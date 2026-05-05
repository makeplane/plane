# Phase 01: Backend — Model Field + Migration + Serializer

## Overview

- **Priority**: Phải hoàn thành trước tất cả phase khác
- **Status**: TODO
- **Goal**: Thêm field `is_bank_wide = BooleanField(default=False)` vào model `Project`, tạo migration, xác nhận serializer tự động expose field này.

---

## Requirements

### Functional

- `Project.is_bank_wide` là `BooleanField`, mặc định `False`
- Field được expose qua `ProjectSerializer`, `ProjectListSerializer`, `ProjectDetailSerializer` (tất cả dùng `fields = "__all__"` → tự động)
- Không cần view/endpoint riêng — field được cập nhật qua endpoint update project hiện tại (`PATCH /api/workspaces/{slug}/projects/{projectId}/`)

### Non-functional

- Migration an toàn, không phá vỡ data hiện tại (default=False)

---

## Related Code Files

### Files to modify:

- `apps/api/plane/db/models/project.py` — thêm field vào class `Project`

### Files to create:

- `apps/api/plane/db/migrations/0143_project_is_bank_wide.py` — migration tự động generate

### Files to verify (không sửa):

- `apps/api/plane/app/serializers/project.py` — xác nhận `fields = "__all__"` (không cần sửa)

---

## Embedded Rules

### Rule 1: BaseModel — Chọn đúng base class

```
- BaseModel → workspace-level entities ✅ (Project kế thừa BaseModel)
- ProjectBaseModel → project-scoped entities
Project đã kế thừa BaseModel (workspace-level) → đúng, không cần thay đổi
```

### Rule 2: Migration an toàn

```python
# Luôn dùng default= khi thêm field mới vào bảng có data
is_bank_wide = models.BooleanField(default=False)
# Chạy: python manage.py makemigrations
# Kiểm tra file migration được tạo tự động
```

### Rule 3: Không mix API layers

```
- plane/app/ (internal, session auth) → serializers SET riêng
- plane/api/ (external, API key) → serializers SET riêng
Field mới tự động exposed tại cả hai layer vì dùng fields="__all__"
→ Không cần sửa gì thêm
```

### Rule 4: Không cần Activity Tracking cho trường hợp này

```
Activity tracking (model_activity.delay) chỉ bắt buộc khi mutation tạo
audit log riêng. Vì project update đã có activity tracking, field mới
sẽ được track tự động bởi ChangeTrackerMixin nếu cần.
→ KHÔNG cần tạo Celery task riêng cho phase này
```

---

## Implementation Steps

### Step 1: Thêm field vào `Project` model

Mở: `apps/api/plane/db/models/project.py`

Tìm block các BooleanField (khoảng line 93–100):

```python
    module_view = models.BooleanField(default=False)
    cycle_view = models.BooleanField(default=False)
    issue_views_view = models.BooleanField(default=False)
    page_view = models.BooleanField(default=True)
    intake_view = models.BooleanField(default=False)
    is_time_tracking_enabled = models.BooleanField(default=True)
    is_issue_type_enabled = models.BooleanField(default=False)
    guest_view_all_features = models.BooleanField(default=False)
```

Thêm sau `guest_view_all_features`:

```python
    is_bank_wide = models.BooleanField(default=False, verbose_name="Is Bank-wide Project")
```

**Apply Rule 2**: field với `default=False` → migration an toàn.

### Step 2: Generate Migration

```bash
cd apps/api
python manage.py makemigrations --name="project_is_bank_wide"
# ⚠️ NOTE: First restore deleted opinion migration: git restore apps/api/plane/db/migrations/0142_issueopinion.py
# Expected output: 0143_project_is_bank_wide.py <!-- Updated: Validation Session 1 -->
```

Xác nhận file `0143_project_is_bank_wide.py` được tạo với nội dung:

```python
migrations.AddField(
    model_name='project',
    name='is_bank_wide',
    field=models.BooleanField(default=False, verbose_name='Is Bank-wide Project'),
)
```

### Step 3: Apply Migration (local dev)

```bash
python manage.py migrate
```

### Step 4: Verify Serializer

Mở `apps/api/plane/app/serializers/project.py`, xác nhận:

- `ProjectSerializer` — `fields = "__all__"` ✅
- `ProjectListSerializer` — `fields = "__all__"` ✅
- `ProjectDetailSerializer` — `fields = "__all__"` ✅

**Không cần sửa** — `is_bank_wide` được expose tự động.

---

## Post-Phase Checklist

- [ ] Field `is_bank_wide` đã có trong `Project` model với `default=False`
- [ ] File migration `0143_project_is_bank_wide.py` đã được tạo thành công
- [ ] Migration đã apply thành công (`python manage.py migrate`)
- [ ] `ProjectSerializer` expose `is_bank_wide` (verify bằng API call hoặc Django shell)
- [ ] Không có breaking change với data/migration hiện tại

### Verification commands:

```bash
# Kiểm tra field tồn tại trong DB
python manage.py shell -c "from plane.db.models import Project; p = Project.objects.first(); print(p.is_bank_wide)"

# Kiểm tra serializer
python manage.py shell -c "
from plane.app.serializers.project import ProjectSerializer
print('is_bank_wide' in ProjectSerializer().fields)
"
```

---

## Success Criteria

- API `GET /api/workspaces/{slug}/projects/{id}/` trả về field `is_bank_wide: false`
- API `PATCH /api/workspaces/{slug}/projects/{id}/` với `{"is_bank_wide": true}` cập nhật thành công
- Migration không có lỗi khi apply
