# Phase 8: Capacity & Overload Dashboard

## Overview
- **Priority**: P2
- **Status**: draft
- Bảng Dashboard cho PM quản lý nguồn lực. Yêu cầu tính toán aggregate, bắt buộc phải tuân theo cấu trúc background tasks và semantic guidelines của Plane.

## 1. Database & Celery Tasks (Backend)
- **Manager & Query**: Việc query dữ liệu toàn dự án bắt buộc lọc đúng `workspace__slug` và chỉ dùng `Issue.issue_objects` (Loại bỏ các task đang Triage hay Archived).
- **Background Task (`plane/bgtasks/capacity_report.py`)**:
  - Bọc hàm bằng `@shared_task`.
  - Tối kỵ việc pass nguyên ORM object (như instance User) vào param của Celery, **chỉ truyền `str(object.id)`**.
  - Sử dụng `log_exception()` chuẩn của hệ thống để bắt và bắn log nếu quá trình query/tính toán bị fails.

## 2. API v0 Layer
- **Tạo Custom View (`plane/app/views/capacity.py`)**:
  - Extend từ `BaseAPIView` (vì đây không làm CRUD chuẩn của `BaseViewSet`).
  - Kiểm tra quyền: `permission_classes = [IsAuthenticated, IsProjectMember]`, kèm decorator `@allow_permission([ROLE.ADMIN], level="PROJECT")` vì đây là report dành cho quản lý.
  - Phải register vào `plane/app/urls/project.py` và `__init__.py`.

## 3. Giao diện (Frontend Analytics)
- **Stores (`apps/web/ce/store/analytics.store.ts`)**: Mở rộng store phân tích, luôn nhớ dùng `runInAction` mỗi khi state (loading, error, list obj) thay đổi ở bước Promise / async yield.  
- **UI Components (`apps/web/ce/components/time-tracking/capacity/`)**:
  - Tích hợp vào **Tab "Capacity"** bên trong màn hình Time Tracking hiện tại.
  - **Kiến trúc Heatmap (BẮT BUỘC):** Phải là dạng **Lưới 2 Chiều (2D Grid)**. Trục dọc là Member, trục ngang là **Các Ngày** trong khoảng thời gian lọc (chứ không chỉ có cột Total).
  - Tính toán tổng giờ đã log theo **từng ngày** cho mỗi user.
  - **Màu Sắc CSS**: Plane cấm hardcode các màu chuẩn `bg-red-500` hoặc tự dùng `dark:`. Heatmap ở đây sẽ phải sử dụng các token **Semantic Color** và áp dụng màu nền (Color Coding) trực tiếp vào **ô của từng ngày** (không chỉ hiện ở cột status):
    - Overload Cell (>8h/ngày): `bg-color-error/10 text-color-error border-color-error`.
    - Normal Cell (đạt chuẩn ~8h): `bg-color-success/10 text-color-success`.
    - Under Capacity/Empty: `bg-color-warning/10` hoặc `text-color-secondary`.
  - Tooltips xem chi tiết: Import `import { Tooltip } from "@plane/propel/tooltip"`.
  - Giữ component dưới mức 150 lines, nếu component render Cells của table quá dài, phải extract thành file con.
- **Project Analytics (Tab 2)**: 
  - Nâng cấp phần Summary Cards của trang Time Tracking cũ để bổ sung **Time Burndown Chart** (đường Remaining Estimate vs Thực tế đã log).
  - Bổ sung **Pie/Donut Chart** thống kê tỷ lệ phân bổ thời gian theo Category (Development, Meeting, Design, Bug Fixing).

## 4. Ngônngữ (i18n)
- Nội dung báo cáo Overload ("Overloaded by X hours", "Under capacity") phải được định nghĩa đồng bộ trong cả 3 ngôn ngữ tại `packages/i18n/src/locales/` (trong các folder `en`, `vi`, `ko`), gọi qua `const { t } = useTranslation();` thay vì hardcode text thuần.
