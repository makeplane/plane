---
category: xem-va-bo-cuc
slug: phan-tich-analytics
sort_order: 50000
title: "Phân tích (Analytics)"
status: published
---

## Mục đích

Trang **Phân tích** (Analytics) tổng hợp số liệu công việc trên toàn workspace thành các thẻ chỉ số, biểu đồ xu hướng và bảng thống kê — giúp trưởng nhóm và quản lý theo dõi khối lượng công việc, tiến độ và phân bổ nhân sự mà không phải mở từng dự án. Trang dành cho **Quản trị viên** và **Thành viên**; vai trò **Khách** (Guest) không truy cập được mục này.

## Khi nào dùng / Yêu cầu

- Dùng khi cần bức tranh tổng quan nhiều dự án: tổng số mục công việc, đã hoàn thành, tỷ lệ tạo mới so với hoàn thành, phân bổ theo người dùng, cycle, module…
- Yêu cầu vai trò **Quản trị viên** hoặc **Thành viên** workspace. Mục **Phân tích** không hiện trong thanh bên với vai trò **Khách**.
- Số liệu lấy từ các dự án bạn đã tham gia; lọc theo dự án để thu hẹp phạm vi.

## Các bước

### Mở trang Phân tích

1. Trên **thanh bên trái**, mở nhóm **Workspace menu** và nhấn mục **Phân tích** (Analytics).
2. Trang mở ở tab **Tổng quan** (Overview) mặc định, đường dẫn dạng `/{workspace}/analytics/overview`.
3. Có thể dùng **Cmd/Ctrl + K** để mở ô tìm kiếm nhanh và điều hướng tới các trang, mục công việc trong workspace.

{{screenshot:analytics-overview-tab}}

### Chuyển giữa các tab phân tích

Trên thanh tab phía trên, chọn loại phân tích muốn xem. Bản đang chạy có 7 tab:

| Tab | Nội dung |
| --- | --- |
| **Tổng quan** (Overview) | Chỉ số tổng hợp và danh sách Teams/Projects đang hoạt động |
| **Teams/Projects** | Thống kê theo từng nhóm (team) hoặc dự án |
| **Người dùng** (Users) | Phân bổ công việc theo người phụ trách |
| **Mục công việc** (Work Items) | Thẻ chỉ số, biểu đồ tạo mới/hoàn thành và bảng số liệu tùy biến |
| **Cycles** | Phân bổ và bảng số liệu theo chu kỳ |
| **Modules** | Số liệu theo module |
| **Intake** | Số liệu yêu cầu tiếp nhận qua Intake |

### Lọc theo dự án

1. Ở góc phải khu vực bộ lọc, nhấn nút chọn dự án (mặc định hiển thị **All projects** — tất cả dự án).
2. Chọn một hoặc nhiều dự án để giới hạn số liệu trong phạm vi đó. Toàn bộ thẻ chỉ số và biểu đồ cập nhật theo lựa chọn.

{{screenshot:analytics-filters}}

### Tùy biến biểu đồ (tab Mục công việc)

Trong tab **Mục công việc**, khu vực biểu đồ tùy biến cho phép chọn:

- **Trục Y** (chỉ số đo) — ví dụ số lượng mục công việc.
- **Trục X** (thuộc tính) và **Nhóm theo** (Group By) — ví dụ theo độ ưu tiên, trạng thái, người phụ trách.

### Xuất CSV

Các bảng số liệu trong tab **Mục công việc** và **Cycles** có nút **Export** ngay trên bảng. Nhấn để tải xuống tệp `.csv` (tên dạng `{workspace}-analytics.csv`) chứa dữ liệu đang hiển thị, mở được bằng Excel.

## Mẹo & lưu ý

- Mục **Phân tích** chỉ hiện với **Quản trị viên** và **Thành viên** — Khách không thấy. Nếu không thấy mục này trong thanh bên, hãy kiểm tra vai trò của bạn.
- Bộ lọc hiện tại là **theo dự án**. Trang không có bộ lọc theo khoảng thời gian; số liệu phản ánh trạng thái hiện tại của dữ liệu.
- Thẻ chỉ số đếm theo số tuyệt đối. Nếu một dự án rỗng hoặc bị lọc bỏ, số liệu giảm tương ứng.
- Nút **Export** chỉ có ở bảng số liệu (Mục công việc, Cycles); các tab khác có thể không có nút xuất.
- Khi chưa có dữ liệu, tab hiển thị trạng thái rỗng thay vì biểu đồ — hãy tạo công việc hoặc bỏ bớt bộ lọc.

## Liên quan

- [Tổng quan trang chủ workspace](/help/a/tong-quan-trang-chu-workspace)
- [Theo dõi tiến độ cycle](/help/a/theo-doi-tien-do-cycle)
- [Lưu & chia sẻ Views](/help/a/luu-va-chia-se-views)
- [Webhooks, xuất dữ liệu & tích hợp](/help/a/webhooks-export-tich-hop)
- [Capacity & báo cáo](/help/a/capacity-va-bao-cao)
