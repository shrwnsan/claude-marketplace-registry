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
