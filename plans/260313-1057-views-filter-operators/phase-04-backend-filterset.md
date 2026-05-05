# Phase 04: Backend — FilterSet & Adapter

## Overview

Thêm các Django ORM lookups mới (`__gt`, `__lt`) vào `IssueFilterSet` để backend support
"greater than" và "less than" cho date fields. Đồng thời verify rằng `filter_backend.py`
đã hỗ trợ `{"not": {...}}` (đã có sẵn) cho various filter types.

**Priority**: Cao  
**Dependencies**: Phase 01 (types) — để biết operators nào cần support  
**Status**: ⏳ Pending

---

## Requirements

### Functional

**Date filters mới:**

- `start_date__gt` — Issue.start_date greater than date
- `start_date__lt` — Issue.start_date less than date
- `target_date__gt` — Issue.target_date greater than date
- `target_date__lt` — Issue.target_date less than date
- `created_at__gt` — Issue.created_at greater than datetime
- `created_at__lt` — Issue.created_at less than datetime
- `updated_at__gt` — Issue.updated_at greater than datetime
- `updated_at__lt` — Issue.updated_at less than datetime

**Negation (is not / is none of):**

- Backend đã hỗ trợ `{"not": {...}}` trong `filter_backend.py`
- Frontend việc gửi `{"not": {"state_id__exact": "uuid"}}` hoạt động với existing setup
- **KHÔNG cần thêm backend code mới** cho negation — chỉ cần frontend wrapper đúng

### Non-functional

- Các lookups mới phải được khai báo trong `filterset_class` để pass `_validate_fields` check
- Filter backend validate fields dựa trên `filterset_class.base_filters.keys()`

---

## Related Code Files

### Modify:

- `apps/api/plane/utils/filters/filterset.py` — thêm `__gt`/`__lt` fields vào `IssueFilterSet.Meta.fields`

### Reference (không modify):

- `apps/api/plane/utils/filters/filter_backend.py` — đã có `{"not": {...}}` support ✅
- `apps/api/plane/utils/filters/converters.py` — không cần thay đổi (legacy converter)

---

## Embedded Rules (Backend)

1. **`BaseViewSet` & `@allow_permission`** — Views đã có sẵn, không thêm views mới. Chỉ modify FilterSet.

2. **`IssueFilterSet.Meta.fields`** — Dict format: `{"field_name": ["lookup1", "lookup2"]}`. Django tự tạo filter `start_date`, `start_date__range`, `start_date__gt`, v.v.

3. **`filterset.py` validation** — `ComplexFilterBackend._validate_fields()` check `filterset_class.base_filters.keys()`. Nếu không khai báo trong Meta, filter sẽ bị reject với `"Filtering on field 'start_date__gt' is not allowed"`.

4. **`filter_backend.py` NOT wrapper** — Khi frontend gửi:

   ```json
   { "not": { "state_id__exact": "some-uuid" } }
   ```

   Backend xử lý `{"not": leaf}` → `~Q(state_id__exact="some-uuid")`.
   Không cần thêm backend logic.

5. **Date vs DateTime** — `start_date` và `target_date` là `DateField`. `created_at` và `updated_at` là `DateTimeField`. Cả hai đều hỗ trợ `__gt` và `__lt` Django lookups.

---

## Implementation Steps

### Step 1: Cập nhật `IssueFilterSet.Meta.fields` trong `filterset.py`

**File**: `apps/api/plane/utils/filters/filterset.py`

Thêm `"gt"` và `"lt"` lookups vào các date fields:

```python
class Meta:
    model = Issue
    fields = {
        "start_date": ["exact", "range", "gt", "lt"],
        "target_date": ["exact", "range", "gt", "lt"],
        "created_at": ["exact", "range", "gt", "lt"],
        "updated_at": ["exact", "range", "gt", "lt"],
        "is_draft": ["exact"],
        "priority": ["exact", "in"],
    }
```

Điều này tạo ra các filters sau trong `base_filters`:

- `start_date__gt`, `start_date__lt`
- `target_date__gt`, `target_date__lt`
- `created_at__gt`, `created_at__lt`
- `updated_at__gt`, `updated_at__lt`

### Step 2: Verify filter_backend NOT logic

Mở `filter_backend.py` và confirm `_evaluate_node` xử lý `"not"` key:

```python
# Đã có ở line 205-213:
if "not" in node:
    child = node["not"]
    if not isinstance(child, dict):
        return None
    child_q = self._evaluate_node(child, view, queryset)
    if child_q is None:
        return None
    return ~child_q
```

✅ Không cần thay đổi.

### Step 3: Verify `state_id__exact` filter

Confirm `state_id__exact` tồn tại trong `base_filters` (thông qua `BaseFilterSet.get_filters()` auto-generate):

```python
# BaseFilterSet.get_filters() tự thêm __exact versions:
for filter_name, filter_obj in filters.items():
    if hasattr(filter_obj, "lookup_expr") and filter_obj.lookup_expr == "exact":
        exact_field_name = f"{filter_name}__exact"
        # Automatically added
```

Vì `state_id = filters.UUIDFilter(field_name="state_id")` có `lookup_expr="exact"` mặc định, `state_id__exact` sẽ tự động được tạo. ✅

### Step 4: Test backend manually

Sau khi cập nhật, test với curl hoặc Python shell:

```python
# Kiểm tra filter gt hoạt động:
from plane.utils.filters.filterset import IssueFilterSet
print(list(IssueFilterSet.base_filters.keys()))
# Expected: [..., 'start_date__gt', 'start_date__lt', ...]
```

### Step 5: Verify View FilterSet được update đồng bộ

Nếu workspace views và project views có ViewFilterSet riêng, cần update cả đó. Grep:

```bash
grep -r "class.*FilterSet" apps/api/plane/ --include="*.py"
```

---

## Post-Phase Checklist

- [ ] `IssueFilterSet.Meta.fields` chứa `"gt"` và `"lt"` cho tất cả date fields
- [ ] `IssueFilterSet.base_filters` có keys: `start_date__gt`, `start_date__lt`, `target_date__gt`, `target_date__lt`, `created_at__gt`, `created_at__lt`, `updated_at__gt`, `updated_at__lt`
- [ ] `state_id__exact` tự động được generate bởi `BaseFilterSet.get_filters()`
- [ ] `filter_backend.py` xử lý `{"not": {...}}` — confirm không có regression
- [ ] Test API call với `{"start_date__gt": "2025-01-01"}` trả về đúng kết quả
- [ ] Test API call với `{"not": {"state_id__exact": "uuid"}}` hoạt động
- [ ] Không có Python syntax errors: `python -m py_compile apps/api/plane/utils/filters/filterset.py`

---

## Success Criteria

- API endpoint views filter hỗ trợ `start_date__gt`, `start_date__lt` trong query
- `{"not": {"state_id__in": ["uuid1", "uuid2"]}}` trả về issues KHÔNG có state đó
- `{"start_date__gt": "2025-03-01"}` trả về issues có start_date sau ngày 2025-03-01
- Backend không throw `"Filtering on field ... is not allowed"` với lookups mới

---

## Bonus: Payload format từ Frontend

Khi user chọn "is not" cho `state_id`, frontend sẽ gửi:

```json
{
  "not": {
    "state_id__exact": "some-uuid"
  }
}
```

Khi user chọn "is not any of" cho `assignee_id`, frontend sẽ gửi:

```json
{
  "not": {
    "assignee_id__in": ["uuid1", "uuid2"]
  }
}
```

Khi user chọn "after" cho `start_date`:

```json
{
  "start_date__gt": "2025-03-01"
}
```

Tất cả đều được backend xử lý đúng với implementation hiện tại!
