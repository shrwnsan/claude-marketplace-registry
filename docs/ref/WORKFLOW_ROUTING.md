# PR Review Routing Architecture

Conditional routing system that uses **tiered model selection** to optimize cost, speed, and capability.

## Workflow Chain

```
1. Pull Request Created
        ↓
2. route-pr-to-model.yml (all PRs)
   ├─ Analyzes: lines, paths, security, breaking changes
   ├─ Calculates: complexity_score, tier (1, 2, or 3)
   └─ Outputs: routing-analysis.json artifact
        ↓
   ┌────────────────────────────────────────────────────┐
   │                                                    │
   TIER 1                  TIER 2                TIER 3  │
   (Fast Triage)      (Standard Review)     (Deep Analysis)
   │                                                    │
   ├→ amp-review-tier1.yml      ├→ claude-auto-pr-review.yml
   │  • Amp Code (Haiku 4.5)     │  • Claude (GLM 4.7 via Z.ai)
   │  • ~2 minutes               │  • ~5 minutes
   │  • ~$0.01                   │  • ~$0.05
   │                             │
   │                             └→ droid-review.yml
   │                                • Factory Droid (GPT-5.2)
   │                                • ~10 minutes
   │                                • ~$0.10
```

## Routing Criteria

| Tier | Condition | Model | Use Case |
|------|-----------|-------|----------|
| **1** | `docOnly == true` | Amp (Haiku) | README, CHANGELOG, docs/** updates |
| **1** | `configOnly && lines < 50` | Amp (Haiku) | .prettierrc, .gitignore, tsconfig updates |
| **2** | `hasCriticalPaths && lines < 100` | Claude (GLM 4.7) | Focused service/API updates |
| **2** | `hasAPI && lines > 200` | Claude (GLM 4.7) | Substantial API changes |
| **2** | `hasSecurity && !hasCriticalPaths` | Claude (GLM 4.7) | Security improvements in standard scope |
| **3** | `hasSecurity && hasCriticalPaths` | Factory Droid (GPT-5.2) | Auth/permission refactors |
| **3** | `hasBreakingChange && hasAPI` | Factory Droid (GPT-5.2) | Major API version changes |
| **3** | `hasCriticalPaths && lines > 500` | Factory Droid (GPT-5.2) | Large-scale refactors |

## Files

### New/Modified Workflows

- **`.github/workflows/route-pr-to-model.yml`** ← NEW
  - Triggers on all PRs
  - Analyzes PR complexity
  - Outputs `routing-analysis.json`

- **`.github/workflows/amp-review-tier1.yml`** ← NEW
  - Listens to `route-pr-to-model` completion
  - Only runs if `tier == 1`
  - Uses Amp Code in `rush` mode (Haiku 4.5)
  - Fast feedback for docs/minimal changes

- **`.github/workflows/claude-auto-pr-review.yml`** ← RENAMED (was `auto-pr-review.yml`)
  - Listens to `route-pr-to-model` completion
  - Only runs if `tier == 2`
  - Uses Claude via Z.ai (GLM 4.7)
  - Delete old `auto-pr-review.yml` after testing

- **`.github/workflows/droid-review.yml`** ← MODIFIED
  - Listens to `route-pr-to-model` completion
  - Only runs if `tier == 3`
  - Uses Factory Droid (GPT-5.2)
  - Added conditional check for tier

## Cost Optimization

Using Factory multipliers:
- **TIER 1** (80% of PRs): 0.4× cost (Haiku)
- **TIER 2** (15% of PRs): 0.25× cost (GLM 4.7)
- **TIER 3** (5% of PRs): 0.7× cost (GPT-5.2)

**Average cost:** (0.80 × 0.4) + (0.15 × 0.25) + (0.05 × 0.7) = **0.38× vs all-Haiku** = ~73% savings vs always using expensive models

## Models & Capabilities

| Model | Mode | Cost | Capability | Best For |
|-------|------|------|-----------|----------|
| **Claude Haiku 4.5** | Amp rush | Ultra-cheap | Fast triage | Docs, minimal changes, quick feedback |
| **GLM 4.7** | Z.ai proxy | Very cheap | Reliable coding | Standard logic, API reviews |
| **GPT-5.2** | Factory Droid | Baseline | Reasoning, security | Complex logic, security analysis |

## Implementation Notes

### Artifact Passing
- `route-pr-to-model.yml` creates `routing-analysis.json`
- All downstream workflows download artifact
- Safe fallback to `tier=2` if artifact missing

### Conditional Execution
- Each workflow checks its tier before running
- No parallel execution (workflows depend on routing)
- Keeps GitHub Actions usage predictable

### GitHub Event Context
- All workflows run on `workflow_run` trigger
- PR context extracted from artifact + GitHub API
- Safe for private repos and forks

## Testing the Routing

Create test PRs with different scopes:

```bash
# Test TIER 1: Should use Amp
echo "# New feature docs" >> docs/FEATURE.md
git add docs/FEATURE.md
git commit -m "docs: add feature documentation"
git push origin feature-docs

# Test TIER 2: Should use Claude
# Edit src/services/github-search.ts (< 100 lines)
# Commit and push

# Test TIER 3: Should use Factory Droid
# Edit pages/api/search.ts AND src/services/github-search.ts (> 500 lines)
# Commit and push
```

Check PR comments to see which model was selected and why.

## Monitoring

View routing decisions in PR comments:
1. Check comment from `route-pr-to-model.yml` with tier + reason
2. Check comment from selected review workflow
3. Verify complexity_score in routing analysis

## Future Enhancements

- Add TIER 0 for auto-skip (typo fixes, comment updates)
- Add Opus 4.5 for critical security paths
- Add performance benchmarking per tier
- Export metrics to analytics dashboard
