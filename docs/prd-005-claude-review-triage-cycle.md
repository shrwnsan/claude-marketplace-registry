# Claude Review-Triage-Implementation Cycle

> **Status:** Implemented - Structured Payload Architecture
> **Last Updated:** 2026-01-26

## Overview

An autonomous development cycle where Claude reviews pull requests, validates its own findings, triages issues by severity, creates follow-up work items, and automatically implements them when source PRs merge.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        claude-code.yml                                  │
│                    (triggered by @claude mention)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  review (🔍) → self-review (✅) → triage (🎯)                            │
│    ↓               ↓                   ↓                                │
│  PR comments   validated findings  critical fixes + follow-up issues     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ PR merged
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 follow-up-implementation.yml                             │
│                   (triggered on PR close, merged=true)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  detect linked issues → validate relevance → implement → new PR          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Payload Format

Jobs communicate via structured JSON payloads embedded in PR comments as HTML comments.

### CLAUDE_REVIEW_PAYLOAD

Each job embeds its output in this format:

```html
<!-- CLAUDE_REVIEW_PAYLOAD_START{"version":1,"job":"review",...}CLAUDE_REVIEW_PAYLOAD_END -->
```

The `version` field (currently `1`) allows future schema changes while maintaining backward compatibility.

### Finding Interface

```typescript
interface Finding {
  id: string;                    // Unique identifier (e.g., "SEC-001")
  severity: 'critical' | 'medium' | 'low';
  category: 'security' | 'quality' | 'performance' | 'breaking-change' | 'style';
  file: string;                  // File path
  lineStart?: number;
  lineEnd?: number;
  title: string;
  description: string;
  recommendation: string;
  validated?: boolean;           // Set by self-review job
  falsePositive?: boolean;       // Set by self-review job
}
```

### Payload Types by Job

| Job | Payload Type | Key Fields |
|-----|--------------|------------|
| review | `ReviewPayload` | `findings[]` |
| self-review | `ValidationPayload` | `validatedFindings[]`, `additionalFindings[]`, `sourceRunId` |
| triage | `TriagePayload` | `actions[]` (fixed/issue-created/skipped) |

### CLAUDE_JOB Marker

Each job also emits a simple job identifier for quick detection:

```html
<!-- CLAUDE_JOB:review -->
<!-- CLAUDE_JOB:self-review -->
<!-- CLAUDE_JOB:triage -->
```

## Issue Linkage Format

Follow-up issues include a linkage block for the implementation workflow to parse:

```html
<!-- ISSUE_LINKAGE_START
Source-PR: #123
Source-SHA: abc123def
Claude-Run-ID: 9876543210
Finding-ID: SEC-001
ISSUE_LINKAGE_END -->
```

| Field | Description |
|-------|-------------|
| `Source-PR` | The PR number where the finding was discovered |
| `Source-SHA` | Commit SHA at time of review |
| `Claude-Run-ID` | GitHub Actions run ID for traceability |
| `Finding-ID` | Links back to specific finding in review payload |

The follow-up implementation workflow uses these fields to:
1. Identify which PR the issue originated from
2. Check if the source SHA was already merged (obsolescence detection)
3. Trace back to the original review for context

## Workflow Stages

### Stage 1: Review

**Trigger:** `@claude` mention in PR comment

**Job:** `review` (🔍 CODE REVIEW - Job 1/3)

Runs `claude-code-action` with read-only tools to analyze the PR:
- Security vulnerabilities (OWASP Top 10)
- Code quality issues
- Breaking changes
- Performance concerns

**Output:** PR comment with findings categorized by severity:
- **critical**: Security vulnerabilities, crashes, data loss risks
- **medium**: Code quality issues, missing error handling, performance concerns
- **low**: Style inconsistencies, minor improvements, nice-to-haves

Comment header: `## 🔍 CODE REVIEW (Job 1/3)`

### Stage 2: Self-Review

**Job:** `self-review` (✅ REVIEW VALIDATION - Job 2/3)

Fetches previous job's comments via `gh` CLI and validates:
- **Catches misses:** Issues the first review overlooked
- **Validates findings:** Removes false positives, confirms accuracy
- **Checks severity:** Ensures severity levels are correct

**Output:** PR comment with validation results

Comment header: `## ✅ REVIEW VALIDATION (Job 2/3)`

### Stage 3: Triage

**Job:** `triage` (🎯 TRIAGE - Job 3/3)

Fetches all previous comments via `gh` CLI and processes validated findings:

| Severity | Action |
|----------|--------|
| **Critical** | Implement immediately, commit to PR branch |
| **Medium** | Create follow-up issue with `priority/medium` label |
| **Low** | Create follow-up issue with `priority/low` label |

**Output:** PR comment with summary of actions taken

Comment header: `## 🎯 TRIAGE (Job 3/3)`

**Follow-up issue structure:**
- Title prefix: `[FOLLOW-UP]`
- Labels: `follow-up`, `priority/{severity}`, `claude-generated`
- References source PR number: `From PR #123`
- Includes location, description, suggested fix
- Created via: `gh issue create --title "[FOLLOW-UP] ..." --body "..." --label ...`

### Stage 4: Follow-Up Implementation

**Trigger:** PR merged to main

**Workflow:** `follow-up-implementation.yml`

For each issue linked to the merged PR:

1. **Detect obsolescence:** Did the PR already address this?
   - If yes → Close issue with explanation
   - If no longer relevant → Close with context

2. **Implement if valid:**
   - Create branch: `auto/issue-{number}-implementation`
   - Apply fix, run tests/lint/format
   - Create PR to main
   - Close source issue (referenced by new PR)

## Configuration

### Environment Variables

Set in workflow files or repository secrets:

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_ZAI_API_KEY` | *required* | API key for Claude Code action |
| `ANTHROPIC_BASE_URL` | `https://api.z.ai/api/anthropic` | Z.ai API endpoint (cost optimization, trusted LLM provider) |
| `GH_TOKEN` | auto-provided | GitHub token for API operations |

### Disabling

To disable the auto-review system:

**Temporary:** Add to PR description:
```markdown
claude-auto-review: disabled
```

**Manual:** Only run when explicitly triggered with `@claude` mention

### Issue Templates

Located in `.github/ISSUE_TEMPLATE/`:
- `follow-up-medium.md` - Medium priority issues
- `follow-up-low.md` - Low priority issues

## Permissions

Both workflows require:

```yaml
permissions:
  contents: write      # Push commits, create branches
  pull-requests: write # Comment, create PRs
  issues: write        # Create/close issues
  id-token: write      # OIDC authentication
```

## Testing

### Manual Testing

1. Create a test PR with intentional issues
2. Comment `@claude` on the PR
3. Monitor workflow runs in Actions tab
4. Verify:
   - Review output in PR comments
   - Follow-up issues created with correct labels
   - Critical fixes pushed to PR branch

5. Merge the PR
6. Verify follow-up workflow runs
7. Check that linked issues are evaluated/implemented

### Workflow Dispatch

For manual testing via GitHub UI:

```yaml
on:
  workflow_dispatch:
    inputs:
      pr_number:
        description: 'PR number to review'
        required: true
```

## Troubleshooting

### Review didn't run

Check:
1. User is MEMBER/OWNER/COLLABORATOR
2. `@claude` was mentioned in comment
3. Pre-check (lint/format) passed

### Follow-up issues not created

Check:
1. Self-review job completed successfully
2. Triage job found medium/low severity issues
3. GH_TOKEN has `issues:write` permission
4. Triage job has `Bash(gh:*)` in allowedTools

### Follow-up implementation didn't run

Check:
1. PR was merged (not just closed)
2. Issues are linked via `#123` in issue body/comments
3. Workflow has correct permissions

### Debugging Payloads

Use the payload helpers to inspect workflow data:

```bash
# Source the helpers
source scripts/workflow-payload-helpers.sh

# Get latest review payload from PR
get_latest_payload 123 "review"

# Get validation payload
get_latest_payload 123 "self-review"

# Parse issue linkage from issue body
gh issue view 45 --json body --jq '.body' | parse_issue_linkage
```

### Missing or Invalid Payloads

**Symptom:** Downstream job can't find payload from previous job

Check:
1. Previous job completed successfully (check Actions tab)
2. Comment contains `CLAUDE_REVIEW_PAYLOAD_START` marker
3. Payload is valid JSON (no truncation or encoding issues)

**Symptom:** JSON parse errors in payload

Check:
1. No special characters breaking JSON (use `jq .` to validate)
2. Payload wasn't truncated by comment length limits
3. Run `extract_payload` manually to see raw content

## Labels

Auto-created on first use (via gh CLI):

| Label | Purpose |
|-------|---------|
| `follow-up` | Auto-generated follow-up issue |
| `priority/medium` | Medium severity finding |
| `priority/low` | Low severity finding |
| `claude-generated` | Created by Claude workflow |

## Related Files

- `.github/workflows/claude-code.yml` - Main review workflow
- `.github/workflows/follow-up-implementation.yml` - Follow-up automation
- `.github/ISSUE_TEMPLATE/follow-up-*.md` - Issue templates
- `src/types/workflow-payload.ts` - TypeScript interfaces for payload structures
- `scripts/workflow-payload-helpers.sh` - Bash helpers for parsing/generating payloads
- `docs/ARCHITECTURE.md` - System architecture

---

## Testing Results (Historical)

### Test PR #39 (2026-01-26)

> **Note:** These issues have been addressed with the structured payload architecture implemented above.

**What Was Tested:**
- Job identification headers (🔍, ✅, 🎯)
- Follow-up issue creation for medium/low findings
- All three jobs executing sequentially

**Results:**

✅ **Working:**
- All 3 jobs ran successfully (review → self-review → triage)
- Jobs executed in correct order with proper dependencies
- PR comments were posted by all jobs

**Issues Found (Now Resolved):**

1. **Job Identification Headers** → Resolved via `CLAUDE_JOB` markers in HTML comments
2. **Follow-Up Issues Not Created** → Resolved via structured `ISSUE_LINKAGE` blocks
3. **Comment Parsing Reliability** → Resolved via `CLAUDE_REVIEW_PAYLOAD` JSON format

---

🤖 Generated by [Claude Code](https://claude.ai/code)
