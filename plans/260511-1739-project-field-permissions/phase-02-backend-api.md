# Phase 02 — Backend API + Enforcement

## Context Links

- Issue base view: `apps/api/plane/app/views/issue/base.py` (partial_update, destroy)
- Permissions: `plane/app/permissions` (`ROLE`, `allow_permission`)
- Backend rules: `.claude/rules/plane-backend-architecture.md`
- Reference: per-project settings viewsets (e.g. workflows) for URL + permission patterns

## Overview

Priority: P2 | Status: pending
Expose CRUD-lite endpoint for `ProjectFieldPermission` and enforce toggles on issue update/delete in both `app/` and `api/` layers.

## Key Insights

- Existing `partial_update` already restricts to `ROLE.ADMIN, creator, assignee`. We must additionally block MEMBER/GUEST from changing locked fields even when they are creator/assignee.
- Enforcement must short-circuit BEFORE serializer save to avoid partial writes.
- Editor role: **Explicit dual-level check** (Validation #1). PATCH allowed if user is ROLE.ADMIN at PROJECT level OR ROLE.ADMIN at WORKSPACE level — do not rely on `@allow_permission` resolver to elevate workspace admins.
- **Lock semantics for date fields (Validation #7):** Block only when the old value is non-null AND the new value differs (modify or clear). Empty→Value transitions are ALLOWED. Helper must receive old instance to diff.
- **Activity log (Validation #2):** Emit project activity entry on each toggle update (use existing project activity dispatcher).

<!-- Updated: Validation Session 1 - dual-level check, empty->value semantics, activity log -->

## Requirements

- Functional:
  - GET `/api/v1/workspaces/<slug>/projects/<project_id>/field-permissions/` → returns 1 object (lazy-created)
  - PATCH same URL → admin-only (project admin OR workspace admin), updates booleans
  - Issue `partial_update`: if request payload contains any locked field AND user is not ADMIN → 403
  - Issue `destroy`: if user is not ADMIN AND `allow_member_delete_work_item` is False → 403 (current code already restricts to ADMIN, so widening for members behind toggle = new behavior)
- Non-functional: zero N+1, single SELECT on enforcement path (`select_related("project__field_permission")`).

## Architecture

```
Request → @allow_permission → view method
                            → check_field_permission(user_role, project_field_permission, payload_keys, action)
                            → 403 or serializer.save()
```

## Related Code Files

**Create**

- `apps/api/plane/app/serializers/project/field_permission.py`
- `apps/api/plane/app/views/project/field_permission.py`
- `apps/api/plane/utils/work_item_permission_checker.py` (helper, <60 lines)

**Modify**

- `apps/api/plane/app/serializers/__init__.py`
- `apps/api/plane/app/views/__init__.py`
- `apps/api/plane/app/urls/project.py` (or appropriate urls file) — add 2 routes
- `apps/api/plane/app/views/issue/base.py` — inject checker into `partial_update` + `destroy`; relax `destroy` `@allow_permission` to include MEMBER (gated by checker)
- `apps/api/plane/api/views/issue.py` — same checker call (R1 mitigation)

## Implementation Steps

1. **Serializer** — `ProjectFieldPermissionSerializer` exposing 4 booleans + `workspace`, `project` (read-only).
2. **ViewSet** — `ProjectFieldPermissionViewSet(BaseViewSet)`:
   - `get_object()`: `get_or_create(project_id=..., workspace__slug=...)`
   - `retrieve`: `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")` — all project members can read.
   - `partial_update`: `@allow_permission([ROLE.ADMIN], level="WORKSPACE")` decorator at workspace-admin level UNION an inner check accepting project admins. Concretely: decorate with `@allow_permission([ROLE.ADMIN], level="PROJECT")` AND inside method ALSO accept user if `WorkspaceMember.role == ADMIN` for the workspace. Dual-level pattern is required (Validation #1) since workspace admins may not be project members.
   - On successful PATCH: dispatch project activity entry (Validation #2) capturing toggled keys + old/new values.
3. **URLs** — `path("workspaces/<str:slug>/projects/<uuid:project_id>/field-permissions/", ...)`.
4. **Helper** `check_work_item_field_permission(user_role_project, user_role_workspace, project_field_permission, request_payload, current_instance, action)`:
   - Map field key → permission column (constants dict)
   - If `user_role_project == ADMIN` OR `user_role_workspace == ADMIN`: pass
   - For each date field in payload (completed_at, target_date, start_date):
     - perm column `True` → allow
     - perm column `False`: compare `current_instance.<field>` vs `payload[<field>]`
       - `current is None and payload is not None` → ALLOW (empty→value, Validation #7)
       - `current is not None and payload != current` → 403 (value→value OR value→empty)
   - `action == "delete"`: if `allow_member_delete_work_item` False → 403
5. **Inject helper** in `IssueViewSet.partial_update` after auth, before `serializer.is_valid()`. Pass `current_instance` (existing Issue) + `request.data` so helper can diff old vs new for the Empty→Value rule (Validation #7). Fetch `ProjectFieldPermission` via `select_related` once per request.
6. **Relax `destroy`** decorator from `[ROLE.ADMIN]` to `[ROLE.ADMIN, ROLE.MEMBER]` and rely on helper for gating.
7. Mirror in `plane/api/views/issue.py` (external API).
8. Register all in `__init__.py` files.

## Todo List

- [ ] Serializer
- [ ] ViewSet (retrieve + partial_update)
- [ ] URLs
- [ ] Helper util with constants map
- [ ] Resolve workspace-admin-as-project-admin question; fallback if needed
- [ ] Inject into `app/views/issue/base.py` (partial_update + destroy)
- [ ] Inject into `api/views/issue.py` (R1)
- [ ] Register all
- [ ] Unit tests (Phase 06)

## Success Criteria

- GET returns lazy-created row with all `False` defaults
- PATCH as project MEMBER → 403; as project ADMIN → 200; as workspace ADMIN (non-project-member) → 200
- Issue PATCH with `target_date` as MEMBER when toggle False → 403; toggle True → 200
- DELETE issue as MEMBER → 403 when toggle False; 204 when toggle True
- External API exhibits same behavior

## Risk Assessment

- **R1 (revisited):** Forgetting external API path → permission bypass. Mitigation: helper imported in both layers; add a test that hits both.
- **R2:** Existing flows that rely on `destroy` being ADMIN-only break if logic regresses. Mitigation: default is `False` so behavior identical until admin toggles.
- **R3:** Helper called too late (after partial DB writes). Mitigation: call before `serializer.is_valid()`.
- **R4:** Workspace Admin not auto-resolved as project admin → cannot edit project that they don't belong to as project member. Mitigation: explicit dual-level check inside view if resolver doesn't cover this case.

## Security Considerations

- Authoritative server-side enforcement (frontend is UX only).
- Use `level="PROJECT"` on viewset; reject cross-project reads via `project_id` + `workspace__slug` scoping.

## Next Steps

- Phase 03 (Frontend store)
