# HR System Integration Spec — Database Structure Validation

**Date:** 2026-05-06
**Spec:** `docs/hr-system-integration-spec.md` (v1.4)
**Validated Against:** `apps/api/plane/db/models/staff.py` + migrations + serializers + views

---

## Executive Summary

**CRITICAL FINDINGS:**

1. **Model is missing `workspace` FK** — The DB migration 0121 created StaffProfile WITH workspace FK, but current `staff.py` model file omits it. The views and URLs are workspace-scoped but the model docstring incorrectly says "instance-level (not workspace-scoped)".

2. **Spec describes NEW external API (`/api/v1/staff/`)** — The existing `plane/app/` implementation is internal/session-auth. The spec's API key auth + `/api/v1/staff/` endpoints do NOT exist yet.

3. **Spec uses `staff_id` as URL key** — Existing views use `pk` (UUID). Spec requires `PUT/PATCH/GET /api/v1/staff/{staff_id}/` but current views are `/workspaces/<slug>/staff/<uuid:pk>/`.

---

## 1. StaffProfile Model vs Spec Field Comparison

### 1.1 Field Name Mismatches

| Spec Field        | Model Field             | DB Type          | Status                                          |
| ----------------- | ----------------------- | ---------------- | ----------------------------------------------- |
| `staff_id`        | `staff_id`              | `CharField(8)`   | ✅ MATCH                                        |
| `first_name`      | `user.first_name`       | FK lookup        | ✅ MATCH (via User)                             |
| `last_name`       | `user.last_name`        | FK lookup        | ✅ MATCH (via User)                             |
| `position`        | `position`              | `CharField(255)` | ✅ MATCH                                        |
| `job_grade`       | `job_grade`             | `CharField(50)`  | ✅ MATCH                                        |
| `phone`           | `phone`                 | `CharField(20)`  | ✅ MATCH                                        |
| `joining_date`    | `date_of_joining`       | `DateField`      | ⚠️ NAMING MISMATCH                              |
| `status` (create) | `employment_status`     | `CharField(20)`  | ⚠️ NAMING MISMATCH                              |
| `is_manager`      | `is_department_manager` | `BooleanField`   | ⚠️ NAMING MISMATCH                              |
| `date_of_leaving` | `date_of_leaving`       | `DateField`      | ✅ MATCH                                        |
| `notes`           | `notes`                 | `TextField`      | ✅ MATCH                                        |
| N/A               | `workspace` FK          | `ForeignKey`     | ❌ MISSING IN MODEL FILE                        |
| N/A               | `department` FK         | `ForeignKey`     | ⚠️ NOT IN SPEC (spec says no dept data from HR) |

### 1.2 Employment Status Values

**Spec (Section 3.1):** `active`, `probation`, `suspended`, `transferred`

**Model (staff.py line 9-14):**

```python
class EmploymentStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    PROBATION = "probation", "Probation"
    RESIGNED = "resigned", "Resigned"        # ⚠️ IN MODEL BUT NOT IN SPEC CREATE
    SUSPENDED = "suspended", "Suspended"
    TRANSFERRED = "transferred", "Transferred"
```

**Issue:** `resigned` exists in model but spec doesn't list it in create/update status enum. Deactivate endpoint sets `employment_status = "resigned"`.

### 1.3 Email Convention

**Spec (Section 3.1):** `sh{staff_id}@swing.shinhan.com`

**Model (staff.py line 79-81):**

```python
@property
def email(self):
    return f"sh{self.staff_id}@swing.shinhan.com"
```

✅ MATCH

**Code (views/staff.py line 641):**

```python
email = f"sh{data['staff_id']}@swing.shinhan.com"
```

✅ MATCH

---

## 2. Database Constraints

### 2.1 Migration 0121 Constraints (Actual DB)

```python
# Unique per workspace
UniqueConstraint(fields=["workspace", "staff_id"], condition=..., name="staff_unique_workspace_staff_id")
UniqueConstraint(fields=["workspace", "user"], condition=..., name="staff_unique_workspace_user")
```

### 2.2 Current Model Constraints (staff.py lines 66-77)

```python
# WRONG - Missing workspace!
constraints = [
    models.UniqueConstraint(
        fields=["staff_id"],  # ❌ Should be ["workspace", "staff_id"]
        condition=models.Q(deleted_at__isnull=True),
        name="staff_unique_staff_id",
    ),
    models.UniqueConstraint(
        fields=["user"],      # ❌ Should be ["workspace", "user"]
        condition=models.Q(deleted_at__isnull=True),
        name="staff_unique_user",
    ),
]
```

**CRITICAL:** The model file has incorrect constraints that don't match the DB schema.

---

## 3. Existing Implementation vs Spec API

### 3.1 Auth Method

| Component  | Spec Requirement             | Current Implementation                               |
| ---------- | ---------------------------- | ---------------------------------------------------- |
| Auth       | API Key (`X-Api-Key`)        | Session auth (cookie) via `WorkSpaceAdminPermission` |
| URL Prefix | `/api/v1/staff/`             | `/workspaces/<slug>/staff/`                          |
| Scope      | API key determines workspace | Session + URL slug                                   |

**Conclusion:** Spec describes a NEW external API layer. Current implementation is internal API (`plane/app/`). Need to create `plane/api/` endpoints.

### 3.2 Endpoint Comparison

| Spec Endpoint                               | Current Endpoint                                      | Issues                        |
| ------------------------------------------- | ----------------------------------------------------- | ----------------------------- |
| `POST /api/v1/staff/`                       | `POST /workspaces/<slug>/staff/`                      | Different URL, different auth |
| `PUT /api/v1/staff/{staff_id}/`             | N/A                                                   | UUID used, not staff_id       |
| `PATCH /api/v1/staff/{staff_id}/`           | `PATCH /workspaces/<slug>/staff/<uuid:pk>/`           | UUID used, not staff_id       |
| `GET /api/v1/staff/{staff_id}/`             | `GET /workspaces/<slug>/staff/<uuid:pk>/`             | UUID used, not staff_id       |
| `GET /api/v1/staff/`                        | `GET /workspaces/<slug>/staff/`                       | Works (different auth)        |
| `POST /api/v1/staff/{staff_id}/deactivate/` | `POST /workspaces/<slug>/staff/<uuid:pk>/deactivate/` | UUID used, not staff_id       |
| `GET /api/v1/staff/batch/?ids=`             | N/A                                                   | Not implemented               |
| `POST /api/v1/staff/bulk/`                  | N/A                                                   | Not implemented               |

### 3.3 Missing Endpoints (in spec but not implemented)

- `GET /api/v1/staff/batch/?ids=` — Batch get by staff_ids
- `POST /api/v1/staff/bulk/` — Bulk create/update

### 3.4 Key Discrepancy: staff_id vs UUID

**Spec behavior:** Uses `staff_id` (8-digit string) to identify staff in URL
**Current behavior:** Uses `pk` (UUID) to identify staff

The existing implementation at `StaffDetailEndpoint.patch` (views/workspace/staff.py:187) does:

```python
staff = StaffProfile.objects.filter(
    workspace__slug=slug, pk=pk, deleted_at__isnull=True
).first()
```

But spec requires lookup by `staff_id`, not `pk`.

---

## 4. Spec Compliance Issues

### 4.1 Deactivate Behavior (Section 4.4)

**Spec says:**

1. `employment_status` → `resigned`
2. `date_of_leaving` → set to provided date or today
3. `User.is_active` → `false`
4. `WorkspaceMember.is_active` → `false`
5. User removed from all project memberships

**Current implementation (StaffDeactivateEndpoint lines 304-336):**

```python
# Removes ProjectMember within workspace only ✅
ProjectMember.objects.filter(member=user, project__workspace=workspace).delete()

# Updates WorkspaceMember ✅
WorkspaceMember.objects.filter(member=user, workspace=workspace).update(is_active=False)

# Sets status to "resigned" ✅
staff.employment_status = "resigned"

# ❌ MISSING: User.is_active = False
# ❌ MISSING: date_of_leaving set
```

**Missing:** `user.is_active = False` and `staff.date_of_leaving` update.

### 4.2 Department Handling

**Spec (Section 11):** "No department data from HR. Department assignment is managed internally by Plane."

**Current model:** Has `department = FK` field
**Current create serializer:** Accepts `department` or `department_id`

**Issue:** The spec says HR doesn't send department, but the existing implementation expects department. For the external HR API, department should probably be ignored or not required.

---

## 5. Critical Issues Summary

| #   | Issue                                                                      | Severity | Location                         |
| --- | -------------------------------------------------------------------------- | -------- | -------------------------------- |
| 1   | Model missing `workspace` FK field                                         | CRITICAL | `db/models/staff.py`             |
| 2   | Model constraints don't match DB (missing workspace in unique constraints) | CRITICAL | `db/models/staff.py` lines 66-77 |
| 3   | Spec API endpoints don't exist (need new `plane/api/` views)               | CRITICAL | New development needed           |
| 4   | staff_id lookup by URL param not implemented                               | HIGH     | Need new detail views            |
| 5   | Deactivate missing `user.is_active = False`                                | HIGH     | `StaffDeactivateEndpoint`        |
| 6   | Deactivate missing `date_of_leaving` update                                | MEDIUM   | `StaffDeactivateEndpoint`        |
| 7   | Batch get endpoint not implemented                                         | MEDIUM   | New endpoint needed              |
| 8   | Bulk sync endpoint not implemented                                         | MEDIUM   | New endpoint needed              |
| 9   | `date_of_joining` vs `joining_date` naming mismatch                        | LOW      | Spec vs model                    |
| 10  | `is_department_manager` vs `is_manager` naming                             | LOW      | Spec vs model                    |

---

## 6. Recommendations

### 6.1 Fix Model (Immediate)

The `staff.py` model file needs:

1. Add `workspace = ForeignKey("db.Workspace", ...)` field
2. Fix unique constraints to `["workspace", "staff_id"]` and `["workspace", "user"]`
3. Update docstring to say "workspace-scoped" not "instance-level"

### 6.2 New External API Layer

Create in `plane/api/` (not `plane/app/`):

- `plane/api/views/staff.py` — External staff sync endpoints
- `plane/api/serializers/staff.py` — External serializers
- `plane/api/urls/staff.py` — URL routing with `/api/v1/staff/`

Use API key authentication middleware.

### 6.3 Fix Deactivate Endpoint

Add missing updates:

```python
user.is_active = False
user.save(update_fields=['is_active'])
staff.date_of_leaving = date_of_leaving or timezone.now().date()
staff.save(update_fields=['employment_status', 'date_of_leaving'])
```

---

## 7. Unresolved Questions

1. Should the HR external API ignore department entirely, or pass it through unchanged?
2. Should `is_manager` in spec set `is_department_manager` directly, or require department association first?
3. What's the expected behavior if HR sends a `department_id` — should it be accepted or rejected?
4. Should the existing internal API (`plane/app/`) be modified to match spec naming (`joining_date` → `date_of_joining`), or keep both for backwards compatibility?

---

**Validator:** Claude Code
**Files Reviewed:**

- `apps/api/plane/db/models/staff.py`
- `apps/api/plane/db/migrations/0121_department_staffprofile_and_more.py`
- `apps/api/plane/db/migrations/0122_alter_staffprofile_user_field.py`
- `apps/api/plane/app/serializers/staff.py`
- `apps/api/plane/app/views/workspace/staff.py`
- `apps/api/plane/app/urls/staff.py`
