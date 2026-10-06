# Spike: mods detection feasibility — `spike/mods-detection`

**Date:** 2026-10-06 · **Question:** can the pipeline detect Claude Code mods (released
2026-10-01, CC ≥ 2.1.287) in the registry corpus, and is there real-world adoption worth
surfacing?

**Mod marker (verified against code.claude.com docs + Anthropic source):** a plugin is a mod
when its `hooks/hooks.json` contains a non-empty `"modules": [...]` array. The same file may
also carry legacy settings-hooks under other keys — coexistence is supported upstream and
observed in the wild.

## Method

- `scripts/spike-detect-mods.mjs` — probes `{pluginDir}/hooks/hooks.json` via the GitHub
  contents API for plugins from `data/plugins/valid-plugins.json` (handles both dataset
  shapes: string `manifestPath` → parent `repository`; object `manifestPath` = plugin source
  blob with its own `url`/`path`/git `ref`). Sampled: 50 keyword-matched candidates + 29
  deterministic baseline (~1/47) + 7 positive controls, deduped, ≤2 probes/repo.
- `scripts/spike-search-mods.mjs` — GitHub code search census of the marker.
- `scripts/spike-detect-mods.mjs` verification round — detector run against third-party
  repos surfaced by code search.

## Findings

| Probe | Result |
| --- | --- |
| Positive controls (4 built-in `anthropics/claude-code/mods/*`, 3 samples in `claude-code-playground`) | **7/7 detected** |
| Registry corpus (79 plugins probed of 5,881) | **0 mods**, 53/79 had no `hooks.json` at all, 0 false positives, 0 HTTP errors |
| GitHub-wide census (`"modules" filename:hooks.json path:hooks`) | **249 files, ≥40 distinct repos** in the first page alone |
| Third-party verification (`token-optimizer`, `claude-dashboard`, `Mindful-Claude`) | **3/3 detected**, incl. `../` module paths, `.tsx` modules, and mixed legacy+modules files |

**Why zero in our corpus but hundreds on GitHub:** the dataset snapshot is 2026-10-04 and
community mod repos were mostly created 2026-10-02…06 (e.g. `karanb192/awesome-claude-code-mods`
221★, `hamzafer/claude-code-mods` 120★). Mods live in *new repos the scanner hasn't indexed
yet* — a discovery gap, not a detection failure.

## Verdicts

- **Feasible:** yes. One extra contents-API call per plugin (~2× calls in
  `plugin-discovery.ts`; needs a throttle — none exists there today). Marker is cheap to
  check and cheap to store.
- **Logical:** yes. Discriminator is spec-backed and empirically clean (0 false positives;
  legacy hooks.json never carries `modules`).
- **Beneficial:** yes, and time-sensitive. The ecosystem has real adoption that our fresh
  dataset predates. Detecting + indexing mods now makes the registry the first directory
  with a mods surface; the census query can also feed a new *discovery strategy*.

## Production integration sketch (next PR, not in this spike)

1. **Detect:** in `plugin-discovery.ts` `processPluginEntry` (after `fetchPluginManifest`),
   fetch `{pluginPath}/hooks/hooks.json`; set `modsCount` (+ optionally module event
   surface) on `DiscoveredPlugin` (interface at line 15).
2. **Persist:** `savePluginResults` (scan-marketplaces.ts:956) already preserves extra
   fields; index record gets `modsCount` in `generate-data.ts` `toPluginIndexRecord`
   (lines 135–147, template: `deriveSkillsCount`). Shards ride `metadata` unchanged.
3. **Discover:** add a code-search strategy `"modules" filename:hooks.json` to the
   `STRATEGIES` array (scan-marketplaces.ts:31–37) so mod marketplaces enter the corpus.
4. **Surface:** "Ships mods" badge + mods filter on plugin cards; `/docs/mods` explainer;
   homepage/stat tidbit ("N mods across M marketplaces").
5. Watch-outs: no throttling in `plugin-discovery.ts` today; `valid-plugins.json` has two
   writers with different shapes (integration wrinkle); contents calls double per plugin.

*Spike artifacts: `spike-results.json`, `spike-search-results.json` (committed); token read
from `.env.local`, never logged.*
