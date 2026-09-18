# Claude Marketplace Registry — User Guide

The Claude Marketplace Registry is an automated directory of Claude Code marketplaces and plugins, discovered daily from GitHub and published as a static site with a free JSON API.

## The homepage

- **Search** — the hero search is a typeahead combobox: start typing and it shows grouped marketplace and plugin matches. Arrow keys navigate, Enter opens, and "See all N results" deep-links to the full listing. Press **Cmd/Ctrl+K** from any page to jump to search.
- **Trending topics** — real tags from the catalog; clicking one fills the search.
- **Ecosystem at a glance** — live totals from the latest scan. The full dashboard lives at **/stats** (linked under the hero stats and in the navigation).

## Browsing marketplaces

`/marketplaces` lists every indexed marketplace.

- **Categories** — curated functional filters (MCP servers, Skill collections, AI agents, Workflow & automation, Dev tools, LLM & prompting) with live counts. Raw GitHub topics arrive via deep links and show as removable `#tag` chips.
- **Sort** — by stars, name, or last updated. Selections persist in the URL, so filtered views are shareable.
- **Grid / list** — two viewing densities; the toggle sits next to the sort control.
- **Cards** — the title and the `view details` action both open the marketplace's page. The green shield-check badge means the marketplace ships a valid `.claude-plugin/marketplace.json`.
- **Long lists** load more automatically as you scroll.

## Browsing plugins

`/plugins` lists the full catalog with search, sort, and the same grid/list views. The list auto-loads as you scroll; a back-to-top button appears after the first screens. Plugin cards show author, skills, and version — stars are intentionally omitted because a plugin's only stars belong to its parent marketplace.

## Marketplace pages

Each marketplace page shows repository stats (stars, forks, language, last update), its topics (clickable — they filter the marketplace listing), a plugins/authors/skills summary, the most common skills across its plugins, and its full plugin list with search and grid/list views. The GitHub icon links to the source repository.

## Plugin pages

Plugin detail pages show the description, author, skills, version, and parent marketplace, plus a link to the source repository.

## Ecosystem statistics

The **Ecosystem Statistics** page ([/stats](/stats), linked under the hero stats and in the navigation) covers:

- **Overview** — totals with 30-day growth once a baseline exists (growth % appears automatically after ~30 days of history)
- **Growth trends** — big-number deltas per metric; the annotated line chart appears once five daily snapshots exist
- **Category analytics** — topic distribution with share-of-catalog; click a bar to browse that topic
- **Quality indicators** — manifest coverage, recently-updated share, stale count, and average stars per marketplace

All timestamps display in **your local timezone** with an explicit UTC offset; the data itself is stored in UTC.

## Themes

Light and dark themes are supported with a system option; the choice is remembered and applied before first paint (no flash).

## Data honesty

Every number on the site traces back to the daily scan — there are no synthetic downloads, invented quality scores, or mock data. Where data doesn't exist yet (e.g. young growth history), the UI says so instead of estimating.
