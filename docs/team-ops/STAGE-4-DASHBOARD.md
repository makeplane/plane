# Stage 4: Management dashboard

Read-only, no new tables or migrations. One endpoint, `GET /api/workspaces/<slug>/team-ops/dashboard/?from&to&team&project&user` (period up to 62 days), for people who may see the team (same rule as the Team calendar: admins, leads of their teams, everyone if the policy says so).

It combines what the earlier stages store: who is where **today** (Work Calendar), days per plan and planned hours, logged hours (Time Tracking) with the days where plan and logged time disagree, daily reports submitted / draft / missing (Work reports), time logged per project, and a row per person. Reuses `plan_summary`, `planned_vs_logged`, `summarize_team` and `board`, so numbers match the other pages.

Files: `services/dashboard.py`, `views/dashboard.py`, `time_logged.logged_by_project`, `test_team_ops_dashboard.py` (4 tests); frontend `team-dashboard.service.ts` (2 tests; the name avoids the core `DashboardService`), `components/team-ops/dashboard/`, page `team-ops/dashboard/`, sidebar item "Dashboard".
Checked in the browser as admin (cards, today, plan counts, per-person table). Charts beyond counts and lists are not built yet.
Next: Teamspaces, then workflows and approvals.
