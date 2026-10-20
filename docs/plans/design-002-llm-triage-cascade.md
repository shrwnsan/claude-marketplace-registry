# Design 002: LLM cascade for residual Dependabot triage

Status: designed, not implemented — gated on the deterministic triage
workflow (#451) completing a 2–3 cycle soak. See §7.

## 1. Problem

Post-#451, `triage-dependabot.yml` deterministically squash-merges
allowlist-clean, minor-only Dependabot PRs with green checks. The residual
— allowlist violations, major bumps, un-green checks — is left open with a
skip comment for manual review. This design covers that residual with an
LLM cascade: classify it, grade the classification, escalate on failure,
and never merge without a passing eval.

## 2. Non-goals

- The LLM never merges directly. It produces a *recommendation*; the
  workflow executes merges only for cases the deterministic policy already
  approves, or a human approves the recommendation.
- No LLM in the merge-critical path of green minor bumps (deterministic
  code handles those; the cascade only sees what the policy skipped).

## 3. Cascade

```
deterministic policy SKIP
        │
        ▼
[G1] generator: openrouter:free        → recommendation + cited reason
        │
        ▼
[E1] evaluator: openrouter:free        → grades vs golden rules
        │ pass ──────────────► comment recommendation; human merges/closes
        ▼ fail
[G2] generator: z.ai glm-5.3-flash@low
        │
        ▼
[E2] evaluator: z.ai glm-5.3-flash@low
        │ pass ──────────────► comment recommendation
        ▼ fail
HITL: @shrwnsan on the PR + issue notification (NO third model round)
```

Rules:
- Generator and evaluator are **separate calls** even when they use the same
  model — the evaluator never sees the generator's rationale, only its
  output (decision + reason), to avoid self-review rationalization.
- Round 2 skips the free tier: a failed E1 already demonstrated the free
  model was insufficient for that case.
- A case that fails E2 is *ambiguous by construction* (a strong model also
  disagrees with the golden rules) — the correct escalation is the human,
  not another model round.
- Evaluator availability fallback: if openrouter:free 429s on the evaluator
  slot, the evaluator call may fall back to Z.ai while the generator stays
  free-tier (grading is cheaper to trust from the stronger model anyway).

## 4. Golden rules

`data/evals/dependabot-triage-golden.json` — versioned fixture of real
cases with expected labels. The evaluator prompt embeds the rules below and
grades generator output against the fixture's `expected` for the matched
case, or against the general rules for novel cases.

1. Merge iff: author is dependabot, all paths in the allowlist
   (package.json/package-lock.json + non-AI-assist workflows), no major
   bump in any from/to pair, checks green.
2. Skip-with-comment for major bumps: reason must name the dependency and
   point at #452 (migrations tracking issue).
3. Skip-with-comment for allowlist violations: reason must list the
   offending paths.
4. Security updates for ignored majors are NEVER auto-merged; route to
   human (the ignore rules suppress these deliberately).
5. Novel/unknown cases: recommend "skip for manual review" (conservative
   default). Precision beats recall — a missed merge costs 3 days, a bad
   merge costs the deploy.

## 5. Telemetry

One JSON line per LLM call, artifact + committed aggregate:

```json
{"ts":"2026-10-26T02:31:22Z","run_id":"1234567","pr":449,
 "role":"generator","provider":"openrouter","model":"z-ai/glm-5.3-flash:free",
 "effort":"low","round":1,"prompt_tokens":812,"completion_tokens":94,
 "cache_read_tokens":0,"cache_hit":false,"latency_ms":1410,
 "decision":"merge","eval_verdict":"pass","cost_estimate_usd":0}
```

Schema: `data/evals/telemetry-schema.json`. Aggregate lands in
`data/llm-telemetry/YYYY-MM.json` via the automation PR — this is the
retro/blog dataset (provider reliability, cache-hit rate, eval pass rate
per round, cost).

## 6. Budget

50 req/day free (20/min); a full 3-PR residual round trip is ≤12 calls.
Even a bad week stays under 5% of the daily budget. Z.ai calls ride the
existing `CLAUDE_ZAI_API_KEY` coding-plan quota at effort low.

## 7. Sequencing (soak)

| When (2026) | What |
|---|---|
| Oct 21–25 | #451 merged; triage workflow runs Wed 21st, Sat 24th, Sun 25th 02:30 UTC |
| Oct 26 | Soak review (scheduled): did it merge/skip correctly, comment spam?, PAT quota ok |
| After soak | Populate golden fixture from real run outcomes; implement cascade in the SKIP branch; blog retro with before/after telemetry |
