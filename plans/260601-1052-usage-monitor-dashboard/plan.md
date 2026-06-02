# Usage Monitor Dashboard (God-Mode)

Instance-admin dashboards tracking user usage across the Plane instance, built from `IssueWorkLog` data.

## Decisions (user-confirmed 2026-06-01)

- **Active user (per day)** = user with a worklog-day whose summed `duration_minutes` > 0. Worklog-based proxy for activity — login history is NOT stored (`User.last_login_time` is a single overwritten value, `apps/api/plane/db/models/user.py:106`), so per-day login series can't be derived. Dashboards measure _users who logged time_; "Active Users" label keeps that meaning (document in UI subtitle).
- **Standard user (per day)** = active user whose summed `duration_minutes` for that day ≥ 480 min (8h). "Standard" is a **per-day status**, not a fixed range-level label — a user can be standard one day, active-only the next. The Standard Users tab therefore **mirrors the Active Users tab**: a time series of **distinct standard users per period bucket** (a bucket counts a user once if they had ≥1 standard day in it; active-but-non-standard buckets still appear, reporting 0) + a headline card of **distinct standard users across the range** (deduped). The earlier range-level pie was removed (user correction 2026-06-02).
- **User population** = exclude bots and deactivated accounts: base queryset filters `logged_by__is_bot=False, logged_by__is_active=True` (`apps/api/plane/db/models/user.py:97,115`).
- **Live-parent only** = base queryset filters `workspace__deleted_at__isnull=True, project__deleted_at__isnull=True` (async soft-delete cascade leaves ghost worklogs; `apps/api/plane/db/mixins.py:73-79`).
- **Cross-workspace standard** = global pie/standard uses per-(user,day) totals across scope; per-department standard uses per-(user,workspace,day) totals. Documented in Phase 01.
- **Scope** = God-Mode instance-admin only (`/api/instances/usage-monitor/...`, `InstanceAdminPermission`).
- **Delivery** = all 3 dashboards now.
- **TDD** = backend aggregation utils + endpoints get real unit/contract tests first; frontend verified via tsc + lint.
- **Timezone** = `logged_at` is a tz-naive `DateField` stored project-local. Buckets use the stored date as-is — acceptable for a single-region instance; documented limitation if multi-region.
- **Audit-logging** = NOT implemented (user-confirmed 2026-06-01: ship without). Per-employee productivity views are not access-audit-logged this round; revisit if compliance requires.
- **Filter presets** = filter bar offers quick-select **week / month / 3-month** ranges + a **custom date range** picker (user-confirmed 2026-06-01). Daily-grain cap stays 92 days (3-month preset is the longest daily-grain quick-select); longer custom spans must use month/year granularity.
- **Response-type location** = shared response types (`TUsageUsersResponse`, `TDepartmentsResponse`, rows) live in `packages/types`; UI-only types (`TUsageMonitorTab`) stay admin-local (user-confirmed 2026-06-01 — service in `packages/services` cannot import `apps/admin`).

## Dashboards

1. **Active Users** — time series (daily/monthly/yearly) of distinct active users + total. Workspace filter.
2. **Standard Users** — headline card (distinct standard users in range, deduped) + time series of distinct standard users per period. Mirrors the Active Users tab; "standard" is a per-day status. Workspace filter.
3. **Departments** — bar chart comparing workspaces (active/standard users, total logtime); drill into per-project totals (projects with logged time).

## Approach

- Backend: on-the-fly ORM aggregation of `IssueWorkLog`. DB-side date bucketing (`TruncDate/TruncMonth/TruncYear`) + server-side max-range caps. One **new index migration** on `(workspace, logged_at)` (no new model). Pure util functions → testable.
- **2 endpoints** (not 3): `usage-monitor/users/` (active + standard share one `user_day_totals` pass) and `usage-monitor/departments/`. Client resolves `date_from/date_to` once and sends explicit dates to both.
- Frontend: admin React-Router page with 3 tabs, shared filter bar, Propel charts (Recharts). Service methods typed to response contracts (no `unknown`+cast).

## Phases

| #   | Phase                                                                                             | Status      |
| --- | ------------------------------------------------------------------------------------------------- | ----------- |
| 01  | [Backend aggregation utils + index migration + unit tests](phase-01-backend-aggregation-utils.md) | ✅ complete |
| 02  | [Backend endpoints (2) + URLs + contract tests](phase-02-backend-endpoints.md)                    | ✅ complete |
| 03  | [Shared service + admin types](phase-03-service-and-types.md)                                     | ✅ complete |
| 04  | [Admin store + hook + root registration](phase-04-store-and-hook.md)                              | ✅ complete |
| 05  | [Menu + route + page scaffold + filter bar](phase-05-menu-route-scaffold.md)                      | ✅ complete |
| 06  | [3 dashboard chart components](phase-06-dashboard-components.md)                                  | ✅ complete |
| 07  | [Integration, lint, compile, review](phase-07-integration-review.md)                              | ✅ complete |

## Implementation Notes (2026-06-01)

- All 7 phases implemented. Backend: 19 unit + 14 contract tests pass; migration `0179` applies cleanly (only the `(workspace, logged_at)` index). Frontend: admin `tsc --noEmit` + eslint + prettier all clean.
- Test infra: added `IssueFactory`/`IssueWorkLogFactory`; also added `username` to `UserFactory` and `identifier` to `ProjectFactory` (both required/unique, previously unset) — net +17 previously-broken unrelated tests now pass, zero regressions.
- Backend tests run inside the `api` Docker container (no local venv); container is a baked image (no host mount), so changed files were `docker cp`'d in for the run.
- Review (code-reviewer): 0 Critical/High. Applied: surface fetch errors in dashboards (was silent empty-state on 400); compute preset date window from local parts not UTC (avoids UTC+9 off-by-one); endpoint default `date_to` uses `timezone.now().date()`.
- Pre-existing repo migration drift (`makemigrations` sweeps unrelated field alters) and pre-existing failing tests (issue_field_permission, capacity_export) are out of scope.
- **Manual smoke pending:** verify "Usage Monitor" renders in the God-Mode sidebar and charts load against live data (hand-maintained sidebar array edit + live SQL cross-check).

### Correction (2026-06-02) — per-day Standard semantics

- Reworked "Standard" from a range-level pie (≥1 standard day → standard for the whole range) to a **per-day status**, matching user intent. Standard Users tab now mirrors Active Users: headline card (`total_standard_users`, deduped over range) + `series_standard` line chart of distinct standard users per period bucket. Active-but-non-standard buckets report 0 so the two series share identical period keys.
- Backend: `standard_users_series` rewritten + `total_standard_users` added; `standard_users_pie` removed. Endpoint `users/` envelope now `{series_active, series_standard, total_active_users, total_standard_users}` (no `pie`). Departments endpoint unchanged.
- Types: `TStandardUsersPoint` → `{period, standard_users}`; `TStandardUsersPie` removed; `TUsageUsersResponse.total_standard_users` added.
- Filter bar: Granularity converted from `<select>` to a highlighted button group (consistent with Range presets + tabs).
- Verification: 35 unit+contract tests pass; admin `tsc`/eslint/prettier clean; code-reviewer 0 Critical/High.

### Follow-up (2026-06-02) — searchable Workspace filter

- Workspace filter changed from a native `<select>` (first server page only) to a Propel `Combobox` with **server-side debounced search** (`fetchWorkspaces(search)` → backend `name__icontains`), so any workspace is reachable by typing. New component `usage-workspace-select.tsx`; caches the selected workspace name locally because the store resets its list per search. `aria-label` restores the label association; `loader` drives a "Searching…" hint during the fetch window.
- Drive-by build fix: two monitoring tab components (`email-logs-tab`, `worker-health-tab`) shipped a `Component.displayName` assignment on a `() => Element` const (TS2339) — converted to named function expressions.

## Key Dependencies

- 02 depends on 01; 03 depends on 02 (URL+JSON contract); 04 depends on 03; 05–06 depend on 04; 07 depends on all.

## Constraints

- Admin app: **English-only, NO i18n**, Propel components, `bg-layer-2` inputs, files <200L (<150 components).
- Backend: license `BaseAPIView`, register views in `__init__.py`, no plan refs in code/comments. One new index migration permitted; no new model.

## Red Team Review

### Session — 2026-06-01

**Findings:** 15 (15 accepted, 0 rejected) — 4 reviewers (Security, Failure Mode, Assumption, Scope/Complexity)
**Severity breakdown:** 1 Critical, 8 High, 6 Medium

| #   | Finding                                                                          | Severity | Disposition                                         | Applied To  |
| --- | -------------------------------------------------------------------------------- | -------- | --------------------------------------------------- | ----------- |
| 1   | department_aggregates needs workspace-grain helper + cross-ws standard semantics | Critical | Accept                                              | 01          |
| 2   | Soft-deleted parent worklogs leak (async cascade)                                | High     | Accept                                              | 01,02       |
| 3   | Bots/deactivated users counted                                                   | High     | Accept (exclude both)                               | 01,02       |
| 4   | Pie "≥1 standard day" vs per-day decision                                        | High     | Accept (keep ≥1-day, documented)                    | plan,01     |
| 5   | Active=summed>0 vs ≥1 worklog / 0-min logs                                       | High     | Accept (keep summed>0, +test)                       | plan,01     |
| 6   | Endpoint↔type envelope-field mismatch                                            | High     | Accept (drop echoes)                                | 02,03       |
| 7   | Multi-workspace double-count vs deduped total                                    | High     | Accept (document+label+test)                        | 01,06,07    |
| 8   | Active+Standard duplicate user_day_totals → merge endpoints                      | High     | Accept (2 endpoints)                                | 02,03,04,06 |
| 9   | Unbounded full-table scan; no index                                              | High     | Accept (range cap + DB bucketing + index migration) | 01,02       |
| 10  | active_user_days stacked bar double-counts                                       | Medium   | Accept (non_standard_user_days)                     | 02,03,06    |
| 11  | "Active" mislabels logged-time as login; bad citation                            | Medium   | Accept (doc + fix citation)                         | plan,01     |
| 12  | Test paths wrong (unit/utils, contract/license) + auth fixture                   | Medium   | Accept                                              | 01,02       |
| 13  | Service Promise<unknown>+cast defeats typing                                     | Medium   | Accept (type to T\*Response)                        | 03,04       |
| 14  | Unverified FE assumptions (sidebar array, chart generics, loader)                | Medium   | Accept (verify-before-build)                        | 04,05,06    |
| 15  | tz-naive DateField bucketing                                                     | Medium   | Accept (documented limitation)                      | plan,01     |

## Validation Log

### Session 1 — 2026-06-01

Verification pass skipped: `## Red Team Review` already present with `verified by` evidence on all claims; no `[UNVERIFIED]` tags remained. 4 critical-questions asked.

| #   | Question                                    | Decision                                                       | Propagated To             |
| --- | ------------------------------------------- | -------------------------------------------------------------- | ------------------------- |
| 1   | Active = logtime-only (login un-trackable)? | Accept logtime-only; document in UI subtitle                   | plan,01 (already aligned) |
| 2   | Access-audit-log per-employee views?        | Ship without audit log                                         | plan,02,07                |
| 3   | Daily range cap / filter UX?                | Presets week/month/3-month + custom range; daily cap stays 92d | 04,05                     |
| 4   | Shared response-type location?              | `packages/types` for response types; admin-local for UI-only   | 03                        |

### Whole-Plan Consistency Sweep

Performed after propagation. Zero unresolved contradictions:

- Audit-logging now stated RESOLVED (ship without) in plan.md + Phase 02 Security + Phase 07 — no lingering "OPEN" framing.
- Filter presets (week/month/3-month + custom) added to Phase 04 (defaultRange→presets) and Phase 05 (filter bar); 92-day daily cap in Phase 02 unchanged and consistent with the 3-month longest daily preset.
- Response types pinned to `packages/types` in Phase 03; the prior "confirm where T\*Response should live" ambiguity removed. Phase 04 store + service import the same source.
