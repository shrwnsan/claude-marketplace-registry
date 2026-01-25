# Claude Review-Triage-Implementation Cycle

> **Status:** Implemented
> **Last Updated:** 2025-01-25

## Overview

An autonomous development cycle where Claude reviews pull requests, validates its own findings, triages issues by severity, creates follow-up work items, and automatically implements them when source PRs merge.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        claude-code.yml                                  │
│                    (triggered by @claude mention)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  review → self-review → triage                                          │
│    ↓           ↓             ↓                                          │
│  artifacts   validated    critical fixes + follow-up issues             │
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

## Workflow Stages

### Stage 1: Review

**Trigger:** `@claude` mention in PR comment

**Job:** `review`

Runs `claude-code-action` with read-only tools to analyze the PR:
- Security vulnerabilities (OWASP Top 10)
- Code quality issues
- Breaking changes
- Performance concerns

**Output:** `/tmp/review.json` artifact with categorized findings:
```json
{
  "critical": [{"location": "src/auth.ts:45", "issue": "...", "fix": "..."}],
  "medium": [...],
  "low": [...]
}
```

### Stage 2: Self-Review

**Job:** `self-review`

Validates the initial review output:
- **Catches misses:** Issues the first review overlooked
- **Validates findings:** Removes false positives, confirms accuracy
- **Merges results:** Combines original + new findings

**Output:** `/tmp/validated-findings.json`:
```json
{
  "validated": {"critical": [...], "medium": [...], "low": [...]},
  "missed": [...],
  "false_positives": [...]
}
```

### Stage 3: Triage

**Job:** `triage`

Processes validated findings:

| Severity | Action |
|----------|--------|
| **Critical** | Implement immediately, commit to PR branch |
| **Medium** | Create follow-up issue with `medium-priority` label |
| **Low** | Create follow-up issue with `low-priority` label |

**Follow-up issue structure:**
- Labels: `follow-up`, `{severity}-priority`, `claude-generated`
- References source PR number
- Includes location, description, suggested fix

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
| `ANTHROPIC_BASE_URL` | `https://api.z.ai/api/anthropic` | API endpoint |
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
2. Validated findings artifact exists
3. GH_TOKEN has `issues:write` permission

### Follow-up implementation didn't run

Check:
1. PR was merged (not just closed)
2. Issues are linked via `#123` in issue body/comments
3. Workflow has correct permissions

## Labels

Auto-created on first use (via gh CLI):

| Label | Color | Purpose |
|-------|-------|---------|
| `follow-up` | yellow | Auto-generated follow-up |
| `medium-priority` | orange | Medium severity |
| `low-priority` | blue | Low severity |
| `claude-generated` | purple | Created by Claude |
| `auto-implementation` | green | Auto-implemented PR |

## Related Files

- `.github/workflows/claude-code.yml` - Main review workflow
- `.github/workflows/follow-up-implementation.yml` - Follow-up automation
- `.github/ISSUE_TEMPLATE/follow-up-*.md` - Issue templates
- `docs/ARCHITECTURE.md` - System architecture

---

🤖 Generated by [Claude Code](https://claude.ai/code) - GLM 4.7
