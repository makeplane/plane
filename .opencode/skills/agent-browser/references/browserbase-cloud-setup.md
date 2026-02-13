# Browserbase Cloud Setup

Configure agent-browser to use Browserbase cloud browsers for CI/CD and headless environments.

## Overview

Browserbase provides remote browser infrastructure. Use when:
- Running in CI/CD pipelines
- Local browser not available
- Need consistent browser environment
- Scaling parallel browser sessions

## Account Setup

1. Sign up at [browserbase.com](https://browserbase.com)
2. Create a project
3. Get API key from dashboard
4. Note your project ID

## Environment Variables

```bash
# Required
export BROWSERBASE_API_KEY="bb_live_xxxxxxxxxxxxx"
export BROWSERBASE_PROJECT_ID="proj_xxxxxxxxxxxxx"

# Optional: set provider default
export AGENT_BROWSER_PROVIDER="browserbase"
```

## Usage

### Explicit Provider Flag
```bash
agent-browser -p browserbase open https://example.com
agent-browser snapshot -i
agent-browser click @e1
agent-browser close
```

### With Default Provider (env var)
```bash
# After setting AGENT_BROWSER_PROVIDER=browserbase
agent-browser open https://example.com  # Uses Browserbase automatically
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Browser Tests
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install agent-browser
        run: npm install -g agent-browser

      - name: Run browser tests
        env:
          BROWSERBASE_API_KEY: ${{ secrets.BROWSERBASE_API_KEY }}
          BROWSERBASE_PROJECT_ID: ${{ secrets.BROWSERBASE_PROJECT_ID }}
          AGENT_BROWSER_PROVIDER: browserbase
        run: |
          agent-browser open https://example.com
          agent-browser snapshot -i
          agent-browser screenshot -o screenshot.png
          agent-browser close

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: screenshots
          path: screenshot.png
```

### GitLab CI
```yaml
browser-test:
  image: node:20
  variables:
    AGENT_BROWSER_PROVIDER: browserbase
  script:
    - npm install -g agent-browser
    - agent-browser open https://example.com
    - agent-browser snapshot -i
    - agent-browser close
  artifacts:
    paths:
      - "*.png"
```

## Session Management

Browserbase sessions are managed automatically. Each `open` creates a new session, `close` terminates it.

```bash
# Long-running session
agent-browser -p browserbase open https://example.com
# ... many commands ...
agent-browser close  # Terminates Browserbase session
```

## Parallel Sessions

Use named sessions for parallel browser instances:

```bash
# Session 1
agent-browser -p browserbase --session user1 open https://example.com

# Session 2 (separate terminal/process)
agent-browser -p browserbase --session user2 open https://example.com
```

## Debugging

### View Session Logs
Check Browserbase dashboard for:
- Session recordings
- Network logs
- Console output
- Screenshots

### Local Fallback
If Browserbase unavailable, remove provider flag to use local browser:
```bash
agent-browser open https://example.com  # Uses local Chromium
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Authentication failed | Verify API key is correct and not expired |
| Project not found | Check BROWSERBASE_PROJECT_ID matches dashboard |
| Connection timeout | Check network/firewall allows outbound connections |
| Session limit reached | Upgrade Browserbase plan or wait for sessions to expire |
| Commands hang | Ensure previous session closed properly |

## Pricing Considerations

- Browserbase charges per session minute
- Close sessions promptly with `agent-browser close`
- Use local browser for development, cloud for CI/CD
- Monitor usage in Browserbase dashboard

## Resources

- [Browserbase Documentation](https://docs.browserbase.com/)
- [Browserbase Dashboard](https://browserbase.com/dashboard)
- [agent-browser GitHub](https://github.com/vercel-labs/agent-browser)
