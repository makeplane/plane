---
category: xem-va-bo-cuc
slug: dashboard-tuy-chinh
sort_order: 60000
title: "Dashboard tùy chỉnh"
status: published
---

## Mục đích

Dashboard tùy chỉnh (Custom Dashboards) là nơi bạn tự dựng các bảng số liệu trực quan từ dữ liệu công việc trong Shinhan Workspace. Mỗi dashboard là một lưới chứa nhiều **widget** (biểu đồ), mỗi widget hiển thị một góc nhìn riêng — ví dụ số công việc theo mức ưu tiên, xu hướng theo thời gian, hay một con số tổng hợp duy nhất. Tính năng này dành cho **Quản trị viên** và **Thành viên** (Khách không truy cập được), phù hợp khi bạn cần tự tổng hợp báo cáo cho phòng/dự án mà không phải dùng tới trang Analytics có sẵn.

> **Đang triển khai:** Mục **Dashboards** hiện **chưa hiển thị trên thanh bên** trong Shinhan Workspace. Hướng dẫn dưới đây mô tả cách dùng để bạn nắm trước; các bước sẽ áp dụng khi tính năng được bật chính thức trên giao diện.

## Khi nào dùng / Yêu cầu

- Bạn cần quyền **Quản trị viên** hoặc **Thành viên** trong workspace (Khách không truy cập được).
- Lưu ý phân biệt: đây **không** phải trang **Công việc của bạn** (Your Work). "Công việc của bạn" là trang cá nhân tổng hợp việc được giao cho riêng bạn; còn Dashboard tùy chỉnh là các bảng biểu đồ bạn tự cấu hình và có thể chia sẻ.

## Các bước

### Tạo dashboard mới

1. Mở trang danh sách Dashboards. Nếu chưa có dashboard nào, bạn sẽ thấy màn hình trống với nút tạo mới.
2. Nhấn nút tạo dashboard. Một hộp thoại hiện ra.
3. Nhập **Tên** (bắt buộc) và **Mô tả** (tùy chọn).
4. Bật/tắt công tắc quyền truy cập: mặc định dashboard ở chế độ **riêng tư**; bật công tắc để chuyển sang **công khai** cho workspace.
5. (Tùy chọn) Chọn các dự án mà dashboard này gắn vào.
6. Lưu lại. Dashboard mới xuất hiện dưới dạng thẻ trong danh sách.

{{screenshot:dashboard-list}}

### Thêm và cấu hình widget

1. Nhấp vào thẻ dashboard để mở trang chi tiết.
2. Nhấn **+ Thêm widget** ở góc phải thanh tiêu đề.
3. Trong hộp thoại cấu hình, chọn lần lượt theo các tab:
   - **Loại biểu đồ**: chọn một trong các kiểu — **Bar Chart** (cột), **Line Chart** (đường), **Area Chart** (vùng), **Donut Chart**, **Pie Chart** (tròn) hoặc **Number Widget** (một con số tổng hợp).
   - **Cơ bản**: đặt tên widget, chọn **trục X** (thuộc tính như Mức ưu tiên, Trạng thái, Người phụ trách, Nhãn, Cycle, Module, ngày bắt đầu/hết hạn…), chọn **chỉ số trục Y** (Số lượng công việc hoặc Tổng điểm ước lượng), chọn **kiểu mô hình** (Cơ bản / Theo nhóm) và **nhóm theo** (tùy chọn). Riêng Number Widget có thêm các chỉ số mở rộng như công việc đang chờ, đã hoàn thành, đang xử lý, bị chặn, đến hạn hôm nay/tuần này.
   - **Kiểu hiển thị**: chọn bộ màu và các tùy chọn trình bày theo từng loại biểu đồ.
   - **Hiển thị**: bật/tắt **chú giải** (legend) và **chú thích khi rê chuột** (tooltip).
   - **Bộ lọc**: giới hạn dữ liệu theo Mức ưu tiên, Nhóm trạng thái và các khoảng ngày.
4. Lưu widget. Biểu đồ xuất hiện trên lưới dashboard.

{{screenshot:dashboard-widget-config}}

### Sửa, chia sẻ hoặc xóa widget

Rê chuột vào widget rồi nhấn nút menu (biểu tượng ba chấm) ở góc trên để:

- **Chỉnh sửa** — mở lại hộp thoại cấu hình.
- **Mở trong tab mới** — xem danh sách công việc theo bộ lọc của widget.
- **Sao chép liên kết** — lấy đường dẫn trực tiếp tới widget.
- **Xóa** — gỡ widget khỏi dashboard.

Để xóa cả dashboard, dùng menu trên thẻ ở trang danh sách và xác nhận trong hộp thoại.

## Mẹo & lưu ý

- Mỗi widget có chiều rộng và cao riêng trên lưới; sắp xếp nhiều widget để tạo một trang báo cáo hoàn chỉnh.
- **Trục X** và **chỉ số trục Y** là bắt buộc cho biểu đồ — nếu bỏ trống, hệ thống sẽ nhắc nhập.
- Chỉ số trục Y của biểu đồ thường chỉ gồm hai lựa chọn (Số lượng và Tổng điểm ước lượng); muốn dùng nhiều chỉ số hơn (đang chờ, hoàn thành, đến hạn…) hãy chọn loại **Number Widget**.
- Dashboard **riêng tư** chỉ mình bạn thấy; chuyển sang **công khai** để đồng nghiệp trong workspace cùng xem.
- Mục **Dashboards** chưa hiển thị trên thanh bên ở bản hiện tại; khi tính năng được bật chính thức, lối vào sẽ xuất hiện trong điều hướng workspace.

## Liên quan

- [Phân tích (Analytics)](/help/a/phan-tich-analytics)
- [Công việc của bạn (Dashboard cá nhân)](/help/a/cong-viec-cua-ban-dashboard)
- [Các bố cục hiển thị](/help/a/cac-bo-cuc-hien-thi)
- [Lưu & chia sẻ Views](/help/a/luu-va-chia-se-views)
- [Tổng quan trang chủ workspace](/help/a/tong-quan-trang-chu-workspace)
