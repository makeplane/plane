# Security Adversarial Review: HO View Refactor — Workspace/Project Filters

**Plan:** `plans/260330-0935-ho-ui-refactor-workspace-filter/`
**Reviewer role:** Hostile Security Adversary
**Date:** 2026-03-30

---

## Finding 1: project_id Filter Bypasses Workspace Authorization

- **Severity:** Critical
- **Location:** Phase 1, section "Implementation Steps — Step 1"
- **Flaw:** The plan filters `project_id__in=project_ids` AFTER building the queryset, but the queryset is already scoped by `workspace_id__in=workspace_ids`. The plan claims this is safe: "`project_id` scoped within already-filtered workspace_ids queryset." This is **false**. The ORM filter `Issue.objects.filter(workspace_id__in=workspace_ids).filter(project_id__in=project_ids)` does NOT verify that the supplied `project_ids` belong to the allowed `workspace_ids`. It produces a SQL `AND` between two independent `IN` clauses. Django will return zero rows if there's no overlap — but it will **not** raise an error. A user who has access to workspace A can supply project IDs from workspace B; Django silently returns no rows. However, this same pattern on `HoAccessibleWorkspacesView` does expose projects from all workspaces the user can see — and the frontend populates `selectedProjectIds` from that set. The deeper risk: if a future caller or test passes a project_id from a workspace the user does not have access to, the queryset scoping on `workspace_id__in` does stop data exposure today — but only accidentally, not by design. There is no explicit cross-check `Project.objects.filter(id__in=project_ids, workspace_id__in=workspace_ids)` to reject unauthorized IDs with a 400/403.
- **Failure scenario:** A user with access to workspace A crafts a request `?workspace_slug=workspace-a&project_id=<uuid-of-project-in-workspace-b>`. The ORM returns 0 rows (safe by coincidence), but there is no 400 or 403. This creates an oracle: an attacker can probe whether a UUID corresponds to a valid project by checking if results count changes. More critically, if the workspace filter is omitted (`?project_id=<uuid-of-project-in-workspace-b>`), the queryset is already scoped to the user's workspace_ids — still safe. But the auth guarantee is implicit, not enforced, and any refactor that reorders the filters breaks it silently.
- **Evidence:** Phase 1, Step 1: `qs = qs.filter(project_id__in=project_ids)` with no `project__workspace_id__in=workspace_ids` cross-check. Security section: "project_id scoped within already-filtered workspace_ids queryset" — this statement conflates queryset scoping with authorization validation.
- **Suggested fix:** Before filtering, validate supplied project IDs: `valid_ids = list(Project.objects.filter(id__in=project_ids, workspace_id__in=workspace_ids).values_list("id", flat=True))`. If `len(valid_ids) < len(project_ids)`, return 400. Filter only on `valid_ids`.

---

## Finding 2: UUID Injection Causes 500 on Both Filter Endpoints

- **Severity:** High
- **Location:** Phase 1, "Failure Modes" table + Step 1/2
- **Flaw:** The plan acknowledges "Invalid UUID in `project_id` param | Medium | Low | Django ORM raises ValueError -> 500; add try/except to return 400" — but this mitigation is listed in a failure-modes table and is **not included in the implementation steps or todo list**. The code shown in the plan does no UUID validation before passing raw strings into `project_id__in`. Django's UUID field will raise `ValueError` or `DataError` (database-level) when given a malformed UUID. `BaseAPIView.handle_exception` catches `ValidationError` and `ObjectDoesNotExist` but not bare `ValueError` from the ORM — those propagate to a 500.
- **Failure scenario:** `GET /api/ho/issues/?project_id=../../../../etc/passwd` — Django ORM passes the string to Postgres, which raises `DataError: invalid input syntax for type uuid`. This becomes a 500 response. Repeated calls may pollute logs, trigger alerting noise, or — depending on error reporting integration — leak stack traces containing model names, DB table names, or file paths.
- **Evidence:** Implementation steps show `project_ids = [pid.strip() for pid in project_ids_param.split(",") if pid.strip()]` with no UUID format check. Failure mode row exists but todo list (`- [ ] ...`) has zero entry for the try/except fix.
- **Suggested fix:** Add `import uuid` and validate: `try: uuid.UUID(pid) except ValueError: return Response({"detail": "Invalid project_id."}, status=400)`. Or use Django's `UUIDField` clean mechanism. Add this as a mandatory todo item.

---

## Finding 3: Issue.objects Used Instead of Issue.issue_objects — Leaks Triage/Draft/Archived Issues

- **Severity:** High
- **Location:** Phase 1, Steps 1 and 2 (both views); existing code confirmed at lines 126 and 181
- **Flaw:** The existing `HoIssueListView` and `HoCategorySummaryView` both use `Issue.objects.filter(...)` with explicit `is_draft=False`, `archived_at__isnull=True`, `deleted_at__isnull=True` guards. The project's canonical rule (`.agents/rules/plane-backend-architecture.md`, Rule 1: **"NEVER `Issue.objects` for user queries"**) mandates `Issue.issue_objects` instead. `IssueManager` (the `issue_objects` manager) automatically excludes `state__group=TRIAGE`, archived issues, and draft issues from the queryset. By using `Issue.objects`, the plan relies on manual filter arguments that are easy to miss or partially omit when adding the new filter params. The new `HoAccessibleWorkspacesView` proposed in Step 3 doesn't query issues — but it does expose project names/identifiers including archived projects (only `archived_at__isnull=True` is checked on projects in the plan code, but `deleted_at__isnull=True` filter on `workspace_project` is applied).
- **Failure scenario:** A developer extending the filter logic in a follow-up omits `is_draft=False` from the new queryset (easy when copy-pasting the new filter block). Draft issues — which may contain confidential information not yet published — appear in the HO dashboard response.
- **Evidence:** `Issue.objects.filter(... is_draft=False, archived_at__isnull=True, deleted_at__isnull=True ...)` at lines 126 and 181 in existing code; plan does not flag this violation nor migrate to `issue_objects`.
- **Suggested fix:** Replace `Issue.objects.filter(workspace_id__in=workspace_ids, is_draft=False, archived_at__isnull=True, deleted_at__isnull=True)` with `Issue.issue_objects.filter(workspace_id__in=workspace_ids)`. The manager handles the exclusions automatically and cannot be accidentally dropped.

---

## Finding 4: HoAccessibleWorkspacesView Exposes logo Field via Wrong Attribute — Potential Internal URL Leak

- **Severity:** High
- **Location:** Phase 1, Step 3 (`HoAccessibleWorkspacesView` implementation)
- **Flaw:** The plan serializes `"logo_url": ws.logo` — accessing the raw `TextField` `logo` directly. The `Workspace` model has a `logo_url` **property** that returns either `self.logo_asset.asset_url` (a relative internal API path like `/api/assets/v2/static/<id>/`) or the raw `logo` text field value. By using `ws.logo` instead of `ws.logo_url`, the plan bypasses this property and exposes the raw stored value in `logo` — which may be an absolute external URL, a relative path, or legacy data. More critically, if `logo_asset` is set (the modern path), `ws.logo` returns the old raw value (possibly stale or empty) while the actual logo lives in `logo_asset`. The frontend type definition `logo_url: string | null` expects the property, not the field.
- **Failure scenario:** A workspace whose logo was set via the modern asset upload has `ws.logo = ""` and `ws.logo_asset = <FileAsset>`. The API returns `"logo_url": ""` instead of the correct `/api/assets/v2/static/<uuid>/` URL. UI shows no logo. Separately, old workspaces with `ws.logo` set to an absolute URL expose that URL directly in the API response — which may be an internal CDN path, S3 pre-signed URL, or a path that reveals storage infrastructure.
- **Evidence:** Phase 1, Step 3 line: `"logo_url": ws.logo,` vs. the model property at `workspace.py:147` which shows `def logo_url(self): if self.logo_asset: return self.logo_asset.asset_url`.
- **Suggested fix:** Use `ws.logo_url` (the property) instead of `ws.logo` (the field). Also add logo to the `select_related` chain: `.select_related("logo_asset")` to prevent N+1 when iterating workspaces.

---

## Finding 5: Race Condition — setWorkspaceFilter/setProjectFilter Fire Concurrent Fetches Without Cancellation

- **Severity:** High
- **Location:** Phase 2, Step 3 ("Store: Add actions")
- **Flaw:** Both `setWorkspaceFilter` and `setProjectFilter` use `void this.fetchIssues(1)` and `void this.fetchCategorySummary()` — fire-and-forget async calls with no cancellation or sequencing. If a user clicks workspace A, then immediately clicks workspace B, two concurrent `fetchIssues` requests are in flight. The plan acknowledges this: "Race condition on rapid filter changes | Low | Medium | Each fetch replaces data; last one wins. Acceptable for this use case" — but "last one wins" is wrong. The response that arrives last (determined by network latency, not click order) wins. If workspace-B request is faster, workspace-A results overwrite the UI showing workspace B's data.
- **Failure scenario:** User selects workspace B (slower backend). Before that resolves, they select workspace A (faster backend). Workspace A response arrives first, overwrites store. Then workspace B response arrives, overwrites with workspace B data — while the UI shows workspace A is selected. User sees stale/wrong data for 100% of rapid-click scenarios under normal network jitter.
- **Evidence:** Phase 2, Step 3: `setWorkspaceFilter = (slug): void => { this.selectedWorkspaceSlug = slug; ...; void this.fetchIssues(1); void this.fetchCategorySummary(); }` — no request ID, no abort controller, no sequence counter.
- **Suggested fix:** Add a `_fetchSeq = 0` counter. Increment before each fetch, capture local `const seq = ++this._fetchSeq`. In the fetch's `runInAction`, only apply if `seq === this._fetchSeq`. Or use `AbortController` passed to the service layer.

---

## Finding 6: Silent Failure on fetchAccessibleWorkspaces Hides Auth/Network Errors from Operators

- **Severity:** Medium
- **Location:** Phase 2, Step 3 (`fetchAccessibleWorkspaces` action)
- **Flaw:** The catch block is `catch { // silent — workspace list is non-critical }`. This swallows all errors including auth failures (401, 403), server errors (500), and network failures. If `get_accessible_workspace_ids()` returns empty because of a backend misconfiguration, the endpoint returns 200 with an empty list — the frontend silently shows no workspace selectors and users believe they have no workspaces. There is no way to distinguish "user has no workspaces" from "the request failed." Furthermore, the plan claims "User sees 'All workspaces' default, selectors disabled while loading" — but `isWorkspacesLoading` is set to false in `finally`, so after a failure the UI looks identical to "loaded with no workspaces."
- **Failure scenario:** Backend returns 500 on the `/api/ho/workspaces/` endpoint (e.g., a DB connection issue). The store catches silently, `accessibleWorkspaces = []` remains (initial empty). The workspace selector shows nothing. No error boundary is triggered. No toast notification. Operators have no signal that the filter feature is broken — they see no logs on the frontend side.
- **Evidence:** Phase 2, Step 3: `} catch { // silent — workspace list is non-critical }`. Failure modes table: "fetchAccessibleWorkspaces fails silently | Low | Low | User sees 'All workspaces' default" — this is not "All workspaces" behavior, it is "No workspaces accessible" behavior.
- **Suggested fix:** At minimum, log the error: `catch (err) { console.error("[HO] fetchAccessibleWorkspaces failed:", err); }`. Better: distinguish 401/403 (auth error, should surface to user) from network errors (retry or degrade gracefully). Consider a separate `workspacesError: string | null` observable.

---

## Finding 7: page_size Query Param Allows Unbounded Response — DoS Vector

- **Severity:** Medium
- **Location:** Phase 1 (existing code inherited, not addressed by plan) — `HoIssuePagination` at lines 80-81
- **Flaw:** `HoIssuePagination` sets `page_size_query_param = "page_size"` with `max_page_size = 500`. Any authenticated HO user (or instance admin) can request `?page_size=500` on `/api/ho/issues/`. The new workspace/project filter params introduced in this plan do not scope the max page size, and with cross-workspace queries now possible (an instance admin sees ALL workspaces), a single request can hydrate 500 fully `select_related` + `prefetch_related` issues across all workspaces. The serializer includes nested objects (`assignees`, `issue_module__module`, `issue_cycle__cycle`, `issue_worklogs`). The plan adds no mention of pagination review for the new cross-workspace use case.
- **Failure scenario:** Instance admin calls `GET /api/ho/issues/?page_size=500` with no filters on a large installation. Postgres executes a cross-workspace join with annotations (`Sum`, `Count`, `prefetch_related` for cycles/modules/assignees) over potentially thousands of issues per workspace. Response body may be several megabytes. With 10 concurrent requests, this becomes a DoS.
- **Evidence:** `max_page_size = 500` at line 81. Plan does not review or reduce this for the expanded cross-workspace query surface.
- **Suggested fix:** Reduce `max_page_size` to 100 (already the default). Add query complexity guards: if `workspace_slug` is not provided for instance admins (all-workspace query), cap `page_size` to 50 or require a workspace filter.

---

## Finding 8: HoAccessibleWorkspacesView Returns Projects Without Member-Scoping

- **Severity:** Medium
- **Location:** Phase 1, Step 3 (`HoAccessibleWorkspacesView`)
- **Flaw:** The plan returns all non-deleted, non-archived projects within each accessible workspace: `ws.workspace_project.filter(deleted_at__isnull=True, archived_at__isnull=True)`. This includes **private projects** and projects where the HO user is not a project member. In Plane's model, project membership is separate from workspace access. A department manager who is an HO admin for workspace A will see every project in workspace A in the selector — including private or confidential projects they have no business viewing.
- **Failure scenario:** Workspace A has a confidential HR project "Executive Compensation Q4" that is private. The HO department manager (a department manager but not a member of that project) calls `GET /api/ho/workspaces/`. The response includes `{"id": "<uuid>", "name": "Executive Compensation Q4", "identifier": "EXEC"}` in the projects list. Even if selecting that project returns zero issues (because `HoIssueListView` scopes by workspace_id not by project membership), the project's existence and name are disclosed.
- **Evidence:** Phase 1, Step 3: `ws.workspace_project.filter(deleted_at__isnull=True, archived_at__isnull=True).values("id", "name", "identifier")` — no `ProjectMember` or `network="public"` filter.
- **Suggested fix:** Add `network="public"` filter, or join against `ProjectMember` to return only projects the user is a member of, or only return projects that actually have issues visible to this user (cross-reference with `get_accessible_workspace_ids` scope).

---

## Unresolved Questions

1. Does `BaseAPIView` (used by `HoAccessibleWorkspacesView`) enforce the same `ROLE`-based permission as existing HO views, or only `IsAuthenticated`? The plan does not add `@allow_permission` — is `IsAuthenticated` alone the intended gate for this endpoint?
2. Is `get_accessible_workspace_ids()` called on every request without caching? For instance admins who trigger `Workspace.objects.values_list("id", flat=True)` on every page load, is there a DB cost concern at scale?
3. The plan says filters persist across datasheet/category view switches (shared store). If a user with partial workspace access navigates to a view that doesn't call `fetchAccessibleWorkspaces`, will `selectedWorkspaceSlug` from a previous session survive a store re-instantiation?
