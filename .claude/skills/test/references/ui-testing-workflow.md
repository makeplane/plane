# UI Testing Workflow

Use `ck:agent-browser` for live browser testing when a fresh/tool-managed browser is enough. Use `ck:chrome-profile` only when the test needs the user's real Chrome profile, cookies, or already-logged-in state. Use `ck:web-testing` or project-native Playwright/Vitest/k6 commands for repeatable test runs.

## Purpose

Run comprehensive UI tests on a website and generate a detailed report.

## Arguments

- $1: URL - The URL of the website to test
- $2: OPTIONS - Optional test configuration (e.g., --headless, --mobile, --auth)

## Testing Protected Routes (Authentication)

### Step 1: User Manual Login

Instruct the user to:

1. Open the target site in their browser
2. Log in manually with their credentials
3. Open browser DevTools (F12) → Application tab → Cookies/Storage

### Step 2: Select the Chrome Profile

Prefer project-native auth helpers for repeatable tests. For ad-hoc browser driving with real user auth/cookies, invoke `ck:chrome-profile` and run:

```bash
chrome-profile doctor
chrome-profile setup
chrome-profile list
```

### Step 3: Run Tests

After auth is available, run tests normally. If real user Chrome state is not needed, use `ck:agent-browser`:

```bash
agent-browser open https://example.com/dashboard
agent-browser screenshot -o profile.png
```

If real user Chrome state is needed:

```bash
chrome-profile work https://example.com/dashboard
```

Then select the MCP page whose URL contains `cdp-profile=work` and capture screenshots or snapshots through the active bridge.

## Workflow

- Use `ck:plan` skill to organize the test plan & report
- All screenshots saved in the same report directory
- Browse URL, discover all pages, components, endpoints
- Create test plan based on discovered structure
- Use multiple `tester` subagents in parallel for: pages, forms, navigation, user flows, accessibility, responsive layouts, performance, security, seo
- Use `ck:ai-multimodal` to analyze all screenshots
- Generate comprehensive Markdown report
- Ask user if they want to preview with `/ck:preview`

## Output Requirements

- Clear, structured Markdown with headers, lists, code blocks
- Include test results summary, key findings, screenshot references
- Ensure token efficiency while maintaining high quality
- Sacrifice grammar for concision

**Do not** start implementing fixes.
