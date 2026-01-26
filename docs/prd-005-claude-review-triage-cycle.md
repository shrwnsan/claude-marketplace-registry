# Claude Review-Triage-Implementation Cycle

> **Status:** Partially Implemented - Known Issues (see Testing Results)
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
- `docs/ARCHITECTURE.md` - System architecture

---

## Testing Results

### Test PR #39 (2026-01-26)

**What Was Tested:**
- Job identification headers (🔍, ✅, 🎯)
- Follow-up issue creation for medium/low findings
- All three jobs executing sequentially

**Results:**

✅ **Working:**
- All 3 jobs ran successfully (review → self-review → triage)
- Jobs executed in correct order with proper dependencies
- PR comments were posted by all jobs

❌ **Issues Found:**

1. **Job Identification Headers Not Working**
   - **Expected:** Each job uses distinct header (🔍 CODE REVIEW, ✅ REVIEW VALIDATION, 🎯 TRIAGE)
   - **Actual:** All 3 comments use `### 🔍 CODE REVIEW (Job 1/3)`
   - **Root Cause:** The `anthropics/claude-code-action@v1` has built-in comment formatting that overrides custom header instructions
   - **Impact:** Cannot distinguish which job posted which comment

2. **Follow-Up Issues Not Created**
   - **Expected:** Triage job creates issues for medium/low findings via `gh issue create`
   - **Actual:** Zero issues created despite clear instructions
   - **Root Cause:** Unknown - job completed successfully but didn't execute issue creation commands
   - **Impact:** Triage workflow is non-functional

3. **Comment Count Mismatch**
   - **Expected:** 3 jobs → 3 comments with distinct headers
   - **Actual:** 3 comments but all with identical headers
   - **Impact:** Confusion about which findings come from which job

---

## Next Steps

### Option A: Work Within Action Constraints

**Approach:** Accept the claude-code-action's built-in comment format and adapt to it.

**Actions:**
1. Research `anthropics/claude-code-action@v1` documentation for:
   - Built-in features for job identification
   - Configuration options for comment formatting
   - Alternative ways to distinguish jobs
2. Use job-specific content indicators:
   - Add job identifiers in comment body (e.g., "This is Job 1/3")
   - Use unique emoji combinations in findings
   - Structure findings differently per job
3. Investigate triage failure:
   - Check if `gh issue create` commands are being executed
   - Verify permissions and API access
   - Add debug logging to triage job

**Pros:**
- Works within the action's design
- May be more stable long-term
- Less maintenance overhead

**Cons:**
- Limited customization options
- May not solve all issues
- Dependent on action's feature set

### Option B: Override Action Formatting

**Approach:** Find ways to disable or override the action's default header formatting.

**Actions:**
1. Research:
   - Action source code for formatting logic
   - Environment variables or settings to disable default headers
   - Alternative GitHub Actions with more customization
2. Potential solutions:
   - Fork and modify the claude-code-action
   - Use the action's raw output and post comments manually
   - Switch to a different implementation approach
3. Address triage failure:
   - Debug why `gh issue create` isn't working
   - Consider alternative issue creation methods
   - Add explicit error handling and logging

**Pros:**
- Full control over comment format
- Can implement custom workflows
- Potentially solves all issues

**Cons:**
- Higher maintenance burden
- May break with action updates
- More complex implementation

---

## Recommendation

**Start with Option A** (Work Within Action Constraints) to:
1. Quickly resolve the triage/issue creation issue (highest priority)
2. Document workarounds for job identification
3. Gather more data on action limitations

**If Option A is insufficient**, proceed to Option B:
1. Fork or find alternative action
2. Implement custom comment posting
3. Full control over workflow behavior

---

🤖 Generated by [Claude Code](https://claude.ai/code) - GLM 4.7
