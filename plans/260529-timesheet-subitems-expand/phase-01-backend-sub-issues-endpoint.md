# Phase 01 — Backend: sub_issues_count + lazy sub-issues timesheet endpoint (TDD)

**Priority:** High · **Status:** ✅ Done — 7/7 contract tests green

## Overview

Expose hierarchy info so the frontend can (a) decide whether to show a chevron and (b) lazily fetch a
parent's sub-items for the current user. **Scope: only sub-items the current user logged time on that
week** (`logged_by=user`, same predicate as the flat grid `timesheet_grid.py:53-60`). No all-children
fetch, no 0-minute placeholder children.

## Related code files

**Modify**

- `apps/api/plane/app/views/workspace/time_tracking/timesheet_grid.py` — add `sub_issues_count` to each row.
- `apps/api/plane/app/views/workspace/time_tracking/cross_workspace.py` — add `sub_issues_count` to each
  row of `CrossWorkspaceTimesheetEndpoint`.
- `apps/api/plane/app/views/workspace/time_tracking/__init__.py` — export new endpoint class.
- `apps/api/plane/app/urls/issue.py` — register new URL (project-scoped, next to existing timesheet URL).
- `apps/api/plane/tests/contract/app/test_workspace_time_tracking.py` — add tests (TDD: write first).

**Create**

- `apps/api/plane/app/views/workspace/time_tracking/timesheet_sub_issues.py` — `TimesheetSubIssuesEndpoint`.

## Design

> **Shared week-start helper (red-team #2).** There is NO single reusable `_parse_week_start`.
> `timesheet_grid.py:19` defines `_parse_week_start(request)` (takes the request object);
> `cross_workspace.py:18` defines a separate `_get_week_start(raw_date_str)` (takes a string).
> **Extract one shared function** `parse_week_start(raw_date_str: str | None) -> (week_start, week_end, error)`
> into a new module `apps/api/plane/app/views/workspace/time_tracking/_week.py`, and have all three
> endpoints import it. State the exact signature in code; do not "reuse `_parse_week_start`" blindly.

> **Date-key contract (red-team #3, Critical).** Backend keys `days` by `wl["logged_at"].isoformat()`
> (local/naive date — `timesheet_grid.py:87`, `cross_workspace.py:89`); frontend builds week-date keys via
> `nd.toISOString().split("T")[0]` (UTC — `time-format.ts:26`). For users in non-UTC zones these strings
> can differ by one day → child worklog lands in wrong cell or shows silent 0. The new endpoint MUST key
> `days` with the **same construction the existing flat rows use**, AND we must verify whether the existing
> flat grid already exhibits this bug. If it does, call it out as inherited (do not silently propagate);
> if fixing is in-scope, fix it consistently across grid + sub-issues in one pass.

### 1. Add `sub_issues_count` to existing rows

`sub_issues_count` = **count of the current user's logged children for the week**, NOT all project
children (user decision, validation 2026-05-29). It must match exactly the set the sub-issues endpoint
returns, so chevron presence ⇔ expandable logged children exist (resolves red-team #11 by construction).

> **Single grouped count over `logged_issue_ids` (red-team #12, now simpler).** The grid already has
> `logged_issue_ids` = every issue the user logged time on this week. A parent's logged-children count is
> simply how many of those issues have `parent_id == this issue`. ONE grouped query, no correlated
> subquery, no query over all project children:
>
> ```python
> from django.db.models import Count
> # children that are themselves logged-by-user this week, grouped by parent
> child_counts = dict(
>     Issue.issue_objects.filter(id__in=logged_issue_ids)
>     .exclude(parent_id__isnull=True)
>     .values("parent_id").annotate(c=Count("id")).values_list("parent_id", "c")
> )
> # then: "sub_issues_count": child_counts.get(issue_id, 0)
> ```
>
> Filter is on `id__in` (PK set) so it is index-backed; the `parent_id` index still matters for the
> endpoint's children fetch below. This count is inherently small (bounded by the user's own logged issues).

For `timesheet_grid.py` (model-instance rows): add `"sub_issues_count": child_counts.get(i.id, 0)` to each
`issue_map` / row dict.

**For `cross_workspace.py` — `.values()` path, explicit (red-team #9, High; cross-workspace is the DEFAULT
view per `timesheet-grid.tsx:38`, so a silent drop breaks the feature for every user immediately):**
`cross_workspace.py:72-84` builds rows as **dicts** via `.values("id","name",...)` and iterates
`for issue in logged_issues: issue["id"]`. You CANNOT read `i.sub_issues_count` here. Use the grouped
`child_counts` map and set `"sub_issues_count": child_counts.get(issue["id"], 0)` in the row dict. (If using
an annotation instead, it must be `.annotate(...)` BEFORE `.values(..., "sub_issues_count")` or the key is
silently dropped.)

### 2. New endpoint — `TimesheetSubIssuesEndpoint`

```
GET /api/workspaces/<slug>/projects/<uuid:project_id>/time-tracking/timesheet/sub-issues/
    ?parent_id=<uuid>&week_start=YYYY-MM-DD   (week_start optional → current Monday)
```

- Permission: `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` (project-level, matches `TimesheetGridEndpoint`).
- Use the shared `parse_week_start(...)` helper (see Design callout — NOT a blind reuse of `_parse_week_start`).
- **Validate `parent_id` (red-team #5, High).** It is an attacker-controlled query param; `project_id` (URL)
  is the only thing `@allow_permission` checks. Up front:
  `parent = get_object_or_404(Issue.issue_objects, pk=parent_id, project_id=project_id, workspace__slug=slug)`
  → 404 on mismatch. Also guard malformed input: `try: uuid.UUID(parent_id) except (ValueError, TypeError):
return Response(status=400)` BEFORE the ORM call (a raw non-UUID `parent_id` otherwise raises
  `ValidationError`/500). Without this, cross-project parent/child links (`sub_issue.py:39` filters by
  `workspace__slug` only, not project) let a member probe `parent_id`s for an enumeration oracle.
- **Children scoped to the current user's logged time (user decision).** Compute the week's worklogs for
  the current user under this parent FIRST, then build rows only for the children that have such worklogs:
  ```python
  child_worklogs = (
      IssueWorkLog.objects.filter(
          workspace__slug=slug, project_id=project_id, logged_by=request.user,
          logged_at__range=[week_start, week_end], issue__parent_id=parent_id,
      ).values("issue_id", "logged_at").annotate(total=Sum("duration_minutes"))
  )
  child_ids = {w["issue_id"] for w in child_worklogs}
  children = (Issue.issue_objects.filter(id__in=child_ids)
      .select_related("project", "workspace").order_by("sequence_id")[:200])
  ```
  So there are NO 0-minute placeholder children — only logged children appear. `[:200]` breadth cap kept
  as a cheap guard (red-team #13), though breadth is now inherently bounded by the user's own logged issues
  (amplification is largely moot). Verify the worklog field name (`logged_by` vs alternative) during impl.
- Attach `sub_issues_count` to each child row from the grouped `child_counts` map (so grandchildren chevrons
  use the same logged-children semantics — recursion stays consistent).
- Build rows identical shape to `ITimesheetRow`: `issue_id, issue_name, issue_identifier, project_id,
days, total_minutes, sub_issues_count` + `workspace_slug, workspace_name` (so cross-workspace child
  rows display consistently). Order by `sequence_id`. Key `days` per the date-key contract above.
- Response: `{ "rows": [...] }`.

> Children scoped to the parent's project AND to the current user's own worklogs. Same endpoint serves
> cross-workspace mode because the frontend calls it with the row's own `workspace_slug` + `project_id`.

## Implementation steps

1. **(TDD)** Write contract tests in `test_workspace_time_tracking.py`:
   - **Self-contained fixtures (red-team #10, High).** The existing `setup` fetches hardcoded seeded rows
     (`User.objects.get(email="ngocyt001@gmail.com")`, `Workspace.objects.get(slug="huhuhhahaha")`) and the
     sole existing test only asserts status codes — it creates no Issue/IssueWorkLog rows. With
     `--reuse-db --nomigrations`, hardcoded `.get(...)` raises `DoesNotExist` on a clean CI DB. **Do NOT reuse
     that pattern for value-level assertions.** Create Workspace/Project/User/Issue (parent + 2 children with
     valid `sequence_id`/`project`/`workspace`)/IssueWorkLog in the test (Factory Boy per
     `backend-testing-i18n.md`, or an explicit self-contained `setUp`). The current user logs time on the
     parent + exactly ONE child; the second child has NO worklog by this user.
   - `test_timesheet_grid_includes_sub_issues_count`: grid row for parent has `sub_issues_count == 1`
     (only the one logged child counts, NOT both children).
   - `test_timesheet_sub_issues_endpoint`: returns exactly 1 row (the logged child) with correct
     `total_minutes` + `sub_issues_count`; the unlogged child is **absent** (no 0-minute placeholder row).
   - `test_timesheet_sub_issues_excludes_other_users_logs`: a child logged only by a DIFFERENT user is NOT
     returned and does NOT raise `sub_issues_count` (guards current-user scoping).
   - `test_timesheet_sub_issues_cross_workspace_count`: cross-workspace grid rows include `sub_issues_count`
     scoped to the current user's logged children (guards the `.values()` drop in #9 — the default view).
   - `test_timesheet_sub_issues_requires_parent_id`: 400 when `parent_id` missing; 400 on malformed UUID;
     404 when `parent_id` belongs to another project (guards #5).
   - `test_timesheet_sub_issues_forbidden_for_non_member`: non-member user → 403 (no auth-failure test exists
     today; add one).
   - Run → expect failures (endpoint/field absent).
2. Extract shared `parse_week_start` into `_week.py`; repoint `timesheet_grid.py` + `cross_workspace.py` (#2).
3. Compute grouped `child_counts` from `logged_issue_ids` (current user's logged children only); add
   `sub_issues_count` key in `timesheet_grid.py` (instance) and `cross_workspace.py` (dict `.values()` path).
4. Create `timesheet_sub_issues.py` with `TimesheetSubIssuesEndpoint` (parent validation, UUID guard,
   current-user logged-children filter, `[:200]` breadth cap, shared week helper, date-key contract).
5. Export in `__init__.py`; register URL in `urls/issue.py`.
6. Run tests → all pass.

## Todo

- [x] Self-contained contract tests (failing): logged-children count, endpoint (only logged child, no placeholder), other-user exclusion, cross-workspace count, parent_id 400/404, non-member 403
- [x] Extract shared `parse_week_start` → `_week.py`; repoint both grid endpoints
- [x] Grouped `child_counts` from `logged_issue_ids` (current-user logged children); `sub_issues_count` in both grid endpoints
- [x] Verify `issues.parent_id` index exists — `Issue.parent` is a FK, Django auto-indexes (no `db_index=False`)
- [x] `TimesheetSubIssuesEndpoint` (parent validation + UUID guard + current-user logged-children filter + `[:200]` cap + date-key contract)
- [x] Export + URL registration (both `time_tracking/__init__.py` AND `app/views/__init__.py`)
- [x] Tests green (7/7 `TestTimesheetSubIssues`)

## Success criteria

- New + existing time-tracking contract tests pass (incl. logged-children count, other-user exclusion, cross-workspace count, parent_id 400/404, non-member 403).
- Grid rows include `sub_issues_count` = count of the current user's logged children; sub-issues endpoint
  returns ONLY the current user's logged children for the week (no 0-minute placeholders), breadth-capped,
  with date keys matching the frontend's week-date keys.
- No change to `daily_totals` / `grand_total_minutes` of the grid.

## Security

- `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` enforces project access. `parent_id` validated via
  `get_object_or_404(..., project_id=project_id, workspace__slug=slug)` + UUID guard → no cross-project
  enumeration (red-team #5). Worklogs filtered by current user → only own time (verify the actual worklog
  model field name during impl — `logged_by` vs alternative; a wrong field name silently returns nobody's time).
- **Red-team #1 NEUTRALIZED by current-user scoping (validation 2026-05-29).** Children are now returned
  only when the _requesting user_ logged time on them, so a workspace-admin expanding a non-member
  project's row sees only issues they themselves logged time on — never arbitrary sub-issue titles of
  projects they don't belong to. The earlier "admin can read non-member sub-issue names" leak no longer
  applies. (The `@allow_permission` admin project bypass still exists but exposes nothing extra here.)

## Next

- Phase 02 consumes the endpoint contract.
