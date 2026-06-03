# Frontend Verification

Visual verification of frontend implementations using `ck:agent-browser`, `ck:chrome-profile`, Chrome MCP / `chrome-devtools-mcp`, or project-native browser tests.

## Applicability Check

**Skip entirely if task is NOT frontend-related.** Frontend indicators:

- Files modified: `*.tsx`, `*.jsx`, `*.vue`, `*.svelte`, `*.html`, `*.css`, `*.scss`
- Changes to: components, layouts, pages, styles, DOM structure, UI behavior
- Keywords: render, display, layout, responsive, animation, visual, UI, UX

If none match, skip this technique.

## Step 1: Detect Browser Bridge Availability

First decide whether the verification needs real user Chrome state.

- No real login/cookies needed: use `ck:agent-browser`, Chrome MCP, or project-native browser tests.
- Real user login/cookies/profile needed: invoke `ck:chrome-profile` and run:

```bash
chrome-profile doctor
```

**ok=true** → Proceed to Step 2A (Chrome profile + MCP)
**ok=false** → Follow the skill's setup playbook, or use `ck:agent-browser` / project-native browser tests if profile state is not required.

## Step 2A: Chrome Profile Available — Direct Verification

Use `chrome-profile <key> <url>` to open the implementation in the user's actual browser profile. Ensure dev server is running first.

### Navigate & Screenshot

```
1. chrome-profile <key> http://localhost:3000
2. List MCP pages/tabs and select the tab whose URL contains cdp-profile=<key>
3. Capture screenshot or snapshot through the active MCP bridge
4. Read the screenshot with Read tool to visually inspect
```

### Visual Inspection Checklist

After capturing screenshot, verify:

1. **Layout** — Elements positioned correctly, no overflow/overlap
2. **Content** — Text, images, data rendered as expected
3. **Responsiveness** — Resize viewport if MCP supports it
4. **Interactions** — Use chrome**click / chrome**type to test interactive elements
5. **Console errors** — Use chrome\_\_evaluate to check `console.error` output

### Console Error Check

```
chrome__evaluate → "JSON.stringify(window.__consoleErrors || [])"
```

Or navigate and observe any error output from Chrome MCP tool responses.

### Get Page Content

```
chrome__get_content → extract DOM/text to verify rendered output matches expectations
```

## Step 2B: Real Chrome Profile NOT Required — Generic Browser Fallback

```bash
# Use agent-browser for ad-hoc visual checks.
agent-browser open http://localhost:3000
agent-browser screenshot -o ./verification-screenshot.png

# Prefer the project's own browser tests for repeatable evidence.
npm run test:e2e
```

For repeatable test evidence, prefer the project's Playwright/Vitest/Cypress commands if present.

If no browser tool is available, skip visual verification and note in report:

> "Visual verification skipped — no Chrome profile bridge, agent-browser, or project-native browser test available."

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
- Method: [agent-browser | chrome-profile | Chrome MCP | project-native browser test | skipped]
- Screenshot: ./verification-screenshot.png
- Console errors: [none | list]
- Visual check: [pass | issues found]
- Responsive: [checked at X viewports | skipped]
```
