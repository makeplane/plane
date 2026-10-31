# Stage 2: Work Calendar

Status: implemented and tested on the development machine. **Not applied to the server. Not committed** (the owner commits and pushes).
Branch: `feat/team-ops-work-calendar` (created from the Stage 1 commit).
Design: [STAGE-2-WORK-CALENDAR-DESIGN.md](STAGE-2-WORK-CALENDAR-DESIGN.md) (approved, with all decisions D1–D7 as recommended).

Everything in this stage (UI text, code, comments, docs) is English only, as requested.

> **A work mode is a plan, not proof of presence or of hours worked.** The UI, the report responses and every CSV export say so, and no report or label calls anything "presence".

## What it does

| Page | URL | Who | What |
|---|---|---|---|
| My calendar | `/<workspace>/team-ops/calendar/` | Admin, Member | Month and week views. Click a day to set its mode (Onsite, Remote, Day off, Leave), optional start and end time, a note and the leave type. "Fill days" sets one plan on many days (with weekday selection). "Reset day" removes a day set by hand and, for a future day, goes back to the weekly plan. The panel shows the history of changes of that day. Past days are read-only for members. |
| Team calendar | `.../calendar/team/` | per policy | Month grid with, per day, how many people are in each mode, plus avatars. Filters: team, project (project members), plan. Side panel: legend, month statistics, searchable people list (click a person to narrow the view). Selecting a day opens a table: person, plan, planned hours, note, **time logged in Time Tracking** that day and the project they logged most time on. Where the policy lets the viewer change other people's plans (and the day is not past their limit) each row has an **Edit** button; the change is audited with both names. |
| Reports | `.../calendar/reports/` | Admin, Member (own data), leads (their teams) | *Plan summary*: days per mode, holidays and working days without a plan, planned hours. *Planned vs logged*: planned hours next to Time Tracking hours, per person, with the days that disagree. Presets this/last week and month, or a custom range. CSV download. |
| Settings | `.../calendar/settings/` | everyone: weekly plan. Admins: also policy, teams, holidays | *My weekly plan*: weekday by weekday mode and hours; saving writes it into the calendar. *Policy*, *Teams* and *Holidays* are admin-only. |

The sidebar has a new "Work calendar" item under "Time tracking".

## Rules that matter

**How a day is resolved** (one function, `resolve_day`, used by every view and report): a day set by hand, then a holiday, then a day written from the weekly plan, otherwise nothing planned. A working day is a configured working weekday that is not a holiday; a working day with nothing planned is *unplanned*. Someone who works on a holiday plans that day by hand.

**Weekly plan.** It is written out as real entries (`source = TEMPLATE`) for the next *N* weeks (default 8) when saved, and extended every day at 00:30 UTC by a Celery beat task. Saving only touches today and later, never days set by hand, and removes plan entries of weekdays that left the plan. Past days and the reports built from them never change when the plan changes.

**Access** (server-side on every endpoint, workspace-scoped, the user in a payload is never trusted for scope):

| | Admin | Team lead | Member | Guest |
|---|---|---|---|---|
| Own plan | any date | within the past-days window | within the past-days window | no |
| Team calendar | always | per `team_view_access`, own teams only | only if `ALL_MEMBERS` | no |
| Other people's plans | per `edit_others_access` | per `edit_others_access`, own teams only | no | no |
| Teams, holidays, policy | yes | no | no | no |
| Reports | everyone | own teams | own data | no |

Policy defaults: team view `ADMINS_AND_LEADS`, editing others `ADMINS`, members edit today and the future only (`member_edit_past_days = 0`), working week Monday–Friday, 8-week horizon. "Manager" is not a workspace role: it means a workspace admin or a team lead.

**Audit.** Every change (day, weekly plan, holiday, policy, team) writes an append-only row with who made it, whose plan it was and the old and new values. Rows cannot be changed or deleted through the model or the API. Days written from the weekly plan are derived data and are audited once, as one weekly-plan change. Only the history of a person you may see is visible to you; workspace-level changes are for admins.

## Decisions (from the design)

| # | Decision | Outcome |
|---|---|---|
| D1 | English-only text | One English wording module in code (`calendar-labels.ts`, component files); no locale catalogs. The only catalog change is one key, `team_ops.nav.work_calendar`, added in English to all 22 `team-ops.json` files so the sidebar label works and `sync:check` stays complete. |
| D2 | Weekly plan | Written out as entries (above). |
| D3 | Leave | Self-declared with a type (annual, sick, unpaid, other). No approval flow or balances. |
| D4 | Teams | Built here (`tops_team`, `tops_team_member`), reused by later modules. |
| D5 | Past days | Members: none by default; configurable window. Admins: any date. |
| D6 | Working week | Monday–Friday, configurable. Gregorian dates only, left-to-right. |
| D7 | Git | Stage 1 was committed once (`8ff8043a3`) before the owner said not to commit; nothing in Stage 2 is committed. |

## Differences from the design document

1. **Report URLs and download parameter.** `reports/plan-summary/` replaces `reports/attendance/` (nothing here measures attendance), and the CSV is requested with `export=csv` because DRF reserves `?format=` for choosing a renderer.
2. **Audit entity `TEAM` added** so team membership changes (which decide who can see whom) are audited too.
3. **Day view is the side panel.** My calendar has month and week views; a selected day opens in the panel instead of a third "day" view.
4. **Statistics bar instead of a donut** in the month statistics.
5. **Report limits.** Plan summary up to 366 days, planned-vs-logged up to 93 days (it lists every day), team view up to 62 days.
6. **Teams are readable by every Admin/Member** (names and members), as the design table said; only admins write.
7. **Planned-vs-logged flags** are informational: "planned to work, nothing logged" (only for days up to the person's today), "time logged on a day off, leave or holiday", "time logged on a day with no plan".

## Migrations

All create-table only; no Core table is changed. They depend on `db.0125` through Stage 1's `team_ops.0001`.

| Migration | Tables |
|---|---|
| `team_ops.0002_calendar_foundation` | `tops_team`, `tops_team_member`, `tops_calendar_settings`, `tops_calendar_holiday`, `tops_calendar_audit` |
| `team_ops.0003_calendar_entries` | `tops_calendar_entry`, `tops_calendar_template` |

Database-level rules: one entry per user and day; start and end times both present or both absent and ordered; times only on onsite/remote; a leave type exactly on leave days; weekdays 1–7; no leave in the weekly plan; unique team names, team members, holidays and weekly-plan weekdays per workspace (while not deleted). Models are named `OpsTeam` / `OpsTeamMember` because Core already has a `Team` model with the same reverse accessors.

**Tested on a restore of the real server backup** (`plane-db.dump` of 2026-10-30: 22 users, 5 workspaces, 10 projects, 479 work items, 110 tables, 9091 rows): `manage.py migrate` applied `db.0122`–`0125` and `team_ops.0001`–`0003` without error. Row counts of all original tables were unchanged except Django's own metadata tables (`django_migrations`, `django_content_type`, `auth_permission`); 9 new empty tables, none dropped. `migrate team_ops zero` removed all `tops_*` tables and left the original data intact, and re-applying worked. A fresh database also migrates from zero.

## API

All under `/api/workspaces/<slug>/team-ops/`. Times are `HH:MM`, dates `YYYY-MM-DD`.

| Endpoint | Purpose |
|---|---|
| `GET teams/`, `POST teams/` | List, create (admin). Body: `name`, `description`, `members: [{user, role: LEAD\|MEMBER}]` |
| `GET\|PATCH\|DELETE teams/<id>/` | Read; update (members, when sent, replace the list); delete (admin) |
| `GET\|PUT calendar/settings/` | Policy plus the caller's effective rights; PUT is admin-only and partial |
| `GET\|POST calendar/holidays/`, `DELETE calendar/holidays/<id>/` | Holidays (`?from&to`); admin writes |
| `GET calendar/entries/?from&to&user` | Every day in the range for one person (default self), each resolved with its source |
| `PUT\|DELETE calendar/entries/<date>/` | Set a whole day / remove a day set by hand (optional `user`) |
| `POST calendar/entries/bulk/` | One plan for `dates` or `start_date`+`end_date` (+`weekdays`); days the caller may no longer change come back in `skipped_dates` |
| `GET\|PUT calendar/template/` | The weekly plan (PUT replaces it and writes it out) |
| `GET calendar/team/?from&to&team&project&user&mode` | Per-day counts and people for everyone the caller may see |
| `GET calendar/team/day/<date>/` | The day table with Time Tracking hours and main project |
| `GET calendar/audit/?user&entity&from&to` | Change history (paginated) |
| `GET calendar/reports/plan-summary/` and `.../planned-vs-logged/` | `?from&to&team&project&user`, add `export=csv` to download |

CSV files start with a byte-order mark (for Excel), write hours as decimals, escape names that start with `=`, `+`, `-` or `@`, and end with the plan-not-presence notice.

## Files

**Backend, new** (`apps/api/plane/team_ops/`): `models/{team,calendar,calendar_entry}.py`, `migrations/0002_*`, `0003_*`, `serializers/{team,calendar,calendar_entry}.py`, `services/{access,audit,csv_export,date_params,day_resolution,entry_writes,policy,reports,team_view,time_logged,weekly_plan}.py`, `views/{team,calendar_policy,calendar_entry,team_view,reports}.py`, `tasks.py`; tests in `apps/api/plane/tests/contract/app/` (`team_ops_support.py` plus four `test_team_ops_calendar_*.py` files).

**Backend, changed:** only inside the app (`apps.py` registers the daily beat entry so `plane/celery.py` stays untouched; `urls.py`, `models/__init__.py`, `serializers/__init__.py`, `views/__init__.py`).

**Frontend, new:** `packages/types/src/team-ops/work-calendar.ts`; `packages/services/src/team-ops/{work-calendar.service,calendar-dates,calendar-labels,calendar-plan,calendar-team,calendar-reports}.ts` with tests; `apps/web/hooks/team-ops/use-work-calendar.ts`; `apps/web/components/team-ops/calendar/` (my calendar, month grid, week view, day panel, plan fields, apply-range dialog, weekly plan editor, team calendar, team grid and side panel, day table, reports, policy form, holidays, teams, tabs, settings); `apps/web/app/(all)/[workspaceSlug]/(projects)/team-ops/calendar/` (layout, header and the four pages).

**Frontend, changed in Core (small):** `apps/web/app/routes/extended.ts` (routes), `packages/constants/src/workspace.ts` (sidebar item), `apps/web/components/workspace/sidebar/{helper,sidebar-menu-items}.tsx` (icon and static key), `packages/i18n/src/locales/*/team-ops.json` (one key), `packages/types|services/src/team-ops/index.ts` (exports).

## Tests

| Layer | Count | Result |
|---|---|---|
| Backend, Team Ops contract tests (Stage 1 and 2) | 255 (45 time tracking, 72 foundation, 87 days and weekly plan, 33 team view, 18 reports) | pass |
| Frontend `@plane/services` (vitest) | 103 (all Team Ops helpers and services) | pass |
| `tsc --noEmit` for `web` and `services` | | clean |
| `oxlint --deny-warnings` on all new frontend files, `ruff check` and `ruff format` on the backend | | clean |
| `pnpm --filter @plane/i18n sync:check` | 3901 keys × 22 locales | complete |
| `makemigrations --check` | | no drift |
| Full backend suite (unit and contract) on this branch, compared with a clean checkout of `preview` | 1739 tests: 1576 passed, 163 failed | **no new failures**: the same 161 tests fail on the clean checkout (this Windows setup: embedded Postgres, fake Redis); 2 more email-change tests failed in the full run only because they share the fake Redis with the other tests, and they behave exactly as on the clean checkout when run alone (6 failed, 1 passed in both) |
| Real browser run (Plane dev servers against a local database) | admin, lead and member sessions | the flows below worked |

What the tests cover, in short: every access rule for each role and across workspaces; validation of times, modes, leave type, dates and ranges; the resolution order; the weekly plan (writing, idempotence, removal, past days untouched, days set by hand untouched, daily extension, people who left); audit rows; counts, filters and scope of the team view; the Time Tracking comparison including per-person timezones; report numbers, flags, CSV content and CSV formula escaping.

**Run in a browser** (admin, lead and member sessions against a seeded workspace): setting a day; apply to a range with weekdays; weekly plan saving and its effect on the month; reset to the weekly plan; read-only past days with the explanation; the history panel; team grid with counts and avatars; day table with 5 h logged and the main project; filters; an admin changing someone else's day (audited with both people); the lead seeing only their team; a plain member getting no Team calendar tab and a clear message on the direct URL; creating a team, adding a holiday; both reports and their CSV (checked through the API). Layout problems found and fixed on the way: truncated labels in narrow cells, legend dots that used colours the design system does not define, select filters overflowing their boxes.

## How to run

```bash
# Backend (needs Postgres; see AGENTS.md for the Docker stack)
docker compose -f docker-compose-test.yml run --rm --build api-tests \
  pytest plane/tests/contract/app/test_team_ops_time_tracking.py \
         plane/tests/contract/app/test_team_ops_calendar_foundation.py \
         plane/tests/contract/app/test_team_ops_calendar_entries.py \
         plane/tests/contract/app/test_team_ops_calendar_team.py \
         plane/tests/contract/app/test_team_ops_calendar_reports.py

# Frontend
pnpm --filter @plane/services test
pnpm --filter @plane/i18n sync:check
pnpm --filter web check:types
```

Environment: `TEAM_OPS_ENABLED=1` (default) serves the API and registers the daily task; `0` removes both. The tables always exist. For the daily task make sure the Celery worker and beat run as usual (the task is `plane.team_ops.tasks.extend_weekly_plans_task`; saving a weekly plan also writes it out immediately, so a late job never leaves a person without entries).

## Before this goes on the server

1. Fresh backup (database volume **and** uploads), as for Stage 1. Never `docker compose down -v`.
2. Apply to staging first: build images from this branch, run `migrate`, open all four pages as admin, lead and member.
3. Production: the same migration order, then compare row counts of the original tables (they must not change).
4. Rollback: `python manage.py migrate team_ops zero` removes only the `tops_*` tables (and with them Time Tracking data, so export first if it holds data).

## Known limitations and next steps

- **Translations:** the calendar is English only by decision; the sidebar label is English in all locales. A later translation pass would move the wording into the locale catalogs.
- **Month and week only:** no separate day view; no Jalali calendar and no right-to-left layout.
- **Leave** has no approval, balance or half days; plans cannot cross midnight (overnight shifts) and a day holds one plan.
- **Timezone:** a person's "today" and the cut of their logged time use their profile timezone; the browser's week and month grid use the browser's timezone. Near midnight in different zones a day can look one off.
- **Large workspaces:** the team view returns one entry per person per day for up to 62 days; fine for tens of people. Beyond a few hundred it should be paged by team.
- **Report CSVs** are generated in the request; very large periods for large workspaces should move to a background export.
- **Notifications** (for example telling someone their plan was changed by a manager) belong to the Notifications module later.
- The CSV download button was not clicked in the browser (a browser download needs the owner's consent); the same files were fetched through the API and checked.
