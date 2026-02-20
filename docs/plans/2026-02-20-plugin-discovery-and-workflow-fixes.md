# Plugin Discovery & Workflow Artifacts Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix duplicate plugin ID generation and resolve workflow_run artifact download failures across three review workflows.

**Architecture:** Two independent fix tracks: (1) Add fallback ID generation in plugin-discovery.ts when both repo and path are empty, (2) Add `run-id` parameter to download-artifact steps in workflow_run-triggered workflows to properly access artifacts from the triggering workflow.

**Tech Stack:** TypeScript, Jest, GitHub Actions (workflow_run, download-artifact@v4)

---

## Track A: Plugin Discovery Fixes

### Task A1: Fix Duplicate Plugin ID Generation

**Files:**
- Modify: `scripts/plugin-discovery.ts:84-87`
- Test: `scripts/__tests__/plugin-discovery.test.ts` (new)

**Step 1: Create test file with test cases for ID generation**

Create `scripts/__tests__/plugin-discovery.test.ts`:

```typescript
/**
 * Plugin Discovery Tests
 *
 * Tests for plugin discovery logic focusing on:
 * - ID generation uniqueness
 * - Plugin entry processing
 * - Error handling
 */

import { Octokit } from '@octokit/rest';
import { PluginDiscovery, MarketplaceInfo } from '../plugin-discovery';

// Mock Octokit
jest.mock('@octokit/rest');

describe('PluginDiscovery', () => {
  let discovery: PluginDiscovery;
  let mockOctokit: jest.Mocked<Octokit>;

  const mockMarketplace: MarketplaceInfo = {
    owner: 'test-owner',
    repo: 'test-repo',
    id: 'test-marketplace',
    name: 'Test Marketplace',
    url: 'https://github.com/test-owner/test-repo',
    manifest: {},
  };

  beforeEach(() => {
    mockOctokit = {
      repos: {
        getContent: jest.fn(),
      },
    } as any;
    discovery = new PluginDiscovery(mockOctokit);
  });

  describe('processPluginEntry - ID Generation', () => {
    it('should generate ID from external repository', async () => {
      const pluginEntry = {
        name: 'Test Plugin',
        repository: 'external/repo',
      };

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify({ name: 'Test Plugin' })).toString('base64'),
        },
      });

      // Access private method via type assertion
      const result = await (discovery as any).processPluginEntry(pluginEntry, mockMarketplace);

      expect(result.id).toBe('external-repo');
    });

    it('should generate ID from internal path', async () => {
      const pluginEntry = {
        name: 'Test Plugin',
        path: 'plugins/my-plugin',
      };

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify({ name: 'Test Plugin' })).toString('base64'),
        },
      });

      const result = await (discovery as any).processPluginEntry(pluginEntry, mockMarketplace);

      expect(result.id).toBe('test-marketplace-plugins-my-plugin');
    });

    it('should generate unique ID when both repo and path are empty (single-plugin repo)', async () => {
      const pluginEntry = {
        name: 'Single Plugin',
      };

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify({ name: 'Single Plugin' })).toString('base64'),
        },
      });

      const result = await (discovery as any).processPluginEntry(pluginEntry, mockMarketplace);

      // Should use plugin name as fallback, not just marketplace.id + "-"
      expect(result.id).toBe('test-marketplace-single-plugin');
      expect(result.id).not.toBe('test-marketplace-');
    });

    it('should handle special characters in plugin name for ID', async () => {
      const pluginEntry = {
        name: 'My Cool Plugin!',
      };

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify({ name: 'My Cool Plugin!' })).toString('base64'),
        },
      });

      const result = await (discovery as any).processPluginEntry(pluginEntry, mockMarketplace);

      expect(result.id).toBe('test-marketplace-my-cool-plugin');
      expect(result.id).toMatch(/^[a-z0-9-]+$/);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- scripts/__tests__/plugin-discovery.test.ts`
Expected: FAIL - single-plugin repo test fails because ID is `test-marketplace-` instead of `test-marketplace-single-plugin`

**Step 3: Fix ID generation logic**

Modify `scripts/plugin-discovery.ts` lines 84-87:

```typescript
// Generate unique ID
const pluginId = pluginRepo
  ? pluginRepo.replace('/', '-')
  : pluginPath
    ? `${marketplace.id}-${pluginPath.replace(/\//g, '-')}`
    : `${marketplace.id}-${pluginName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- scripts/__tests__/plugin-discovery.test.ts`
Expected: PASS - all 4 ID generation tests pass

**Step 5: Commit**

```bash
git add scripts/plugin-discovery.ts scripts/__tests__/plugin-discovery.test.ts
git commit -m "fix(scripts): prevent duplicate plugin IDs when path is empty

Add fallback to plugin name for ID generation when both repository
and path are undefined. Sanitizes plugin name for use in ID.

Co-Authored-By: GLM <zai-org@users.noreply.github.com>"
```

---

## Track B: Workflow Artifact Download Fixes

### Task B1: Fix amp-review-tier1.yml

**Files:**
- Modify: `.github/workflows/amp-review-tier1.yml:27-30`

**Step 1: Add run-id to download-artifact**

Modify lines 26-31:

```yaml
      - name: Download routing artifacts
        uses: actions/download-artifact@v4
        with:
          name: routing-analysis
          github-token: ${{ github.token }}
          run-id: ${{ github.event.workflow_run.id }}
```

**Step 2: Commit**

```bash
git add .github/workflows/amp-review-tier1.yml
git commit -m "fix(ci): add run-id for workflow_run artifact download in amp-review-tier1

The download-artifact action needs run-id to access artifacts from
the triggering workflow when using workflow_run event.

Co-Authored-By: GLM <zai-org@users.noreply.github.com>"
```

### Task B2: Fix claude-auto-pr-review.yml

**Files:**
- Modify: `.github/workflows/claude-auto-pr-review.yml:27-30`

**Step 1: Add run-id to download-artifact**

Modify lines 26-31:

```yaml
      - name: Download routing artifacts
        uses: actions/download-artifact@v4
        with:
          name: routing-analysis
          github-token: ${{ github.token }}
          run-id: ${{ github.event.workflow_run.id }}
```

**Step 2: Commit**

```bash
git add .github/workflows/claude-auto-pr-review.yml
git commit -m "fix(ci): add run-id for workflow_run artifact download in claude-auto-pr-review

The download-artifact action needs run-id to access artifacts from
the triggering workflow when using workflow_run event.

Co-Authored-By: GLM <zai-org@users.noreply.github.com>"
```

### Task B3: Fix droid-review.yml

**Files:**
- Modify: `.github/workflows/droid-review.yml:28-31`

**Step 1: Add run-id to download-artifact**

Modify lines 27-32:

```yaml
      - name: Download routing artifacts
        uses: actions/download-artifact@v4
        with:
          name: routing-analysis
          github-token: ${{ github.token }}
          run-id: ${{ github.event.workflow_run.id }}
```

**Step 2: Commit**

```bash
git add .github/workflows/droid-review.yml
git commit -m "fix(ci): add run-id for workflow_run artifact download in droid-review

The download-artifact action needs run-id to access artifacts from
the triggering workflow when using workflow_run event.

Co-Authored-By: GLM <zai-org@users.noreply.github.com>"
```

---

## Parallel Execution Notes

Track A and Track B are fully independent and can be executed in parallel:
- Track A modifies `scripts/` and adds tests
- Track B modifies `.github/workflows/`

Within Track B, tasks B1, B2, B3 are independent and can be parallelized.

**Recommended parallelization:**
- Agent 1: Track A (plugin discovery fix + tests)
- Agent 2: Track B (all three workflow fixes)
