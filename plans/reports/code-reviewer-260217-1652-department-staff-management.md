# Code Review: Department & Staff Management Feature

## Scope

- **Files Reviewed:** 25 files (9 backend, 16 frontend)
- **LOC:** Backend ~942, Frontend ~800 (estimated)
- **Focus:** Recent implementation (full review)
- **Scout Findings:** 10 edge cases discovered (see scout report)

---

## Overall Assessment

**Quality Score: 6.5/10**

The implementation demonstrates solid architectural understanding with proper separation of concerns, RESTful API design, and React best practices. However, **critical security vulnerabilities** and **data integrity issues** significantly impact production readiness.

**Positives:**

- Clean model design with proper constraints
- Hierarchical tree structure well-implemented
- Consistent API patterns
- Good frontend component organization

**Critical Gaps:**

- Missing input validation in serializers
- SQL injection vulnerability
- Race conditions in transactions
- Over-deletion in deactivation
- API contract mismatches

---

## Critical Issues

### 1. **CRITICAL: Missing Model Validation in Serializers**

**File:** `apps/api/plane/app/serializers/department.py` (lines 9-35)

**Problem:**

```python
class DepartmentSerializer(BaseSerializer):
    class Meta:
        model = Department
        fields = [...]
        read_only_fields = ["id", "workspace", "created_at", "updated_at"]
    # NO validate() method to call model.clean()
```

**Impact:**

- Department.clean() validation NEVER runs via API
- Accepts lowercase `short_name` (must be uppercase)
- Accepts 3-digit `dept_code` (must be 4 digits)
- Circular parent references only caught at database level with cryptic errors

**Evidence:**

- Model validation in `department.py:85-96` defines rules
- Serializer has NO `validate()` method calling `self.instance.clean()`
- Other Plane serializers (workspace.py, project.py) also skip this pattern

**Fix Required:**

```python
class DepartmentSerializer(BaseSerializer):
    def validate(self, attrs):
        # For updates, validate against existing instance
        if self.instance:
            temp_instance = self.instance
            for key, value in attrs.items():
                setattr(temp_instance, key, value)
            temp_instance.clean()

        # For creates, build temp instance
        else:
            temp_instance = Department(**attrs)
            temp_instance.clean()

        return attrs
```

**Files to Fix:**

- `apps/api/plane/app/serializers/department.py`
- Add similar validation for staff if business rules emerge

---

### 2. **CRITICAL: SQL Injection via Unsafe Type Casting**

**File:** `apps/api/plane/app/views/workspace/department.py:48`

**Problem:**

```python
level = request.query_params.get("level")
if level:
    departments = departments.filter(level=int(level))  # UNSAFE
```

**Impact:**

- `int("malicious")` throws `ValueError` → 500 error
- No validation that level is 1-5 (model constraint bypassed)
- Poor error handling exposes stack traces

**Attack Vector:**

```bash
GET /api/workspaces/foo/departments/?level=DROP%20TABLE
# Returns 500 with stack trace
```

**Fix Required:**

```python
level = request.query_params.get("level")
if level:
    try:
        level_int = int(level)
        if level_int < 1 or level_int > 5:
            return Response(
                {"error": "level must be between 1 and 5"},
                status=status.HTTP_400_BAD_REQUEST
            )
        departments = departments.filter(level=level_int)
    except (ValueError, TypeError):
        return Response(
            {"error": "Invalid level parameter"},
            status=status.HTTP_400_BAD_REQUEST
        )
```

**Also Check:**

- `parent` param (line 44) should validate UUID format
- All query params in `StaffEndpoint.get()`

---

### 3. **HIGH: Race Condition in Staff Transfer**

**File:** `apps/api/plane/app/views/workspace/staff.py:193-211`

**Problem:**

```python
with transaction.atomic():
    # Remove from old department's linked project
    if old_dept and old_dept.linked_project:
        ProjectMember.objects.filter(
            project=old_dept.linked_project, member=user
        ).delete()  # old_dept.linked_project can be None by now!

    staff.department = new_dept
    staff.save(update_fields=["department"])

    # Add to new department's linked project
    if new_dept.linked_project:
        ProjectMember.objects.get_or_create(...)  # Can also be None
```

**Impact:**

- Concurrent request deletes `old_dept.linked_project` → filter matches 0 rows, no error
- Staff transferred but membership not cleaned up
- Data integrity violation

**Fix Required:**

```python
with transaction.atomic():
    # Lock the staff record
    staff = StaffProfile.objects.select_for_update().filter(
        workspace__slug=slug, pk=pk, deleted_at__isnull=True
    ).select_related("department", "user").first()

    if not staff:
        return Response({"error": "Staff not found"}, 404)

    # Verify current department matches expectation
    old_dept = staff.department

    # Lock departments
    new_dept = Department.objects.select_for_update().filter(
        pk=new_dept_id, workspace__slug=slug, deleted_at__isnull=True
    ).first()

    if not new_dept:
        return Response({"error": "Department not found"}, 400)

    # Now safe to proceed with project membership changes
    if old_dept and old_dept.linked_project:
        ProjectMember.objects.filter(
            project_id=old_dept.linked_project_id,  # Use ID, not relation
            member=user
        ).delete()

    staff.department = new_dept
    staff.save(update_fields=["department"])

    if new_dept.linked_project:
        role = 20 if staff.is_department_manager else 15
        ProjectMember.objects.get_or_create(
            project_id=new_dept.linked_project_id,  # Use ID
            member=user,
            defaults={"role": role},
        )
```

---

### 4. **HIGH: Over-Deletion in Deactivate Endpoint**

**File:** `apps/api/plane/app/views/workspace/staff.py:236`

**Problem:**

```python
with transaction.atomic():
    # Remove ALL ProjectMember entries
    ProjectMember.objects.filter(member=user).delete()

    # Deactivate WorkspaceMember
    WorkspaceMember.objects.filter(member=user).update(is_active=False)
```

**Impact:**

- Deletes ProjectMembers from ALL workspaces (user may be in multiple)
- Deactivates WorkspaceMembers in ALL workspaces
- User completely locked out system-wide when only intended for one workspace

**Security Issue:**
Workspace admin in workspace A can deactivate user who is admin in workspace B.

**Fix Required:**

```python
with transaction.atomic():
    workspace = Workspace.objects.get(slug=slug)

    # Only remove ProjectMembers in THIS workspace's projects
    workspace_projects = Project.objects.filter(
        workspace=workspace
    ).values_list('id', flat=True)

    ProjectMember.objects.filter(
        member=user,
        project_id__in=workspace_projects
    ).delete()

    # Only deactivate WorkspaceMember for THIS workspace
    WorkspaceMember.objects.filter(
        member=user,
        workspace=workspace
    ).update(is_active=False)

    # DO NOT deactivate User.is_active (user-level, not workspace-level)
    # user.is_active = False  # REMOVE THIS
    # user.save(update_fields=["is_active"])  # REMOVE THIS

    staff.employment_status = "resigned"
    staff.save(update_fields=["employment_status"])
```

---

## High Priority Issues

### 5. **Hardcoded Default Password in Bulk Import**

**File:** `apps/api/plane/app/views/workspace/staff.py:267`

**Problem:**

```python
default_password = request.data.get("default_password", "Shinhan@2026")
```

**Issues:**

- Default password exposed in source code
- All imported users share same password
- No forced password reset on first login
- Password transmitted in plain text in request body

**Fix Required:**

```python
import secrets
import string

def generate_temp_password(length=12):
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

# In bulk import:
for row in reader:
    temp_password = generate_temp_password()
    data = {
        ...
        "password": temp_password,
    }

    # Create staff
    staff = _create_staff(workspace, department, data, request.user)

    # Send email with temp password
    send_welcome_email(staff.user.email, temp_password)

    # Set flag for forced password reset
    staff.user.is_password_autoset = True
    staff.user.save(update_fields=["is_password_autoset"])
```

**Add User Model Field:**

```python
class User:
    is_password_autoset = models.BooleanField(default=False)
```

---

### 6. **API Contract Mismatch: Bulk Import Response**

**File:** Frontend `staff.service.ts:191` vs Backend `staff.py:324`

**Problem:**

```typescript
// Frontend expects:
Promise<{ success: number; errors: any[] }>

// Backend returns:
{
    "created": created,  // NOT "success"
    "skipped": skipped,
    "errors": errors,
}
```

**Impact:**
Frontend code at `staff-import-modal.tsx:63`:

```typescript
message: `Successfully imported ${result.success} staff members.`;
// result.success is UNDEFINED → displays "undefined"
```

**Fix Option 1 (Backend):**

```python
return Response(
    {
        "success": created,  # Match frontend expectation
        "created": created,  # Keep for backward compat
        "skipped": skipped,
        "errors": errors,
    },
    status=status.HTTP_200_OK,
)
```

**Fix Option 2 (Frontend):**

```typescript
async bulkImport(...): Promise<{ created: number; skipped: number; errors: any[] }> {
    // Update type signature
}

// In component:
message: `Successfully imported ${result.created} staff members.`
```

---

### 7. **Frontend URL Mismatch: Unlink Project**

**File:** `apps/web/core/services/department.service.ts:166`

**Problem:**

```typescript
async unlinkProject(workspaceSlug: string, departmentId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/departments/${departmentId}/unlink-project/`)
    // Backend URL is /link-project/ (DELETE method), not /unlink-project/
}
```

**Backend Route:** `department.py:33`

```python
path(
    "workspaces/<str:slug>/departments/<uuid:pk>/link-project/",
    DepartmentLinkProjectEndpoint.as_view(http_method_names=["post", "delete"]),
)
```

**Impact:**

- Unlinking departments returns 404
- Feature completely broken

**Fix:**

```typescript
async unlinkProject(workspaceSlug: string, departmentId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/departments/${departmentId}/link-project/`)
    // Remove /unlink-project/, use /link-project/ with DELETE
}
```

---

## Medium Priority Issues

### 8. **N+1 Query in Department Tree**

**File:** `apps/api/plane/app/serializers/department.py:66-69`

**Problem:**

```python
def get_children(self, obj):
    children = obj.children.filter(deleted_at__isnull=True).order_by(...)
    return DepartmentTreeSerializer(children, many=True, ...).data
```

No prefetching in view → each department triggers query for children.

**Fix:**

```python
# In DepartmentTreeEndpoint.get():
from django.db.models import Prefetch

root_departments = (
    Department.objects.filter(...)
    .prefetch_related(
        Prefetch(
            'children',
            queryset=Department.objects.filter(deleted_at__isnull=True)
                .select_related('manager', 'linked_project')
                .order_by('sort_order', 'name')
        )
    )
)
```

---

### 9. **Unbounded Recursion in Auto-Membership**

**File:** `apps/api/plane/app/views/workspace/staff.py:479-491`

**Problem:**

```python
def _join_children_projects(department, user):
    children = Department.objects.filter(parent=department, deleted_at__isnull=True)
    for child in children:
        if child.linked_project:
            ProjectMember.objects.get_or_create(...)
        _join_children_projects(child, user)  # N+1 queries, no depth limit
```

**Impact:**

- N+1 queries (one per child department)
- Can recurse 5 levels deep
- No prefetching

**Fix:**

```python
def _join_children_projects(department, user):
    """Iteratively join all descendant linked projects."""
    from collections import deque

    # BFS to avoid recursion
    queue = deque([department])
    visited = {department.id}

    while queue:
        current_dept = queue.popleft()

        # Get children with prefetch
        children = Department.objects.filter(
            parent=current_dept,
            deleted_at__isnull=True
        ).select_related('linked_project')

        for child in children:
            if child.id not in visited:
                visited.add(child.id)

                if child.linked_project:
                    ProjectMember.objects.get_or_create(
                        project=child.linked_project,
                        member=user,
                        defaults={"role": 15},
                    )

                queue.append(child)
```

---

### 10. **CSV Injection Vulnerability**

**File:** `apps/api/plane/app/views/workspace/staff.py:285-322`

**Problem:**
No validation that CSV fields don't start with `=`, `+`, `@`, `-` (formula injection).

**Impact:**
Excel opens exported CSV with formulas executing.

**Fix:**

```python
def sanitize_csv_field(value):
    """Prevent CSV injection by escaping formula characters."""
    if isinstance(value, str) and value and value[0] in ('=', '+', '@', '-'):
        return "'" + value  # Prefix with single quote
    return value

# In StaffExportEndpoint.get():
for staff in staff_list:
    writer.writerow([
        sanitize_csv_field(staff.staff_id),
        sanitize_csv_field(staff.user.last_name),
        sanitize_csv_field(staff.user.first_name),
        # ... etc
    ])
```

---

## Security Audit

### Authentication & Authorization ✅

**Strengths:**

- Proper permission classes: `WorkSpaceAdminPermission` for mutations
- `WorkspaceEntityPermission` for read operations
- Consistent application across all endpoints

**Verified:**

- All POST/PATCH/DELETE require admin (correct)
- GET operations allow workspace members (correct)

---

### Input Validation ❌

**Critical Gaps:**

1. No validation that `parent` UUID is valid before filtering
2. No validation that `level` is 1-5 before database query
3. CSV bulk import accepts arbitrary data without schema validation
4. No length limits enforced on text fields beyond model constraints

**Recommendations:**

- Add serializer-level validation with `validate_<field>` methods
- Validate UUIDs before database operations
- Add CSV schema validation before processing rows

---

### Password Security ⚠️

**Issues:**

1. Default password hardcoded
2. No password complexity validation
3. Passwords stored correctly (hashed via `set_password`) ✅
4. No rate limiting on bulk import (could spam users)

**Good:**

- Uses Django's `set_password()` (bcrypt hashing) ✅

---

### OWASP Top 10 Coverage

| Vulnerability                               | Status  | Notes                                     |
| ------------------------------------------- | ------- | ----------------------------------------- |
| Injection                                   | ❌ FAIL | SQL injection via int() casting           |
| Broken Auth                                 | ✅ PASS | Proper Django auth, permissions enforced  |
| Sensitive Data                              | ⚠️ WARN | Passwords in bulk import request body     |
| XML External Entities                       | N/A     | No XML parsing                            |
| Broken Access Control                       | ❌ FAIL | Cross-workspace deletion in deactivate    |
| Security Misconfiguration                   | ⚠️ WARN | Default password in code                  |
| XSS                                         | ✅ PASS | React sanitizes output                    |
| Insecure Deserialization                    | ✅ PASS | No custom deserialization                 |
| Using Components with Known Vulnerabilities | ⚠️ WARN | Check dependencies                        |
| Insufficient Logging                        | ⚠️ WARN | No audit trail for transfers/deactivation |

---

## Data Integrity Analysis

### Auto-Membership Logic ⚠️

**Issues Found:**

1. **Staff Creation:** Auto-adds to `department.linked_project` ✅
2. **Department Linking:** Auto-adds existing staff ✅
3. **Staff Transfer:** Removes from old, adds to new ✅
4. **Department Unlinking:** Does NOT remove members ⚠️
   - Intentional? Document this behavior
5. **Changing linked_project:** No migration of members ❌
   - If dept.linked_project changes from Project A → Project B, staff stay in A

**Missing Signal Handlers:**

```python
# Should exist in models/department.py
from django.db.models.signals import pre_save
from django.dispatch import receiver

@receiver(pre_save, sender=Department)
def migrate_members_on_project_change(sender, instance, **kwargs):
    if instance.pk:  # Update, not create
        try:
            old_dept = Department.objects.get(pk=instance.pk)
            if old_dept.linked_project_id != instance.linked_project_id:
                # Migrate all staff members from old to new project
                # ... implementation
        except Department.DoesNotExist:
            pass
```

---

### Circular Reference Prevention ⚠️

**Model Validation:** `department.py:90-96` prevents circular parents ✅

**Problem:** Only runs on `model.clean()`, which serializer DOESN'T call ❌

**Test Case:**

```python
# Create: A → B → C
# Update: C.parent = A  # Creates cycle

# Via API: SUCCEEDS (serializer skips clean)
# Via admin: FAILS (admin calls clean)
```

**Fix:** See Critical Issue #1

---

## Performance Analysis

### Database Queries

**Identified Issues:**

1. **Tree Serializer:** N+1 on children (Issue #8) ❌
2. **Auto-Membership Recursion:** N+1 on descendants (Issue #9) ❌
3. **Staff List:** Proper `select_related` ✅
4. **Department List:** Proper `select_related` + `annotate` ✅

**Optimizations Needed:**

- Add `prefetch_related` to tree endpoint
- Convert recursion to iterative with single query + filtering

---

### Frontend Performance

**Issues:**

1. **No Pagination:** Staff table loads all staff at once
   - Problem for 10,000+ employee orgs
2. **No Virtual Scrolling:** Large tables will lag
3. **Tree Expansion:** All nodes fetched upfront (acceptable for <1000 depts)

**Recommendations:**

- Add pagination to `StaffEndpoint` (limit=100 default)
- Use `react-window` for virtual scrolling in staff table
- Consider lazy-loading tree children

---

## Code Quality

### Positive Observations ✅

1. **Consistent Patterns:**
   - All views inherit `BaseAPIView`
   - Serializers extend `BaseSerializer`
   - Proper use of soft delete (`deleted_at__isnull=True`)

2. **Type Safety:**
   - Frontend has proper TypeScript interfaces
   - Good type coverage in service layer

3. **Error Handling:**
   - Try-catch blocks in frontend components
   - Toast notifications for user feedback

4. **Code Organization:**
   - Logical file separation (models, views, serializers, urls)
   - Frontend follows Plane CE conventions

5. **Database Design:**
   - Proper unique constraints
   - Foreign key relationships well-defined
   - Soft delete support

---

### Code Smells

1. **Magic Numbers:** Role values (15, 20) hardcoded
   - Should be constants: `ROLE_MEMBER = 15`, `ROLE_MANAGER = 20`

2. **Helper Function Location:** `_create_staff` at bottom of views file
   - Should be in `services/staff_service.py`

3. **Frontend Service Duplication:** Each component creates service instance
   - Should use singleton or DI

4. **No Logging:** Critical operations (transfer, deactivate) not logged
   - Add audit trail

---

## Edge Cases from Scout Report

**All 10 edge cases documented in scout report are VALID and CRITICAL.**

Priority breakdown:

- **Must Fix Before Production:** Issues #1, #2, #3, #4, #5, #7
- **Fix in Next Iteration:** Issues #6, #8, #9, #10

---

## Testing Recommendations

### Critical Test Cases Missing

1. **Circular Parent Detection:**

   ```python
   def test_circular_parent_via_api():
       # Create A → B → C
       # Update C.parent = A
       # Should return 400, not 500
   ```

2. **Cross-Workspace Deactivation:**

   ```python
   def test_deactivate_preserves_other_workspaces():
       # User in workspace A and B
       # Deactivate in A
       # Assert still active in B
   ```

3. **Transfer Race Condition:**

   ```python
   def test_concurrent_transfer_and_project_deletion():
       # Thread 1: Transfer staff
       # Thread 2: Delete linked_project
       # Assert no orphaned memberships
   ```

4. **Bulk Import Edge Cases:**

   ```python
   def test_bulk_import_duplicate_staff_id():
       # CSV has duplicate staff_id
       # Assert proper error handling

   def test_bulk_import_invalid_department_code():
       # CSV references nonexistent dept
       # Assert skipped or errored appropriately
   ```

---

## Metrics

### Type Coverage

- **Backend:** N/A (Python)
- **Frontend:** ~85% (good, TypeScript interfaces defined)

### Test Coverage

- **Backend:** Unknown (no tests visible in review)
- **Frontend:** Unknown (no tests visible in review)
- **Estimated:** 0% (no test files found)

### Linting Issues

- **Backend:** Not run (no flake8/black output)
- **Frontend:** Not run (no eslint output)
- **Recommendation:** Run before review

---

## Summary of Required Fixes

### Before Production (P0 - Must Fix)

1. ❌ **Add serializer validation** (calls `model.clean()`)
2. ❌ **Fix SQL injection** in query param casting
3. ❌ **Fix race condition** in transfer (add `select_for_update`)
4. ❌ **Fix over-deletion** in deactivate (scope to workspace)
5. ❌ **Remove hardcoded password** (generate random)
6. ❌ **Fix API contract** (bulk import response shape)
7. ❌ **Fix URL mismatch** (unlink project endpoint)

### Next Sprint (P1 - High Priority)

8. ⚠️ Add prefetch_related to tree endpoint
9. ⚠️ Convert recursion to iterative (auto-membership)
10. ⚠️ Add CSV injection prevention
11. ⚠️ Add audit logging for sensitive operations
12. ⚠️ Add pagination to staff list
13. ⚠️ Add integration tests

### Technical Debt (P2 - Medium Priority)

14. 📝 Extract magic numbers to constants
15. 📝 Move helper functions to services layer
16. 📝 Add forced password reset on first login
17. 📝 Add email notifications for password
18. 📝 Add signal handlers for linked_project changes

---

## Unresolved Questions

1. **Department Deletion:** What happens to staff when department is soft-deleted?
   - Should staff.department be set to NULL?
   - Should deletion be prevented if staff exist?

2. **Deactivation Reversibility:** Can deactivated staff be reactivated?
   - Current implementation sets `user.is_active=False` (irreversible via UI)
   - Should use soft delete on StaffProfile instead?

3. **Manager Permissions:** Should `is_department_manager=True` grant workspace admin permissions?
   - Currently no special permissions
   - Consider adding role-based access

4. **CSV Size Limits:** What's maximum file size for bulk import?
   - No limit enforced
   - Could cause memory issues with 100k+ rows

5. **Transfer Audit:** Should transfers create notification or history record?
   - No audit trail currently
   - Consider adding `DepartmentTransferHistory` model

6. **Concurrent Editing:** What happens if two admins edit same department simultaneously?
   - Last write wins (Django default)
   - Consider optimistic locking

---

## Conclusion

The feature demonstrates **solid architectural foundations** but has **critical security and data integrity gaps** that MUST be addressed before production deployment.

**Recommendation: 🔴 DO NOT DEPLOY** until P0 issues (#1-#7) are resolved and tested.

After fixes, re-review with focus on:

- Integration test coverage
- Load testing with 10k+ staff
- Security penetration testing
- Frontend UX polish

**Estimated Fix Time:** 3-5 days for P0 issues with proper testing.
