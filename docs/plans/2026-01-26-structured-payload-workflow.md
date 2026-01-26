# Structured Payload Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace fragile header-based job identification with machine-readable structured payloads for reliable inter-job communication and issue linking.

**Architecture:** Each job embeds a JSON payload in an HTML comment block. Downstream jobs parse payloads to get findings, validate them, and create issues with explicit linkage markers.

**Tech Stack:** GitHub Actions, claude-code-action, gh CLI, JSON payloads in HTML comments

---

## Task 1: Define Payload TypeScript Types

**Files:**
- Create: `src/types/workflow-payload.ts`

**Step 1: Create the payload type definitions**

```typescript
/**
 * Structured payload for Claude review workflow inter-job communication.
 * Embedded in PR comments as HTML comments for machine parsing.
 */

export interface Finding {
  id: string; // F-001, F-002, etc.
  severity: 'critical' | 'medium' | 'low';
  category: 'security' | 'quality' | 'performance' | 'breaking-change' | 'style';
  file: string;
  lineStart?: number;
  lineEnd?: number;
  title: string;
  description: string;
  recommendation: string;
  validated?: boolean; // Set by self-review
  falsePositive?: boolean; // Set by self-review
}

export interface ReviewPayload {
  version: 1;
  job: 'review';
  runId: string;
  prNumber: number;
  timestamp: string;
  findings: Finding[];
}

export interface ValidationPayload {
  version: 1;
  job: 'self-review';
  runId: string;
  prNumber: number;
  timestamp: string;
  sourceRunId: string; // Links to review job
  validatedFindings: Finding[]; // Updated with validated/falsePositive flags
  additionalFindings: Finding[]; // New issues found during validation
}

export interface TriagePayload {
  version: 1;
  job: 'triage';
  runId: string;
  prNumber: number;
  timestamp: string;
  sourceRunId: string;
  actions: TriageAction[];
}

export interface TriageAction {
  findingId: string;
  severity: 'critical' | 'medium' | 'low';
  action: 'fixed' | 'issue-created' | 'skipped';
  issueNumber?: number; // For medium/low
  commitSha?: string; // For critical fixes
  reason?: string; // For skipped
}

export type WorkflowPayload = ReviewPayload | ValidationPayload | TriagePayload;

/**
 * Issue body markers for reliable linking in follow-up workflow.
 */
export interface IssueLinkage {
  sourcePr: number;
  sourceSha: string;
  claudeRunId: string;
  findingId: string;
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run type-check`
Expected: PASS (no errors related to new file)

**Step 3: Commit**

```bash
git add src/types/workflow-payload.ts
git commit -m "feat(workflow): add structured payload type definitions"
```

---

## Task 2: Create Payload Helper Script

**Files:**
- Create: `scripts/workflow-payload-helpers.sh`

**Step 1: Create shell helpers for parsing/generating payloads**

```bash
#!/bin/bash
# Workflow payload helpers for Claude review cycle
# These functions help parse and generate structured payloads in PR comments

# Extract payload from comment body
# Usage: extract_payload "comment_body"
extract_payload() {
  local body="$1"
  echo "$body" | sed -n 's/.*<!-- CLAUDE_REVIEW_PAYLOAD_START\(.*\)CLAUDE_REVIEW_PAYLOAD_END -->.*/\1/p' | head -1
}

# Validate payload has required fields
# Usage: validate_payload "json_payload" "expected_job"
validate_payload() {
  local payload="$1"
  local expected_job="$2"
  
  local version=$(echo "$payload" | jq -r '.version // empty')
  local job=$(echo "$payload" | jq -r '.job // empty')
  
  if [ -z "$version" ] || [ -z "$job" ]; then
    echo "ERROR: Invalid payload - missing version or job" >&2
    return 1
  fi
  
  if [ "$job" != "$expected_job" ]; then
    echo "ERROR: Expected job '$expected_job' but got '$job'" >&2
    return 1
  fi
  
  return 0
}

# Get latest payload of a specific job type from PR comments
# Usage: get_latest_payload PR_NUMBER JOB_TYPE
get_latest_payload() {
  local pr_number="$1"
  local job_type="$2"
  
  # Fetch all comments
  local comments=$(gh pr view "$pr_number" --json comments --jq '.comments[].body')
  
  # Find comments with our payload marker and matching job
  echo "$comments" | while read -r comment; do
    local payload=$(extract_payload "$comment")
    if [ -n "$payload" ]; then
      local job=$(echo "$payload" | jq -r '.job // empty')
      if [ "$job" = "$job_type" ]; then
        echo "$payload"
      fi
    fi
  done | tail -1  # Return only the latest
}

# Generate issue body with linkage markers
# Usage: generate_issue_body FINDING_JSON SOURCE_PR SOURCE_SHA RUN_ID
generate_issue_body() {
  local finding="$1"
  local source_pr="$2"
  local source_sha="$3"
  local run_id="$4"
  
  local id=$(echo "$finding" | jq -r '.id')
  local file=$(echo "$finding" | jq -r '.file')
  local line_start=$(echo "$finding" | jq -r '.lineStart // "N/A"')
  local line_end=$(echo "$finding" | jq -r '.lineEnd // "N/A"')
  local description=$(echo "$finding" | jq -r '.description')
  local recommendation=$(echo "$finding" | jq -r '.recommendation')
  
  cat << EOF
## Location
- **File:** \`$file\`
- **Lines:** $line_start - $line_end

## Description
$description

## Suggested Fix
$recommendation

---

<!-- ISSUE_LINKAGE_START
Source-PR: #$source_pr
Source-SHA: $source_sha
Claude-Run-ID: $run_id
Finding-ID: $id
ISSUE_LINKAGE_END -->

*Created by Claude Review Workflow from PR #$source_pr*
EOF
}

# Parse issue linkage from issue body
# Usage: parse_issue_linkage "issue_body"
parse_issue_linkage() {
  local body="$1"
  local linkage=$(echo "$body" | sed -n '/ISSUE_LINKAGE_START/,/ISSUE_LINKAGE_END/p')
  
  if [ -z "$linkage" ]; then
    echo "{}"
    return 1
  fi
  
  local source_pr=$(echo "$linkage" | grep "Source-PR:" | sed 's/.*#\([0-9]*\).*/\1/')
  local source_sha=$(echo "$linkage" | grep "Source-SHA:" | awk '{print $2}')
  local run_id=$(echo "$linkage" | grep "Claude-Run-ID:" | awk '{print $2}')
  local finding_id=$(echo "$linkage" | grep "Finding-ID:" | awk '{print $2}')
  
  jq -n \
    --arg pr "$source_pr" \
    --arg sha "$source_sha" \
    --arg run "$run_id" \
    --arg finding "$finding_id" \
    '{sourcePr: ($pr|tonumber), sourceSha: $sha, claudeRunId: $run, findingId: $finding}'
}
```

**Step 2: Make script executable**

Run: `chmod +x scripts/workflow-payload-helpers.sh`

**Step 3: Commit**

```bash
git add scripts/workflow-payload-helpers.sh
git commit -m "feat(workflow): add payload helper scripts for parsing/generating"
```

---

## Task 3: Update Review Job with Structured Payload

**Files:**
- Modify: `.github/workflows/claude-code.yml` (review job settings)

**Step 1: Update review job instructions to output structured payload**

Replace the review job's `settings.instructions` with instructions that:
1. Output findings in structured format
2. Embed JSON payload in HTML comment
3. Use `CLAUDE_JOB=review` marker

New instructions content (update in workflow file):

```
You are the CODE REVIEW job (Job 1 of 3).

IMPORTANT: Your comment MUST include a machine-readable payload block.

Pre-check status:
- ESLint: ${{ needs.pre-check.outputs.lint-status }}
- Prettier: ${{ needs.pre-check.outputs.format-status }}

Analyze this PR for:
1. Security Issues (OWASP Top 10, auth flaws, injection)
2. Code Quality (type safety, error handling, performance)
3. Best Practices (framework patterns, conventions)
4. Breaking Changes (API changes, migration needed)

For each finding, assign:
- **id**: F-001, F-002, etc.
- **severity**: critical | medium | low
- **category**: security | quality | performance | breaking-change | style
- **file**: exact file path
- **lineStart/lineEnd**: line numbers if applicable
- **title**: brief summary
- **description**: detailed explanation
- **recommendation**: how to fix

Structure your comment as:

---

## 🔍 CODE REVIEW (Job 1/3)
CLAUDE_JOB=review

[Human-readable findings organized by severity]

<!-- CLAUDE_REVIEW_PAYLOAD_START
{
  "version": 1,
  "job": "review",
  "runId": "${{ github.run_id }}",
  "prNumber": PR_NUMBER,
  "timestamp": "ISO_TIMESTAMP",
  "findings": [
    {
      "id": "F-001",
      "severity": "critical",
      "category": "security",
      "file": "path/to/file.ts",
      "lineStart": 42,
      "lineEnd": 58,
      "title": "SQL Injection vulnerability",
      "description": "User input is concatenated directly...",
      "recommendation": "Use parameterized queries..."
    }
  ]
}
CLAUDE_REVIEW_PAYLOAD_END -->

---

Replace PR_NUMBER with the actual PR number and ISO_TIMESTAMP with current ISO 8601 timestamp.
```

**Step 2: Verify workflow syntax**

Run: `cat .github/workflows/claude-code.yml | head -150`
Expected: Valid YAML with updated instructions

**Step 3: Commit**

```bash
git add .github/workflows/claude-code.yml
git commit -m "feat(workflow): add structured payload to review job"
```

---

## Task 4: Update Self-Review Job with Payload Parsing

**Files:**
- Modify: `.github/workflows/claude-code.yml` (self-review job)

**Step 1: Update self-review to parse review payload and output validation payload**

Update the self-review job to:
1. Parse the review job's payload from comments
2. Validate each finding
3. Output its own validation payload

New instructions for self-review:

```
You are the REVIEW VALIDATION job (Job 2 of 3).

IMPORTANT: Your comment MUST include a machine-readable payload block.

First, read /tmp/review-comments.txt and find the CLAUDE_REVIEW_PAYLOAD block.
Parse the JSON payload to get the list of findings from Job 1.

For each finding in the payload:
1. Verify the issue exists at the stated location
2. Confirm severity is appropriate
3. Check for false positives
4. Set 'validated: true' if confirmed, 'falsePositive: true' if not real

Also check for issues the original review missed:
- OWASP Top 10 vulnerabilities
- Performance anti-patterns
- Breaking changes
- Type safety issues

Structure your comment as:

---

## ✅ REVIEW VALIDATION (Job 2/3)
CLAUDE_JOB=self-review

[Human-readable validation results]

<!-- CLAUDE_REVIEW_PAYLOAD_START
{
  "version": 1,
  "job": "self-review",
  "runId": "${{ github.run_id }}",
  "prNumber": PR_NUMBER,
  "timestamp": "ISO_TIMESTAMP",
  "sourceRunId": "RUN_ID_FROM_REVIEW_PAYLOAD",
  "validatedFindings": [
    {
      "id": "F-001",
      ... original fields ...,
      "validated": true,
      "falsePositive": false
    }
  ],
  "additionalFindings": [
    {
      "id": "F-NEW-001",
      ... new finding fields ...
    }
  ]
}
CLAUDE_REVIEW_PAYLOAD_END -->

---
```

**Step 2: Verify workflow syntax**

Run: `head -220 .github/workflows/claude-code.yml`

**Step 3: Commit**

```bash
git add .github/workflows/claude-code.yml
git commit -m "feat(workflow): add payload parsing to self-review job"
```

---

## Task 5: Update Triage Job with Issue Creation and Linkage

**Files:**
- Modify: `.github/workflows/claude-code.yml` (triage job)

**Step 1: Update triage to use validation payload and create linked issues**

Update triage job to:
1. Parse validation payload
2. Process only validated findings (not false positives)
3. Create issues with proper linkage markers
4. Output triage payload with action summary

New instructions for triage:

```
You are the TRIAGE job (Job 3 of 3).

IMPORTANT: Your comment MUST include a machine-readable payload block.

Read /tmp/all-review-comments.txt and find the latest CLAUDE_REVIEW_PAYLOAD block with job="self-review".
Parse the validatedFindings and additionalFindings arrays.

Skip any findings where falsePositive=true.

For each validated finding by severity:

**CRITICAL** - Fix immediately:
1. Edit the code to fix the issue
2. Run: npm test
3. Commit with message: fix(scope): description [F-XXX]
4. Push to PR branch
5. Record: action="fixed", commitSha=<sha>

**MEDIUM/LOW** - Create follow-up issue with linkage:
1. Create issue using gh:

gh issue create \
  --title "[FOLLOW-UP] <title>" \
  --body "## Location
- **File:** \`<file>\`
- **Lines:** <start> - <end>

## Description
<description>

## Suggested Fix
<recommendation>

---

<!-- ISSUE_LINKAGE_START
Source-PR: #${{ env.PR_NUMBER }}
Source-SHA: ${{ github.sha }}
Claude-Run-ID: ${{ github.run_id }}
Finding-ID: <finding_id>
ISSUE_LINKAGE_END -->

*Created by Claude Review Workflow from PR #${{ env.PR_NUMBER }}*" \
  --label follow-up \
  --label priority/<severity> \
  --label claude-generated

2. Capture issue number from output
3. Record: action="issue-created", issueNumber=<number>

After processing, post summary:

---

## 🎯 TRIAGE (Job 3/3)
CLAUDE_JOB=triage

### Summary
- Critical fixes applied: X (commits: <sha1>, <sha2>)
- Medium issues created: X (#N1, #N2)
- Low issues created: X (#N3, #N4)
- Skipped (false positives): X

<!-- CLAUDE_REVIEW_PAYLOAD_START
{
  "version": 1,
  "job": "triage",
  "runId": "${{ github.run_id }}",
  "prNumber": PR_NUMBER,
  "timestamp": "ISO_TIMESTAMP",
  "sourceRunId": "RUN_ID_FROM_VALIDATION_PAYLOAD",
  "actions": [
    {"findingId": "F-001", "severity": "critical", "action": "fixed", "commitSha": "abc123"},
    {"findingId": "F-002", "severity": "medium", "action": "issue-created", "issueNumber": 45}
  ]
}
CLAUDE_REVIEW_PAYLOAD_END -->

---

CRITICAL: If you intend to create issues but create zero, FAIL and report the error.
Log all gh commands executed and their exit codes.
```

**Step 2: Verify workflow syntax**

Run: `tail -100 .github/workflows/claude-code.yml`

**Step 3: Commit**

```bash
git add .github/workflows/claude-code.yml
git commit -m "feat(workflow): add issue linkage to triage job"
```

---

## Task 6: Update Follow-Up Implementation to Use Linkage

**Files:**
- Modify: `.github/workflows/follow-up-implementation.yml`

**Step 1: Update issue detection to use explicit linkage markers**

Replace the github-script detection with label-based + body parsing:

```yaml
- name: Detect linked issues
  id: detect
  env:
    GH_TOKEN: ${{ github.token }}
  run: |
    PR_NUMBER="${{ github.event.pull_request.number }}"
    echo "Finding follow-up issues for PR #$PR_NUMBER"
    
    # Find issues with follow-up label that reference this PR
    ISSUES=$(gh issue list \
      --label "follow-up" \
      --label "claude-generated" \
      --state open \
      --json number,body \
      --jq ".[] | select(.body | contains(\"Source-PR: #$PR_NUMBER\")) | .number")
    
    if [ -z "$ISSUES" ]; then
      echo "No linked follow-up issues found"
      echo "issue_numbers=" >> $GITHUB_OUTPUT
    else
      ISSUE_LIST=$(echo "$ISSUES" | tr '\n' ',' | sed 's/,$//')
      echo "Found issues: $ISSUE_LIST"
      echo "issue_numbers=$ISSUE_LIST" >> $GITHUB_OUTPUT
    fi
```

**Step 2: Update implementation job to check obsolescence via SHA**

Add to the implementation job instructions:

```
When checking if issue is obsolete:
1. Parse the ISSUE_LINKAGE block from issue body
2. Get Source-SHA from linkage
3. Compare with current main HEAD
4. If the specific file+lines have changed since Source-SHA, the issue may be resolved
5. Use git diff Source-SHA..HEAD -- <file> to check
```

**Step 3: Commit**

```bash
git add .github/workflows/follow-up-implementation.yml
git commit -m "feat(workflow): use explicit linkage for follow-up detection"
```

---

## Task 7: Update PRD with New Architecture

**Files:**
- Modify: `docs/plans/prd-005-claude-review-triage-cycle.md`

**Step 1: Update the PRD to reflect structured payload architecture**

Add new sections:
1. Payload Format specification
2. Issue Linkage Format specification
3. Updated troubleshooting with payload debugging
4. Remove "Next Steps" section (now implemented)

**Step 2: Commit**

```bash
git add docs/prd-005-claude-review-triage-cycle.md
git commit -m "docs(prd-005): update with structured payload architecture"
```

---

## Task 8: Add Debug Logging Script

**Files:**
- Create: `scripts/debug-workflow-payload.sh`

**Step 1: Create debug script for payload inspection**

```bash
#!/bin/bash
# Debug script to inspect workflow payloads in PR comments
# Usage: ./scripts/debug-workflow-payload.sh PR_NUMBER

set -e

PR_NUMBER="$1"

if [ -z "$PR_NUMBER" ]; then
  echo "Usage: $0 PR_NUMBER"
  exit 1
fi

echo "=== Fetching comments for PR #$PR_NUMBER ==="

COMMENTS=$(gh pr view "$PR_NUMBER" --json comments --jq '.comments[] | {author: .author.login, createdAt: .createdAt, body: .body}')

echo ""
echo "=== Found Comments ==="
echo "$COMMENTS" | jq -r '.author + " at " + .createdAt'

echo ""
echo "=== Payload Analysis ==="

echo "$COMMENTS" | jq -r '.body' | while read -r body; do
  # Check for CLAUDE_JOB marker
  job_marker=$(echo "$body" | grep -o 'CLAUDE_JOB=[a-z-]*' || true)
  if [ -n "$job_marker" ]; then
    echo "Found job marker: $job_marker"
  fi
  
  # Check for payload
  if echo "$body" | grep -q "CLAUDE_REVIEW_PAYLOAD_START"; then
    echo "Found payload block"
    payload=$(echo "$body" | sed -n '/CLAUDE_REVIEW_PAYLOAD_START/,/CLAUDE_REVIEW_PAYLOAD_END/p' | grep -v 'CLAUDE_REVIEW_PAYLOAD')
    echo "$payload" | jq '.' 2>/dev/null || echo "Invalid JSON in payload"
  fi
done

echo ""
echo "=== Issue Linkage Check ==="
gh issue list --label "follow-up" --label "claude-generated" --json number,title,body --jq ".[] | select(.body | contains(\"Source-PR: #$PR_NUMBER\")) | {number, title}"
```

**Step 2: Make executable and commit**

```bash
chmod +x scripts/debug-workflow-payload.sh
git add scripts/debug-workflow-payload.sh
git commit -m "feat(workflow): add debug script for payload inspection"
```

---

## Task 9: Final Verification and Push

**Step 1: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 2: Run lint**

Run: `npm run lint`
Expected: PASS (warnings OK)

**Step 3: Validate workflow YAML syntax**

Run: `cat .github/workflows/claude-code.yml | python3 -c "import sys, yaml; yaml.safe_load(sys.stdin)"`
Run: `cat .github/workflows/follow-up-implementation.yml | python3 -c "import sys, yaml; yaml.safe_load(sys.stdin)"`
Expected: No errors

**Step 4: Push branch and create PR**

```bash
git push -u origin feature/structured-payload-workflow
gh pr create --title "feat: structured payload workflow for reliable job communication" \
  --body "## Summary
Implements structured JSON payloads for the Claude review cycle to fix:
1. Job identification failures (all jobs showing same header)
2. Issue creation failures (triage not creating follow-up issues)

## Changes
- Add TypeScript types for workflow payloads
- Add shell helpers for payload parsing
- Update all 3 review jobs to emit/parse structured payloads
- Add explicit issue linkage markers (Source-PR, Source-SHA, Claude-Run-ID)
- Update follow-up workflow to use linkage for issue detection
- Add debug script for payload inspection

## Testing
Trigger with @claude mention on a test PR and verify:
1. Each job's comment contains CLAUDE_JOB marker
2. Each comment has valid JSON in CLAUDE_REVIEW_PAYLOAD block
3. Medium/low findings create issues with ISSUE_LINKAGE markers
4. Debug script can parse all payloads

Closes investigation from prd-005 testing results."
```

---

## Verification Checklist

After PR is merged and tested:

- [ ] Job 1 (review) comment contains `CLAUDE_JOB=review` and valid payload
- [ ] Job 2 (self-review) comment contains `CLAUDE_JOB=self-review` and references Job 1's runId
- [ ] Job 3 (triage) comment contains `CLAUDE_JOB=triage` and lists actions taken
- [ ] Medium/low issues are created with `ISSUE_LINKAGE` blocks
- [ ] Follow-up workflow can find issues by Source-PR
- [ ] Debug script successfully parses all payloads
