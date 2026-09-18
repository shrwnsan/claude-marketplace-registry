#!/bin/bash
cd /Users/karma/Developer/personal/claude-marketplace-registry/.worktrees/feat-insights || exit 1
echo "PWD=$(pwd)"
echo "--- lint errors:"
npm run lint 2>&1 | grep -c "  error  "
echo "--- type-check:"
npm run type-check 2>&1 | tail -1
echo "--- tests:"
npm test 2>&1 | grep -E "Tests:|Suites:"
echo "--- build:"
REPOSITORY_NAME=claude-marketplace-registry npm run build 2>&1 | tail -2
ls out/index.html || exit 1
ln -sfn /Users/karma/Developer/personal/claude-marketplace-registry/.worktrees/feat-insights/out /tmp/site/claude-marketplace-registry
echo BUILD_OK
