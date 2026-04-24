# Chrome DevTools Scripts

CLI scripts for browser automation using Puppeteer.

**CRITICAL**: Always check `pwd` before running scripts.

## Installation

## Skill Location

Skills can exist in **project-scope** or **user-scope**. Priority: project-scope > user-scope.

```bash
# Detect skill location
SKILL_DIR=""
if [ -d ".claude/skills/chrome-devtools/scripts" ]; then
  SKILL_DIR=".claude/skills/chrome-devtools/scripts"
elif [ -d "$HOME/.claude/skills/chrome-devtools/scripts" ]; then
  SKILL_DIR="$HOME/.claude/skills/chrome-devtools/scripts"
fi
cd "$SKILL_DIR"
```

### Quick Install

```bash
pwd  # Should show current working directory
cd $SKILL_DIR/.claude/skills/chrome-devtools/scripts
./install.sh  # Auto-checks dependencies and installs
```

### Manual Installation

**Linux/WSL** - Install system dependencies first:
```bash
./install-deps.sh  # Auto-detects OS (Ubuntu, Debian, Fedora, etc.)
```

Or manually:
```bash
sudo apt-get install -y libnss3 libnspr4 libasound2t64 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1
```

**All platforms** - Install Node dependencies:
```bash
npm install
```

## Scripts

**CRITICAL**: Always check `pwd` before running scripts.

### inject-auth.js
Inject authentication (cookies, tokens, storage) for testing protected routes.

**Workflow for testing protected routes:**
1. User manually logs into the site in their browser
2. User extracts cookies/tokens from browser DevTools (Application tab)
3. Run inject-auth.js to inject auth into puppeteer session
4. Run other scripts which will use the authenticated session

```bash
# Inject cookies
node inject-auth.js --url https://example.com --cookies '[{"name":"session","value":"abc123","domain":".example.com"}]'

# Inject Bearer token (stores in localStorage + sets HTTP header)
node inject-auth.js --url https://example.com --token "Bearer eyJhbGciOi..." --header Authorization

# Inject localStorage items
node inject-auth.js --url https://example.com --local-storage '{"auth_token":"xyz","user_id":"123"}'

# Inject sessionStorage items
node inject-auth.js --url https://example.com --session-storage '{"temp_key":"value"}'

# Combined injection
node inject-auth.js --url https://example.com \
  --cookies '[{"name":"session","value":"abc"}]' \
  --local-storage '{"user":"data"}' \
  --reload true

# Clear saved auth session
node inject-auth.js --url https://example.com --cookies '[]' --clear true
```

Options:
- `--cookies '<json>'` - JSON array of cookie objects (name, value, domain required)
- `--token '<token>'` - Bearer token to inject
- `--token-key '<key>'` - localStorage key for token (default: access_token)
- `--header '<name>'` - HTTP header name for token (e.g., Authorization)
- `--local-storage '<json>'` - JSON object of localStorage key-value pairs
- `--session-storage '<json>'` - JSON object of sessionStorage key-value pairs
- `--reload true` - Reload page after injection to apply auth
- `--clear true` - Clear the saved auth session file

**Session persistence:** Auth is saved to `.auth-session.json` (valid 24h) and automatically applied by subsequent script runs until `--clear true` is used or browser closes.

### navigate.js
Navigate to a URL.

```bash
node navigate.js --url https://example.com [--wait-until networkidle2] [--timeout 30000]
```

### screenshot.js
Take a screenshot with automatic compression.

**Important**: Always save screenshots to `./docs/screenshots` directory.

```bash
node screenshot.js --output screenshot.png [--url https://example.com] [--full-page true] [--selector .element] [--max-size 5] [--no-compress]
```

**Automatic Compression**: Screenshots >5MB are automatically compressed using ImageMagick to ensure compatibility with Gemini API and Claude Code. Install ImageMagick for this feature:
- macOS: `brew install imagemagick`
- Linux: `sudo apt-get install imagemagick`

Options:
- `--max-size N` - Custom size threshold in MB (default: 5)
- `--no-compress` - Disable automatic compression
- `--format png|jpeg` - Output format (default: png)
- `--quality N` - JPEG quality 0-100 (default: auto)

### click.js
Click an element.

```bash
node click.js --selector ".button" [--url https://example.com] [--wait-for ".result"]
```

### fill.js
Fill form fields.

```bash
node fill.js --selector "#input" --value "text" [--url https://example.com] [--clear true]
```

### evaluate.js
Execute JavaScript in page context.

```bash
node evaluate.js --script "document.title" [--url https://example.com]
```

### snapshot.js
Get DOM snapshot with interactive elements.

```bash
node snapshot.js [--url https://example.com] [--output snapshot.json]
```

### console.js
Monitor console messages.

```bash
node console.js --url https://example.com [--types error,warn] [--duration 5000]
```

### network.js
Monitor network requests.

```bash
node network.js --url https://example.com [--types xhr,fetch] [--output requests.json]
```

### performance.js
Measure performance metrics and record trace.

```bash
node performance.js --url https://example.com [--trace trace.json] [--metrics] [--resources true]
```

### ws-debug.js
Debug WebSocket connections (basic mode).

```bash
node ws-debug.js
```

Monitors WebSocket events via CDP: created, handshake, response, closed, error.

### ws-full-debug.js
Debug WebSocket connections with full event tracking.

```bash
node ws-full-debug.js
```

Monitors all WebSocket events including frame sent/received, with detailed logging.

## Common Options

- `--headless false` - Show browser window
- `--close false` - Keep browser open
- `--timeout 30000` - Set timeout in milliseconds
- `--wait-until networkidle2` - Wait strategy (load, domcontentloaded, networkidle0, networkidle2)

## Selector Support

Scripts that accept `--selector` (click.js, fill.js, screenshot.js) support both **CSS** and **XPath** selectors.

### CSS Selectors (Default)

```bash
# Element tag
node click.js --selector "button" --url https://example.com

# Class selector
node click.js --selector ".btn-submit" --url https://example.com

# ID selector
node fill.js --selector "#email" --value "user@example.com" --url https://example.com

# Attribute selector
node click.js --selector 'button[type="submit"]' --url https://example.com

# Complex selector
node screenshot.js --selector "div.container > button.btn-primary" --output btn.png
```

### XPath Selectors

XPath selectors start with `/` or `(//` and are automatically detected:

```bash
# Text matching - exact
node click.js --selector '//button[text()="Submit"]' --url https://example.com

# Text matching - contains
node click.js --selector '//button[contains(text(),"Submit")]' --url https://example.com

# Attribute matching
node fill.js --selector '//input[@type="email"]' --value "user@example.com"

# Multiple conditions
node click.js --selector '//button[@type="submit" and contains(text(),"Save")]'

# Descendant selection
node screenshot.js --selector '//div[@class="modal"]//button[@class="close"]' --output modal.png

# Nth element
node click.js --selector '(//button)[2]'  # Second button on page
```

### Discovering Selectors

Use `snapshot.js` to discover correct selectors:

```bash
# Get all interactive elements
node snapshot.js --url https://example.com | jq '.elements[]'

# Find buttons
node snapshot.js --url https://example.com | jq '.elements[] | select(.tagName=="BUTTON")'

# Find inputs
node snapshot.js --url https://example.com | jq '.elements[] | select(.tagName=="INPUT")'
```

### Security

XPath selectors are validated to prevent injection attacks. The following patterns are blocked:
- `javascript:`
- `<script`
- `onerror=`, `onload=`, `onclick=`
- `eval(`, `Function(`, `constructor(`

Selectors exceeding 1000 characters are rejected (DoS prevention).

## Output Format

All scripts output JSON to stdout:

```json
{
  "success": true,
  "url": "https://example.com",
  "title": "Example Domain",
  ...
}
```

Errors are output to stderr:

```json
{
  "success": false,
  "error": "Error message",
  "stack": "..."
}
```
