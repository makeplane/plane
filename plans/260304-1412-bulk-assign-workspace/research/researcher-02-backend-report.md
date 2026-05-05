# Backend Research: Django God-Mode Workspace Member Management

## 1. Existing Bulk Import Endpoints

### Workspace Bulk Create (God-Mode)

- File: `apps/api/plane/license/api/views/workspace_bulk_create.py`
- Endpoint: `POST /api/instances/workspaces/bulk-create/`
- Permission: `InstanceAdminPermission`
- Input: JSON `{ "workspaces": [{ "name": str, "organization_size"?: str }] }`
- Max 200/request, atomic transactions, auto-slug generation

### User Bulk Import (Instance Admin)

- File: `apps/api/plane/license/api/views/user_bulk_import.py`
- Endpoint: `POST /api/instances/users/bulk-import/`
- Permission: `InstanceAdminPermission`
- Input: CSV file (UTF-8) with columns: `first_name, last_name, email, password`
- Max 500 rows, email validation

### Staff Bulk Import (Workspace Admin)

- File: `apps/api/plane/app/views/workspace/staff.py` (lines 340-447)
- Endpoint: `POST /api/workspaces/{slug}/staff/bulk-import/`
- Permission: `WorkSpaceAdminPermission`
- Input: CSV with `staff_id, first_name, last_name, department_code, position...`
- Auto-creates User + WorkspaceMember + ProjectMember, max 5000 rows

## 2. Member Invitation Logic

- File: `apps/api/plane/app/views/workspace/invite.py`
- Endpoint: `POST /api/workspaces/{slug}/invitations/`
- Input: `{ "emails": [{ "email": str, "role": int }] }`
- Generates JWT tokens, creates `WorkspaceMemberInvite` records
- Triggers background email task

## 3. Role Values

- Guest = 5, Member = 10, Admin = 15, Owner = 20

## 4. Django View Patterns

- `BaseAPIView` / `BaseViewSet` base classes
- `InstanceAdminPermission` for god-mode
- `WorkSpaceAdminPermission` for workspace admin
- Always `transaction.atomic()` for bulk ops

## 5. Excel/CSV Parsing

- **No openpyxl** — uses stdlib `csv` module only (csv.DictReader)
- `io.StringIO` for in-memory handling
- UTF-8 with BOM handling (`utf-8-sig`)
- Row-by-row validation, collect errors per row
- Returns summary: `{ created: [], skipped: [], errors: [] }`

## 6. WorkspaceMember Model

- Fields: workspace, member (user FK), role (int)
- Related: `WorkspaceMemberInvite` for pending invites

## 7. Key Insights

- **No openpyxl** — if Excel (.xlsx) support needed, must use `xlsx` on frontend + send JSON or add openpyxl to backend
- **No god-mode endpoint for bulk member assignment** — needs to be created
- Existing user lookup: by email via `User.objects.get(email=email)`
- Atomic transactions mandatory
- Role hierarchy enforced (can't invite higher role than self)

## 8. Unresolved Questions

- Is there a god-mode direct-add endpoint (bypassing invite flow)?
- Does bulk assign need email invite flow or direct WorkspaceMember creation?
- What happens if user email doesn't exist — create user or skip/error?
- Max rows limit for new endpoint?
- Rate limits on bulk operations?
