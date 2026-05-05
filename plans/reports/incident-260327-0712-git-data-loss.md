---
title: "Incident Report: Git Data Loss — git-manager Agent"
date: 2026-03-27T07:12:00+07:00
severity: HIGH
status: PARTIALLY_RECOVERABLE
branch: ngoc-feat/workspaces-default-view
---

# Incident Report: Git Data Loss

**Ngày/Giờ:** 2026-03-27 ~07:12 ICT
**Branch:** `ngoc-feat/workspaces-default-view`
**Mức độ:** HIGH — Mất dữ liệu uncommitted, không thể hoàn toàn khôi phục
**Trạng thái:** PARTIALLY RECOVERABLE (44 dangling blobs tồn tại trong git object DB)

---

## 1. Tóm tắt

User yêu cầu `/git commit all my code safety`. `git-manager` subagent được spawn để thực hiện. Agent đã chạy `git reset HEAD` (hoặc `--hard`) **9 lần liên tiếp** trên cùng 1 HEAD commit, dẫn đến mất ~30–35 file đã được staged nhưng chưa committed.

---

## 2. Timeline

| Thời điểm   | Sự kiện                                                    |
| ----------- | ---------------------------------------------------------- |
| `HEAD@{10}` | Commit `f6c504cb0` — UUID validation fix (last safe state) |
| `HEAD@{9}`  | `reset: moving to HEAD` ← git-manager bắt đầu              |
| `HEAD@{8}`  | `reset: moving to HEAD`                                    |
| `HEAD@{7}`  | `reset: moving to HEAD`                                    |
| `HEAD@{6}`  | `reset: moving to HEAD`                                    |
| `HEAD@{5}`  | `reset: moving to HEAD`                                    |
| `HEAD@{4}`  | `reset: moving to HEAD`                                    |
| `HEAD@{3}`  | `reset: moving to HEAD`                                    |
| `HEAD@{2}`  | `reset: moving to HEAD`                                    |
| `HEAD@{1}`  | `reset: moving to HEAD` ← 9 lần reset                      |
| `HEAD@{0}`  | Commit `59cb2a9d7` — chỉ 6 files còn sót lại               |

**Root cause:** `git reset --hard HEAD` xóa cả index lẫn working tree, đưa về trạng thái HEAD. Agent không có cơ chế bảo vệ trước khi chạy lệnh destructive này.

---

## 3. Files bị mất

### 3a. Đã committed (an toàn, không mất)

Những file này đã được commit trước session và vẫn tồn tại trong `f6c504cb0`:

- `apps/api/plane/bgtasks/issue_activities_task.py`
- `apps/web/ce/hooks/use-issue-form-validation.ts`
- `apps/web/core/components/issues/issue-modal/components/default-properties.tsx`

### 3b. Mất hoàn toàn (staged nhưng chưa commit)

**Backend — `apps/api/`:**
| File | Status trước đó |
|------|----------------|
| `apps/api/plane/app/serializers/issue.py` | MM (staged + unstaged changes) |
| `apps/api/plane/app/serializers/worklog.py` | M (staged) |
| `apps/api/plane/app/views/issue/base.py` | MM |
| `apps/api/plane/app/views/issue/worklog.py` | M |
| `apps/api/plane/app/views/workspace/time_tracking/timesheet_bulk.py` | M |
| `apps/api/plane/db/models/issue.py` | M (unstaged) |

**Frontend — `apps/web/`:**
| File | Status |
|------|--------|
| `apps/web/ce/components/issues/issue-details/additional-activity-root.tsx` | M |
| `apps/web/ce/components/issues/issue-details/sidebar/task-category-property.tsx` | M |
| `apps/web/ce/components/issues/issue-layouts/utils.tsx` | M (unstaged) |
| `apps/web/ce/components/issues/spreadsheet/columns/index.ts` | M (unstaged) |
| `apps/web/ce/components/navigations/daily-logtime-indicator.tsx` | M |
| `apps/web/ce/store/task-category.store.ts` | M |
| `apps/web/core/components/issues/issue-detail/sidebar.tsx` | M |
| `apps/web/core/components/issues/issue-modal/components/task-category-fields.tsx` | M |
| `apps/web/core/components/issues/issue-modal/form.tsx` | M |
| `apps/web/core/components/issues/peek-overview/properties.tsx` | M |
| `apps/web/core/store/issue/issue-details/issue.store.ts` | M |

**Admin — `apps/admin/`:**
| File | Status |
|------|--------|
| `apps/admin/app/(all)/(dashboard)/task-categories/components/main-category-form-modal.tsx` | M |
| `apps/admin/app/(all)/(dashboard)/task-categories/components/main-category-list.tsx` | M |
| `apps/admin/app/(all)/(dashboard)/task-categories/components/sub-category-form-modal.tsx` | M |
| `apps/admin/app/(all)/(dashboard)/task-categories/components/sub-category-list.tsx` | M |
| `apps/admin/app/(all)/(dashboard)/task-categories/page.tsx` | M |

**Packages:**
| File | Status |
|------|--------|
| `packages/constants/src/issue/common.ts` | M (unstaged) |
| `packages/i18n/src/locales/en/translations.ts` | MM |
| `packages/i18n/src/locales/ko/translations.ts` | MM |
| `packages/i18n/src/locales/vi/translations.ts` | MM |
| `packages/services/src/task-category/task-category.service.ts` | M |
| `packages/types/src/issues/issue.ts` | M (unstaged) |
| `packages/types/src/view-props.ts` | M (unstaged) |

**Plan/Docs (Added — mới hoàn toàn, mất 100%):**

- `apps/api/plans/reports/Explore-260327-0128-task-category-fields.md`
- `plans/260326-2005-task-categories-v2/plan.md`
- `plans/270303-0244-task-category-columns/` (4 files)
- `plans/reports/` (4 report files)

---

## 4. Trạng thái khôi phục từ Dangling Blobs

Git còn giữ **44 dangling blobs** trong object database (vì các file đã được `git add` trước khi bị reset). Một số file **có thể khôi phục**:

### Đã xác định blob → file path

| Blob        | Size              | File path (dự đoán)                                                               | Độ tin cậy |
| ----------- | ----------------- | --------------------------------------------------------------------------------- | ---------- |
| `c623b34d`  | 22369 (617 lines) | `apps/web/core/components/issues/issue-modal/form.tsx`                            | HIGH       |
| `1bd2a1a8`  | 54485             | `apps/api/plane/app/views/issue/base.py`                                          | HIGH       |
| `b38253452` | 37329             | `apps/api/plane/app/serializers/issue.py`                                         | HIGH       |
| `6ab0b6aa`  | 2632              | `apps/web/ce/store/task-category.store.ts`                                        | HIGH       |
| `95c6d50d`  | 1948              | Signal file — workspace default view (NEW file, tên chưa xác định)                | MEDIUM     |
| `484c00c6`  | 4493              | `apps/web/core/components/issues/issue-modal/components/task-category-fields.tsx` | HIGH       |
| `bc4256c0`  | 4388              | `apps/admin/.../main-category-form-modal.tsx`                                     | HIGH       |
| `d47ea64d`  | 5109              | `apps/admin/.../sub-category-form-modal.tsx`                                      | HIGH       |
| `df8aeb00`  | 4065              | `apps/admin/.../sub-category-list.tsx`                                            | HIGH       |
| `98df4eef`  | 3877              | `apps/admin/.../main-category-list.tsx`                                           | HIGH       |
| `428507730` | 14105             | `packages/constants/src/issue/common.ts`                                          | HIGH       |
| `e267f571`  | 7305              | `packages/types/src/issues/issue.ts`                                              | MEDIUM     |
| `caaada6f`  | 4512              | Plan markdown — daily-status spreadsheet view                                     | MEDIUM     |
| `938097275` | 8046              | Plan markdown — Today Work Items                                                  | MEDIUM     |

### Chưa xác định chính xác (AGPL header, cần đọc thêm)

~20 blobs còn lại có thể là: i18n translations, sidebar.tsx, utils.tsx, view-props.ts, và các file khác.

### Lệnh khôi phục từng file

```bash
# task-category store
git cat-file -p 6ab0b6aac95ac1dd655ffed56f5a1d0f38edf1c0 > apps/web/ce/store/task-category.store.ts

# issue modal form (latest version - 617 lines)
git cat-file -p c623b34daaf98287603575229870a4b99504e3a9 > apps/web/core/components/issues/issue-modal/form.tsx

# task-category-fields component (latest - 4493 bytes)
git cat-file -p 484c00c6f307fabb01978be1cb856bdbc2528f99 > apps/web/core/components/issues/issue-modal/components/task-category-fields.tsx

# API views
git cat-file -p 1bd2a1a8f09a2fa17e3e46cba347c3371a5a3169 > apps/api/plane/app/views/issue/base.py
git cat-file -p b38253452ff4ab0afd2603ec76483c65984c6d90 > apps/api/plane/app/serializers/issue.py

# Admin components
git cat-file -p bc4256c034e851a56014d751689d6b7523a41006 > apps/admin/app/\(all\)/\(dashboard\)/task-categories/components/main-category-form-modal.tsx
git cat-file -p d47ea64d55c8e2ab9923a3ff86eb66416e05e6f6 > apps/admin/app/\(all\)/\(dashboard\)/task-categories/components/sub-category-form-modal.tsx
git cat-file -p df8aeb00ab6e2d0ebdc2e517a434e8aeae75aa7e > apps/admin/app/\(all\)/\(dashboard\)/task-categories/components/sub-category-list.tsx
git cat-file -p 98df4eefdb521fc00fcec89ce218d7397f1c8554 > apps/admin/app/\(all\)/\(dashboard\)/task-categories/components/main-category-list.tsx

# Constants
git cat-file -p 428507730290ebe0d5ac6e0da9b0939dfa492e1b > packages/constants/src/issue/common.ts

# Signal file (new workspace default view - cần xác định tên file)
git cat-file -p 95c6d50d3aff5f7aef170a35cc3d1a28851244b0
```

**Thời hạn khôi phục:** Git dangling objects bị xóa khi chạy `git gc`. Khôi phục ngay bây giờ!

---

## 5. Files đã được commit thành công (không mất)

Commit `59cb2a9d7` đã lưu 6 files:

- `apps/web/ce/components/issues/spreadsheet/columns/main-task-category-column.tsx` ✓ (new)
- `apps/web/ce/components/issues/spreadsheet/columns/sub-task-category-column.tsx` ✓ (new)
- `apps/web/ce/components/dashboards/custom-dashboard-widget-grid.tsx` ✓
- `apps/web/ce/services/department.service.ts` ✓
- `apps/web/ce/services/staff.service.ts` ✓
- `apps/web/core/store/issue/issue-details/issue.store.ts` ✓ (ESLint fixed)

---

## 6. Root Cause Analysis

### Tại sao agent gây data loss?

1. **Thiếu safeguard:** `git-manager` agent không check `git diff HEAD --stat` trước khi reset để biết có uncommitted changes không
2. **Chạy `--hard` reset:** Thay vì chỉ unstage (mixed reset), agent dùng hard reset xóa cả working tree
3. **Lặp lại 9 lần:** Mỗi lần ESLint block commit, agent retry bằng reset thay vì fix lỗi
4. **Không dùng `git stash`:** Lẽ ra phải `git stash` trước khi thử lại

### Tại sao pre-commit block commit?

ESLint `--max-warnings=0` strict mode. Files staged ban đầu có các warnings:

- Floating promises (`@typescript-eslint/no-floating-promises`)
- Await non-Promise values (`@typescript-eslint/await-thenable`)
- Missing return in `.then()` (`promise/always-return`)

---

## 7. Khuyến nghị

### Ngắn hạn

1. **Chạy recovery commands** ở Section 4 ngay để tránh `git gc`
2. **Dùng VS Code Timeline** để recovery các file chưa identify được blob
3. **Kiểm tra** từng file recovered trước khi commit lại

### Dài hạn

1. **Thêm safeguard vào git-manager prompt:** Yêu cầu agent luôn chạy `git stash` trước khi reset, và check `git status` trước mọi destructive operation
2. **Tắt `--max-warnings=0` cho staged-only check:** Hoặc fix ESLint warnings ngay trong code trước khi stage
3. **Memory note:** Lưu vào memory rằng git-manager agent CÓ THỂ gây data loss nếu không được prompt đúng cách

---

## 8. Câu hỏi còn tồn đọng

1. Signal file `95c6d50d` (1948 bytes) là file mới cho feature `workspaces-default-view` — tên file chính xác là gì? Nằm ở đâu trong codebase?
2. 20+ blobs còn lại chưa identify — có bao nhiêu file i18n (en/ko/vi translations) trong số đó?
3. `apps/api/plane/app/views/issue/worklog.py` và `apps/api/plane/app/serializers/worklog.py` — blob nào tương ứng?
4. Các plan markdown files trong `plans/` — có cần khôi phục không hay có thể tái tạo?
