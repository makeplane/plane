---
title: "God-Mode Delete Workspace"
description: "Add Delete button per workspace in god-mode workspace list with name-confirmation modal"
status: complete
priority: P2
effort: 3h
branch: triho
tags: [god-mode, workspace, delete, admin]
created: 2026-03-12
---

# God-Mode Delete Workspace

Add a Delete button (trash icon, always visible) to each workspace row in `/god-mode/workspace/` list. Clicking opens a confirmation modal requiring: (1) type workspace name, (2) type "delete my workspace" — identical to web app UX. Uses new `DELETE /api/instances/workspaces/<slug>/` endpoint with `InstanceAdminPermission`.

## Phases

| #   | Phase                                                                  | Status      | Est  |
| --- | ---------------------------------------------------------------------- | ----------- | ---- |
| 01  | [Backend: Delete Endpoint](./phase-01-backend-delete-endpoint.md)      | ✅ complete | 0.5h |
| 02  | [Service Layer: InstanceWorkspaceService](./phase-02-service-layer.md) | ✅ complete | 0.5h |
| 03  | [Admin Store: deleteWorkspace action](./phase-03-admin-store.md)       | ✅ complete | 0.5h |
| 04  | [UI: Delete Modal + List Item Button](./phase-04-ui-components.md)     | ✅ complete | 1.5h |

## Affected Files

- `apps/api/plane/license/api/views/workspace.py` — add `InstanceWorkSpaceDetailEndpoint` with DELETE
- `apps/api/plane/license/urls.py` — add `workspaces/<slug>/` route
- `packages/services/src/workspace/instance-workspace.service.ts` — add `destroy()`
- `apps/admin/store/workspace.store.ts` — add `deleteWorkspace` action
- `apps/admin/components/workspace/delete-workspace-modal.tsx` — new file
- `apps/admin/components/workspace/list-item.tsx` — add Delete button
- `apps/admin/app/(all)/(dashboard)/workspace/page.tsx` — update description text

## Validation Log

### Session 1 — 2026-03-12

**Trigger:** Initial plan creation
**Questions asked:** 4

#### Questions & Answers

1. **[UX]** The plan uses a single name-match confirmation (type workspace name only). The web app delete form requires TWO fields: workspace name + "delete my workspace". Which approach for god-mode?
   - Options: Single field only | Two fields (mirror web app)
   - **Answer:** Two fields (mirror web app)
   - **Rationale:** Consistency with existing web app UX. Modal must have both inputs: workspace name field + "delete my workspace" confirmation field.

2. **[Architecture]** Which API endpoint should the god-mode delete use?
   - Options: New instance endpoint | Reuse existing endpoint
   - **Answer:** New instance endpoint (DELETE /api/instances/workspaces/<slug>/)
   - **Rationale:** Consistent with other god-mode APIs using `InstanceAdminPermission`. Proper separation of concerns.

3. **[Scope]** After deletion in god-mode, what happens if the currently logged-in web user's own workspace is deleted by the admin?
   - Options: No special handling | Add warning in modal
   - **Answer:** No special handling
   - **Rationale:** God-mode is a separate app; no redirect logic needed. Web app handles stale session naturally.

4. **[UX]** How should the Delete button appear in the workspace list item row?
   - Options: Icon button, always visible | Text button on hover
   - **Answer:** Icon button, always visible
   - **Rationale:** Consistent discoverability. Use trash icon from lucide-react.

#### Confirmed Decisions

- Confirmation modal: Two fields (name + "delete my workspace") — mirrors web app
- API: New `DELETE /api/instances/workspaces/<slug>/` with `InstanceAdminPermission`
- Button style: Trash icon, always visible on right side of row
- Post-delete: No redirect/special handling needed

#### Action Items

- [x] Update phase-04 modal to use two-field confirmation (not single field)
- [x] Update phase-04 Delete button to use trash icon (Trash2 from lucide-react)

#### Impact on Phases

- Phase 04: Modal needs two-field confirmation form; Delete button must be trash icon always visible
