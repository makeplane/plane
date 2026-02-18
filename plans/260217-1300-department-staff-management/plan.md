# Department & Staff Management — Shinhan Bank VN

**Date**: 2026-02-17
**Type**: Feature Implementation
**Status**: Validated & Completed (TS fixes applied 2026-02-18)
**Context Tokens**: Shinhan Bank VN, ~1000 NV, cấu trúc phòng ban đa cấp, AD Windows

## Executive Summary

Xây dựng hệ thống **phòng ban đa cấp** (Department) + **hồ sơ nhân viên** (StaffProfile) tích hợp vào Plane CE. Admin quản lý tổ chức qua God Mode. Nhân viên được **tự động gán** vào đúng Project (team workspace) dựa trên phòng ban. Trưởng phòng tự động xem được tất cả project của team dưới quyền.

**Nguyên tắc cốt lõi:** Department = metadata tổ chức (ai ở đâu). Project = phân quyền (ai thấy gì). Link giữa 2 cái = tự động gán.

## Context Links

- **Related Plans**: `plans/260216-2037-ldap-authentication-implementation/plan.md` (LDAP auth)
- **Related Plans**: `plans/260217-1200-staff-id-login-frontend/plan.md` (Staff ID login)
- **Dependencies**: Plane CE core (Workspace, Project, ProjectMember, User)
- **Reference Models**: `apps/api/plane/db/models/workspace.py`, `project.py`, `user.py`

---

## 1. Phương án kiến trúc: Hybrid (Phương án C)

### 1.1 Mapping tổ chức → Plane

| Tổ chức               | Plane concept                 | Chi tiết                                             |
| --------------------- | ----------------------------- | ---------------------------------------------------- |
| Shinhan Bank VN       | **Workspace**                 | 1 workspace duy nhất cho toàn ngân hàng              |
| Khối / Phòng / Team   | **Department** (NEW)          | Cây đa cấp, metadata tổ chức, quản lý trong God Mode |
| Team nội bộ           | **Project** (SECRET)          | Mỗi team = 1 project riêng, chỉ member thấy          |
| Dự án liên phòng      | **Project** (SECRET)          | Mời thủ công member từ nhiều team                    |
| Trưởng phòng overview | **Project** (SECRET)          | Auto-join project của các team dưới quyền            |
| Nhân viên             | **User + StaffProfile** (NEW) | Mã NV, chức vụ, phòng ban                            |
| Task                  | **Issue**                     | Trong project, chỉ member thấy                       |

### 1.2 Ví dụ cấu trúc thực tế

```
Workspace: "Shinhan Bank VN"
│
│  ═══ DEPARTMENT TREE (metadata, God Mode) ═══
│
│  RBG (Khối Bán lẻ) — GĐ Khối: Ông A
│    ├── RBG-CR (Phòng Tín dụng) — TP: Bà B
│    │     ├── RBG-CR-AP (Team Thẩm định) — TL: Anh C  →  link Project
│    │     └── RBG-CR-CO (Team Thu hồi)   — TL: Chị D  →  link Project
│    └── RBG-TX (Phòng Giao dịch) — TP: Ông E
│          ├── RBG-TX-01 (Team GD1)       — TL: Anh F  →  link Project
│          └── RBG-TX-02 (Team GD2)       — TL: Chị G  →  link Project
│
│  ITG (Khối CNTT) — GĐ Khối: Ông H
│    ├── ITG-DEV (Phòng Phát triển) — TP: Ông I
│    │     ├── ITG-DEV-BE (Team Backend)  — TL: Anh J  →  link Project
│    │     └── ITG-DEV-FE (Team Frontend) — TL: Chị K  →  link Project
│    └── ITG-OPS (Phòng Vận hành) — TP: Ông L
│          └── ITG-OPS-IF (Team Infra)    — TL: Anh M  →  link Project
│
│  ═══ PROJECTS (phân quyền, workspace level) ═══
│
│  📁 [Thẩm định] Nội bộ       (SECRET) ← linked RBG-CR-AP
│  📁 [Thu hồi nợ] Nội bộ      (SECRET) ← linked RBG-CR-CO
│  📁 [GD1] Nội bộ             (SECRET) ← linked RBG-TX-01
│  📁 [Backend] Nội bộ         (SECRET) ← linked ITG-DEV-BE
│  📁 [Frontend] Nội bộ        (SECRET) ← linked ITG-DEV-FE
│  📁 [Infra] Nội bộ           (SECRET) ← linked ITG-OPS-IF
│  🚀 Core Banking Migration   (SECRET) ← cross-team, mời thủ công
│  📊 [Khối CNTT] Overview     (SECRET) ← GĐ Khối + team leads
```

### 1.3 Ai thấy gì?

**Nhân viên (Dev) — Nguyễn Dương, Team Backend:**

```
Thấy:  ✅ [Backend] Nội bộ (auto từ department)
       ✅ Core Banking Migration (được mời thủ công)
Không: ❌ [Frontend], [Thẩm định], [Thu hồi nợ]...
```

**Team Leader — Anh J, Team Backend:**

```
Thấy:  ✅ [Backend] Nội bộ (Project Admin — leader)
       ✅ Core Banking Migration (được mời)
Quyền: Tạo/sửa/xóa task, quản lý members, cấu hình project
```

**Trưởng phòng — Ông I, Phòng Phát triển:**

```
Thấy:  ✅ [Backend] Nội bộ (auto-join — trưởng phòng cha)
       ✅ [Frontend] Nội bộ (auto-join — trưởng phòng cha)
       ✅ [Phòng PT] Overview (project riêng)
→ Tự động join TẤT CẢ project của team dưới quyền
```

**Giám đốc Khối — Ông H, Khối CNTT:**

```
Thấy:  ✅ [Backend], [Frontend], [Infra] Nội bộ (auto-join tất cả)
       ✅ [Khối CNTT] Overview
→ Thấy TẤT CẢ project trong toàn khối
```

### 1.4 Chuyển phòng ban

```
Dương chuyển: Team Backend → Team Frontend
  │
  Tự động:
  ├── Remove khỏi "[Backend] Nội bộ"
  ├── Thêm vào "[Frontend] Nội bộ"
  └── Dự án cross-team (Core Banking) KHÔNG bị ảnh hưởng
```

### 1.5 Dự án liên phòng (cross-team)

```
Project "Core Banking Migration" (SECRET)
  → Không link department nào
  → Admin/PM tự mời người từ nhiều team
  → Khi NV chuyển phòng, membership dự án này giữ nguyên
```

---

## 2. Data Models

### 2.1 Department (Phòng ban — cây đa cấp)

```python
# File: apps/api/plane/db/models/department.py

class Department(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="departments")

    # Thông tin cơ bản
    name = models.CharField(max_length=255)            # "Team Backend"
    code = models.CharField(max_length=20)              # "ITG-DEV-BE"
    short_name = models.CharField(max_length=10)       # "BE", "FE", "INFRA" — viết hoa, min 2 ký tự, dùng làm prefix task ID
    dept_code = models.CharField(max_length=4)         # "0947", "7128" — đúng 4 chữ số
    description = models.TextField(blank=True, default="")

    # Cây đa cấp (parent=NULL → top level)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="children")
    level = models.PositiveSmallIntegerField(default=1, validators=[MaxValueValidator(5)]) # 1=Khối, 2=Phòng, 3=Team, 4-5=Sub-teams
    <!-- Updated: Validation Session 1 - max level changed from 3 to 5 -->

    # Trưởng đơn vị
    manager = models.ForeignKey("db.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="managed_departments")

    # Link → Project (team project tương ứng)
    linked_project = models.ForeignKey("db.Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="linked_department")

    # Sắp xếp
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
            raise ValidationError("short_name phải viết hoa, tối thiểu 2 ký tự")
        if self.dept_code and (len(self.dept_code) != 4 or not self.dept_code.isdigit()):
            raise ValidationError("dept_code phải đúng 4 chữ số")
```

**Ví dụ data:**

| code       | short_name | dept_code | name             | parent  | level | manager | linked_project         |
| ---------- | ---------- | --------- | ---------------- | ------- | ----- | ------- | ---------------------- |
| RBG        | RBG        | 0100      | Khối Bán lẻ      | NULL    | 1     | Ông A   | NULL                   |
| RBG-CR     | CR         | 0110      | Phòng Tín dụng   | RBG     | 2     | Bà B    | NULL                   |
| RBG-CR-AP  | AP         | 0111      | Team Thẩm định   | RBG-CR  | 3     | Anh C   | → "[Thẩm định] Nội bộ" |
| ITG        | ITG        | 0900      | Khối CNTT        | NULL    | 1     | Ông H   | NULL                   |
| ITG-DEV    | DEV        | 0910      | Phòng Phát triển | ITG     | 2     | Ông I   | NULL                   |
| ITG-DEV-BE | BE         | 0911      | Team Backend     | ITG-DEV | 3     | Anh J   | → "[Backend] Nội bộ"   |

**Ví dụ task ID prefix:** Task trong Team Backend → `BE-123`, Team Thẩm định → `AP-456`

**Quy tắc:**

- Chỉ **cấp thấp nhất** (team) mới link project — vì team là đơn vị làm việc
- Khối/Phòng **không link project** — trưởng phòng auto-join qua logic children

### 2.2 StaffProfile (Hồ sơ nhân viên)

```python
# File: apps/api/plane/db/models/staff.py

class EmploymentStatus(models.TextChoices):
    ACTIVE = "active", "Đang làm việc"
    PROBATION = "probation", "Thử việc"
    RESIGNED = "resigned", "Đã nghỉ"
    SUSPENDED = "suspended", "Tạm ngưng"
    TRANSFERRED = "transferred", "Chuyển công tác"

class StaffProfile(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="staff_profiles")
    user = models.OneToOneField("db.User", on_delete=models.CASCADE, related_name="staff_profile")

    # Mã nhân viên
    staff_id = models.CharField(max_length=8, db_index=True)  # "18506320"

    # Phòng ban
    department = models.ForeignKey("db.Department", on_delete=models.SET_NULL, null=True, blank=True, related_name="staff_members")

    # Công việc
    position = models.CharField(max_length=255, blank=True, default="")    # "Senior Developer"
    job_grade = models.CharField(max_length=50, blank=True, default="")     # "Senior"

    # Liên lạc
    phone = models.CharField(max_length=20, blank=True, default="")

    # Thời gian
    date_of_joining = models.DateField(null=True, blank=True)
    date_of_leaving = models.DateField(null=True, blank=True)

    # Trạng thái
    employment_status = models.CharField(max_length=20, choices=EmploymentStatus.choices, default=EmploymentStatus.ACTIVE)

    # Quyền đặc biệt
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

### 2.3 Quan hệ tổng thể

```
Workspace (1)
  │
  ├──── Department (N, tree)
  │       │ parent → self (cây đa cấp)
  │       │ manager → User
  │       │ linked_project → Project (optional, chỉ team level)
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
  └──── User (N, Plane core — KHÔNG SỬA)
```

---

## 3. Auto-membership Logic

### 3.1 Khi thêm nhân viên vào department

```python
def on_staff_created(staff_profile):
    dept = staff_profile.department
    user = staff_profile.user

    # 1. Tạo WorkspaceMember nếu chưa có
    WorkspaceMember.objects.get_or_create(
        workspace=dept.workspace, member=user,
        defaults={"role": 15}  # Member
    )

    # 2. Nếu department có linked_project → add ProjectMember
    if dept.linked_project:
        role = 20 if staff_profile.is_department_manager else 15
        ProjectMember.objects.get_or_create(
            project=dept.linked_project, member=user,
            defaults={"role": role}
        )

    # 3. Nếu là trưởng đơn vị (is_department_manager) → join TẤT CẢ children projects
    if staff_profile.is_department_manager:
        for child_dept in get_all_descendants(dept):
            if child_dept.linked_project:
                ProjectMember.objects.get_or_create(
                    project=child_dept.linked_project, member=user,
                    defaults={"role": 15}  # Xem được, không phải Admin
                )
```

### 3.2 Khi chuyển phòng ban

```python
def on_staff_transferred(staff_profile, old_dept, new_dept):
    user = staff_profile.user

    # 1. Remove khỏi project CŨ (chỉ linked project, không ảnh hưởng cross-team)
    if old_dept.linked_project:
        ProjectMember.objects.filter(
            project=old_dept.linked_project, member=user
        ).delete()

    # 2. Add vào project MỚI
    if new_dept.linked_project:
        ProjectMember.objects.get_or_create(
            project=new_dept.linked_project, member=user,
            defaults={"role": 15}
        )

    # 3. Nếu là manager → update children projects tương ứng
```

### 3.3 Khi link department ↔ project

```python
def on_department_linked_project(dept, project):
    # Add TẤT CẢ nhân viên trong department vào project
    for staff in dept.staff_members.filter(employment_status="active"):
        role = 20 if staff.is_department_manager else 15
        ProjectMember.objects.get_or_create(
            project=project, member=staff.user,
            defaults={"role": role}
        )

    # Add managers của parent departments (trưởng phòng cấp trên)
    parent = dept.parent
    while parent:
        if parent.manager:
            ProjectMember.objects.get_or_create(
                project=project, member=parent.manager,
                defaults={"role": 15}
            )
        parent = parent.parent
```

### 3.4 Khi deactivate nhân viên (nghỉ việc)

```python
def on_staff_deactivated(staff_profile):
    user = staff_profile.user

    # 1. Remove TẤT CẢ ProjectMember (cả team + cross-team)
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

| Method | Path                    | Mô tả                                         | Permission       |
| ------ | ----------------------- | --------------------------------------------- | ---------------- |
| GET    | `/`                     | List flat (filter: parent, level, is_active)  | Workspace Member |
| GET    | `/tree/`                | Full tree nested JSON                         | Workspace Member |
| GET    | `/<id>/`                | Chi tiết department                           | Workspace Member |
| POST   | `/`                     | Tạo department                                | Workspace Admin  |
| PATCH  | `/<id>/`                | Sửa department                                | Workspace Admin  |
| DELETE | `/<id>/`                | Soft delete department                        | Workspace Admin  |
| GET    | `/<id>/staff/`          | List NV trong department                      | Workspace Member |
| POST   | `/<id>/link-project/`   | Link department ↔ project (auto-sync members) | Workspace Admin  |
| DELETE | `/<id>/unlink-project/` | Unlink (không remove members)                 | Workspace Admin  |

**GET `/tree/` response:**

```json
[
  {
    "id": "uuid-1",
    "code": "ITG",
    "short_name": "ITG",
    "dept_code": "0900",
    "name": "Khối CNTT",
    "level": 1,
    "manager": { "id": "...", "display_name": "Ông H", "staff_id": "10000008" },
    "linked_project": null,
    "staff_count": 30,
    "children": [
      {
        "id": "uuid-2",
        "code": "ITG-DEV",
        "short_name": "DEV",
        "dept_code": "0910",
        "name": "Phòng Phát triển",
        "level": 2,
        "manager": { "id": "...", "display_name": "Ông I" },
        "staff_count": 15,
        "children": [
          {
            "id": "uuid-3",
            "code": "ITG-DEV-BE",
            "short_name": "BE",
            "dept_code": "0911",
            "name": "Team Backend",
            "level": 3,
            "manager": { "id": "...", "display_name": "Anh J" },
            "linked_project": { "id": "...", "name": "[Backend] Nội bộ", "identifier": "BE" },
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

| Method | Path                | Mô tả                                                 | Permission      |
| ------ | ------------------- | ----------------------------------------------------- | --------------- |
| GET    | `/`                 | List NV (filter: department, status, search)          | Workspace Admin |
| GET    | `/<id>/`            | Chi tiết NV                                           | Workspace Admin |
| POST   | `/`                 | Tạo NV (auto: User + WorkspaceMember + ProjectMember) | Workspace Admin |
| PATCH  | `/<id>/`            | Sửa NV                                                | Workspace Admin |
| DELETE | `/<id>/`            | Soft delete                                           | Workspace Admin |
| POST   | `/<id>/transfer/`   | Chuyển phòng ban (auto-update project membership)     | Workspace Admin |
| POST   | `/<id>/deactivate/` | Nghỉ việc (deactivate user + remove memberships)      | Workspace Admin |
| POST   | `/bulk-import/`     | Import từ CSV/JSON                                    | Workspace Admin |
| GET    | `/export/`          | Export CSV                                            | Workspace Admin |
| GET    | `/stats/`           | Thống kê (tổng, theo phòng, theo status)              | Workspace Admin |

**POST `/` — Tạo nhân viên:**

```json
// Request
{
  "staff_id": "18506320",
  "first_name": "Dương",
  "last_name": "Nguyễn",
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
// 2. Create StaffProfile(staff_id=18506320, department=Team Backend)
// 3. Create WorkspaceMember(role=Member)
// 4. Team Backend linked → "[Backend] Nội bộ"
//    → Create ProjectMember(project="[Backend] Nội bộ", role=Member)
```

**POST `/<id>/transfer/` — Chuyển phòng:**

```json
// Request
{ "department_id": "uuid-of-frontend-team" }

// Auto-actions:
// 1. Remove ProjectMember từ "[Backend] Nội bộ"
// 2. Update department → Team Frontend
// 3. Add ProjectMember vào "[Frontend] Nội bộ"
// 4. Cross-team projects KHÔNG ảnh hưởng
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
// 18506320,Nguyễn,Dương,ITG-DEV-BE,Senior Developer,Senior,0901234567,2020-01-15
// 10000002,Trần,Minh,ITG-DEV-FE,Developer,Junior,0912345678,2023-06-01
```

---

## 5. Admin Frontend (Workspace Settings)

<!-- Updated: Validation Session 1 - Moved from God Mode to Workspace Settings -->

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
├── 🏢 Phòng ban          ← NEW
└── 👤 Nhân viên          ← NEW
```

### 5.2 Trang Phòng ban (`/<workspaceSlug>/settings/departments/`)

```
┌────────────────────────────────────────────────────────────┐
│  🏢 Quản lý Phòng ban                       [+ Thêm mới] │
├────────────────────────────────────────────────────────────┤
│  🔍 Tìm kiếm...                                           │
│                                                            │
│  ▼ RBG — Khối Ngân hàng Bán lẻ             (45 NV) [✏️🗑] │
│    ▼ RBG-CR — Phòng Tín dụng               (20 NV) [✏️🗑] │
│      ● RBG-CR-AP — Team Thẩm định           (8 NV) [✏️🗑] │
│        🔗 Project: [Thẩm định] Nội bộ                      │
│        👤 Leader: Nguyễn Văn C                              │
│      ● RBG-CR-CO — Team Thu hồi nợ          (5 NV) [✏️🗑] │
│    ▶ RBG-TX — Phòng Giao dịch              (25 NV)        │
│                                                            │
│  ▼ ITG — Khối CNTT                          (30 NV) [✏️🗑] │
│    ▼ ITG-DEV — Phòng Phát triển            (15 NV) [✏️🗑] │
│      ● ITG-DEV-BE — Team Backend             (6 NV) [✏️🗑] │
│        🔗 Project: [Backend] Nội bộ                         │
│      ● ITG-DEV-FE — Team Frontend            (5 NV) [✏️🗑] │
│    ▶ ITG-OPS — Phòng Vận hành              (10 NV)        │
└────────────────────────────────────────────────────────────┘
```

### 5.3 Trang Nhân viên (`/<workspaceSlug>/settings/staff/`)

```
┌───────────────────────────────────────────────────────────────────┐
│  👤 Quản lý Nhân viên               [📥 Import CSV] [+ Thêm mới] │
├───────────────────────────────────────────────────────────────────┤
│  🔍 Tìm...   Phòng ban: [Tất cả ▼]   Trạng thái: [Tất cả ▼]   │
│                                                                   │
│  ┌────────┬──────────────┬──────────────┬───────────┬─────┬────┐ │
│  │ Mã NV  │ Họ tên       │ Phòng ban    │ Chức vụ   │ TT  │    │ │
│  ├────────┼──────────────┼──────────────┼───────────┼─────┼────┤ │
│  │18506320│ Nguyễn Dương │ Team Backend │ Sr. Dev   │ 🟢  │✏️🗑│ │
│  │10000002│ Trần Minh    │ Team Frontend│ Dev       │ 🟢  │✏️🗑│ │
│  │10000003│ Lê Hoa       │ Team Thẩm định│ NV      │ 🟡  │✏️🗑│ │
│  └────────┴──────────────┴──────────────┴───────────┴─────┴────┘ │
│                                                                   │
│  📊 Tổng: 100 │ 🟢 Active: 95 │ 🟡 Thử việc: 3 │ 🔴 Nghỉ: 2  │
└───────────────────────────────────────────────────────────────────┘
```

---

## 6. Implementation Phases

### Phase 1: DB Models + Migrations (Est: 1 ngày)

**Tasks:**

1. [x] Tạo Department model - file: `apps/api/plane/db/models/department.py`
2. [x] Tạo StaffProfile model - file: `apps/api/plane/db/models/staff.py`
3. [x] Export models - file: `apps/api/plane/db/models/__init__.py`
4. [x] Chạy `makemigrations` + `migrate`
5. [x] Unit test models

**Acceptance Criteria:**

- [x] Migration thành công, không conflict với Plane core
- [x] Department tree: parent/children đúng
- [x] StaffProfile 1:1 với User
- [x] Unique constraints: staff_id + workspace, code + workspace

---

### Phase 2: Backend API — Department (Est: 1 ngày)

**Tasks:**

1. [x] DepartmentSerializer - file: `apps/api/plane/app/serializers/department.py`
2. [x] DepartmentTreeSerializer (nested) - cùng file
3. [x] DepartmentViewSet (CRUD + tree + link) - file: `apps/api/plane/app/views/workspace/department.py`
4. [x] URL routing - file: `apps/api/plane/app/urls/workspace/department.py`
5. [x] Include URLs - file: `apps/api/plane/app/urls/workspace/__init__.py`
6. [x] Permission: Workspace Admin only (role=20) cho write
7. [x] API tests

**Acceptance Criteria:**

- [x] GET `/tree/` trả nested JSON đúng
- [x] CRUD hoạt động
- [x] Link/unlink project + auto-sync members
- [x] Permission denied cho non-admin

---

### Phase 3: Backend API — StaffProfile (Est: 1.5 ngày)

**Tasks:**

1. [x] StaffProfileSerializer - file: `apps/api/plane/app/serializers/staff.py`
2. [x] StaffProfileViewSet - file: `apps/api/plane/app/views/workspace/staff.py`
   - CRUD + transfer + deactivate + bulk-import + export + stats
3. [x] Auto-create logic: User + WorkspaceMember + ProjectMember
4. [x] Transfer logic: remove old project, add new project
5. [x] Deactivate logic: remove memberships, deactivate user
6. [x] Bulk import: parse CSV, validate, batch create
7. [x] Export: CSV response
8. [x] URL routing - file: `apps/api/plane/app/urls/workspace/staff.py`
9. [x] API tests

**Acceptance Criteria:**

- [x] POST tạo NV → auto-create User + project membership
- [x] Transfer → auto-update memberships
- [x] Bulk import 100 NV OK
- [x] Deactivate → user disabled, removed from projects

---

### Phase 4: Workspace Settings UI — Phòng ban (Est: 2 ngày)

<!-- Updated: Validation Session 1 - Moved from God Mode (apps/admin) to Workspace Settings (apps/web) -->

**Tasks:**

1. [x] Department service - file: `apps/web/core/services/department.service.ts`
2. [x] Department tree component - file: `apps/web/app/[workspaceSlug]/(projects)/settings/departments/components/department-tree.tsx`
3. [x] Department form modal - file: `apps/web/app/[workspaceSlug]/(projects)/settings/departments/components/department-form.tsx`
4. [x] Department tree item - file: `apps/web/app/[workspaceSlug]/(projects)/settings/departments/components/department-item.tsx`
5. [x] Department page - file: `apps/web/app/[workspaceSlug]/(projects)/settings/departments/page.tsx`
6. [x] Sidebar menu item - file: workspace settings sidebar component

**Acceptance Criteria:**

- [x] Tree view collapsible
- [x] CRUD phòng ban qua UI
- [x] Link project selector
- [x] Hiện staff count per department

---

### Phase 5: Workspace Settings UI — Nhân viên (Est: 2 ngày)

<!-- Updated: Validation Session 1 - Moved from God Mode (apps/admin) to Workspace Settings (apps/web) -->

**Tasks:**

1. [x] Staff service - file: `apps/web/core/services/staff.service.ts`
2. [x] Staff table component - file: `apps/web/app/[workspaceSlug]/(projects)/settings/staff/components/staff-table.tsx`
3. [x] Staff form modal - file: `apps/web/app/[workspaceSlug]/(projects)/settings/staff/components/staff-form.tsx`
4. [x] Staff filter component - file: `apps/web/app/[workspaceSlug]/(projects)/settings/staff/components/staff-filter.tsx`
5. [x] CSV import dialog - file: `apps/web/app/[workspaceSlug]/(projects)/settings/staff/components/staff-import.tsx`
6. [x] Staff page - file: `apps/web/app/[workspaceSlug]/(projects)/settings/staff/page.tsx`
7. [x] Sidebar menu item

**Acceptance Criteria:**

- [x] Table với pagination, sort, search
- [x] CRUD NV → auto project membership
- [x] Import CSV OK
- [x] Export CSV OK
- [x] Transfer phòng ban dialog

---

### Phase 6: Auto-membership + Manager Access (Est: 1 ngày)

**Tasks:**

1. [x] Django signal: StaffProfile post_save → sync project membership
2. [x] Django signal: Department.linked_project change → sync all members
3. [x] Manager auto-join: trưởng phòng join children linked projects
4. [x] Celery task: bulk sync (khi link project vào department có nhiều NV)
5. [x] Tests cho auto-membership logic

**Acceptance Criteria:**

- [x] Link project → tất cả NV auto join
- [x] Thêm NV → auto join linked project
- [x] Trưởng phòng auto join children projects
- [x] Chuyển phòng → auto remove/add project

---

### Phase 7: Integration + Polish (Est: 1 ngày)

**Tasks:**

1. [x] Staff ID login tự tạo StaffProfile nếu chưa có
2. [x] Hiện phòng ban + chức vụ trên user profile (Plane web sidebar)
3. [x] Dashboard stats: tổng NV, per department, per status
4. [x] Error handling + loading states
5. [x] Responsive UI cho admin pages

**Acceptance Criteria:**

- [x] Login Mã NV → thấy đúng project
- [x] Profile hiện phòng ban
- [x] Stats dashboard OK

---

## 7. File Summary

### Files mới (16):

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

### Files sửa (4):

| #   | File                                                 | Phase | Thay đổi                         |
| --- | ---------------------------------------------------- | ----- | -------------------------------- |
| 1   | `apps/api/plane/db/models/__init__.py`               | 1     | +export Department, StaffProfile |
| 2   | `apps/api/plane/app/urls/workspace/__init__.py`      | 2,3   | +include department, staff URLs  |
| 3   | `apps/web/.../settings/sidebar (workspace settings)` | 4     | +menu items Phòng ban, Nhân viên |
| 4   | `apps/web/.../auth-root.tsx`                         | 7     | +staff profile on login          |

---

## 8. Testing Strategy

- **Unit Tests**: Models, serializers, auto-membership logic
- **API Tests**: All endpoints, permission checks, edge cases
- **Integration**: Bulk import 100 NV, transfer, deactivate flows
- **E2E Manual**: Admin tạo phòng ban → thêm NV → NV login → thấy đúng project

## 9. Security Considerations

- [ ] Workspace Admin only cho CRUD department/staff (role=20)
- [ ] StaffProfile data không expose ra non-admin API
- [ ] Bulk import validate CSV trước khi process
- [ ] Deactivate NV → revoke tất cả access ngay lập tức
- [ ] Password NV: hash bcrypt, không log plaintext

## 10. Risk Assessment

| Risk                                   | Impact     | Mitigation                             |
| -------------------------------------- | ---------- | -------------------------------------- |
| Migration conflict Plane upstream      | Trung bình | Separate tables, không sửa core models |
| Department tree query chậm (nhiều cấp) | Thấp       | Max 5 levels, cache tree response      |
| Bulk import timeout                    | Trung bình | Celery background task + progress bar  |
| Auto-membership loop (mutual parent)   | Thấp       | Validate no circular parent references |
| Manager join quá nhiều project         | Thấp       | Limit depth, manual override option    |

## 11. Timeline

| Phase                 | Thời gian    | Dependency    | Song song      |
| --------------------- | ------------ | ------------- | -------------- |
| 1: DB Models          | 1 ngày       | Không         | -              |
| 2: API Department     | 1 ngày       | Phase 1       | ↕ cùng Phase 3 |
| 3: API Staff          | 1.5 ngày     | Phase 1       | ↕ cùng Phase 2 |
| 4: Admin UI Phòng ban | 2 ngày       | Phase 2       | ↕ cùng Phase 5 |
| 5: Admin UI Nhân viên | 2 ngày       | Phase 3       | ↕ cùng Phase 4 |
| 6: Auto-membership    | 1 ngày       | Phase 2, 3    | -              |
| 7: Integration        | 1 ngày       | Phase 4, 5, 6 | -              |
| **Tổng sequential**   | **9.5 ngày** |               |                |
| **Tổng parallel**     | **~7 ngày**  |               |                |

## 12. Câu hỏi cần confirm

1. **Email format:** `sh{mã NV}@swing.shinhan.com` — đúng cho tất cả NV?
2. **Số cấp tối đa:** 3 (Khối→Phòng→Team) hay cần nhiều hơn?
3. **Trưởng phòng:** Có quyền CRUD NV trong phòng mình qua God Mode hay chỉ Super Admin?
4. **Password NV:** Admin đặt password ban đầu hay gửi email invite?
5. **Tạo department:** Có tự tạo project SECRET tương ứng luôn không?
6. **Dữ liệu hiện có:** Đã có NV nào trong Plane chưa hay bắt đầu từ đầu?

## 13. TODO Checklist

- [x] Phase 1: Department + StaffProfile models + migrations
- [x] Phase 2: Department API (CRUD + tree + link)
- [x] Phase 3: StaffProfile API (CRUD + import + transfer + deactivate)
- [x] Phase 4: Admin UI Phòng ban (tree view)
- [x] Phase 5: Admin UI Nhân viên (table + import + transfer)
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

1. **[Assumptions]** Email format: sh{mã NV}@swing.shinhan.com — đúng cho tất cả NV? Hay có format khác?
   - Options: sh{id}@swing.shinhan.com | Tùy chỉnh theo NV
   - **Answer:** sh{id}@swing.shinhan.com
   - **Rationale:** Confirmed — email auto-generated from staff_id, no manual override needed.

2. **[Architecture]** Số cấp phòng ban tối đa: 3 (Khối→Phòng→Team) hay cần hỗ trợ nhiều hơn?
   - Options: Tối đa 3 cấp | Tối đa 5 cấp | Không giới hạn
   - **Answer:** Tối đa 5 cấp
   - **Rationale:** Changed from 3→5. Model `level` field max=5. Adds flexibility for sub-teams or future org expansion without unbounded query depth.

3. **[Security]** Password nhân viên mới: Admin đặt password ban đầu hay hệ thống tự generate?
   - Options: Admin đặt password | Auto-generate | Default password
   - **Answer:** Admin đặt password
   - **Rationale:** Confirmed — admin inputs password during staff creation. Plan already has this in POST request body.

4. **[Scope]** Khi deactivate NV (nghỉ việc), plan xóa TẤT CẢ ProjectMember kể cả cross-team. Xác nhận đúng?
   - Options: Xóa tất cả membership | Chỉ xóa team project
   - **Answer:** Xóa tất cả membership
   - **Rationale:** Confirmed — security-first approach. NV nghỉ việc → revoke ALL access immediately.

5. **[Architecture]** Quản lý Department/Staff ở God Mode (instance-level) hay Workspace Settings (workspace admin)?
   - Options: God Mode only | Workspace Settings
   - **Answer:** Workspace Settings
   - **Rationale:** **MAJOR CHANGE.** UI moves from `apps/admin` (God Mode) to `apps/web` (workspace settings). Workspace admins manage dept/staff. Affects Phase 4, 5 file paths and permissions.

6. **[Scope]** Khi tạo department cấp team, có tự động tạo project SECRET tương ứng luôn không?
   - Options: Không tự tạo | Tự động tạo + link
   - **Answer:** Không tự tạo
   - **Rationale:** Confirmed — admin manually creates project then links. Avoids orphaned projects and gives admin control.

7. **[Assumptions]** Dữ liệu hiện tại: Đã có user/NV nào trong Plane chưa hay bắt đầu từ đầu?
   - Options: Bắt đầu từ đầu | Đã có một số user
   - **Answer:** Bắt đầu từ đầu
   - **Rationale:** No migration script needed. Clean slate import via bulk CSV.

#### Confirmed Decisions

- **Email format:** sh{staff_id}@swing.shinhan.com — auto-generated, no override
- **Max dept levels:** 5 (changed from 3)
- **Password:** Admin-set during creation
- **Deactivation:** Remove ALL memberships (team + cross-team)
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
