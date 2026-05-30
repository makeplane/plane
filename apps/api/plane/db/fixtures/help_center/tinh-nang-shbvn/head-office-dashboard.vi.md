---
category: tinh-nang-shbvn
slug: head-office-dashboard
sort_order: 10000
title: "Head Office Dashboard"
status: published
---

## Mục đích

Head Office Dashboard (gọi tắt: **HO Dashboard**) tổng hợp toàn bộ công việc từ nhiều phòng ban — workspace trong một màn hình duy nhất, giúp cấp quản lý theo dõi tiến độ, worklog và danh mục công việc toàn ngân hàng mà không cần mở từng workspace riêng lẻ.

## Khi nào dùng / Yêu cầu

- Dành cho: **Trưởng phòng ban**, **Quản lý cấp cao** và **Quản trị viên hệ thống**.
- Tab **Department** chỉ hiển thị nếu bạn là _Trưởng phòng ban_ (department manager) hoặc _Instance Admin_. Người dùng thông thường mặc định vào tab **Datasheet**.
- Truy cập: thanh bên trái → **Overall Management** (biểu tượng tòa nhà).

## Các bước

### Xem tổng quan phòng ban (tab Department)

1. Mở **Overall Management** từ sidebar.
2. Chọn tab **Department** ở thanh tab phía trên.
3. Danh sách phòng ban theo cây tổ chức hiện ra — mỗi dòng cho thấy tên workspace liên kết và số lượng công việc đang mở.

{{screenshot:head-office-dashboard-department-tab}}

### Xem bảng dữ liệu chi tiết (tab Datasheet)

1. Chọn tab **Datasheet**.
2. Bảng hiển thị tất cả công việc từ các workspace bạn có quyền xem, với tối đa **18 cột** có thể bật/tắt: Phòng ban, Tên dự án, Danh mục chính/phụ, Công việc, Lead, Assignee, Dự án toàn ngân hàng, Ưu tiên, Trạng thái, Tiến độ, Module, Cycle, Ngày bắt đầu, Ngày đến hạn, Ngày hoàn thành, Tổng giờ log, Liên kết tham chiếu.
3. Nhấp **vào tiêu đề cột** để sắp xếp tăng/giảm dần.
4. Nhấp **biểu tượng lọc** trên tiêu đề cột để lọc theo phòng ban, assignee, trạng thái, ưu tiên, danh mục, v.v.
5. Nhấp **Display** (góc phải trên) để bật/tắt từng cột hiển thị.

{{screenshot:head-office-datasheet-columns}}

### Xem tổng hợp theo danh mục (tab Category)

1. Chọn tab **Category**.
2. Bảng nhóm công việc theo danh mục chính và danh mục phụ.
3. Nhấp vào một danh mục để xem danh sách công việc thuộc danh mục đó.

### Xem worklog chi tiết theo thành viên

1. Ở tab Datasheet, cột **Tổng giờ log** hiển thị tổng giờ của mỗi công việc.
2. Nhấp vào ô giờ để mở **Worklog Breakdown Popover** — liệt kê từng thành viên và số giờ họ đã log.
3. Nhấp vào tên thành viên để xem chi tiết từng mục worklog của họ.

{{screenshot:head-office-worklog-breakdown}}

### Xuất dữ liệu (tab Exports)

1. Chọn tab **Exports**.
2. Nhấp **Export** và chọn định dạng (CSV).
3. Danh sách các lần xuất trước cũng được lưu lại tại đây; nhấp **Tải xuống** để lấy lại file đã xuất.

{{screenshot:head-office-exports-tab}}

## Mẹo & lưu ý

- **Phân quyền tab Department**: nếu bạn không thấy tab Department, tài khoản chưa được gán làm Trưởng phòng ban trong God Mode — liên hệ quản trị viên.
- **Cột sticky**: cột đầu tiên được ghim khi cuộn ngang — bóng đổ nhẹ xuất hiện khi bảng bị cuộn.
- **Lọc nhiều giá trị**: hầu hết bộ lọc hỗ trợ chọn nhiều giá trị cùng lúc (ngoại trừ bộ lọc "Dự án toàn ngân hàng" chỉ có Có/Không).
- **Dữ liệu realtime**: trang tự tải dữ liệu mỗi khi bạn thay đổi bộ lọc; không cần tải lại trình duyệt.

## Liên quan

- [Dự án toàn ngân hàng](/help/a/du-an-toan-ngan-hang)
- [Capacity & báo cáo](/help/a/capacity-va-bao-cao)
- [Chấm công & timesheet](/help/a/cham-cong-va-timesheet)
