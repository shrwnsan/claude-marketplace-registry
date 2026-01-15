# Claude Code Action Setup

This repository is configured to use [Claude Code Action](https://github.com/anthropics/claude-code-action) with custom API configuration for Z.ai.

## How It Works

Claude Code Action runs on GitHub's infrastructure (cloud), NOT from your local machine. When you comment `@claude` on a PR or issue:

1. GitHub triggers the workflow
2. Claude executes on GitHub Actions runners
3. Claude responds directly in the comment thread
4. Claude can read code, make changes, run tests, and commit to branches

## Setup Instructions

### 1. Add GitHub Secret

Go to **Settings → Secrets and variables → Actions** and add:

- **`ANTHROPIC_API_KEY`**: Your Z.ai API key

### 2. Install the GitHub App

Run in your terminal:

```bash
claude
# Then run: /install-github-app
```

Or manually install the [Claude Code GitHub App](https://github.com/apps/claude-code-app)

### 3. Merge This PR

Once the workflow is merged, you can start using `@claude` in comments.

## Usage

### Interactive Mode (@claude mentions)

On any pull request or issue, comment:

```
@claude Review this PR for security issues
@claude Fix the failing tests
@claude Refactor this component
@claude Add JSDoc comments to src/utils.ts
```

**Who can trigger**: Only users with write permissions

### What Claude Can Do

- **Code Review**: Analyze changes and suggest improvements
- **Fix Bugs**: Implement fixes for reported issues
- **Refactor**: Improve code structure and readability
- **Add Tests**: Write unit tests for existing code
- **Update Docs**: Generate or update documentation
- **Run Commands**: Execute npm scripts, git commands, tests
- **Create Commits**: Push changes to branches (never force pushes)

## Configuration

The workflow (`.github/workflows/claude-code.yml`) includes:

| Setting | Value | Description |
|---------|-------|-------------|
| API Base URL | `https://api.z.ai/api/anthropic` | Custom endpoint for Z.ai |
| Max Turns | 10 | Conversation turns per request |
| Allowed Tools | Read, Write, Edit, Bash (npm, git), etc. | Tools Claude can use |
| Permissions | contents, PRs, issues: write | Required for making changes |

### Modifying Tools

To allow more Bash commands:

```yaml
claude_args: |
  --allowedTools "Bash(npm:*),Bash(git:*),Bash(yarn:*),Bash(pnpm:*)"
```

## Examples

### Code Review
```
@claude Review this PR focusing on:
1. Security vulnerabilities
2. Performance issues
3. TypeScript type safety
```

### Bug Fix
```
@claude The login form isn't submitting. Please investigate and fix.
```

### Refactoring
```
@claude Refactor src/components/Header.tsx to use React.memo and useCallback
```

### Testing
```
@claude Add unit tests for the utils/dateFormatter.ts file
```

## Troubleshooting

### "@claude isn't responding"

- You need **write permissions** on the repository
- Check Actions tab for workflow failures
- Verify `ANTHROPIC_API_KEY` secret is set
- Ensure GitHub App is installed

### "403 Resource not accessible"

The workflow includes `bot_id` defaults to handle this. If using custom auth, specify:

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    bot_id: "your_bot_id"
    bot_name: "your_bot_name"
```

### Custom API URL Not Working

The `ANTHROPIC_BASE_URL` is set in the `env:` section. Verify it's correct for your Z.ai endpoint.

## Branch Behavior

- **Open PRs**: Claude pushes to the PR branch
- **Closed PRs**: Claude creates a new branch
- **Issues**: Claude always creates a new branch

## Security Notes

- Claude never force pushes or performs destructive operations
- Workflow files cannot be modified by Claude (security restriction)
- Bash commands are limited to allowlisted npm/git/node commands
- All changes appear as commits in your repository

## Resources

- [Official Documentation](https://github.com/anthropics/claude-code-action)
- [Solutions Guide](https://github.com/anthropics/claude-code-action/blob/main/docs/solutions.md)
- [FAQ](https://github.com/anthropics/claude-code-action/blob/main/docs/faq.md)
- [Configuration Reference](https://github.com/anthropics/claude-code-action/blob/main/docs/configuration.md)
