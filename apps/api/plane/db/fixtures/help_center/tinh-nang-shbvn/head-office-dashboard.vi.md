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
3. Danh sách phòng ban hiển thị dạng cây tổ chức, mỗi dòng gồm tên phòng ban (cột Name) và nút **Workspace liên kết** (Linked Workspace). Bấm nút này sẽ hiện hộp xác nhận, rồi mở workspace trong tab mới.

{{screenshot:head-office-dashboard-department-tab}}

### Xem bảng dữ liệu chi tiết (tab Datasheet)

1. Chọn tab **Datasheet**.
2. Bảng hiển thị công việc từ các workspace bạn có quyền xem (xem lưu ý phân quyền ở dưới), với tối đa **18 cột** có thể bật/tắt: Phòng ban, Tên dự án, Danh mục chính/phụ, Số lượng công việc con, Lead, Assignee, Dự án toàn ngân hàng, Ưu tiên, Trạng thái, Tiến độ, Module, Cycle, Ngày bắt đầu, Ngày đến hạn, Ngày hoàn thành, Tổng giờ log, Liên kết tham chiếu.
3. Trên thanh công cụ phía trên có: hai ô ngày **From/To** để lọc theo khoảng thời gian, công tắc **Show archived** để ẩn/hiện công việc đã lưu trữ, và hai ô chọn **Workspace** / **Project** để thu hẹp phạm vi.
4. Nhấp **vào tiêu đề cột** để sắp xếp tăng/giảm dần; nhấp **biểu tượng lọc** trên tiêu đề cột để lọc theo phòng ban, assignee, trạng thái, ưu tiên, danh mục, v.v.
5. Nhấp **Display** (góc phải trên) để bật/tắt từng cột hiển thị; ở đầu panel Display có tùy chọn **Show sub work items** để hiện/ẩn công việc con (ảnh hưởng số dòng và tổng giờ).
6. Bảng phân trang: nhấp **Load more** ở cuối bảng để tải thêm (nút hiển thị "đã tải / tổng"). Hãy tải hết trước khi kết luận về dữ liệu.

{{screenshot:head-office-datasheet-columns}}

### Xem tổng hợp theo danh mục (tab Category)

1. Chọn tab **Category**.
2. Bảng liệt kê các tổ hợp **Phòng ban / Danh mục chính / Danh mục phụ** đang có công việc; có ô tìm kiếm, sắp xếp theo cột và nút **Export** (XLSX).
3. Bảng chỉ để tra cứu — các dòng không bấm vào được để mở danh sách công việc.

### Xem worklog chi tiết theo thành viên

1. Ở tab Datasheet, cột **Tổng giờ log** có nút **Xem** (biểu tượng đồng hồ) — không in sẵn tổng giờ.
2. Nhấp nút **Xem** để mở **bảng phân tích worklog** — liệt kê tổng giờ và từng thành viên cùng số giờ họ đã log.
3. Nhấp vào tên thành viên để xem chi tiết từng mục worklog của họ.

{{screenshot:head-office-worklog-breakdown}}

### Xuất dữ liệu (tab Exports)

1. Để xuất dữ liệu, vào tab **Datasheet** và nhấp nút **Export** trên thanh công cụ — hệ thống xếp hàng tạo file **XLSX** và gửi qua email khi xong (không có bước chọn định dạng).
2. Mở tab **Exports** để xem danh sách các lần xuất (chỉ đọc); dùng nút **Refresh** để cập nhật trạng thái, rồi nhấp **Download** trên từng dòng để tải file.
3. Link tải có hạn **7 ngày** (xem cột Expires) — nên tải file sớm.

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
