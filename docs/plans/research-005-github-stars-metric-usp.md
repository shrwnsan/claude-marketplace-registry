# Research 005 — GitHub Stars as a showcase metric

**Date:** 2026-10-05 · **Status:** Decisions implemented (PR #410 merged 2026-10-04; header polish in this PR)
**Scope:** Whether "GitHub Stars" earns a showcase slot on the homepage hero, how the same
metric should be treated on `/stats`, and the `/stats` page header cleanup that fell out of it.

## Question

With 800+ marketplaces indexed, the summed GitHub star count crossed 1,000,000. Does a
"GitHub Stars" metric card make sense as a USP/proof point for the platform to showcase?

## Method

1. **Competitive scan** — fetched homepages of 15 comparable directories and recorded every
   hero/header metric they display: PyPI, crates.io, npm, Homebrew, VS Code Marketplace,
   WordPress.org plugins, Product Hunt, AlternativeTo, There's An AI For That, and the five
   closest MCP/plugin competitors (PulseMCP, Smithery, Glama, mcp.so, cursor.directory).
2. **Credibility & growth literature** — Stanford Web Credibility Project guidelines,
   Nielsen Norman Group credibility factors, Lean Startup vanity-vs-actionable metrics,
   CXL on social proof, precision-credibility research (Mason et al.; Bansal & Muthulingam),
   developer-marketing skepticism write-ups.

## Findings

- **F1 — Nobody sums stars.** 0 of 15 comparable directories display an aggregate
  GitHub-stars (or any summed third-party popularity) metric, though every one could compute
  it. Stars appear only **per item** — on listing cards and detail pages — where they help a
  visitor judge a single project. (Verified 2026-10-04.)
- **F2 — The hero card was a category error.** Three of the four hero cards were inventory
  claims about the platform (plugins / marketplaces / developers — verifiable by browsing);
  the fourth was popularity accrued on GitHub, independent of the registry, presented in the
  same visual grammar. Unattributed, it reads as claiming credit for the ecosystem.
- **F3 — The sum is structurally weak.** Cumulative-only (never falls), dominated by a
  handful of mega-repos (~180 avg stars/plugin; median far lower — one starred mega-repo
  swings it more than a hundred real marketplaces), and unverifiable at a glance.
- **F4 — Verifiability and freshness beat magnitude for dev audiences.** Stanford guideline
  #1 ("make it easy to verify") and NN/g both rank transparency and up-to-date content among
  the top trust factors; precision only adds credibility when the number is attributable.
- **F5 — Freshness is the universal trust proxy in this genre.** "Updated daily"
  (PulseMCP), exact scan timestamps (Glama), "Added X ago" (mcp.so), daily ranked lists
  (Product Hunt). It answers the visitor's real question: *is this directory alive, or a
  stale awesome-list?*

## Decisions

### D1 — Hero: replace the GitHub Stars card with a LAST SCAN freshness card ✅ shipped

PR #410 (merged as `ddd93eb`, 2026-10-04). The fourth hero StatCard is now **LAST SCAN**
showing `formatRelativeAge(overview.lastUpdated)` (e.g. "12h ago") with a `—` fallback;
icon `Star` → `Clock`, cyan accent kept. The hero footnote keeps the absolute viewer-local
timestamp (relative = aliveness, absolute = verifiability). Per-repo stars on listings and
detail pages are untouched — that is where the whole market puts them, and where they do
their social-proof work.

*Considered alternative:* relabel to "Combined GitHub stars" + subline "summed across N
plugins" + link the card to a sorted-by-stars view (the "our portfolio has raised $4B"
attribution pattern). Rejected for the hero — freshness is owned, differentiating, and the
stronger answer to "why trust this directory"; the stars story can live in subheadline copy
if wanted later (deferred).

*Known trade-off:* if the daily scan ever stalls, the card will honestly show it
(e.g. "5d ago") — consistent with the site's honest-dataviz positioning.

### D2 — /stats: keep the GitHub Stars card, with context ✅ decided, no change needed

The same number is legitimate on the dashboard because the framing the hero lacked is all
present there:

- The page's stated contract is analytical ("live counts from the daily marketplace
  scans"), read voluntarily by people who want the data.
- Each OverviewMetrics card carries a delta line ("▲ +234.7% vs 30-day baseline", or an
  honest "baseline pending") — turning a cumulative sum into a trend observation.
- A dedicated Stars trend chart exists (deliberately single-axis; a dual axis would invent
  correlations), plus a Traction card ("≥N★ marketplaces — X%") covering the distribution
  the raw sum hides.
- The number is computed once per marketplace repo (`scripts/generate-data.ts`:
  `totalStars = marketplaces.reduce((s, m) => s + m.stars, 0)`), not per plugin, so there
  is no multi-counting; the aria label ("Total GitHub stars across marketplaces") is
  accurate.

Division of labor: **hero says "alive" (owned metrics), /stats says "here's everything —
including the ecosystem's borrowed popularity — in context."** Optional future polish:
relabel to "Combined stars" or add a "summed across N marketplace repos" hint.

### D3 — /stats page header: finish it in the site design language ✅ shipped in this PR

Findings (why it looked unfinished):

- **Duplicated metadata:** the page header and the OverviewMetrics section header each
  rendered a subtitle, an "updated …" timestamp, and a refresh control — two refresh
  buttons and two timestamps visible at once.
- **Layout hack:** the title was centered via a 3×`flex-1` row with two empty spacer divs.
- **Off-pattern controls:** a bordered white "Refresh" button with a hand-rolled inline SVG
  — unlike any other control on the site (ghost mono buttons, lucide icons).
- **Missing identity:** every other page/section leads with a terminal eyebrow
  (`ls ./featured`, `cat popular.json`); /stats had none.

Fixes, following the site's own established patterns:

- Page header rebuilt on the **results-header pattern** used by the listing pages since
  round 8 (identity left, controls right; stacks centered on mobile — the #409 "stable
  section controls" layout).
- Eyebrow **`status --live`** moved from OverviewMetrics to the page header; h1 + subtitle
  left-aligned; `tracking-tight` on the display size.
- Freshness (`updated YYYY-MM-DD HH:MM:SS UTC±HH:MM`, the user-requested dashboard format)
  and a **single mono ghost refresh control** (`Activity` icon, spins while loading) now
  live in one place — the page header. OverviewMetrics renders only the data; its
  duplicated header is removed. It has exactly one consumer (`pages/stats.tsx` via
  `EcosystemStats`), so blast radius is nil.
- QualityIndicators' inner header (third refresh control + third timestamp + a
  `check --quality` eyebrow the sibling sections don't have) removed for the same reason —
  its refresh hit the identical shared cache; all four sections now render uniformly
  (section `h3` from EcosystemStats + data).
- Files touched: `src/components/EcosystemStats/EcosystemStats.tsx` (header rebuilt),
  `src/components/EcosystemStats/OverviewMetrics.tsx` and
  `src/components/EcosystemStats/QualityIndicators.tsx` (duplicated headers removed,
  header-only imports dropped).

## Sources

- Stanford Web Credibility Guidelines — https://credibility.stanford.edu/guidelines/index.html
- NN/g, "Trustworthiness in Web Design: 4 Credibility Factors" — https://www.nngroup.com/articles/credibility-dimensions/
- Lean Startup, ch. 7 "Measure" (vanity vs actionable metrics)
- CXL, "Which Types of Social Proof Work Best?" — https://cxl.com/blog/social-proof/
- Mason et al. (JPSP) precision-credibility; Bansal & Muthulingam (2022)
- Primary observations (2026-10-04): pypi.org, brew.sh, crates.io (+ its summary API),
  pulsemcp.com, smithery.ai, glama.ai/mcp/servers, mcp.so, cursor.directory,
  marketplace.visualstudio.com, wordpress.org/plugins, producthunt.com,
  theresanaiforthat.com, alternativeto.net, figma.com/community, npmjs.com (partial fetch)
