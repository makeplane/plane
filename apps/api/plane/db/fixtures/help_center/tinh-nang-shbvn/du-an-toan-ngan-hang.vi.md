---
category: tinh-nang-shbvn
slug: du-an-toan-ngan-hang
sort_order: 40000
title: "Dự án toàn ngân hàng"
status: published
---

## Mục đích

**Dự án toàn ngân hàng** (Bank-wide Projects) là danh bạ tập trung liệt kê tất cả dự án được đánh dấu quan trọng toàn hàng — dù dự án đó thuộc workspace nào. Nhân viên dùng trang này để tìm và truy cập nhanh các dự án liên phòng ban mà không cần biết trước workspace chứa dự án đó.

## Khi nào dùng / Yêu cầu

- Mọi nhân viên đều xem được danh bạ này.
- Một dự án chỉ xuất hiện ở đây nếu **Quản trị viên dự án** đã bật cờ _Bank-wide_ trong cài đặt dự án (Settings → Bank-wide). Việc đánh dấu yêu cầu quyền **Admin** của dự án đó.
- Truy cập: sidebar trái → **Bank-wide Projects** (biểu tượng tòa nhà/cờ ngân hàng).

## Các bước

### Duyệt và tìm dự án toàn ngân hàng

1. Mở **Bank-wide Projects** từ sidebar.
2. Trang hiển thị các dự án nhóm theo **workspace** — mỗi nhóm có tiêu đề là tên workspace.
3. Mỗi thẻ dự án hiển thị: ảnh bìa, tên, mã định danh, số thành viên và workspace chứa dự án.
4. Nhấp vào thẻ để mở dự án trong tab mới.

{{screenshot:du-an-toan-ngan-hang}}

### Tìm kiếm và lọc

1. Nhấp ô **Tìm kiếm** (Search) phía trên và gõ tên dự án — danh sách lọc theo thời gian thực.
2. Dùng bộ lọc **Workspace** để chỉ xem dự án của một workspace cụ thể.
3. Dùng bộ lọc **Date Range** để lọc theo ngày tạo dự án.
4. Bật **Show Archived** để hiển thị thêm các dự án đã lưu trữ.

{{screenshot:du-an-toan-ngan-hang-filters}}

### Sao chép liên kết dự án

1. Trỏ chuột vào thẻ dự án — biểu tượng **liên kết** (🔗) xuất hiện ở góc trên bên phải ảnh bìa.
2. Nhấp biểu tượng đó để sao chép đường dẫn trực tiếp vào clipboard.
3. Dán vào email, chat hoặc tài liệu để chia sẻ với đồng nghiệp.

### Đánh dấu dự án là Bank-wide (dành cho Admin dự án)

1. Vào dự án → **Settings** → **Bank-wide**.
2. Bật công tắc **Mark as Bank-wide Project**.
3. Dự án xuất hiện ngay trong danh bạ Bank-wide Projects của toàn hệ thống.
4. Tắt công tắc để gỡ khỏi danh bạ.

{{screenshot:du-an-toan-ngan-hang-bank-wide-setting}}

## Mẹo & lưu ý

- **Không cần gia nhập workspace**: bạn có thể xem thông tin và mở dự án dù không phải thành viên của workspace đó — tuy nhiên quyền xem nội dung vẫn phụ thuộc vào _network_ của dự án (Public/Secret).
- **Dự án Private**: dự án có khóa 🔒 là Secret network — bạn cần được mời mới vào được dù nó có trong danh bạ bank-wide.
- **Nhóm theo workspace**: khi nhiều dự án của cùng một workspace được đánh dấu bank-wide, chúng xếp chung vào một nhóm để dễ đọc.
- **Không hiển thị dự án cá nhân**: chỉ dự án được Admin đánh dấu bank-wide mới xuất hiện — dự án thông thường không tự hiện ở đây.

## Liên quan

- [Làm việc với dự án](/help/a/lam-viec-voi-du-an)
- [Head Office Dashboard](/help/a/head-office-dashboard)
- [Cấu hình dự án](/help/a/cau-hinh-du-an)
