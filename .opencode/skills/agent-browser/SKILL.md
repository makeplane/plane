---
name: agent-browser
description: AI-optimized browser automation CLI with context-efficient snapshots. Use for long autonomous sessions, self-verifying workflows, video recording, and cloud browser testing (Browserbase).
license: Apache-2.0
---

# agent-browser Skill

Browser automation CLI designed for AI agents. Uses "snapshot + refs" paradigm for 93% less context than Playwright MCP.

## Quick Start

```bash
# Install globally
npm install -g agent-browser

# Download Chromium (one-time)
agent-browser install

# Linux: include system deps
agent-browser install --with-deps

# Verify
agent-browser --version
```

## Core Workflow

The 4-step pattern for all browser automation:

```bash
# 1. Navigate
agent-browser open https://example.com

# 2. Snapshot (get interactive elements with refs)
agent-browser snapshot -i
# Output: button "Sign In" @e1, textbox "Email" @e2, ...

# 3. Interact using refs
agent-browser fill @e2 "user@example.com"
agent-browser click @e1

# 4. Re-snapshot after page changes
agent-browser snapshot -i
```

## When to Use (vs chrome-devtools)

| Use agent-browser | Use chrome-devtools |
|-------------------|---------------------|
| Long autonomous AI sessions | Quick one-off screenshots |
| Context-constrained workflows | Custom Puppeteer scripts needed |
| Video recording for debugging | WebSocket full frame debugging |
| Cloud browsers (Browserbase) | Existing workflow integration |
| Multi-tab handling | Need Sharp auto-compression |
| Self-verifying build loops | Session with auth injection |

**Token efficiency:** ~280 chars/snapshot vs 8K+ for Playwright MCP.

## Command Reference

### Navigation
```bash
agent-browser open <url>       # Navigate to URL
agent-browser back             # Go back
agent-browser forward          # Go forward
agent-browser reload           # Reload page
agent-browser close            # Close browser
```

### Analysis (Snapshot)
```bash
agent-browser snapshot         # Full accessibility tree
agent-browser snapshot -i      # Interactive elements only (recommended)
agent-browser snapshot -c      # Compact output
agent-browser snapshot -d 3    # Limit depth
agent-browser snapshot -s "nav" # Scope to CSS selector
```

### Interactions (use @refs from snapshot)
```bash
agent-browser click @e1        # Click element
agent-browser dblclick @e1     # Double-click
agent-browser fill @e2 "text"  # Clear and fill input
agent-browser type @e2 "text"  # Type without clearing
agent-browser press Enter      # Press key
agent-browser hover @e1        # Hover over element
agent-browser check @e3        # Check checkbox
agent-browser uncheck @e3      # Uncheck checkbox
agent-browser select @e4 "opt" # Select dropdown option
agent-browser scroll @e1       # Scroll element into view
agent-browser scroll down 500  # Scroll page by pixels
agent-browser drag @e1 @e2     # Drag from e1 to e2
agent-browser upload @e5 file.pdf  # Upload file
```

### Information Retrieval
```bash
agent-browser get text @e1     # Get text content
agent-browser get html @e1     # Get HTML
agent-browser get value @e2    # Get input value
agent-browser get attr @e1 href  # Get attribute
agent-browser get title        # Page title
agent-browser get url          # Current URL
agent-browser get count "li"   # Count elements
agent-browser get box @e1      # Bounding box
```

### State Checks
```bash
agent-browser is visible @e1   # Check visibility
agent-browser is enabled @e1   # Check if enabled
agent-browser is checked @e3   # Check if checked
```

### Media
```bash
agent-browser screenshot           # Capture viewport
agent-browser screenshot --full    # Full page
agent-browser screenshot -o ss.png # Save to file
agent-browser pdf -o page.pdf      # Export PDF
agent-browser record start         # Start video recording
agent-browser record stop          # Stop and save video
agent-browser record restart       # Restart recording
```

### Wait Conditions
```bash
agent-browser wait @e1                    # Wait for element
agent-browser wait --text "Success"       # Wait for text to appear
agent-browser wait --url "/dashboard"     # Wait for URL pattern
agent-browser wait --load                 # Wait for page load
agent-browser wait --idle                 # Wait for network idle
agent-browser wait --fn "() => window.ready"  # Wait for JS condition
```

### Browser Configuration
```bash
agent-browser viewport 1920 1080   # Set viewport size
agent-browser device "iPhone 14"   # Emulate device
agent-browser geolocation 40.7 -74.0  # Set geolocation
agent-browser offline true         # Enable offline mode
agent-browser headers '{"X-Custom":"val"}'  # Set headers
agent-browser credentials user pass  # HTTP auth
agent-browser color-scheme dark    # Set color scheme
```

### Storage Management
```bash
agent-browser cookies              # List cookies
agent-browser cookies set name=val # Set cookie
agent-browser cookies clear        # Clear cookies
agent-browser storage local        # Get localStorage
agent-browser storage session      # Get sessionStorage
agent-browser state save auth.json # Save browser state
agent-browser state load auth.json # Load browser state
```

### Network Control
```bash
agent-browser network route "**/*.jpg" --abort    # Block requests
agent-browser network route "**/api/*" --body '{"data":[]}'  # Mock response
agent-browser network unroute "**/*.jpg"          # Remove specific route
agent-browser network requests                    # List intercepted requests
```

### Semantic Finding
```bash
agent-browser find role button           # Find by ARIA role
agent-browser find text "Submit"         # Find by text content
agent-browser find label "Email"         # Find by label
agent-browser find placeholder "Search"  # Find by placeholder
agent-browser find testid "login-btn"    # Find by data-testid
agent-browser find first "button"        # First matching element
agent-browser find last "li"             # Last matching element
agent-browser find nth 2 "li"            # Nth element (0-indexed)
```

### Advanced
```bash
agent-browser tabs                 # List tabs
agent-browser tab new              # New tab
agent-browser tab 2                # Switch to tab
agent-browser tab close            # Close current tab
agent-browser frame 0              # Switch to frame
agent-browser dialog accept        # Accept dialog
agent-browser dialog dismiss       # Dismiss dialog
agent-browser eval "document.title"  # Execute JS
agent-browser highlight @e1        # Highlight element visually
agent-browser mouse move 100 200   # Move mouse to coordinates
agent-browser mouse down           # Mouse button down
agent-browser mouse up             # Mouse button up
```

## Global Options

| Option | Description |
|--------|-------------|
| `--session <name>` | Named session for parallel testing |
| `--json` | JSON output for parsing |
| `--headed` | Show browser window |
| `--cdp <port>` | Connect via Chrome DevTools Protocol |
| `-p <provider>` | Cloud browser provider |
| `--proxy <url>` | Proxy server |
| `--headers <json>` | Custom HTTP headers |
| `--executable-path` | Custom browser binary |
| `--extension <path>` | Load browser extension |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AGENT_BROWSER_SESSION` | Default session name |
| `AGENT_BROWSER_PROVIDER` | Cloud provider (e.g., browserbase) |
| `AGENT_BROWSER_EXECUTABLE_PATH` | Browser binary location |
| `AGENT_BROWSER_EXTENSIONS` | Comma-separated extension paths |
| `AGENT_BROWSER_STREAM_PORT` | WebSocket streaming port |
| `AGENT_BROWSER_HOME` | Custom installation directory |
| `AGENT_BROWSER_PROFILE` | Browser profile directory |
| `BROWSERBASE_API_KEY` | Browserbase API key |
| `BROWSERBASE_PROJECT_ID` | Browserbase project ID |

## Common Patterns

### Form Submission
```bash
agent-browser open https://example.com/login
agent-browser snapshot -i
agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3  # Submit button
agent-browser wait url "/dashboard"
```

### State Persistence (Auth)
```bash
# Save authenticated state
agent-browser open https://example.com/login
# ... login steps ...
agent-browser state save auth.json

# Reuse in future sessions
agent-browser state load auth.json
agent-browser open https://example.com/dashboard
```

### Video Recording (Debugging)
```bash
agent-browser open https://example.com
agent-browser record start
# ... perform actions ...
agent-browser record stop  # Saves to recording.webm
```

### Parallel Sessions
```bash
# Terminal 1
agent-browser --session test1 open https://example.com

# Terminal 2
agent-browser --session test2 open https://example.com
```

## Cloud Browsers (Browserbase)

For CI/CD or environments without local browser:

```bash
# Set credentials
export BROWSERBASE_API_KEY="your-api-key"
export BROWSERBASE_PROJECT_ID="your-project-id"

# Use cloud browser
agent-browser -p browserbase open https://example.com
```

See `references/browserbase-cloud-setup.md` for detailed setup.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Command not found | Run `npm install -g agent-browser` |
| Chromium missing | Run `agent-browser install` |
| Linux deps missing | Run `agent-browser install --with-deps` |
| Session stale | Close browser: `agent-browser close` |
| Element not found | Re-run `snapshot -i` after page changes |

## Resources

- [GitHub Repository](https://github.com/vercel-labs/agent-browser)
- [Official Documentation](https://github.com/vercel-labs/agent-browser#readme)
- [Browserbase Docs](https://docs.browserbase.com/)
