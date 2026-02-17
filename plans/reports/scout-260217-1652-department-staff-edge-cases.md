# Scout Report: Department & Staff Management Edge Cases

## Scope

Analyzed security, data integrity, and API contract alignment for Department & Staff Management feature.

## Critical Edge Cases Found

### 1. **CRITICAL: Missing Input Validation in Serializers**

**Location:** `apps/api/plane/app/serializers/department.py`, `staff.py`

**Issue:** Department and Staff serializers do NOT call `model.clean()` validation

- Department model has validation in `clean()`: short_name uppercase check, dept_code 4-digit check, circular parent detection
- StaffProfile has no `clean()` method but relies on database constraints
- Serializers don't validate these constraints BEFORE database operation

**Risk:**

- Invalid data bypasses model validation (e.g., lowercase short_name, 3-digit dept_code)
- Circular parent references only caught after save attempt
- Poor error messages returned to frontend

**Affected:**

- `DepartmentSerializer` (line 9-35)
- No explicit validation in `validate()` method

**Recommendation:**

```python
class DepartmentSerializer(BaseSerializer):
    def validate(self, attrs):
        # Explicitly call model clean() if updating
        if self.instance:
            dept = self.instance
            for key, value in attrs.items():
                setattr(dept, key, value)
            dept.clean()
        return attrs
```

---

### 2. **HIGH: SQL Injection Risk via Query Parameters**

**Location:** `apps/api/plane/app/views/workspace/department.py:42-52`

**Issue:** Direct integer casting without validation

```python
level = request.query_params.get("level")
if level:
    departments = departments.filter(level=int(level))  # Line 48
```

**Risk:**

- `int()` throws `ValueError` on non-numeric input → 500 error
- `parent` param directly used in filter (line 44) without UUID validation

**Affected:**

- `DepartmentEndpoint.get()` line 42-52
- `StaffEndpoint.get()` line 54-60 (safe: uses `icontains`)

**Recommendation:**

```python
try:
    level = int(level)
    if level < 1 or level > 5:
        return Response({"error": "level must be 1-5"}, 400)
    departments = departments.filter(level=level)
except ValueError:
    return Response({"error": "Invalid level"}, 400)
```

---

### 3. **HIGH: Race Condition in Transfer Logic**

**Location:** `apps/api/plane/app/views/workspace/staff.py:193-211`

**Issue:** Non-atomic check-then-update pattern

```python
with transaction.atomic():
    # Remove from old dept project
    if old_dept and old_dept.linked_project:
        ProjectMember.objects.filter(...).delete()  # Line 196-198

    # Update department
    staff.department = new_dept
    staff.save(update_fields=["department"])  # Line 201-202

    # Add to new dept project
    if new_dept.linked_project:
        ProjectMember.objects.get_or_create(...)  # Line 206-211
```

**Risk:**

- If `old_dept.linked_project` is deleted between read and delete → silent failure
- If `new_dept.linked_project` is deleted between read and get_or_create → silent failure
- No verification that staff actually belongs to old_dept before transfer

**Recommendation:**

```python
# Add select_for_update() and verify ownership
staff = StaffProfile.objects.select_for_update().filter(...).first()
if staff.department_id != old_dept.pk:
    return Response({"error": "Staff not in expected department"}, 400)
```

---

### 4. **HIGH: Deactivation Cascade Without Verification**

**Location:** `apps/api/plane/app/views/workspace/staff.py:234-247`

**Issue:** Deletes ALL ProjectMembers across ALL workspaces

```python
with transaction.atomic():
    # Remove ALL ProjectMember entries
    ProjectMember.objects.filter(member=user).delete()  # Line 236

    # Deactivate WorkspaceMember
    WorkspaceMember.objects.filter(member=user).update(is_active=False)  # Line 239
```

**Risk:**

- User may have ProjectMembers in OTHER workspaces
- No scoping to current workspace → over-deletion
- No check if user is workspace admin before deactivating

**Recommendation:**

```python
# Scope deletion to current workspace's projects only
workspace_projects = Project.objects.filter(workspace__slug=slug)
ProjectMember.objects.filter(
    member=user,
    project__in=workspace_projects
).delete()

# Only deactivate WorkspaceMember for THIS workspace
WorkspaceMember.objects.filter(
    member=user,
    workspace__slug=slug
).update(is_active=False)
```

---

### 5. **MEDIUM: Bulk Import Password Security**

**Location:** `apps/api/plane/app/views/workspace/staff.py:267, 314`

**Issue:** Default password in plain text

```python
default_password = request.data.get("default_password", "Shinhan@2026")  # Line 267
data = {
    ...
    "password": default_password,  # Line 314
}
```

**Risk:**

- Default password exposed in code
- No minimum password complexity enforcement
- All bulk-imported users share same password
- No forced password reset on first login

**Recommendation:**

- Generate random passwords per user
- Send via secure channel (email)
- Set `User.force_password_reset = True` flag

---

### 6. **MEDIUM: Recursive Query Performance Issue**

**Location:** `apps/api/plane/app/views/workspace/staff.py:479-491`

**Issue:** Unbounded recursion for children projects

```python
def _join_children_projects(department, user):
    children = Department.objects.filter(parent=department, deleted_at__isnull=True)
    for child in children:
        if child.linked_project:
            ProjectMember.objects.get_or_create(...)
        _join_children_projects(child, user)  # Line 491 - recursion
```

**Risk:**

- N+1 query problem (one query per child)
- No depth limit (could recurse to level 5)
- No prefetching of linked_project

**Recommendation:**

```python
# Use iterative approach with prefetch
descendants = Department.objects.filter(
    workspace=department.workspace,
    level__gt=department.level,  # All deeper levels
    deleted_at__isnull=True
).prefetch_related('linked_project')

# Filter descendants programmatically or use MPTT
```

---

### 7. **MEDIUM: API Contract Mismatch**

**Location:** Frontend `staff.service.ts:191` vs Backend `staff.py:324`

**Issue:** Response shape inconsistency

```typescript
// Frontend expects (line 191):
async bulkImport(...): Promise<{ success: number; errors: any[] }>

// Backend returns (line 324-329):
{
    "created": created,  // NOT "success"
    "skipped": skipped,
    "errors": errors,
}
```

**Risk:**

- Frontend will not correctly display created count
- `result.success` is undefined in frontend (line 63 of staff-import-modal.tsx)

**Recommendation:**
Backend should return `success` OR frontend should use `created`.

---

### 8. **LOW: Missing Prefetch in Tree Serializer**

**Location:** `apps/api/plane/app/serializers/department.py:66-69`

**Issue:** N+1 queries in tree serialization

```python
def get_children(self, obj):
    children = obj.children.filter(deleted_at__isnull=True).order_by(...)
    return DepartmentTreeSerializer(children, many=True, ...).data
```

**Risk:**

- Each department triggers new query for children
- No `prefetch_related('children')` in view

**Recommendation:**
In `DepartmentTreeEndpoint.get()`:

```python
root_departments = Department.objects.filter(...).prefetch_related(
    Prefetch('children', queryset=Department.objects.filter(deleted_at__isnull=True))
)
```

---

### 9. **LOW: Frontend Unlink URL Mismatch**

**Location:** `department.service.ts:166`

**Issue:** Frontend calls `/unlink-project/` but backend expects DELETE to `/link-project/`

```typescript
// Frontend (line 166):
async unlinkProject(...) {
    return this.delete(`/api/workspaces/${slug}/departments/${id}/unlink-project/`)
}

// Backend URL (department.py:33):
path(".../<uuid:pk>/link-project/", ..., http_method_names=["post", "delete"])
```

**Risk:**

- URL `/unlink-project/` returns 404
- Feature is broken

**Recommendation:**
Frontend should call:

```typescript
return this.delete(`/api/workspaces/${slug}/departments/${id}/link-project/`);
```

---

## Data Integrity Issues

### 10. **Auto-Membership Logic Gap**

**Location:** `staff.py:463-470`, `department.py:236-253`

**Issue:** No synchronization when linked_project changes

- Creating staff auto-adds to linked_project (line 463-470)
- Linking department auto-adds existing staff (line 236-253)
- **But:** Updating department.linked_project to DIFFERENT project doesn't migrate members
- **But:** Deleting staff doesn't remove from linked_project

**Recommendation:**
Add signal handlers for `pre_delete` and `pre_save` on StaffProfile/Department.

---

## Security Issues Summary

| Severity | Issue                            | Location                            |
| -------- | -------------------------------- | ----------------------------------- |
| CRITICAL | Missing model.clean() validation | serializers/department.py, staff.py |
| HIGH     | SQL injection via int() casting  | views/department.py:48              |
| HIGH     | Race condition in transfer       | views/staff.py:193-211              |
| HIGH     | Over-deletion in deactivate      | views/staff.py:236                  |
| MEDIUM   | Hardcoded default password       | views/staff.py:267                  |
| MEDIUM   | Unbounded recursion              | views/staff.py:479-491              |

---

## Unresolved Questions

1. Should department managers have workspace-level admin permissions?
2. What happens to staff when their department is soft-deleted?
3. Should deactivation be reversible (or use soft delete)?
4. Is there a maximum CSV file size for bulk import?
5. Should transfer operation create audit log entry?
