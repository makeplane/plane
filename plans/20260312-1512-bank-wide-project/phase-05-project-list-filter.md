# Phase 05: Workspace Project List — "Bank-wide" Filter

## Overview

- **Priority**: Low — phụ thuộc Phase 01 (field must exist in API response)
- **Status**: TODO
- **Goal**: Thêm filter "Bank-wide" vào workspace project list để user có thể lọc chỉ hiện bank-wide projects

---

## Requirements

### Functional

- Project list có thêm filter option "Bank-wide only" (hoặc toggle)
- Khi bật filter: chỉ hiển thị projects có `is_bank_wide: true`
- Filter state là ephemeral (không persist) hoặc persist theo pattern hiện tại

### Non-functional

- Follow pattern filter hiện có trong project list (grep existing UI before implementing)
- Filter là **ephemeral** — không persist qua URL hoặc localStorage <!-- Updated: Validation Session 3 - ephemeral confirmed -->
- i18n key: `bank_wide_project.filter.label`

---

## Related Code Files

### Files to investigate first:

- Grep existing project list filter implementation:
  ```bash
  grep -r "project.*filter\|filter.*project" apps/web/ce/components/projects/ --include="*.tsx" -l
  grep -r "projectFilter\|project_filter" apps/web/ce/ --include="*.ts" -l
  ```
- Find where workspace project list renders and how existing filters are applied

### Files to modify (TBD after investigation):

- Project list filter component (CE)
- Project list hook/store (filter logic)

---

## Implementation Steps

### Step 1: Investigate existing filter pattern

Grep để hiểu cấu trúc filter hiện tại trước khi implement:

```bash
# Tìm project list components
grep -r "projectsList\|projects-list\|ProjectList" apps/web/ce/components/ --include="*.tsx" -l
# Tìm filter logic
grep -r "displayFilters\|project.*filter" apps/web/ce/store/ --include="*.ts" -l
```

### Step 2: Extend filter type (nếu có typed filter object)

Nếu có `TProjectDisplayFilters` hoặc tương đương, thêm:

```typescript
is_bank_wide?: boolean;
```

### Step 3: Add filter UI

Thêm toggle/checkbox "Bank-wide only" vào project list filter panel, follow exact pattern của existing filters.

### Step 4: Add filter logic

Trong store hoặc component, filter projects:

```typescript
const filteredProjects = projects.filter((p) => (displayFilters.is_bank_wide ? p.is_bank_wide : true));
```

### Step 5: Add i18n key

Thêm vào Phase 04 i18n files:

```
"bank_wide_project.filter.label": "Bank-wide only"  // en
"bank_wide_project.filter.label": "전행 프로젝트만"  // ko
"bank_wide_project.filter.label": "Chỉ dự án toàn ngân hàng"  // vi
```

---

## Post-Phase Checklist

- [ ] Filter "Bank-wide only" xuất hiện trong project list filter UI
- [ ] Bật filter → chỉ hiện projects có `is_bank_wide: true`
- [ ] Tắt filter → hiện tất cả projects
- [ ] i18n key đúng, không hardcode
- [ ] Follow exact pattern của existing project filters

---

## Success Criteria

- User có thể lọc workspace project list để chỉ xem bank-wide projects
- Filter hoạt động đúng với data từ API
