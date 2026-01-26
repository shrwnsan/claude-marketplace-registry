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
- `docs/ref/ARCHITECTURE.md` - System architecture

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

### Test PR #42 (2026-01-26)

> **Status:** Issues Identified - Fix Implemented

**What Was Tested:**
- Structured payload architecture after merge to main
- CLAUDE_JOB markers in workflow comments
- JSON payload embedding in PR comments

**Results:**

✅ **Working:**
- All 4 jobs executed successfully
- CLAUDE_JOB markers found in comments

⚠️ **Issues Identified:**

1. **JSON Payloads Not Embedded** - Claude described the format instead of outputting actual JSON
   - **Root Cause:** Placeholder language (`[INSERT_ISO_TIMESTAMP]`) made Claude treat it as a template
   
2. **Comments Hard to Distinguish** - All comments had similar generic headers from claude-code-action
   - **Root Cause:** Action's built-in formatting overrides custom headers

3. **Payload Marker Inconsistency** - Triage used `STRUCTURED_PAYLOAD_START` vs `CLAUDE_REVIEW_PAYLOAD_START`

**Fix Applied (PR pending):**

1. Each job now posts a **separate branded comment** via `gh pr comment`
2. Distinct visual headers:
   - `## 🔍 CODE REVIEW (Job 1/3)`
   - `## ✅ REVIEW VALIDATION (Job 2/3)`
   - `## 🎯 TRIAGE (Job 3/3)`
3. Standardized payload markers: `<!-- CLAUDE_PAYLOAD ... END_PAYLOAD -->`
4. Removed placeholder text - uses `date -u` command for timestamps
5. Added `Bash(gh:*)` and `Bash(date:*)` to all jobs

---

### Test PR #44 (2026-01-26)

> **Status:** Issues Persist - PR #43 fixes insufficient

**What Was Tested:**
- Verification of PR #43 fixes
- Branded comments via `gh pr comment`
- Actual JSON payload embedding
- CLAUDE_PAYLOAD marker parsing

**Workflow Execution:**
✅ **All 4 jobs completed successfully:**
1. Pre-Check Validation
2. Code Review (Job 1/3)
3. Review Validation (Job 2/3)
4. Finding Triage (Job 3/3)

**Results:**

✅ **Working:**
- All 4 jobs executed in correct order
- CLAUDE_JOB markers present in comments
- Jobs complete without errors

⚠️ **Issues Still Present:**

1. **JSON Payloads Still Not Being Embedded**
   - **Problem:** Comments still **describe** the payload format rather than **containing** actual JSON
   - **Root Cause:** Workflow instructions are too complex and contain placeholder patterns like `[YOUR FINDINGS HERE]` and `YOUR_FINDINGS_ARRAY`
   - **Impact:** Claude treats the bash commands as template examples rather than executing them
   - **Evidence:** Debug script shows "Found payload block" but no actual JSON in comments

2. **Branded Comment via `gh pr comment` Not Executing**
   - **Problem:** Workflow instructs Claude to post separate branded comment using `gh pr comment`
   - **Actual:** Claude only posts the main claude-code-action comment
   - **Root Cause:** Instructions embed bash commands within JSON strings, making them look like examples
   - **Impact:** Only one generic comment per job, not clearly branded separate comments

3. **Debug Script Incompatibility**
   - **Problem:** Script looks for `CLAUDE_REVIEW_PAYLOAD_START/END` markers
   - **Actual:** PR #43 changed to `CLAUDE_PAYLOAD...END_PAYLOAD`
   - **Impact:** Debug script cannot parse payloads even if they were present

**Verification Steps Used:**
```bash
# Ran debug script on PR #44
./scripts/debug-workflow-payload.sh 44

# Output showed:
# - Job markers found: ✅
# - Payload block references found: ✅
# - Actual JSON embedded: ❌ (still only format descriptions)
```

**Workflow Jobs Structure:**
```
Pre-Check Validation (runs first)
    ↓
Code Review (Job 1/3) ← depends on pre-check
    ↓
Review Validation (Job 2/3) ← depends on review, runs even if review fails
    ↓
Finding Triage (Job 3/3) ← depends on validation
```

**Root Cause Analysis:**

The workflow instructions suffer from "template confusion":
- Complex nested JSON within bash command examples
- Placeholder patterns `[YOUR FINDINGS HERE]`, `YOUR_FINDINGS_ARRAY`
- Bash commands embedded in instruction strings make them look like documentation
- Claude interprets as "here's what you SHOULD do" rather than "DO THIS NOW"

**Required Fixes:**

1. **Simplify workflow instructions** - Make them direct and executable
2. **Remove placeholder patterns** - Use actual variable substitutions
3. **Separate instruction from execution** - Don't embed bash in JSON examples
4. **Update debug script** - Match new `CLAUDE_PAYLOAD...END_PAYLOAD` markers
5. **Make directives explicit** - Use "EXECUTE NOW" language instead of examples

**Next Actions:**
1. Refactor workflow instructions to be imperative rather than descriptive
2. Extract bash commands to separate workflow steps before Claude execution
3. Provide clearer success criteria in instructions
4. Update debug script for new marker format
5. Re-test with simplified instructions

---

### Test PR #45 (2026-01-26)

> **Status:** Issue Persists - Simplified instructions insufficient

**What Was Tested:**
- Retest after PR #44 merge to main
- Pre-generated timestamps (no date command in instructions)
- Simplified STEP 1/2/3 instruction format
- Imperative "EXECUTE THIS COMMAND" language
- Heredoc placeholders (FINDINGS_MD, PAYLOAD_JSON)

**Workflow Execution:**
✅ **All 4 jobs completed successfully:**
1. Pre-Check Validation
2. Code Review (Job 1/3)
3. Review Validation (Job 2/3)
4. Finding Triage (Job 3/3)

**Results:**

⚠️ **Issues Still Present:**

1. **gh pr Comment Not Executed**
   - **Problem:** Claude still not executing the `gh pr comment` command
   - **Evidence:** Only 3 main claude-code-action comments posted, no separate branded comments
   - **Impact:** No separate branded comments per job

2. **JSON Payloads Still Described, Not Embedded**
   - **Problem:** Comments show JSON as example/template: `{"version":1,"job":"review"...}`
   - **Evidence:** No actual JSON with real runId, prNumber, timestamp values in comments
   - **Impact:** Debug script cannot parse actual payloads

**Verification Steps Used:**
```bash
# Ran debug script on PR #45
./scripts/debug-workflow-payload.sh 45

# Output showed:
# - Job markers found: ✅
# - Payload block references found: ✅
# - Actual JSON with real data: ❌ (still only format descriptions)
```

**Key Finding:**

The PR #44 improvements (pre-generated timestamps, clearer language, heredoc placeholders) reduced complexity but **did not solve the core issue**.

**Root Cause - Deeper Understanding:**

The fundamental issue is not just "template confusion" - it's that **Claude will not execute bash commands that are embedded in workflow instruction strings**, regardless of:
- How simple the syntax is
- How imperative the language is ("EXECUTE THIS COMMAND")
- Whether placeholders are used

The heredoc syntax `$(cat <<'TAG'...TAG)` is still complex enough that Claude interprets it as example code rather than executable commands.

**Commit Tagged:**
- `18c309d` - PR #44 merge point, tagged as rollback reference
- Contains simplified workflow instructions
- Contains complete test history in PRD-005

**Decision Point:**

Two paths forward:

**Option 1:** Remove ALL bash syntax from instructions
- Use ultra-simple text placeholders only
- Example: `[PASTE YOUR FINDINGS HERE]` instead of heredocs
- Test if minimal complexity enables execution

**Option 2:** Use workflow step to post comments
- Move comment posting to separate workflow step
- Claude outputs findings to file, workflow posts them
- Guaranteed to work but loses Claude's natural formatting

**Next Step:**
Decide between Option 1 (try simpler placeholders) or Option 2 (workflow-controlled posting).

---

🤖 Generated by [Claude Code](https://claude.ai/code)
