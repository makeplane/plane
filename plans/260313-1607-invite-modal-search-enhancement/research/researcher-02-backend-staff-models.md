# Backend Staff Models & API Research Report

## Model Architecture

### StaffProfile Model

**Location:** `apps/api/plane/db/models/staff.py`

- **FK: User** — one-to-one relationship (unique constraint enforced)
- **staff_id** — char(8), unique, indexed
- **department** — FK to `Department` (nullable, soft-delete aware)
- **position** — varchar(255)
- **job_grade** — varchar(50)
- **phone** — varchar(20)
- **employment_status** — choices: ACTIVE, PROBATION, RESIGNED, SUSPENDED, TRANSFERRED
- **is_department_manager** — boolean, auto-join children workspaces
- **email property** — derived from staff_id: `sh{staff_id}@swing.shinhan.com`

### Department Model

**Location:** `apps/api/plane/db/models/department.py`

- **Hierarchical** — self-referencing FK (parent), max 6 levels
- **name** — varchar(255)
- **code, short_name, dept_code** — various codes (unique constraints)
- **dept_type** — choices: HO, BRX, OSR
- **manager** — FK to User (nullable, soft-delete aware)
- **linked_workspace** — one-to-one FK to Workspace (for department workspace sync)
- **level** — auto-tracked, max 6 (validated on save)
- **is_active** — boolean

**Key Constraint:** circular parent references prevented in `clean()`

### Relationships

- StaffProfile → Department (many-to-one, soft-delete aware)
- Department → Workspace (one-to-one, optional)
- Department → Department (self, hierarchical)

---

## Serializer Fields

### StaffProfileSerializer (Full)

**Used in:** god-mode staff management

**Returned fields:**

- id, user, staff_id, department, position, job_grade, phone
- date_of_joining, date_of_leaving, employment_status
- is_department_manager, notes, email (from user.email), display_name (from user.display_name)
- **department_detail** — {id, name, code}
- **user_detail** — {id, display_name, email, first_name, last_name}
- created_at, updated_at

### MyStaffProfileSerializer (Lightweight)

**Used in:** current user profile endpoint

**Read-only fields:** id, staff_id, position, department, department_detail, is_department_manager

### StaffProfileCreateSerializer

**Used in:** bulk staff import + god-mode create staff

**Input fields:**

- staff_id (required), first_name, last_name, department (UUID), position, job_grade, phone
- date_of_joining, is_department_manager, password (optional), notes

---

## User Search Data (Invite Modal)

### UserLiteSerializer

**Used in:** standard workspace invite list

**Fields:** id, first_name, last_name, avatar, avatar_url, is_bot, display_name

### UserAdminLiteSerializer

**Used in:** god-mode member invitation

**Fields:** ↑ lite fields + email, last_login_medium, **department_name** (via staff_profiles FK lookup)

**Department name resolution:**

```python
profile = next(iter(obj.staff_profiles.all()), None)
return profile.department.name if profile and profile.department_id else None
```

---

## Invite APIs

### POST /api/workspaces/{slug}/invitations/

**View:** `WorkspaceInvitationsViewset.create()`

**Request body:**

```json
{
  "emails": [{ "email": "user@example.com", "role": 5, "auto_join": false }]
}
```

**Response:**

- **auto_join=true** → directly adds existing platform users (no email sent)
- **auto_join=false** → creates `WorkspaceMemberInvite`, sends email
- Returns: `{"message": "Members added successfully"}` (HTTP 200)

**Checks performed:**

1. Role validation (can't invite higher-role users)
2. Duplicate member check (returns existing members if already in workspace)
3. Email validation

### Workspace Member Serializer

**WorkSpaceMemberInviteSerializer** — returns invitation with auto-generated invite_link
**WorkSpaceMemberSerializer** — embeds `member` (UserLiteSerializer)
**WorkspaceMemberAdminSerializer** — embeds `member` (UserAdminLiteSerializer with department_name)

---

## Key Data Flow for Invite Modal

1. **Frontend search query** → User search API (likely uses UserAdminLiteSerializer for god-mode)
2. **Department lookup** → From StaffProfile.department FK, resolved via serializer's `get_department_name()`
3. **Auto-join decision** → flag passed in invite request body (auto_join boolean)
4. **Response data** → UserAdminLiteSerializer includes department_name for UI display

---

## Critical Fields Summary

| Data       | Model        | Field                 | DB Field         | Notes                          |
| ---------- | ------------ | --------------------- | ---------------- | ------------------------------ |
| Staff ID   | StaffProfile | staff_id              | char(8), indexed | unique, auto-email             |
| Email      | StaffProfile | email (property)      | derived          | sh{staff_id}@swing.shinhan.com |
| Department | StaffProfile | department            | FK to Department | nullable, soft-delete          |
| Dept Name  | Department   | name                  | varchar(255)     | primary identifier             |
| User Email | User         | email                 | inherited        | used in invite checks          |
| Is Manager | StaffProfile | is_department_manager | boolean          | auto-join flag                 |

---

## Unresolved Questions

1. What's the exact user search endpoint path for invite modal?
2. Does frontend use pagination/filters for large user lists?
3. Are soft-deleted staff excluded from user search results?
