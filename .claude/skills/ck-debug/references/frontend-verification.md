# Frontend Verification

Visual verification of frontend implementations using Chrome MCP (Claude Chrome Extension) or `ck:chrome-devtools` skill fallback.

## Applicability Check

**Skip entirely if task is NOT frontend-related.** Frontend indicators:
- Files modified: `*.tsx`, `*.jsx`, `*.vue`, `*.svelte`, `*.html`, `*.css`, `*.scss`
- Changes to: components, layouts, pages, styles, DOM structure, UI behavior
- Keywords: render, display, layout, responsive, animation, visual, UI, UX

If none match, skip this technique.

## Step 1: Detect Chrome MCP Availability

Check if Chrome MCP server is available via `ck:mcp-management` skill or `ListMcpResourcesTool`:

```
Use ListMcpResourcesTool to check for Chrome MCP tools.
Look for tools prefixed with "chrome__" (e.g., chrome__navigate, chrome__screenshot).
```

**Available** → Proceed to Step 2A (Chrome MCP)
**Not available** → Proceed to Step 2B (chrome-devtools fallback)

## Step 2A: Chrome MCP Available — Direct Verification

Use Chrome MCP tools to verify the implementation in the user's actual browser. Ensure dev server is running first.

### Navigate & Screenshot

```
1. chrome__navigate → http://localhost:3000 (or project dev URL)
2. chrome__screenshot → capture current page state
3. Read the screenshot with Read tool to visually inspect
```

### Visual Inspection Checklist

After capturing screenshot, verify:
1. **Layout** — Elements positioned correctly, no overflow/overlap
2. **Content** — Text, images, data rendered as expected
3. **Responsiveness** — Resize viewport if MCP supports it
4. **Interactions** — Use chrome__click / chrome__type to test interactive elements
5. **Console errors** — Use chrome__evaluate to check `console.error` output

### Console Error Check

```
chrome__evaluate → "JSON.stringify(window.__consoleErrors || [])"
```

Or navigate and observe any error output from Chrome MCP tool responses.

### Get Page Content

```
chrome__get_content → extract DOM/text to verify rendered output matches expectations
```

## Step 2B: Chrome MCP NOT Available — Fallback to chrome-devtools Skill

When Chrome MCP is not configured, use `ck:chrome-devtools` skill (Puppeteer with bundled Chromium):

```bash
SKILL_DIR="$HOME/.claude/skills/chrome-devtools/scripts"

# Install deps if first time
npm install --prefix "$SKILL_DIR" 2>/dev/null

# Screenshot + console error check
node "$SKILL_DIR/screenshot.js" --url http://localhost:3000 --output ./verification-screenshot.png
node "$SKILL_DIR/console.js" --url http://localhost:3000 --types error,pageerror --duration 5000
```

If `ck:chrome-devtools` skill is also unavailable, skip visual verification and note in report:
> "Visual verification skipped — no Chrome MCP or chrome-devtools available."

## Step 3: Analyze Results

After capture:
1. **Read screenshot** — Use Read tool on the PNG to visually inspect
2. **Check console output** — Zero errors = pass; errors = investigate before claiming done
3. **Compare with expected** — Match against design specs or user description
4. **Document findings** — Include screenshot path and any issues found in verification report

## Integration with Verification Protocol

This technique extends `verification.md`. After standard verification (tests pass, build succeeds), add frontend verification as final gate:

```
Standard verification → Tests pass → Build succeeds → Frontend visual verification → Claim complete
```

Report format:
```
## Frontend Verification
- Method: [Chrome MCP | chrome-devtools | skipped]
- Screenshot: ./verification-screenshot.png
- Console errors: [none | list]
- Visual check: [pass | issues found]
- Responsive: [checked at X viewports | skipped]
```
