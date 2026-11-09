# API improvements — consumer audit, 2026-11-08

Findings and backlog from an external-consumer audit of the public JSON API
(`data/*.json` on GitHub Pages), performed the same day as the 2026-11-08 scan
(7,736 plugins / 2,146 marketplaces / 852 developers).

## What already works well

- All four endpoints live and fresh; CDN headers correct (`ETag`, `Last-Modified`,
  `cache-control: max-age=600`, `access-control-allow-origin: *`).
- History is genuinely monotonic: 51 daily snapshots, 178 → 7,736 plugins since
  2026-02-23, no resets even through the pipeline rework.
- `stats.json` richness (mods tracking, growth rates, securityAudit) is ahead of
  most ecosystem aggregators.

## Prioritized backlog

| # | Improvement | Why | Effort |
|---|-------------|-----|--------|
| 1 | **`schemaVersion` field** in each file (or a `data/schema-version.json`) | `history.json` and `plugins.json` shapes have already evolved silently (`developers`, `starred` added late; `skills[]` → `skillsCount`); strict consumers cannot detect shape changes | S |
| 2 | **Backfill `history.json.developers`** and document `starred` | Early entries lack `developers`; `starred` (traction-starred marketplace count, ≥10) was undocumented and is easy to confuse with the star total | S |
| 3 | **Denormalize `marketplaceStars` into plugin entries** (or document the join, now done in DEVELOPER_API.md) | "Plugin popularity = parent marketplace stars" is true but unreachable without a join; most consumers will skip it | M |
| 4 | **`data/index.json` compact slice** (`id`, `name`, `author`, `marketplaceId`, `skillsCount` only) | `plugins.json` is 2.6 MB; typeahead and agent consumers need ~10% of it for first paint and search | M |
| 5 | **Per-category slices** (`data/plugins/<category>.json`) | Same monolith problem for filtered views; Pages serves static files fine, so this is pure generation work | M |
| 6 | **Per-plugin `securityAudit`** (currently per-marketplace worst-case) | Audit verdicts are the most consumer-demanded field; per-marketplace worst-case over-penalizes large multi-plugin marketplaces | L |
| 7 | **Consolidate or deprecate `docs/ref/api-documentation.md`** | It documents an older "Ecosystem Statistics API v1.0" (last updated 2025-10-26) that predates the static `stats.json` contract; two API docs invite drift | S |
| 8 | Conditional-request guidance for pollers | ✅ Done in this change — see "Conditional requests" in DEVELOPER_API.md | — |

## Non-goals

- Server-side query/filtering: the zero-infrastructure design (Actions + Pages,
  bare static JSON) is a feature; slices keep it that way.
- Per-plugin download counts: GitHub does not expose them; the no-mocked-numbers
  policy stays.
