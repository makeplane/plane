# Phase 07 — Integration, Lint, Compile, Review

**Priority:** P1 | **Status:** pending | **Depends:** 01–06

## Overview

End-to-end verification: backend tests green, migration applies, frontend compiles/lints, charts render against live endpoints, code review for regressions + convention compliance.

## Implementation Steps

1. Backend: `cd apps/api && python run_tests.py -u -c` (unit + contract) → all green. Confirm the `(workspace, logged_at)` migration applies (`migrate` clean, no other pending).
2. Frontend: `pnpm check:lint` + `pnpm check:format` + admin `tsc --noEmit`.
3. Manual smoke: log in to God-Mode, open Usage Monitor, exercise both tabs' data (Active/Standard share one `users/` call) + Departments + granularity + workspace filter; verify numbers vs a hand SQL check on `issue_worklogs` (apply the same bot/deactivated/soft-deleted-parent filters in the SQL).
4. `code-reviewer` subagent: verify (a) acceptance criteria met, (b) no regression to monitoring/other admin stores (root.store edits), (c) no public-contract breakage (services index, types), (d) follows admin conventions (English-only, Propel, bg-layer-2, file sizes), (e) no new lint/type errors, (f) **sidebar item actually renders** (hand-maintained array), (g) endpoints reject bad date/uuid/granularity/over-range with 400 not 500. Pass scout summary + acceptance criteria.
5. Address any findings; re-run tests.

## Acceptance Criteria (whole feature)

- "Usage Monitor" menu item renders only in God-Mode; endpoints reject non-instance-admins (pinned status code from contract test).
- **Active Users**: daily/monthly/yearly series of distinct active users (worklog-based, summed>0; bots + deactivated excluded; live-parent only) + total; workspace filter works.
- **Standard Users**: pie of standard (≥1 day ≥480 min in range) vs non-standard active users; time series of standard vs non-standard user-days (non-overlapping); workspace filter works.
- **Departments**: grouped bar comparing workspaces by active/standard users + total logtime (hours); per-project totals (projects with logged time) when a workspace is selected; multi-workspace reconciliation labeled.
- 2 endpoints (users + departments); no `granularity/date_from/date_to` echo fields; client sends explicit dates; bad input → 400.
- All backend tests pass (incl. 0-min, bot/deactivated, soft-deleted-parent, multi-workspace cases); migration applies; no fake data/mocks.
- No regression in existing admin pages/stores; no new lint/type/build errors.

## Validation

- `python run_tests.py -u -c`, migration apply, `pnpm check:lint`, admin type-check, manual SQL cross-check.

## Risk

- root.store.ts touched (shared) → confirm other stores still instantiate; covered by review item (b).
- New index migration → confirm it is the only new migration and applies on a fresh DB.

## Next

Finalize: project-management sync-back, docs-manager (system-architecture/codebase-summary if warranted), optional commit via git-manager, journal.
