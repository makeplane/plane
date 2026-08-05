# Claude AI Code Analysis - Setup Guide

This GitHub Actions workflow automatically analyzes pull requests using Claude AI to identify potential issues across multiple categories.

## Features

The CI pipeline analyzes PRs for:

1. **Performance Issues** - N+1 queries, inefficient database operations, memory issues
2. **Secret Scanning** - Hardcoded credentials, API keys, sensitive data
3. **Security Issues** - SQL injection, XSS, authentication bypasses, etc.
4. **Public Endpoints** - New/modified API endpoints and their security posture
5. **Dead Code** - Unused functions, imports, unreachable code

## Setup Instructions

### 1. Add Anthropic API Key

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Add it to your repository secrets:
   - Go to your repository on GitHub
   - Navigate to **Settings** > **Secrets and variables** > **Actions**
   - Click **New repository secret**
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key
   - Click **Add secret**

### 2. Enable GitHub Actions

1. Go to your repository's **Actions** tab
2. If actions are disabled, click **I understand my workflows, go ahead and enable them**
3. The workflow will now run automatically on new PRs

### 3. Add the Workflow Files

Copy these files to your repository:

```
.github/
├── workflows/
│   └── claude-pr-analysis.yml
└── scripts/
    └── claude_analyzer.py
```

### 4. Commit and Push

```bash
git add .github/
git commit -m "feat: add Claude AI PR analysis workflow"
git push origin main
```

## Usage

The workflow is manually triggered, giving you control over when to run analysis and manage API costs.

### Manual Triggering

1. **Via GitHub UI:**
   - Go to your repository on GitHub
   - Click the **Actions** tab
   - Select **Claude PR Code Analysis** from the workflows list
   - Click **Run workflow** button (top right)
   - Enter the PR number you want to analyze
   - Click **Run workflow**

2. **Via GitHub CLI:**
   ```bash
   # Analyze PR #123
   gh workflow run claude-pr-analysis.yml -f pr_number=123
   ```

3. **Via API:**
   ```bash
   curl -X POST \
     -H "Accept: application/vnd.github.v3+json" \
     -H "Authorization: token YOUR_GITHUB_TOKEN" \
     https://api.github.com/repos/OWNER/REPO/actions/workflows/claude-pr-analysis.yml/dispatches \
     -d '{"ref":"main","inputs":{"pr_number":"123"}}'
   ```

The workflow will:
1. Fetch the PR details and changes
2. Analyze the code using Claude AI
3. Post findings as a comment on the specified PR

### Example Output

The bot will post a comment like:

```markdown
## 🤖 Claude AI Code Analysis

### ✅ Performance Issues
No significant performance issues detected in this PR.

### ⚠️ Secret Scanning
Potential secrets detected:
- `config.py:45` - Possible API key hardcoded
- `settings.js:23` - Database connection string with credentials

### ✅ Security Issues
No security vulnerabilities found.

### ⚠️ Public Endpoints
New endpoints detected:
- `POST /api/v1/users` - Missing rate limiting
- `GET /api/v1/admin/stats` - Ensure proper authorization

### ✅ Dead Code
No significant dead code detected.

---
*Analysis powered by Claude Sonnet 4*
```

## Configuration

### Why Manual Triggering?

The workflow uses manual triggering (`workflow_dispatch`) instead of automatic PR triggers for several reasons:

1. **Cost Control** - You decide when to run analysis, avoiding unnecessary API costs
2. **Selective Analysis** - Analyze only important PRs or after specific changes
3. **Resource Management** - Prevent rate limiting on busy repositories
4. **Flexibility** - Run multiple analyses on the same PR at different stages

### Switching to Automatic Triggers (Optional)

If you prefer automatic triggering, modify `.github/workflows/claude-pr-analysis.yml`:

```yaml
on:
  pull_request:
    types: [opened, synchronize]
  workflow_dispatch:
    inputs:
      pr_number:
        description: 'PR number to analyze'
        required: true
        type: number
```

Then update the checkout and diff steps to handle both triggers:

```yaml
- name: Checkout code
  uses: actions/checkout@v4
  with:
    ref: ${{ github.event.pull_request.head.sha || steps.pr-info.outputs.head_sha }}
    fetch-depth: 0
```

### Customizing Analysis Prompts

Edit `.github/scripts/claude_analyzer.py` and modify the `ANALYSIS_PROMPTS` dictionary to customize what Claude looks for.

### Changing Claude Model

In `claude_analyzer.py`, update the model parameter:

```python
message = client.messages.create(
    model="claude-sonnet-4-20250514",  # Change this
    max_tokens=4096,
    ...
)
```

Available models:
- `claude-sonnet-4-20250514` (recommended, most capable)
- `claude-3-7-sonnet-20250219`
- `claude-3-5-sonnet-20241022`

## Cost Considerations

- Each PR analysis makes 5 API calls (one per category)
- Average cost per PR: ~$0.50-$2.00 depending on diff size
- Consider limiting runs to specific paths or branches if needed

## Troubleshooting

### Workflow Not Running

- Check that GitHub Actions are enabled
- Verify the workflow file is in `.github/workflows/`
- Check the Actions tab for error messages

### API Key Errors

- Ensure `ANTHROPIC_API_KEY` is set in repository secrets
- Verify the key is valid and has sufficient credits

### No Comments Posted

- Check that the workflow has `pull-requests: write` permission
- Verify `GITHUB_TOKEN` has sufficient permissions

### Analysis Incomplete

- Large PRs may hit token limits
- The script automatically truncates large diffs
- Consider splitting large PRs into smaller ones

## Advanced: Self-Hosted Runners

For private repositories with sensitive code:

1. Set up a [self-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners)
2. Modify the workflow:
   ```yaml
   jobs:
     analyze-with-claude:
       runs-on: self-hosted  # Change from ubuntu-latest
   ```

## Security Notes

- The workflow only reads code; it doesn't modify anything
- Analysis results are posted as PR comments (consider who can view)
- For private repositories, ensure API key permissions are restrictive
- The script filters out binary files and limits file sizes

## Contributing

To improve the analysis:

1. Add new categories to `ANALYSIS_PROMPTS`
2. Improve parsing logic in `parse_analysis_result()`
3. Add file-type specific analysis
4. Implement caching to reduce API costs

## License

This workflow and script are provided as-is for use in your projects.
