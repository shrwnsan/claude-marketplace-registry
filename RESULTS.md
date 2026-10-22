# Spike: capturing standalone mod repos as synthetic marketplaces — `spike/mods-capture`

**Date:** 2026-10-23 · **Question:** the registry indexes only 3 mods while the GitHub-wide
census shows ~413 (Oct-20) marker files, because viral mods live in standalone repos
(`hooks/hooks.json` at root) that the scanner only indexes when the repo carries
`.claude-plugin/marketplace.json`. Can `plugin-discovery` synthesize those repos into
single-plugin marketplace entries, and at what API cost?

**Budget:** 25 GitHub API calls hard cap — used 24 via `scripts/spike-capture-marketplaces.mjs`
+ 1 raw contents fetch to confirm the module schema. Token read from repo-root `.env.local`
via the `spike/mods-detection` loader pattern; never logged.

## Census

| Date | Marker files (`"modules" filename:hooks.json path:hooks`) | Δ |
| --- | --- | --- |
| 2026-10-06 (spike/mods-detection) | 249 | — |
| 2026-10-20 (prior observation) | 413 | +66% in 14d |
| **2026-10-23 (this run)** | **427** | **+3.4% in 3d** |

Growth is steady, not spiky: ~5 new marker files/day. Two search pages (100/page,
`sort=indexed`) yielded **200 files from 200 distinct repos** — one marker file per repo in
the entire first-200 sample, so the 427 files span ≥200 repos and likely close to 427 repos.

## Marketplace-vs-standalone split (the synthesis feasibility number)

One contents call per repo checking `.claude-plugin/marketplace.json` at root. Probed the
first 15 repos of the fresh sample in index order, plus 5 repos named in the Oct-6 census
cohort (disclosed bias: picked to find standalone repos for the event-surface probe).

| Verdict | n | Share |
| --- | --- | --- |
| Already an installable marketplace (root `marketplace.json`) | **18/20** | 90% |
| Standalone mod repo (no root `marketplace.json`) | **2/20** | 10% |
| Unknown / errored | 0 | — |

Two headline facts:

1. **The synthesis target is shrinking, fast.** Of 8 repos from the Oct-6 census cohort that
   we re-probed today (`alexgreensh/token-optimizer`, `uppinote20/claude-dashboard`,
   `halluton/Mindful-Claude`, `lossless-claude/lcm`, `renzrollon/interlock`,
   `tsanva/cc-discord-presence`, `dgokcin/claude-pokemon-mod`, `AlmogBaku/ContextSaver`),
   **all 8 added root `marketplace.json` within ~2.5 weeks**. Repos self-synthesize; the
   window where a standalone repo is only capturable via synthesis is days-to-weeks per repo.
2. **But the pipeline is permanently blind to that window.** 10% of a 427-file and growing
   corpus at any moment — including, presumably, the most viral *newest* repos on day 0-3 —
   is invisible to the scanner until upstream adds `marketplace.json`. Synthesis is worth
   building for freshness and completeness, not for volume.

## Standalone examples (what their `hooks.json` registers)

Only 2 standalone repos existed in the probed sample — itself the finding — so the example
list is short and deep rather than 3-5 wide:

1. **`hex/claude-council`** — 1 classic legacy hook (`Stop`, nested under a `hooks` key,
   shelling `scripts/stop-review-gate.sh`) **plus** 1 module. Raw file (confirms the schema):
   ```json
   {
     "hooks": { "Stop": [ { "hooks": [ { "type": "command",
       "command": "bash \"${CLAUDE_PLUGIN_ROOT}/scripts/stop-review-gate.sh\"", "timeout": 120 } ] } ] },
     "modules": [ "../mods/council-pane/hooks/pane.tsx" ]
   }
   ```
2. **`karanb192/cache-tax`** — 0 classic keys; pure `modules` file, 1 module.

**Decisive schema finding:** the `modules` array holds **plain path strings**, not objects.
There is **no per-module event declaration in `hooks.json` at all** — module event surfaces
live inside the module source files (`.ts`/`.tsx`). Any "per-mod event-surface disclosure"
built only on `hooks.json` is therefore limited to the file's classic legacy keys, and pure
mod files (like `cache-tax`) expose nothing. Event-surface storage should be scoped
accordingly (see DESIGN), and per-mod attribution deferred or upstream-gated.

Also confirmed for the production extractor: classic keys can nest under a `hooks` key
(`hooks.Stop`), not only at the file root — `modsCountFromHooksJson` is unaffected (reads
`.modules` only), but a future event-key extractor must check both root and `hooks: {}`.

## DESIGN

### 1. Synthesis rule (capture standalone repos as single-plugin marketplaces)

Precedent already in the codebase: `scripts/plugin-discovery.ts` `processPluginEntry`
(lines ~97–118) already handles the "plugin IS the marketplace" case — an entry with an
external `repository` gets id `pluginRepo.replace('/', '-')`, its manifest fetched from that
repo's **root**, and `repository` pointed at the external repo. Synthesis reuses exactly this
shape; no new plugin record type is needed.

Proposed flow in `scripts/scan-marketplaces.ts` (new `capture-standalone-mods` strategy, run
after normal discovery):

1. Code search the marker query (`"modules" filename:hooks.json path:hooks`, 1–2 pages,
   `sort=indexed`) → candidate repos (this also *is* the census — log it).
2. Skip any repo already in the corpus (match on `repository.url`/full name, not just id).
3. For each remaining repo: fetch root `.claude-plugin/plugin.json` (1 contents call).
   **Require it.** A repo without `plugin.json` is not yet installable in the synthesized
   form either — indexing it would list un-installable entries; today's data shows those
   repos add the file within days anyway. This also filters non-marketplace false positives.
4. Synthesize a `Marketplace` record:
   - `id`: `owner-repo` (same rule as `processPluginEntry`'s external-repo branch);
     **dedupe**: if the id already exists in the corpus (collision), skip the synthetic —
     a same-named real marketplace outranks it.
   - `name` / `description` / `version`: from `plugin.json` (`name`, `description`,
     `version`); fall back to repo metadata from the search payload.
   - `manifestUrl`: the `plugin.json` blob URL; `repository.url`: the repo.
   - `plugins`: exactly one `DiscoveredPlugin` with `marketplaceId` = the synthetic id —
     identical to what `processPluginEntry` returns for an external-repo plugin today,
     including the `modsCount` stamp already written to the source manifest entry
     (plugin-discovery.ts ~126–127).
   - Persist through the existing raw.json path so `generate-data` picks it up unchanged.

### 2. Throttling design

`plugin-discovery.ts` currently makes back-to-back contents calls (`fetchPluginManifest` →
`fetchModsCount`) with **zero delay and silent failure** on secondary rate limits — the
mods-detection spike flagged this. Design a shared `throttledGetContent()` wrapper used by
both:

- **Inter-fetch delay:** ≥300 ms between contents calls (primary limit is 5,000/hr, but the
  nightly job bursts through hundreds of plugins; delay also protects the secondary limit).
- **Retry-After respect:** on 403/429, sleep `Retry-After` (+1 s jitter), retry once; if the
  response carries `X-RateLimit-Remaining: 0`, abort the remaining work for that repo and
  continue on the next (never fail the whole run).

**Sizing against the freed budget.** Dropping the no-op `validate-plugins` job
(scan.yml's `validate-plugins` step re-fetches manifests for every plugin — ~1,300
contents calls/night — while `generate-data` consumes only `raw.json` manifest-entry stamps,
per the comment at plugin-discovery.ts ~122–125) frees ~1,300 calls/night.

Added cost of synthesis per nightly run:

| Item | Calls |
| --- | --- |
| Census search (1–2 pages) | 1–2 |
| Per new standalone repo: `plugin.json` + `hooks.json` | 2 |
| Observed intake: ~5 new marker files/day × ~10% standalone | ~0.5 repos/day → **~1–3 calls/night** |
| Worst case (20 unknown repos/night, all synthesized) | **~42 calls/night** |

Even the worst case is ~3% of the freed budget. The throttle's main beneficiary is the
existing per-plugin `fetchModsCount` probe, not synthesis.

### 3. Event-surface storage

Given the schema finding (modules = path strings), scope storage to what `hooks.json`
actually discloses:

- **Shape:** extend the existing manifest-entry stamp — `pluginEntry.modsCount = n` gains a
  sibling `pluginEntry.modEvents: string[]` — deduped, sorted classic event keys observed on
  the file (root + nested `hooks` key). Empty array for pure-mod files. Same persistence
  path as `modsCount` (raw.json entries survive into the generate job).
- **Extraction:** inside `fetchModsCount` — it already fetches and parses `hooks.json`; add
  ~5 lines (`modEventsFromHooksJson(raw)`) next to `modsCountFromHooksJson` (line ~38) and
  unit-test it in `scripts/__tests__/plugin-discovery.test.ts` beside the existing
  `modsCount` cases (lines ~130–158). **Zero extra API calls.**
- **Passthrough:** `generate-data.ts` mirrors `modsCount`: interface field next to line 123,
  `deriveModEvents(metadata)` next to `deriveModsCount` (line ~142), index-record field next
  to line ~179, manifest-entry copy next to line ~378.
- **UI: deferred** (per spike scope). When surfaced later, expect sparse coverage — most
  pure-mod files declare no classic keys — so the badge should be "mods: N" with events as a
  detail-row only, never a filter facet.

### 4. Risks

- **Rate limits:** the search API allows 30 req/min — cap at 2 pages/run and keep the 8 s
  inter-page delay; contents secondary limits need the Retry-After wrapper above; a hot
  night (hundreds of new repos) is bounded by the plugin.json requirement (1 call max per
  unknown repo).
- **Id collisions:** a synthetic `owner-repo` id can collide with an existing marketplace id,
  and a synthesized repo may later add a real `marketplace.json` (observed 8/8 within weeks)
  → the same repo could appear twice. Dedupe on **repository URL first, id second**, and let
  the real marketplace record evict the synthetic one on the next scan (prefer-real rule).
- **Non-marketplace scripts:** the search query matches any repo whose `hooks/*.json`
  contains the string "modules" (e.g. generic CI hook configs). The `plugin.json`
  requirement plus the `modules` array parse (must be an array) filters these cheaply —
  false positives cost ≤1 call and are dropped, never indexed.
- **GitHub search index staleness:** code search lags pushes by minutes-to-days, exposes no
  per-item `indexed_at`, and serves deleted files until re-index (contents 404 during
  synthesis → skip gracefully, retry next night). `sort=indexed` mitigates ordering; the
  census number itself will drift ±a few percent run-to-run — compare trends, not values.

## Cost to implement

| File | Change |
| --- | --- |
| `scripts/scan-marketplaces.ts` | New `capture-standalone-mods` strategy: marker search → dedupe vs corpus → synthesize `Marketplace` records into raw output |
| `scripts/plugin-discovery.ts` | `throttledGetContent()` wrapper (delay + Retry-After); `modEventsFromHooksJson()`; stamp `pluginEntry.modEvents` beside `modsCount` (~line 126) |
| `scripts/generate-data.ts` | `modEvents` interface field + `deriveModEvents()` + 2 passthrough sites (mirror `modsCount`) |
| `scripts/__tests__/plugin-discovery.test.ts` | Cases for `modEventsFromHooksJson` (root keys, nested `hooks` key, pure-mod empty) and throttle behavior (fake timers) |
| `.github/workflows/scan.yml` | Drop the no-op `validate-plugins` job and its downstream `needs:` references (frees ~1,300 calls/night, ~10 min of runner time) |

**Two PRs, in this order:**

1. **Capture + throttle (+ drop validate-plugins):** scan strategy, synthesis, dedupe,
   `throttledGetContent`, workflow change. This is the growth gap closed; the workflow edit
   deserves isolated review.
2. **Event-surface storage:** `modEvents` extraction + generate-data passthrough. Tiny,
   mechanical, zero new API calls; can land within days of PR1.

Single-PR is feasible but couples a workflow change with data-model addition — two PRs keep
the blast radius reviewable.

---

*Spike artifacts: `scripts/spike-capture-marketplaces.mjs`, `spike-capture-results.json`
(24 budgeted calls + 1 raw fetch = 25/25 used; resume mode carries the budget counter across
partial runs). Related: `spike/mods-detection` (detection feasibility, shipped as
`fetchModsCount`/`modsCount`).*
