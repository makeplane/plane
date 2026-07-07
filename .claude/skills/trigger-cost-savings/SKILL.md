---
name: trigger-cost-savings
description: >
  Analyze Trigger.dev tasks, schedules, and runs for cost optimization opportunities. Use when
  asked to reduce spend, optimize costs, audit usage, right-size machines, or review task
  efficiency. Combines static source analysis with live run analysis via the Trigger.dev MCP
  tools (list_runs, get_run_details, get_current_worker).
type: core
library: trigger.dev
---

# Trigger.dev Cost Savings Analysis

The full, version-pinned cost-audit workflow ships **inside your installed `@trigger.dev/sdk`**. Read it before giving recommendations so they match the SDK version in this project:

- **Skill:** `node_modules/@trigger.dev/sdk/skills/trigger-cost-savings/SKILL.md` — the static-analysis checklist, the MCP run-analysis steps (`list_runs`, `get_run_details`, `get_current_worker`), the report format, and the machine-preset cost table.
- **Docs:** the canonical guidance is bundled at `node_modules/@trigger.dev/sdk/docs/how-to-reduce-your-spend.mdx`, with supporting pages under `node_modules/@trigger.dev/sdk/docs/` (`machines.mdx`, `runs/max-duration.mdx`, `queue-concurrency.mdx`, `idempotency.mdx`, `triggering.mdx`, `errors-retrying.mdx`).

If those paths don't exist, `@trigger.dev/sdk` isn't installed yet — install it first. In a non-hoisted layout, resolve the package with `node -p "require.resolve('@trigger.dev/sdk/package.json')"` and read `skills/` + `docs/` beside it.

Live run analysis needs the Trigger.dev MCP server (`npx trigger.dev@latest install-mcp`). Without it, do the static source analysis only — never fabricate run data.

## Key principles

- **Waits > 5 seconds are free** — checkpointed, no compute charge.
- **Start small, scale up** — the default `small-1x` is right for most tasks; right-size down tasks stuck on `large-*` with short durations.
- **I/O-bound tasks don't need big machines** — API calls and DB queries wait on the network.
- **Add `maxDuration`** — cap runaway compute.
- **Debounce high-frequency triggers** — consolidate bursts into single runs.
- **Idempotency keys prevent duplicate billed work.**
- **`AbortTaskRunError` stops wasteful retries** — don't pay to retry permanent failures.

## References

Sibling skills: **trigger-authoring-tasks** (the task options these levers tune: `machine`, `maxDuration`, `retry`, `queue`, idempotency), **trigger-realtime-and-frontend**, **trigger-authoring-chat-agent** and **trigger-chat-agent-advanced** (AI agents).
