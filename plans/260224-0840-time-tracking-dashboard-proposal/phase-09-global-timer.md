# Phase 9: Global Timer & Activity Categorization

## Overview
- **Priority**: P3
- **Status**: draft
- Tính năng chạy Timer toàn cục trên Top Navigation và nộp log kèm Phân loại Activity.

## 1. Bổ sung Database (`apps/api/plane/db/`)
- Mở `plane/db/models/issue.py` (hoặc `worklog.py`), class `IssueWorkLog` kế thừa từ `ProjectBaseModel`.
- Bổ sung trường `activity_category` `(CharField, choices=ACTIVITY_CHOICES)`.
- Chạy `python manage.py makemigrations` để sinh file migration mới.
- Khai báo model mới / view mới trong các thư mục `__init__.py` tương ứng nếu có tách file.

## 2. Service & MobX State (Frontend)
- **Store (`apps/web/ce/store/root.store.ts` & `apps/web/ce/store/worklog.store.ts`)**:
  - Biến đếm cần observable state, kết hợp ghi lưu nháp tạm vào localStorage (đề phòng tắt trình duyệt mất timer). Bọc `observer` cho root top-nav component.
- **Tạo Modal Form Submit Log**:
  - File: `apps/web/ce/components/time-tracking/timer/stop-timer-modal.tsx`
  - Dùng `import { Modal } from "@plane/propel/modal"` và `import { Select } from "@plane/propel/select"`.
  - Các state điều khiển đóng/mở Modal và validation phải được inject vào store tương ứng.

## 3. Luồng lưu Time Log
- Phía Frontend, sau khi nhập Form, trigger hàm Service gửi POST lên endpoint `plane/app/views/` (V0 Layer, `/api/workspaces/...`).
- API ViewSet sẽ validate Category (nằm trong options cho phép).
- Nếu User **Update** giờ: 
  - ORM cần track thay đổi bằng cách capture `current_instance` trước khi update.
  - Bắn Celery Task: `model_activity.delay(model_name="issueworklog", ...)` & `issue_activity.delay(...)` để hiển thị trên Issue's Activity Feed.
- Đảm bảo dữ liệu mới update tới MobX của Issue Store để list Comment + Worklog trong trang detail issue được render live ngay lập tức. Cần gọi `runInAction` set lại data cho `issueStore`.

## 4. Acceptance Criteria
- Code Timer Component (UI) dưới 150 lines (ách hàm đếm giờ ra Hook riêng `apps/web/ce/hooks/use-timer.ts` < 100 lines).
- Sử dụng đầy đủ `cn()` utility từ `@plane/utils` để conditionally format màu nút từ xám (`text-color-secondary`) sang xanh báo hiệu đang chạy. 
- Không tự build Modal Component mà phải lấy chuẩn Propel.
