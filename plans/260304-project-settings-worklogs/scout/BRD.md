Các phần còn thiếu cần phát triển (Gaps Analysis):

1. Khu vực Phân trang (Pagination) của bảng Worklogs:

Hiện tại của bạn: Đang dùng nút Load more ở dưới cùng bảng.
Bản Pro: Sử dụng Pagination dạng hiển thị text thông tin tổng số dòng (1-1 of 1) nằm ở góc trái dưới, và nhóm nút (Prev, Next) nằm ở góc phải dưới. 2. Menu "Download" (Xuất dữ liệu):

Hiện tại của bạn: Có menu nhưng chỉ có 1 lựa chọn là Export as CSV. Việc export đang diễn ra trực tiếp ở phía Client (tạo Blob từ dữ liệu hiện có trên màn hình).
Bản Pro:
Nút Download có Dropdown chứa ít nhất 2 tuỳ chọn: Export as Excel và Export as CSV.
Việc export không tải trực tiếp về ngay mà sẽ đẩy một Async Task (Celery) xuống Backend. 3. Section "Previous Downloads" (Khối Hàng đợi và Lịch sử tải xuống):

Hiện tại của bạn: Hoàn toàn chưa có Component này.
Bản Pro:
Là một khối Accordion (có thể đóng/mở <ChevronDown>) nằm ngay dưới phân trang của bảng Worklog.
Có nút Refresh (icon dạng reload) cạnh tiêu đề "Previous Downloads".
Chứa một bảng gồm các cột:
Exported By: Hiển thị Avatar + Tên (VD: shbvn.ictd.a).
Exported On: Ngày yêu cầu xuất file (VD: Mar 04, 2026).
Exported projects: Số lượng project được xuất (VD: 1 project(s)).
Format: Định dạng file (Excel hoặc CSV).
Status: Trạng thái xử lý ngầm (VD: Queued, Processing, Completed, Failed).
Download: Nút tải file thực tế (Khi trạng thái chưa Completed thì hiển thị dấu -, khi Completed thì sẽ có liên kết tải file từ S3/Storage).
Hành động & Kế hoạch (Action Plan):
Để gắn thêm các tính năng này, dưới đây là flow logic bạn cần triển khai:

Phía Backend (plane/):

Model Tracking Export: Thêm một DB Model (hoặc sử dụng WorkspaceExport có sẵn của Plane) để ghi lại lịch sử xuất file của user (export_type='worklogs', status, format='excel'|'csv').
Celery Task: Viết một Celery worker task nhận param filter, tổng hợp log, generate ra file CSV/Excel, lưu lên Object Storage (S3/MinIO), và update trạng thái sang Completed kèm URL tải xuống.
API Endpoints:
GET /api/v1/workspaces/{slug}/projects/{p_id}/worklog-exports/: Lấy lịch sử xuất file.
POST /api/v1/workspaces/{slug}/projects/{p_id}/worklog-exports/: Request xuất file mới (Async).
Phía Frontend (apps/web/):

Update

WorklogFiltersToolbar
: Thêm option Export Excel, khi click gọi API POST thay vì tải Blob tĩnh.
Update

WorklogSettingsPage
:
Thay thế nút Load more bằng 컴ponent Pagination tiêu chuẩn của Plane UI.
Thêm <PreviousDownloads /> component để render bảng Lịch sử xuất. Bảng này cần gọi method poll ngầm (ví dụ qua SWR hoặc setInterval) lấy data GET history để cập nhật trạng thái Queued -> Completed theo thời gian thực.
