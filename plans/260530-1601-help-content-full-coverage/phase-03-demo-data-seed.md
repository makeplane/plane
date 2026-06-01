---
phase: 3
title: "Demo Data Seed (for screenshots)"
status: done
priority: P2
effort: "1d"
dependencies: [1]
---

# Phase 3: Demo Data Seed (for screenshots)

> **Done (2026-05-30):** `seed_help_demo_data` command — creates an isolated `help-demo` workspace +
> a dedicated screenshot user (`help-screenshot@shinhan.local`, instance admin, **onboarded Profile**
> so the SPA renders the app instead of redirecting to sign-in) and populates it via the existing
> `workspace_seed` (1 project, 7 issues, 2 cycles, 3 modules, 2 pages). Idempotent (skips re-seed if
> populated). Verified: authenticated capture shows real content.

## Overview

Screenshots must show realistic content, not empty states. Provide a repeatable demo dataset (a
dedicated demo workspace with projects, work items, cycles, modules, pages) that the Playwright
capture (P4) navigates. Throwaway/isolated — never a real staff workspace (privacy).

## Key Insights

- The repo already has workspace-seed machinery (`workspace_seed` task) and management commands —
  reuse rather than hand-build. Verify what `plane/bgtasks/workspace_seed_task.py` / existing
  seed commands create.
- Demo data only needs to be rich enough to populate each `screenshot_target` (a project with issues
  across states/priorities/labels, an active cycle with burndown, a module, a page with rich content,
  notifications/inbox items, a timesheet/worklog, a department tree for HO/org-chart screenshots).

## Requirements

- A management command `seed_help_demo_data` (idempotent, clearly-named demo workspace e.g.
  `help-demo`) creating: 1 demo workspace + members; 1–2 projects with ~15 issues (varied
  states/priorities/labels/assignees/dates); 1 active cycle + 1 module; 2–3 pages; some
  notifications; worklog/timesheet entries; a small department tree + staff (for SHBVN-custom shots).
- Demo content uses neutral, non-sensitive sample names (no real customer/PII data).
- Tear-down/refresh path (re-run replaces or upserts deterministically).

## Architecture

- Command under `plane/db/management/commands/seed_help_demo_data.py`; compose existing factories/seed
  helpers where possible. Mark all rows with the demo workspace so they are isolable.
- Deterministic fixtures (fixed names/slugs) so screenshots are stable across captures.

## Related Code Files

- Create: `apps/api/plane/db/management/commands/seed_help_demo_data.py`
- Read for pattern: `plane/bgtasks/workspace_seed_task.py`, existing seed/factory utilities,
  `plane/tests/factories.py`

## Implementation Steps

1. Inventory existing seed/factory helpers; decide reuse vs. minimal new creation.
2. Build the demo workspace + projects + issues + cycle + module + pages + notifications + worklog +
   department/staff, all deterministic + idempotent.
3. Run in container; eyeball each screenshot_target route renders non-empty.
4. Document the demo workspace slug + how to reset it (feeds P4 + deploy guide).

## Todo List

- [ ] Demo workspace + members (deterministic, isolated)
- [ ] Projects + ~15 varied issues; 1 active cycle + burndown; 1 module
- [ ] 2–3 pages (rich content); notifications/inbox items
- [ ] Worklog/timesheet + department tree + staff (SHBVN-custom shots)
- [ ] Idempotent re-run; documented reset path

## Success Criteria

- [ ] `seed_help_demo_data` runs idempotently, isolated demo workspace
- [ ] Every `screenshot_target` route renders realistic, non-empty content
- [ ] No real/PII data; neutral sample names

## Risk Assessment

- **Demo data leaking into a real instance** → distinct demo workspace slug, never auto-run in prod
  migrations; capture runs on staging/throwaway instance.
- **Plan-gated features (Active Cycles, bulk ops)** show upgrade CTAs → screenshot the CTA as-is or
  skip; note in P4 target registry.
- **Reusing real workspace_seed** may create more than needed → scope to the screenshot targets.
