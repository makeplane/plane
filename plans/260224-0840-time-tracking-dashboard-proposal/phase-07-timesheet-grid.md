# Phase 7: Timesheet Grid View

## Overview
- **Priority**: P1
- **Status**: draft
- Thay thế luồng nhập worklog cơ bản thành màn hình "My Timesheet" dạng lưới. **Tuân thủ tuyệt đối Plane Architecture**.

## 1. Môi trường Backend (`apps/api/`)
**Quy tắc áp dụng:**
- **API Layer**: Đặt trong `plane/app/` (v0 internal API, session auth). Không đặt vào `plane/api/`.
- **Query Manager**: Bắt buộc dùng `Issue.issue_objects` (lọc bỏ các triage/archived issues). Phải có filter `workspace__slug=slug` chống rò rỉ chéo dữ liệu.
- **Permission**: Dùng decorator `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")` từ `plane.app.permissions`.

**Chi tiết triển khai:**
- **File views**: Cập nhật `plane/app/views/issue/worklog.py`.
- **Endpoint Bulk Update**:
  - `POST /api/workspaces/<str:slug>/projects/<uuid:project_id>/time-tracking/timesheet/bulk/`
  - Khai báo route trong `plane/app/urls/worklog.py`.
- **Activity Tracking**: Sau khi bulk mutations gọi `.save()`, phải capture `current_instance` và bắn `issue_activity.delay(type="WORKLOG_UPDATED", ...)` và `model_activity.delay()`.

## 2. Môi trường Frontend (`apps/web/`)
**Quy tắc áp dụng:**
- **CE Override**: Tất cả UI/Store mới đặt trong thư mục `apps/web/ce/`.
- **MobX Pattern**: Component bọc `observer`, actions cập nhật state qua `runInAction`. Tất cả CE store kế thừa `CoreRootStore` trong `ce/store/root.store.ts`.
- **Component Library**: Bắt buộc dùng `@plane/propel` bằng subpath import (VD: `import { Button } from "@plane/propel/button"`). Tránh xa `@plane/ui`.
- **Styling**: Chỉ dùng Semantic Tokens (`bg-surface-1`, `text-color-primary`, `border-color-subtle`). Không dùng `dark:xyz` hay màu hardcode.

**Chi tiết triển khai:**
- **Types**: Thêm interface cho Timesheet Grid vào `packages/types/src/`.
- **Service (`apps/web/core/services/worklog.service.ts`)**: Thêm hàm lấy dữ liệu lưới `getTimesheetGrid()`. Service kế thừa `APIService`.
- **Store (`apps/web/ce/store/worklog.store.ts`)**: 
  - Thêm property observable `timesheetData`.
  - Logic update: Dùng `runInAction` ở các hàm async fetch/update.
- **Hook (`apps/web/ce/hooks/store/use-worklog.ts`)**: Trỏ về worklog store mới.
- **Components (`apps/web/ce/components/time-tracking/timesheet/`)**:
  - Dùng `@tanstack/react-table` render dữ liệu lưới. 
  - **BẮT BUỘC:** Lưới phải là Interactive Input Grid (không phải Read-only). Các ô tương ứng với các ngày (MON, TUE...) phải dùng `<EditableCell>` hoặc `<Input>` từ `@plane/propel/input` để user có thể click vào và gõ số giờ (vd: `2h`, `30m`). Khi user gõ xong và nhấn Enter hoặc onBlur, tự động gọi API `POST /bulk` để lưu. Tuân thủ dùng hàm `cn()` từ `@plane/utils` để conditionally format css.
  - **Thêm Row mới:** Bổ sung nút "Add Row" hoặc "Add Issue" cho phép user tìm và chọn một Issue, sau đó đưa Issue đó vào lưới hiển thị của tuần hiện tại để tiến hành chấm công.
  - Gắn vào route hiện tại đã có: `/[workspaceSlug]/projects/[projectId]/time-tracking` của Project.
  - Chúng ta sẽ thiết kế lại màn hình Time Tracking cũ thành giao diện **chia Tab (Tabbed Layout)**: 
    - Tab 1: `My Timesheet` (Nhập liệu Grid)
    - Tab 2: `Project Analytics` (Báo cáo hiện tại & Các Chart thống kê)
    - Tab 3: `Capacity` (cho Phase 8).
- **i18n**: Khai báo string mới đồng bộ cho 3 ngôn ngữ (`en`, `vi`, `ko`) trong `packages/i18n/src/locales/` (VD: `time_tracking.timesheet_title`).
- **Route**: Khai báo route project-level trong `apps/web/app/routes/core.ts` (không mix vào settings route).

## 3. Các lưu ý (Common Mistakes to Avoid)
- **N+1 Queries**: Endpoint API list Grid bắt buộc dùng `select_related('logged_by')` và `prefetch_related('issue')`.
- **Imports**: Không dùng barrel import đối với Propel, phải import đích danh từng component để tuân thủ tree-shaking rule theo `code-standards.md`.
