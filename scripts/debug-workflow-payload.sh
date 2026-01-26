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
