# Stage 3: Daily and weekly work reports, and the road to the other Pro features

Status: approved by the owner ("do them all"), implemented one module at a time, in this order:
1. **Work reports** (this stage): daily and weekly reports written by each person, a team status board for managers.
2. Management dashboard (reads Time Tracking, Work Calendar and Work Reports).
3. Teamspaces (built on the existing `tops_team` tables).
4. Workflows and approvals (leave approval first, on top of `LEAVE` entries).
5. The rest (public views, integrations, SSO) one by one.

Each module follows the rules of the project: own `tops_*` tables, create-table migrations only, reuse Plane's roles and the Work Calendar access rules, backend and frontend tests, a stage document, backup before applying anywhere.

## Work reports

**Purpose.** Each person writes what they did, what blocks them and what is next, for a day or a week. Managers see who has reported and who has not. The report is text written by the person; it is not derived from, and does not prove, time worked.

**Data.** One table `tops_work_report`: workspace, user, `kind` (`DAILY` or `WEEKLY`), `period_start` (the day, or the Monday of the week), `done`, `blockers`, `next_steps`, `status` (`DRAFT` or `SUBMITTED`), `submitted_at`, `logged_seconds` (Time Tracking total of the period, frozen at submit). Unique per workspace, user, kind and period.

**Rules.**
- A person writes and submits only their own reports. A submitted report can still be edited by its author; `submitted_at` keeps the first submission.
- Daily reports cover a day up to today; weekly reports a Monday-to-Sunday week up to the current one.
- Who may read whose reports follows the Work Calendar rule (`visible_user_ids`): admins everyone, leads their teams, members themselves (everyone if the policy opens the team view).
- The team status board uses the Work Calendar to know who is expected to report: a working day (policy weekdays), not a holiday, not planned as day off or leave. Missing means expected and not submitted.
- While writing, the page suggests what the person logged in Time Tracking that period (work items and hours) to copy from.

**API** under `/api/workspaces/<slug>/team-ops/work-reports/`:
- `GET ?kind&from&to&user`: reports of one person in a range.
- `GET <kind>/<date>/?user`: one report, or an empty one, plus the Time Tracking suggestions.
- `PUT <kind>/<date>/`: save a draft; `"submit": true` submits.
- `GET status/?kind&from&to&team&project&user`: per person and period, `SUBMITTED`, `DRAFT`, `MISSING` or `NOT_EXPECTED` (managers only).

**Pages.** "Work reports" in the sidebar: *My reports* (today's or this week's report with suggestions, and the list of earlier ones) and *Team board* (people by days for the month, click a cell to read that report).

## As built

Migration `team_ops.0004_work_reports` (one create-table). Backend: `models/work_report.py`, `services/work_reports.py`, `views/work_reports.py`, `time_logged.logged_issues`, 16 contract tests in `test_team_ops_work_reports.py`. Frontend: `work-reports.service.ts` (4 tests), `use-work-reports.ts`, `components/team-ops/reports/`, pages under `team-ops/reports/`, sidebar item "Work reports".
Checked in the browser as admin: a report was written and submitted, and the team board showed missing days and non-working days. The board cell dialog and the weekly view were not clicked through in the browser.
Next: the management dashboard (stage 4), reading Time Tracking, Work Calendar and Work Reports. Teamspaces, workflows and approvals follow.
