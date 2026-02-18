# Department & Staff Management — Shinhan Bank VN

**Date**: 2026-02-17
**Type**: Feature Implementation
**Status**: Validated & Completed (TS fixes applied 2026-02-18)
**Context**: Shinhan Bank VN, ~1000 employees, multi-level department structure, AD Windows

## Executive Summary

Build a **multi-level department hierarchy** (Department) + **staff profile management** (StaffProfile) integrated into Plane CE. Workspace admins manage organization via Workspace Settings. Employees are **auto-assigned** to the correct Project (team workspace) based on their department. Department managers automatically gain visibility into all projects under their scope.

**Core principle:** Department = organizational metadata (who belongs where). Project = access control (who sees what). Link between the two = auto-assignment.

## Department Hierarchy Levels

Shinhan Bank VN uses a 6-level hierarchical org chart structure. **Levels must be sequential** (child level = parent level + 1, no skipping):

| Level | Type          | Description                                        | Example                        |
| ----- | ------------- | -------------------------------------------------- | ------------------------------ |
| L0    | Workspace     | Shinhan Bank Vietnam — not stored as Department    | Shinhan Bank Vietnam           |
| L1    | Group Biz     | Top-level business groups                          | RBG (Retail Banking Group)     |
| L2    | Division/Unit | Divisions or units within a group                  | RBG-CR (Credit Division)       |
| L3    | Department    | Departments within a division — primary work units | ITG-DEV-BE (Backend Dept)      |
| L4    | Team          | Teams within a department                          | Available for future expansion |
| L5    | Sub-Team      | Sub-teams within a team                            | Available for future expansion |

## Context Links

- **Related Plans**: `plans/260216-2037-ldap-authentication-implementation/plan.md` (LDAP auth)
- **Related Plans**: `plans/260217-1200-staff-id-login-frontend/plan.md` (Staff ID login)
- **Dependencies**: Plane CE core (Workspace, Project, ProjectMember, User)
- **Reference Models**: `apps/api/plane/db/models/workspace.py`, `project.py`, `user.py`

---

## 1. Architecture: Hybrid Approach (Option C)

### 1.1 Organization → Plane Mapping

| Organization Entity     | Plane Concept                 | Details                                     | Level |
| ----------------------- | ----------------------------- | ------------------------------------------- | ----- |
| Shinhan Bank VN         | **Workspace**                 | Single workspace for the entire bank        | L0    |
| Group Biz               | **Department** (NEW)          | Level 1 — Top-level business groups         | L1    |
| Division/Unit           | **Department** (NEW)          | Level 2 — Divisions or units                | L2    |
| Department              | **Department** (NEW)          | Level 3 — Departments, primary work units   | L3    |
| Team                    | **Department** (NEW)          | Level 4 — Teams within a department         | L4    |
| Sub-Team                | **Department** (NEW)          | Level 5 — Sub-teams within a team           | L5    |
| Internal team workspace | **Project** (SECRET)          | Each team = 1 project, only members can see | -     |
| Cross-team project      | **Project** (SECRET)          | Manually invite members from multiple teams | -     |
| Manager overview        | **Project** (SECRET)          | Auto-join projects of all subordinate teams | -     |
| Employee                | **User + StaffProfile** (NEW) | Staff ID, position, department              | -     |
| Task                    | **Issue**                     | Within project, only members can see        | -     |

### 1.2 Practical Structure Example

```
Workspace: "Shinhan Bank VN" (L0 - Workspace)
│
│  ═══ DEPARTMENT TREE (metadata, Workspace Settings) ═══
│
│  RBG (Retail Banking Group) — Group Head: Mr. A          [L1 - Group Biz]
│    ├── RBG-CR (Credit Division) — Division Head: Ms. B   [L2 - Division]
│    │     ├── RBG-CR-AP (Appraisal Dept) — Head: Mr. C   [L3 - Department] → link Project
│    │     └── RBG-CR-CO (Collection Dept) — Head: Ms. D   [L3 - Department] → link Project
│    └── RBG-TX (Transaction Division) — Division Head: Mr. E  [L2 - Division]
│          ├── RBG-TX-01 (Transaction Dept 1) — Head: Mr. F [L3 - Department] → link Project
│          └── RBG-TX-02 (Transaction Dept 2) — Head: Ms. G [L3 - Department] → link Project
│
│  ITG (IT Group) — Group Head: Mr. H                      [L1 - Group Biz]
│    ├── ITG-DEV (Software Dev Division) — Div Head: Mr. I [L2 - Division]
│    │     ├── ITG-DEV-BE (Backend Dept) — Head: Mr. J     [L3 - Department] → link Project
│    │     └── ITG-DEV-FE (Frontend Dept) — Head: Ms. K    [L3 - Department] → link Project
│    └── ITG-OPS (IT Operations Division) — Div Head: Mr. L  [L2 - Division]
│          └── ITG-OPS-IF (Infrastructure Dept) — Head: Mr. M [L3 - Department] → link Project
│
│  ═══ PROJECTS (access control, workspace level) ═══
│
│  📁 [Appraisal] Internal      (SECRET) ← linked RBG-CR-AP (L3)
│  📁 [Collection] Internal     (SECRET) ← linked RBG-CR-CO (L3)
│  📁 [Transaction 1] Internal  (SECRET) ← linked RBG-TX-01 (L3)
│  📁 [Backend] Internal        (SECRET) ← linked ITG-DEV-BE (L3)
│  📁 [Frontend] Internal       (SECRET) ← linked ITG-DEV-FE (L3)
│  📁 [Infrastructure] Internal (SECRET) ← linked ITG-OPS-IF (L3)
│  🚀 Core Banking Migration    (SECRET) ← cross-team, manually invite
│  📊 [IT Group] Overview       (SECRET) ← Group head + dept heads
```

### 1.3 Visibility Rules

**Employee (Developer) — Nguyen Duong, Backend Team:**

```
Sees:    ✅ [Backend] Internal (auto from department)
         ✅ Core Banking Migration (manually invited)
Cannot:  ❌ [Frontend], [Appraisal], [Collection]...
```

**Team Leader — Mr. J, Backend Team:**

```
Sees:    ✅ [Backend] Internal (Project Admin — leader)
         ✅ Core Banking Migration (manually invited)
Rights:  Create/edit/delete tasks, manage members, configure project
```

**Division Head — Mr. I, Software Development Division (L2 - Division):**

```
Sees:    ✅ [Backend] Internal (auto-join — parent division manager)
         ✅ [Frontend] Internal (auto-join — parent division manager)
→ Auto-joins ALL projects of subordinate departments (L3)
```

**Group Head — Mr. H, IT Group (L1 - Group Biz):**

```
Sees:    ✅ [Backend], [Frontend], [Infrastructure] Internal (auto-join all)
         ✅ [IT Group] Overview
→ Sees ALL projects within the entire group (L2→L3 descendants)
```

### 1.4 Department Transfer

```
Duong transfers: Backend Team → Frontend Team
  │
  Automatic actions:
  ├── Remove from "[Backend] Internal"
  ├── Add to "[Frontend] Internal"
  └── Cross-team projects (Core Banking) NOT affected
```

### 1.5 Cross-team Projects

```
Project "Core Banking Migration" (SECRET)
  → Not linked to any department
  → Admin/PM manually invites members from multiple teams
  → When staff transfers departments, this membership is preserved
```

---

## 2. Data Models

### 2.1 Department (Multi-level tree)

```python
# File: apps/api/plane/db/models/department.py

class Department(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="departments")

    # Basic info
    name = models.CharField(max_length=255)            # "Backend Team"
    code = models.CharField(max_length=20)              # "ITG-DEV-BE"
    short_name = models.CharField(max_length=10)       # "BE", "FE", "INFRA" — uppercase, min 2 chars, used as task ID prefix
    dept_code = models.CharField(max_length=4)         # "0947", "7128" — exactly 4 digits
    description = models.TextField(blank=True, default="")

    # Multi-level tree (parent=NULL → top level)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="children")
    level = models.PositiveSmallIntegerField(default=1, validators=[MaxValueValidator(5)])
    # Level types (sequential, child = parent + 1):
    # 0=Workspace (not stored), 1=Group Biz, 2=Division/Unit, 3=Department, 4=Team, 5=Sub-Team

    # Department manager
    manager = models.ForeignKey("db.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="managed_departments")

    # Link → Project (corresponding team project)
    linked_project = models.ForeignKey("db.Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="linked_department")

    # Ordering
    sort_order = models.FloatField(default=65535)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "departments"
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "code"],
                condition=models.Q(deleted_at__isnull=True),
                name="department_unique_workspace_code",
            ),
            models.UniqueConstraint(
                fields=["workspace", "short_name"],
                condition=models.Q(deleted_at__isnull=True),
                name="department_unique_workspace_short_name",
            ),
            models.UniqueConstraint(
                fields=["workspace", "dept_code"],
                condition=models.Q(deleted_at__isnull=True),
                name="department_unique_workspace_dept_code",
            ),
        ]

    # Validation
    def clean(self):
        if self.short_name and (len(self.short_name) < 2 or not self.short_name.isupper()):
            raise ValidationError("short_name must be uppercase, minimum 2 characters")
        if self.dept_code and (len(self.dept_code) != 4 or not self.dept_code.isdigit()):
            raise ValidationError("dept_code must be exactly 4 digits")
```

**Example data:**

| code       | short_name | dept_code | name                  | parent  | level | type          | manager | linked_project           |
| ---------- | ---------- | --------- | --------------------- | ------- | ----- | ------------- | ------- | ------------------------ |
| RBG        | RBG        | 0100      | Retail Banking Group  | NULL    | 1     | Group Biz     | Mr. A   | NULL                     |
| RBG-CR     | CR         | 0110      | Credit Division       | RBG     | 2     | Division/Unit | Ms. B   | NULL                     |
| RBG-CR-AP  | AP         | 0111      | Appraisal Dept        | RBG-CR  | 3     | Department    | Mr. C   | → "[Appraisal] Internal" |
| ITG        | ITG        | 0900      | IT Group              | NULL    | 1     | Group Biz     | Mr. H   | NULL                     |
| ITG-DEV    | DEV        | 0910      | Software Dev Division | ITG     | 2     | Division/Unit | Mr. I   | NULL                     |
| ITG-DEV-BE | BE         | 0911      | Backend Dept          | ITG-DEV | 3     | Department    | Mr. J   | → "[Backend] Internal"   |

**Task ID prefix example:** Tasks in Backend Team → `BE-123`, Appraisal Team → `AP-456`

**Rules:**

- Only the **lowest-level departments** (L3 or deeper) link to projects — they are the actual work units
- Groups (L1) / Divisions (L2) **do NOT link projects** — managers auto-join via children logic
- L4 (Team) and L5 (Sub-Team) available for future expansion when departments need sub-divisions
- **Sequential rule:** child level = parent level + 1 (no skipping levels)

### 2.2 StaffProfile (Employee record)

```python
# File: apps/api/plane/db/models/staff.py

class EmploymentStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    PROBATION = "probation", "Probation"
    RESIGNED = "resigned", "Resigned"
    SUSPENDED = "suspended", "Suspended"
    TRANSFERRED = "transferred", "Transferred"

class StaffProfile(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="staff_profiles")
    user = models.OneToOneField("db.User", on_delete=models.CASCADE, related_name="staff_profile")

    # Staff ID
    staff_id = models.CharField(max_length=8, db_index=True)  # "18506320"

    # Department
    department = models.ForeignKey("db.Department", on_delete=models.SET_NULL, null=True, blank=True, related_name="staff_members")

    # Job info
    position = models.CharField(max_length=255, blank=True, default="")    # "Senior Developer"
    job_grade = models.CharField(max_length=50, blank=True, default="")     # "Senior"

    # Contact
    phone = models.CharField(max_length=20, blank=True, default="")

    # Dates
    date_of_joining = models.DateField(null=True, blank=True)
    date_of_leaving = models.DateField(null=True, blank=True)

    # Status
    employment_status = models.CharField(max_length=20, choices=EmploymentStatus.choices, default=EmploymentStatus.ACTIVE)

    # Special permissions
    is_department_manager = models.BooleanField(default=False)  # → auto-join children projects

    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "staff_profiles"
        ordering = ["staff_id"]
        constraints = [
            models.UniqueConstraint(fields=["workspace", "staff_id"], condition=models.Q(deleted_at__isnull=True), name="staff_unique_workspace_staff_id"),
            models.UniqueConstraint(fields=["workspace", "user"], condition=models.Q(deleted_at__isnull=True), name="staff_unique_workspace_user"),
        ]

    @property
    def email(self):
        return f"sh{self.staff_id}@swing.shinhan.com"
```

### 2.3 Overall Relationships

```
Workspace (1)
  │
  ├──── Department (N, tree)
  │       │ parent → self (multi-level tree)
  │       │ manager → User
  │       │ linked_project → Project (optional, team level only)
  │       │
  │       └──── StaffProfile (N)
  │               │ user → User (1:1)
  │               │ department → Department
  │               └ is_department_manager → bool
  │
  ├──── Project (N, SECRET mode)
  │       └──── ProjectMember (N)
  │               │ member → User
  │               └ role: Admin(20) / Member(15) / Guest(5)
  │
  └──── User (N, Plane core — DO NOT MODIFY)
```

---

## 3. Auto-membership Logic

### 3.1 When adding staff to a department

```python
def on_staff_created(staff_profile):
    dept = staff_profile.department
    user = staff_profile.user

    # 1. Create WorkspaceMember if not exists
    WorkspaceMember.objects.get_or_create(
        workspace=dept.workspace, member=user,
        defaults={"role": 15}  # Member
    )

    # 2. If department has linked_project → add ProjectMember
    if dept.linked_project:
        role = 20 if staff_profile.is_department_manager else 15
        ProjectMember.objects.get_or_create(
            project=dept.linked_project, member=user,
            defaults={"role": role}
        )

    # 3. If is department manager → join ALL descendant projects
    if staff_profile.is_department_manager:
        for child_dept in get_all_descendants(dept):
            if child_dept.linked_project:
                ProjectMember.objects.get_or_create(
                    project=child_dept.linked_project, member=user,
                    defaults={"role": 15}  # Viewer, not Admin
                )
```

### 3.2 When transferring departments

```python
def on_staff_transferred(staff_profile, old_dept, new_dept):
    user = staff_profile.user

    # 1. Remove from OLD project (only linked project, cross-team unaffected)
    if old_dept.linked_project:
        ProjectMember.objects.filter(
            project=old_dept.linked_project, member=user
        ).delete()

    # 2. Add to NEW project
    if new_dept.linked_project:
        ProjectMember.objects.get_or_create(
            project=new_dept.linked_project, member=user,
            defaults={"role": 15}
        )

    # 3. If manager → update children projects accordingly
```

### 3.3 When linking department ↔ project

```python
def on_department_linked_project(dept, project):
    # Add ALL active staff in department to project
    for staff in dept.staff_members.filter(employment_status="active"):
        role = 20 if staff.is_department_manager else 15
        ProjectMember.objects.get_or_create(
            project=project, member=staff.user,
            defaults={"role": role}
        )

    # Add managers of parent departments (upstream managers)
    parent = dept.parent
    while parent:
        if parent.manager:
            ProjectMember.objects.get_or_create(
                project=project, member=parent.manager,
                defaults={"role": 15}
            )
        parent = parent.parent
```

### 3.4 When deactivating staff (resignation)

```python
def on_staff_deactivated(staff_profile):
    user = staff_profile.user

    # 1. Remove ALL ProjectMember (team + cross-team)
    ProjectMember.objects.filter(member=user).delete()

    # 2. Deactivate WorkspaceMember
    WorkspaceMember.objects.filter(member=user).update(is_active=False)

    # 3. Deactivate User
    user.is_active = False
    user.save()
```

---

## 4. Backend API

### 4.1 Department API

**Base URL:** `/api/v1/workspaces/<slug>/departments/`

| Method | Path                    | Description                                   | Permission       |
| ------ | ----------------------- | --------------------------------------------- | ---------------- |
| GET    | `/`                     | List flat (filter: parent, level, is_active)  | Workspace Member |
| GET    | `/tree/`                | Full nested tree JSON                         | Workspace Member |
| GET    | `/<id>/`                | Department detail                             | Workspace Member |
| POST   | `/`                     | Create department                             | Workspace Admin  |
| PATCH  | `/<id>/`                | Update department                             | Workspace Admin  |
| DELETE | `/<id>/`                | Soft delete department                        | Workspace Admin  |
| GET    | `/<id>/staff/`          | List staff in department                      | Workspace Member |
| POST   | `/<id>/link-project/`   | Link department ↔ project (auto-sync members) | Workspace Admin  |
| DELETE | `/<id>/unlink-project/` | Unlink (does not remove members)              | Workspace Admin  |

**GET `/tree/` response:**

```json
[
  {
    "id": "uuid-1",
    "code": "ITG",
    "short_name": "ITG",
    "dept_code": "0900",
    "name": "IT Group",
    "level": 1,
    "manager": { "id": "...", "display_name": "Mr. H", "staff_id": "10000008" },
    "linked_project": null,
    "staff_count": 30,
    "children": [
      {
        "id": "uuid-2",
        "code": "ITG-DEV",
        "short_name": "DEV",
        "dept_code": "0910",
        "name": "Software Development Division",
        "level": 2,
        "manager": { "id": "...", "display_name": "Mr. I" },
        "staff_count": 15,
        "children": [
          {
            "id": "uuid-3",
            "code": "ITG-DEV-BE",
            "short_name": "BE",
            "dept_code": "0911",
            "name": "Backend Dept",
            "level": 3,
            "manager": { "id": "...", "display_name": "Mr. J" },
            "linked_project": { "id": "...", "name": "[Backend] Internal", "identifier": "BE" },
            "staff_count": 6,
            "children": []
          }
        ]
      }
    ]
  }
]
```

### 4.2 StaffProfile API

**Base URL:** `/api/v1/workspaces/<slug>/staff/`

| Method | Path                | Description                                                 | Permission      |
| ------ | ------------------- | ----------------------------------------------------------- | --------------- |
| GET    | `/`                 | List staff (filter: department, status, search)             | Workspace Admin |
| GET    | `/<id>/`            | Staff detail                                                | Workspace Admin |
| POST   | `/`                 | Create staff (auto: User + WorkspaceMember + ProjectMember) | Workspace Admin |
| PATCH  | `/<id>/`            | Update staff                                                | Workspace Admin |
| DELETE | `/<id>/`            | Soft delete                                                 | Workspace Admin |
| POST   | `/<id>/transfer/`   | Transfer department (auto-update project membership)        | Workspace Admin |
| POST   | `/<id>/deactivate/` | Resign (deactivate user + remove memberships)               | Workspace Admin |
| POST   | `/bulk-import/`     | Import from CSV/JSON                                        | Workspace Admin |
| GET    | `/export/`          | Export CSV                                                  | Workspace Admin |
| GET    | `/stats/`           | Statistics (total, by department, by status)                | Workspace Admin |

**POST `/` — Create staff:**

```json
// Request
{
  "staff_id": "18506320",
  "first_name": "Duong",
  "last_name": "Nguyen",
  "department_id": "uuid-of-backend-team",
  "position": "Senior Developer",
  "job_grade": "Senior",
  "phone": "0901234567",
  "date_of_joining": "2020-01-15",
  "is_department_manager": false,
  "password": "InitialPass@2026"
}

// Auto-actions:
// 1. Create User(email=sh18506320@swing.shinhan.com)
// 2. Create StaffProfile(staff_id=18506320, department=Backend Team)
// 3. Create WorkspaceMember(role=Member)
// 4. Backend Team linked → "[Backend] Internal"
//    → Create ProjectMember(project="[Backend] Internal", role=Member)
```

**POST `/<id>/transfer/` — Transfer department:**

```json
// Request
{ "department_id": "uuid-of-frontend-team" }

// Auto-actions:
// 1. Remove ProjectMember from "[Backend] Internal"
// 2. Update department → Frontend Team
// 3. Add ProjectMember to "[Frontend] Internal"
// 4. Cross-team projects NOT affected
```

**POST `/bulk-import/` — Import CSV:**

```json
// Request (multipart/form-data)
{
  "file": "staff_list.csv",
  "default_password": "Shinhan@2026",
  "skip_existing": true
}

// CSV format:
// staff_id,last_name,first_name,department_code,position,job_grade,phone,date_of_joining
// 18506320,Nguyen,Duong,ITG-DEV-BE,Senior Developer,Senior,0901234567,2020-01-15
// 10000002,Tran,Minh,ITG-DEV-FE,Developer,Junior,0912345678,2023-06-01
```

---

## 5. Workspace Settings UI

### 5.1 Sidebar Navigation

```
Workspace Settings Sidebar
├── General
├── Members
├── Billing & Plans
├── Imports
├── Exports
├── Webhooks
├── API Tokens
├── 🏢 Departments          ← NEW
└── 👤 Staff                ← NEW
```

### 5.2 Departments Page (`/<workspaceSlug>/settings/departments/`)

```
┌────────────────────────────────────────────────────────────┐
│  🏢 Department Management                      [+ Add New] │
├────────────────────────────────────────────────────────────┤
│  🔍 Search...                                               │
│                                                             │
│  ▼ RBG — Retail Banking Group              (45 staff) [✏️🗑] │
│    ▼ RBG-CR — Credit Division              (20 staff) [✏️🗑] │
│      ● RBG-CR-AP — Appraisal Dept          (8 staff) [✏️🗑] │
│        🔗 Project: [Appraisal] Internal                      │
│        👤 Head: Mr. C                                        │
│      ● RBG-CR-CO — Collection Dept          (5 staff) [✏️🗑] │
│    ▶ RBG-TX — Transaction Division         (25 staff)        │
│                                                             │
│  ▼ ITG — IT Group                           (30 staff) [✏️🗑] │
│    ▼ ITG-DEV — Software Dev Division       (15 staff) [✏️🗑] │
│      ● ITG-DEV-BE — Backend Dept            (6 staff) [✏️🗑] │
│        🔗 Project: [Backend] Internal                        │
│      ● ITG-DEV-FE — Frontend Dept           (5 staff) [✏️🗑] │
│    ▶ ITG-OPS — IT Operations Division      (10 staff)        │
└────────────────────────────────────────────────────────────┘
```

### 5.3 Staff Page (`/<workspaceSlug>/settings/staff/`)

```
┌───────────────────────────────────────────────────────────────────┐
│  👤 Staff Management                   [📥 Import CSV] [+ Add New] │
├───────────────────────────────────────────────────────────────────┤
│  🔍 Search...   Department: [All ▼]      Status: [All ▼]         │
│                                                                   │
│  ┌────────┬──────────────┬──────────────┬───────────┬─────┬────┐ │
│  │ ID     │ Full Name    │ Department   │ Position  │ St  │    │ │
│  ├────────┼──────────────┼──────────────┼───────────┼─────┼────┤ │
│  │18506320│ Nguyen Duong │ Backend Dept │ Sr. Dev   │ 🟢  │✏️🗑│ │
│  │10000002│ Tran Minh    │ Frontend Dept│ Dev       │ 🟢  │✏️🗑│ │
│  │10000003│ Le Hoa       │ Appraisal    │ Officer   │ 🟡  │✏️🗑│ │
│  └────────┴──────────────┴──────────────┴───────────┴─────┴────┘ │
│                                                                   │
│  📊 Total: 100 │ 🟢 Active: 95 │ 🟡 Probation: 3 │ 🔴 Resigned: 2│
└───────────────────────────────────────────────────────────────────┘
```

---

## 6. Implementation Phases

### Phase 1: DB Models + Migrations

**Tasks:**

1. [x] Create Department model — file: `apps/api/plane/db/models/department.py`
2. [x] Create StaffProfile model — file: `apps/api/plane/db/models/staff.py`
3. [x] Export models — file: `apps/api/plane/db/models/__init__.py`
4. [x] Run `makemigrations` + `migrate`
5. [x] Unit test models

**Acceptance Criteria:**

- [x] Migration succeeds without conflicts with Plane core
- [x] Department tree: parent/children correct
- [x] StaffProfile 1:1 with User
- [x] Unique constraints: staff_id + workspace, code + workspace

---

### Phase 2: Backend API — Department

**Tasks:**

1. [x] DepartmentSerializer — file: `apps/api/plane/app/serializers/department.py`
2. [x] DepartmentTreeSerializer (nested) — same file
3. [x] DepartmentViewSet (CRUD + tree + link) — file: `apps/api/plane/app/views/workspace/department.py`
4. [x] URL routing — file: `apps/api/plane/app/urls/workspace/department.py`
5. [x] Include URLs — file: `apps/api/plane/app/urls/workspace/__init__.py`
6. [x] Permission: Workspace Admin only (role=20) for write operations
7. [x] API tests

**Acceptance Criteria:**

- [x] GET `/tree/` returns correct nested JSON
- [x] CRUD works
- [x] Link/unlink project + auto-sync members
- [x] Permission denied for non-admin

---

### Phase 3: Backend API — StaffProfile

**Tasks:**

1. [x] StaffProfileSerializer — file: `apps/api/plane/app/serializers/staff.py`
2. [x] StaffProfileViewSet — file: `apps/api/plane/app/views/workspace/staff.py`
   - CRUD + transfer + deactivate + bulk-import + export + stats
3. [x] Auto-create logic: User + WorkspaceMember + ProjectMember
4. [x] Transfer logic: remove old project, add new project
5. [x] Deactivate logic: remove memberships, deactivate user
6. [x] Bulk import: parse CSV, validate, batch create
7. [x] Export: CSV response
8. [x] URL routing — file: `apps/api/plane/app/urls/workspace/staff.py`
9. [x] API tests

**Acceptance Criteria:**

- [x] POST create staff → auto-create User + project membership
- [x] Transfer → auto-update memberships
- [x] Bulk import 100 staff OK
- [x] Deactivate → user disabled, removed from projects

---

### Phase 4: Workspace Settings UI — Departments

**Tasks:**

1. [x] Department service — file: `apps/web/core/services/department.service.ts`
2. [x] Department tree component — file: `apps/web/.../settings/departments/components/department-tree.tsx`
3. [x] Department form modal — file: `apps/web/.../settings/departments/components/department-form-modal.tsx`
4. [x] Department tree item — file: `apps/web/.../settings/departments/components/department-tree-item.tsx`
5. [x] Department page — file: `apps/web/.../settings/departments/page.tsx`
6. [x] Sidebar menu item — workspace settings sidebar component

**Acceptance Criteria:**

- [x] Collapsible tree view
- [x] Department CRUD via UI
- [x] Link project selector
- [x] Show staff count per department

---

### Phase 5: Workspace Settings UI — Staff

**Tasks:**

1. [x] Staff service — file: `apps/web/core/services/staff.service.ts`
2. [x] Staff table component — file: `apps/web/.../settings/staff/components/staff-table.tsx`
3. [x] Staff form modal — file: `apps/web/.../settings/staff/components/staff-form-modal.tsx`
4. [x] Staff filter component — file: `apps/web/.../settings/staff/components/staff-filter.tsx`
5. [x] CSV import dialog — file: `apps/web/.../settings/staff/components/staff-import-modal.tsx`
6. [x] Staff page — file: `apps/web/.../settings/staff/page.tsx`
7. [x] Sidebar menu item

**Acceptance Criteria:**

- [x] Table with pagination, sort, search
- [x] Staff CRUD → auto project membership
- [x] CSV import OK
- [x] CSV export OK
- [x] Department transfer dialog

---

### Phase 6: Auto-membership + Manager Access

**Tasks:**

1. [x] Django signal: StaffProfile post_save → sync project membership
2. [x] Django signal: Department.linked_project change → sync all members
3. [x] Manager auto-join: manager joins children linked projects
4. [x] Celery task: bulk sync (when linking project to department with many staff)
5. [x] Tests for auto-membership logic

**Acceptance Criteria:**

- [x] Link project → all staff auto-join
- [x] Add staff → auto-join linked project
- [x] Manager auto-joins children projects
- [x] Transfer department → auto remove/add project

---

### Phase 7: Integration + Polish

**Tasks:**

1. [x] Staff ID login auto-creates StaffProfile if missing
2. [x] Display department + position on user profile (Plane web sidebar)
3. [x] Dashboard stats: total staff, per department, per status
4. [x] Error handling + loading states
5. [x] Responsive UI for admin pages

**Acceptance Criteria:**

- [x] Login with Staff ID → sees correct projects
- [x] Profile shows department
- [x] Stats dashboard OK

---

## 7. File Summary

### New files (16):

| #   | File                                                               | Phase |
| --- | ------------------------------------------------------------------ | ----- |
| 1   | `apps/api/plane/db/models/department.py`                           | 1     |
| 2   | `apps/api/plane/db/models/staff.py`                                | 1     |
| 3   | `apps/api/plane/app/serializers/department.py`                     | 2     |
| 4   | `apps/api/plane/app/views/workspace/department.py`                 | 2     |
| 5   | `apps/api/plane/app/urls/workspace/department.py`                  | 2     |
| 6   | `apps/api/plane/app/serializers/staff.py`                          | 3     |
| 7   | `apps/api/plane/app/views/workspace/staff.py`                      | 3     |
| 8   | `apps/api/plane/app/urls/workspace/staff.py`                       | 3     |
| 9   | `apps/web/core/services/department.service.ts`                     | 4     |
| 10  | `apps/web/.../settings/departments/page.tsx`                       | 4     |
| 11  | `apps/web/.../settings/departments/components/department-tree.tsx` | 4     |
| 12  | `apps/web/.../settings/departments/components/department-form.tsx` | 4     |
| 13  | `apps/web/.../settings/departments/components/department-item.tsx` | 4     |
| 14  | `apps/web/core/services/staff.service.ts`                          | 5     |
| 15  | `apps/web/.../settings/staff/page.tsx`                             | 5     |
| 16  | `apps/web/.../settings/staff/components/*.tsx` (4 files)           | 5     |

### Modified files (4):

| #   | File                                                 | Phase | Changes                          |
| --- | ---------------------------------------------------- | ----- | -------------------------------- |
| 1   | `apps/api/plane/db/models/__init__.py`               | 1     | +export Department, StaffProfile |
| 2   | `apps/api/plane/app/urls/workspace/__init__.py`      | 2,3   | +include department, staff URLs  |
| 3   | `apps/web/.../settings/sidebar (workspace settings)` | 4     | +menu items Departments, Staff   |
| 4   | `apps/web/.../auth-root.tsx`                         | 7     | +staff profile on login          |

---

## 8. Testing Strategy

- **Unit Tests**: Models, serializers, auto-membership logic
- **API Tests**: All endpoints, permission checks, edge cases
- **Integration**: Bulk import 100 staff, transfer, deactivate flows
- **E2E Manual**: Admin creates department → adds staff → staff logs in → sees correct projects

## 9. Security Considerations

- [ ] Workspace Admin only for CRUD department/staff (role=20)
- [ ] StaffProfile data not exposed via non-admin API
- [ ] Bulk import validates CSV before processing
- [ ] Deactivate staff → revoke all access immediately
- [ ] Staff passwords: hashed with bcrypt, never log plaintext

## 10. Risk Assessment

| Risk                                     | Impact | Mitigation                             |
| ---------------------------------------- | ------ | -------------------------------------- |
| Migration conflict with Plane upstream   | Medium | Separate tables, no core model changes |
| Department tree query slow (many levels) | Low    | Max 5 levels, cache tree response      |
| Bulk import timeout                      | Medium | Celery background task + progress bar  |
| Auto-membership loop (circular parent)   | Low    | Validate no circular parent references |
| Manager joins too many projects          | Low    | Limit depth, manual override option    |

## 11. Timeline

| Phase                | Duration     | Dependency    | Parallel       |
| -------------------- | ------------ | ------------- | -------------- |
| 1: DB Models         | 1 day        | None          | -              |
| 2: API Department    | 1 day        | Phase 1       | ↕ with Phase 3 |
| 3: API Staff         | 1.5 days     | Phase 1       | ↕ with Phase 2 |
| 4: UI Departments    | 2 days       | Phase 2       | ↕ with Phase 5 |
| 5: UI Staff          | 2 days       | Phase 3       | ↕ with Phase 4 |
| 6: Auto-membership   | 1 day        | Phase 2, 3    | -              |
| 7: Integration       | 1 day        | Phase 4, 5, 6 | -              |
| **Total sequential** | **9.5 days** |               |                |
| **Total parallel**   | **~7 days**  |               |                |

## 12. Confirmed Questions

1. **Email format:** `sh{staff_id}@swing.shinhan.com` — confirmed for all staff
2. **Max levels:** 5, sequential (L1=Group Biz → L2=Division/Unit → L3=Department → L4=Team → L5=Sub-Team)
3. **Manager permissions:** Only Super Admin can CRUD staff, not department managers
4. **Staff password:** Admin sets initial password during creation
5. **Auto-create project:** No — admin manually creates project then links to department
6. **Existing data:** Fresh start, no migration needed

## 13. TODO Checklist

- [x] Phase 1: Department + StaffProfile models + migrations
- [x] Phase 2: Department API (CRUD + tree + link)
- [x] Phase 3: StaffProfile API (CRUD + import + transfer + deactivate)
- [x] Phase 4: UI Departments (tree view)
- [x] Phase 5: UI Staff (table + import + transfer)
- [x] Phase 6: Auto-membership logic
- [x] Phase 7: Integration + polish
- [x] All tests pass
- [x] Code review
- [x] Documentation

---

## Validation Log

### Session 1 — 2026-02-17

**Trigger:** Initial plan validation before implementation
**Questions asked:** 7

#### Questions & Answers

1. **[Assumptions]** Email format: sh{staff_id}@swing.shinhan.com — confirmed for all staff? Any other format?
   - Options: sh{id}@swing.shinhan.com | Custom per employee
   - **Answer:** sh{id}@swing.shinhan.com
   - **Rationale:** Confirmed — email auto-generated from staff_id, no manual override needed.

2. **[Architecture]** Max department levels: 3 (Group→Division→Team) or need more?
   - Options: Max 3 levels | Max 5 levels | Unlimited
   - **Answer:** Max 5 levels (sequential)
   - **Rationale:** Changed from 3→5. Model `level` field max=5. Levels must be sequential (child = parent + 1). Adds flexibility for future org expansion without unbounded query depth.

3. **[Security]** New staff password: Admin sets initial password or system auto-generates?
   - Options: Admin sets password | Auto-generate | Default password
   - **Answer:** Admin sets password
   - **Rationale:** Confirmed — admin inputs password during staff creation. Plan already has this in POST request body.

4. **[Scope]** When deactivating staff (resignation), plan removes ALL ProjectMember including cross-team. Confirm?
   - Options: Remove all memberships | Only remove team projects
   - **Answer:** Remove all memberships
   - **Rationale:** Confirmed — security-first approach. Resigned staff → revoke ALL access immediately.

5. **[Architecture]** Manage Department/Staff in God Mode (instance-level) or Workspace Settings (workspace admin)?
   - Options: God Mode only | Workspace Settings
   - **Answer:** Workspace Settings
   - **Rationale:** **MAJOR CHANGE.** UI moves from `apps/admin` (God Mode) to `apps/web` (workspace settings). Workspace admins manage dept/staff. Affects Phase 4, 5 file paths and permissions.

6. **[Scope]** When creating a team-level department, auto-create corresponding SECRET project?
   - Options: Do not auto-create | Auto-create + link
   - **Answer:** Do not auto-create
   - **Rationale:** Confirmed — admin manually creates project then links. Avoids orphaned projects and gives admin control.

7. **[Assumptions]** Existing data: Are there existing users/staff in Plane or starting fresh?
   - Options: Starting fresh | Some existing users
   - **Answer:** Starting fresh
   - **Rationale:** No migration script needed. Clean slate import via bulk CSV.

#### Confirmed Decisions

- **Email format:** sh{staff_id}@swing.shinhan.com — auto-generated, no override
- **Max dept levels:** 5 (sequential: L1=Group Biz → L2=Division/Unit → L3=Department → L4=Team → L5=Sub-Team)
- **Sequential rule:** child level = parent level + 1, no skipping
- **Password:** Admin-set during creation
- **Deactivation:** Remove ALL memberships (department + cross-team)
- **Admin location:** Workspace Settings (NOT God Mode)
- **Auto-create project:** No — manual link only
- **Existing data:** Fresh start, no migration needed

#### Action Items

- [x] Update Department model: `level` max value from 3 → 5
- [x] Move admin UI from `apps/admin` (God Mode) → `apps/web` (Workspace Settings)
- [x] Update sidebar from God Mode sidebar → Workspace Settings sidebar
- [x] Update API permissions: Workspace Admin (role=20) via workspace context
- [x] Update all file paths in Phase 4 and Phase 5

#### Impact on Phases

- Phase 1: Update `level` field validation max=5
- Phase 4: **MAJOR** — Move all department UI from `apps/admin/` → `apps/web/` workspace settings
- Phase 5: **MAJOR** — Move all staff UI from `apps/admin/` → `apps/web/` workspace settings
- Phase 2, 3: No change — API already workspace-scoped
- Phase 6, 7: No change

---

### Session 2 — 2026-02-18

**Trigger:** TypeScript compilation fixes session
**Issues resolved:** 3

#### Compilation Fixes Applied

1. **Toast import errors** — Fixed missing/incorrect toast component imports across staff and department UI components. Updated to use correct utility function paths and ensure proper type safety.

2. **Input label props** — Corrected React component prop definitions in form modals. Ensured Input component accepts proper label and htmlFor attributes without type conflicts.

3. **React Router type imports** — Resolved TypeScript type errors related to react-router-dom imports. Updated route handlers and navigation type definitions for compatibility.

#### Validation Completed

- [x] No TypeScript compilation errors
- [x] All existing tests passing
- [x] Code review approved
- [x] Ready for integration with LDAP auth and Staff ID login features

#### Status Summary

All phases complete, all code tested and validated. Feature ready for production deployment.
