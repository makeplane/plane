---
name: ck:agent-browser
description: Automate browsers and apps with agent-browser. Use for testing, screenshots, forms, scraping, Browserbase/cloud browsers, and Electron when real Chrome cookies are not required.
user-invocable: true
when_to_use: "Invoke for browser/app automation and testing that does not require the user's real Chrome profile state."
category: dev-tools
keywords:
  [
    browser,
    automation,
    playwright,
    testing,
    e2e,
    browserbase,
    autonomous,
    headless,
    electron,
    slack,
    dogfood,
    agentcore,
    vercel-sandbox,
  ]
license: Apache-2.0
allowed-tools: Bash(agent-browser:*), Bash(npx agent-browser:*)
argument-hint: "[url or task]"
metadata:
  author: claudekit
  version: "2.0.0"
  upstream: "vercel-labs/agent-browser"
---

# agent-browser Skill

Fast browser automation CLI for AI agents. Chrome/Chromium via CDP with accessibility-tree snapshots and compact `@eN` element refs.

Use `ck:agent-browser` for browser testing, screenshots, form fills, scraping, exploratory QA, cloud browsers, Electron apps, and flows where a fresh or tool-managed browser is fine.

Use `ck:chrome-profile` instead when the task needs the user's actual Chrome profile: existing cookies, logged-in sessions, a specific Google account, a tenant/workspace already open in daily Chrome, or deterministic targeting across multiple Chrome profiles.

## Install / Upgrade

```bash
npm install -g agent-browser     # install (or upgrade) to latest
agent-browser install            # download Chromium (one-time)
agent-browser install --with-deps  # Linux: include system deps
agent-browser upgrade            # self-upgrade the binary
agent-browser --version          # verify
```

Re-run `npm install -g agent-browser` (or `agent-browser upgrade`) periodically — new commands and skills ship with the binary.

## Start here — load live workflow content

This file is a discovery stub, not the usage guide. Before running any `agent-browser` command, load workflow content from the installed CLI so it always matches your version:

```bash
agent-browser skills get core             # workflows, common patterns, troubleshooting
agent-browser skills get core --full      # full command reference + templates
agent-browser skills list                 # see everything available on this version
```

The CLI serves skill content from the installed binary, so instructions never go stale between releases. Prefer `skills get` over memorized command lists in this file.

## Specialized skills

Load when the task falls outside browser web pages:

```bash
agent-browser skills get electron          # Electron apps (VS Code, Slack, Discord, Figma, Notion, Spotify)
agent-browser skills get slack             # Slack workspace automation
agent-browser skills get dogfood           # Exploratory testing / QA / bug hunts
agent-browser skills get vercel-sandbox    # agent-browser inside Vercel Sandbox microVMs
agent-browser skills get agentcore         # AWS Bedrock AgentCore cloud browsers
```

## When to use

Default for browser automation that does not depend on the user's real Chrome login state: autonomous sessions, ad-hoc navigation, screenshots, form fills, scraping, multi-tab work, self-verifying build loops, Electron desktop apps, Slack automation, and Browserbase/cloud browsers.

For real user Chrome automation with profile/cookie state, use `ck:chrome-profile`. For low-level Chrome DevTools Protocol diagnostics, use `chrome-devtools-mcp` via `/ck:use-mcp`.

## Cloud browsers

For CI/CD or environments without a local browser:

```bash
export BROWSERBASE_API_KEY="..."
export BROWSERBASE_PROJECT_ID="..."
agent-browser -p browserbase open https://example.com
```

See `references/browserbase-cloud-setup.md` for detailed setup. For AWS Bedrock AgentCore or Vercel Sandbox, run `agent-browser skills get agentcore` / `agent-browser skills get vercel-sandbox`.

## Observability dashboard

Agent Browser exposes an observability dashboard independently of browser sessions on port 4848. When using a proxied or forwarded URL, stay on the dashboard origin; session tabs, status, and stream traffic are proxied internally, so individual session ports do not need to be exposed.

## Troubleshooting

| Issue                          | Solution                                                                   |
| ------------------------------ | -------------------------------------------------------------------------- |
| Command not found              | `npm install -g agent-browser`                                             |
| Chromium missing               | `agent-browser install`                                                    |
| Linux deps missing             | `agent-browser install --with-deps`                                        |
| Stale commands / missing flags | `npm install -g agent-browser` then `agent-browser skills get core --full` |
| Session stale                  | `agent-browser close`                                                      |
| Element not found              | Re-run `agent-browser snapshot -i` after page changes                      |

## Resources

- Upstream: https://github.com/vercel-labs/agent-browser
- Browserbase: https://docs.browserbase.com/
