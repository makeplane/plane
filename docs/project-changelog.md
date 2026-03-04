# Project Changelog

All significant changes, features, and fixes are recorded here in reverse-chronological order.

---

## [2026-03-04]

### Feature: Bulk Assign Workspace Members via Excel

**Summary:** God-mode admin can upload an `.xlsx` file to bulk-add users to workspaces without manual one-by-one assignment.

**Backend:**
- New POST endpoint `POST /api/instances/workspaces/bulk-assign-members/`
- Validates each row (email, workspace slug, role); skips rows with unknown users or already-active members with a reason string
- No DB migrations required — uses existing `WorkspaceMember` model
- New view file: `apps/api/plane/license/api/views/workspace_member_bulk_assign.py`
- Extended: `apps/api/plane/license/api/views/__init__.py`, `apps/api/plane/license/urls.py`

**Frontend (apps/admin):**
- New page `/workspace/bulk-assign` with three-step flow: Excel upload → row preview → results display
- New components: `workspace-bulk-assign-form.tsx`, `workspace-bulk-assign-preview.tsx`, `workspace-bulk-assign-results.tsx`
- Excel parsed client-side via `xlsx` (SheetJS), JSON payload sent to backend
- "Bulk Assign Workspace" button added to existing `/workspace/` god-mode page
- Store action `bulkAssignMembers` added to `workspace.store.ts`
- Service method added to `packages/services/src/workspace/instance-workspace.service.ts`

**Decisions recorded:**
- Member role value: `15` (matches DB `ROLE_CHOICES`, spec had a typo of `10`)
- User not found: skip row with reason (no auto-invite)
- Already a member: skip row with reason (no role update)
- UX pattern: dedicated page (mirrors existing Bulk Import page)
