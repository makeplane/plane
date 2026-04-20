# API Changes: `role_slug` Migration

**Branch:** `feature/rbac-gac-guest-role-ceiling`
**Date:** 2026-03-16

---

## Summary

All internal member APIs now use **`role_slug`** (string) instead of numeric **`role`** (int) for input. Responses include **both** fields — `role_slug` (string) and `role` (int, read-only).

Sending numeric `role` in write requests returns **400** `"Use role_slug instead of role"`.

**Valid project role slugs:** `admin`, `contributor`, `commenter`, `guest`
**Valid workspace role slugs:** `owner`, `admin`, `member`, `guest`

### Slug ↔ Numeric Reference

| Slug          | Numeric | Namespace           |
| ------------- | ------- | ------------------- |
| `owner`       | 25      | workspace           |
| `admin`       | 20      | workspace / project |
| `member`      | 15      | workspace           |
| `contributor` | 15      | project             |
| `commenter`   | 10      | project             |
| `guest`       | 5       | workspace / project |

---

## Endpoint Changes

### 1. Add Project Members

`POST /api/workspaces/{slug}/projects/{project_id}/members/`

**Before:**

```json
{
  "members": [{ "member_id": "uuid", "role": 15 }]
}
```

**After:**

```json
{
  "members": [{ "member_id": "uuid", "role_slug": "contributor" }]
}
```

**Response** now includes `role_slug`:

```json
[
  {
    "id": "uuid",
    "member": "uuid",
    "role": 15,
    "role_slug": "contributor",
    "project": "uuid",
    "original_role": 15,
    "created_at": "..."
  }
]
```

**Validation:**

- `role_slug` is **required** for each member — 400 if missing
- Invalid `role_slug` → 400 `"Invalid role_slug: {value}"`
- Workspace guests can only be assigned `guest` or `commenter` → 400 if violated
- Workspace admins **can now** be assigned any project role (old restriction removed)

---

### 2. Update Project Member Role

`PATCH /api/workspaces/{slug}/projects/{project_id}/members/{pk}/`

**Before:**

```json
{ "role": 15 }
```

**After:**

```json
{ "role_slug": "contributor" }
```

Sending `{ "role": 15 }` → **400** `"Use role_slug instead of role"`

---

### 3. Update Workspace Member Role

`PATCH /api/workspaces/{slug}/members/{pk}/`

**Before:**

```json
{ "role": 15 }
```

**After:**

```json
{ "role_slug": "member" }
```

Sending `{ "role": 15 }` → **400** `"Use role_slug instead of role"`

---

### 4. Auto-Join Projects

`POST /api/workspaces/{slug}/projects/join/`

**Request unchanged** — still `{ "project_ids": ["uuid", ...] }`

**Behavior change:** The assigned project role is now derived from the user's workspace role:

| Workspace Role             | Project Role Assigned |
| -------------------------- | --------------------- |
| `owner` / `admin`          | `admin` (20)          |
| `guest`                    | `guest` (5)           |
| `member` / any custom role | `contributor` (15)    |

Previously the workspace numeric role was copied directly as the project role.

---

### 5. All Member Responses

All endpoints returning member data now include `role_slug` alongside `role`.

**Project member responses:**

```json
{
  "role": 15,
  "role_slug": "contributor"
}
```

**Workspace member responses:**

```json
{
  "role": 15,
  "role_slug": "member"
}
```

Applies to: list, retrieve, create, update responses for project members, workspace members, and invite serializers.

---

## Error Messages

| Scenario                          | Old Message                                                        | New Message                                                                    |
| --------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Numeric `role` in PATCH           | _(silently accepted)_                                              | `"Use role_slug instead of role"`                                              |
| Missing `role_slug` in create     | N/A                                                                | `"role_slug is required for each member"`                                      |
| Invalid slug value                | N/A                                                                | `"Invalid role_slug: {value}"`                                                 |
| Non-workspace-member added        | _(500 error)_                                                      | `"One or more members are not active workspace members"`                       |
| Guest assigned contributor/admin  | `"You cannot add a user with role higher than the workspace role"` | `"Workspace guests can only be assigned commenter or guest roles on projects"` |
| Admin assigned lower project role | `"You cannot add a user with role lower than the workspace role"`  | _(now allowed — no error)_                                                     |

---

## Workspace Guest Ceiling

Workspace guests are restricted in what project roles they can receive:

- **Auto-join** (joining a public project): always gets `guest`
- **Explicit assignment** (admin adds them): can be `guest` or `commenter` only
- Attempting `contributor` or `admin` for a workspace guest → 400

All other workspace roles (member, admin, owner, custom) have **no restrictions** on project role assignment.

---

## Endpoints NOT Changed

- **External API** (`/api/v1/...`) — still uses numeric `role`
- **All GET/list endpoints** — request format unchanged; responses now include `role_slug`

---

## FE Migration Checklist

- [ ] Replace `role: <number>` with `role_slug: "<string>"` in all member create/update request payloads
- [ ] Update TypeScript types — add `role_slug: string` to member types (`TProjectMembership`, etc.)
- [ ] Read `role_slug` from responses for display instead of mapping numeric values to labels
- [ ] Update role selection dropdowns/forms to submit slug values
- [ ] Workspace guest role dropdowns: only show `guest` and `commenter` options
- [ ] Update error handling to match new error message strings
