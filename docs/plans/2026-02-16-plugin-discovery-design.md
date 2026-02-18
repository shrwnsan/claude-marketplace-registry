# Plugin Discovery Design

> **Status:** Approved
> **Related:** PRD-003 (Data Strategy Improvement)
> **Created:** 2026-02-16
> **Author:** Claude Code

## Summary

This design captures implementation decisions for PRD-003 Phase 2 (Plugin Discovery), refined through brainstorming sessions.

## Scope Decisions

### In Scope
- Tighten manifest paths to official Claude Code spec only
- Extract plugins from marketplace manifests
- Validate plugins have required `.claude-plugin/plugin.json`
- Generate `public/data/plugins.json` with discovered plugins

### Out of Scope (Future Work)
- Skills discovery (Agent Skills, skills.sh integration)
- README parsing for plugin extraction
- Directory scanning for non-manifest plugins
- Fallback discovery mechanisms

**Rationale**: Claude Plugins MUST have `.claude-plugin/plugin.json` per official spec. There is no valid fallback. Skills discovery has traction but is agent-agnostic and belongs in a future phase/marketplace section.

## Official Spec

Per Claude Code documentation:

| Type | Manifest Path |
|------|---------------|
| Marketplace | `.claude-plugin/marketplace.json` |
| Plugin | `.claude-plugin/plugin.json` |

## Architecture

### File Changes

```
scripts/
├── scan-marketplaces.ts        # Updated: Tighten to official paths
└── plugin-discovery.ts         # NEW: Extract plugins from manifests
```

### Data Flow

```
GitHub Repo Discovered
        │
        ▼
┌──────────────────────────────┐
│ Check .claude-plugin/        │
│ marketplace.json             │
└──────────────┬───────────────┘
               │
         Found? ├─ No ──→ Skip (not a valid marketplace)
               │
               Yes
               │
               ▼
┌──────────────────────────────┐
│ Parse marketplace manifest   │
│ Extract plugins[] array      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ For each plugin in plugins[] │
│ Verify .claude-plugin/       │
│ plugin.json exists           │
└──────────────┬───────────────┘
               │
               ▼
    Store validated plugins
    in plugins.json
```

## Implementation Tasks

### Task 1: Tighten Manifest Paths
**File**: `scripts/scan-marketplaces.ts`

Replace loose manifest path array with official paths only:

```typescript
// Before (loose - lines 353-362)
const manifestPaths = [
  '.claude-plugin/marketplace.json',
  '.claude-plugin/plugin.json',
  '.claude/plugin.json',
  'marketplace.json',
  'claude-marketplace.json',
  'plugins/marketplace.json',
  'plugin.json',
];

// After (official spec only)
const OFFICIAL_PATHS = {
  marketplace: '.claude-plugin/marketplace.json',
  plugin: '.claude-plugin/plugin.json',
};
```

### Task 2: Create Plugin Discovery Module
**File**: `scripts/plugin-discovery.ts` (NEW)

Responsibilities:
- Parse marketplace manifest for `plugins` array
- For each plugin, verify `.claude-plugin/plugin.json` exists
- Validate plugin manifest against schema
- Return array of validated plugins

### Task 3: Update Data Generation
**File**: `scripts/generate-data.ts` (or relevant)

- Call plugin discovery after marketplace scan
- Generate `public/data/plugins.json` with discovered plugins
- Update marketplace records with plugin counts

### Task 4: Update PRD-003 Status
**File**: `docs/plans/prd-003-data-strategy-improvement.md`

- Mark completed items
- Reference this design doc
- Update Phase 2 status

## Expected Outcomes

### Before (Current State)
- 5 marketplaces discovered
- 0 plugins indexed (`public/data/plugins.json` = `[]`)
- All marketplaces have `hasManifest: false`
- Loose manifest path checking

### After
- Only repos with `.claude-plugin/marketplace.json` qualify as marketplaces
- Plugins extracted from valid marketplace manifests
- Each plugin verified to have `.claude-plugin/plugin.json`
- Clean, spec-compliant data in `plugins.json`

### Realistic Expectations
- May result in fewer "marketplaces" (only spec-compliant ones)
- Higher data quality and accuracy
- Plugin count depends on actual spec-compliant marketplaces

## Root Cause Analysis

Current state (0 plugins, all marketplaces `hasManifest: false`) indicates:
1. Discovered repos may not be actual spec-compliant marketplaces
2. They may be marketplaces but haven't adopted the official manifest format

**Solution**: Tightening paths will surface accurate data about which repos are truly spec-compliant.

## Future Considerations

When extending to Agent Skills:
- Create separate skills registry section
- Add directory scanning for `skills/` directories
- Integrate with skills.sh-style skill definitions
- Maintain separation between Claude plugins and agent-agnostic skills

---

*Design approved: 2026-02-16*
