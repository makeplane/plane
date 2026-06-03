---
category: tinh-nang-shbvn
slug: du-an-toan-ngan-hang
sort_order: 40000
title: "Dự án toàn ngân hàng"
status: published
---

## Mục đích

**Dự án toàn hàng** (Bank-wide Projects) là danh bạ tập trung liệt kê các dự án được đánh dấu quan trọng toàn hàng. Nhân viên dùng trang này để tìm và truy cập nhanh các dự án liên phòng ban. Danh sách hiển thị tùy theo quyền của bạn (xem mục Mẹo & lưu ý).

## Khi nào dùng / Yêu cầu

- Nhân viên có vai trò **Quản trị viên** (Admin) hoặc **Thành viên** (Member) trong workspace đều thấy mục này ở sidebar; **Khách** (Guest) không có mục này.
- Danh sách hiển thị tùy theo quyền của bạn (xem mục **Mẹo & lưu ý**).
- Một dự án chỉ xuất hiện ở đây nếu **Quản trị viên dự án** đã bật cờ _Dự án toàn ngân hàng_ trong cài đặt dự án. Việc đánh dấu yêu cầu quyền **Admin** của dự án đó.
- Truy cập: sidebar trái → **Dự án toàn hàng** (biểu tượng quả địa cầu).

## Các bước

### Duyệt và tìm dự án toàn ngân hàng

1. Mở **Dự án toàn hàng** từ sidebar.
2. Trang hiển thị các dự án nhóm theo **workspace** — mỗi nhóm có tiêu đề là tên workspace.
3. Mỗi thẻ dự án hiển thị: ảnh bìa, tên, mã định danh, số thành viên và workspace chứa dự án.
4. Nhấp vào thẻ để mở dự án trong tab mới.

{{screenshot:du-an-toan-ngan-hang}}

### Tìm kiếm và lọc

1. Nhấp ô **Tìm kiếm** (Search) phía trên và gõ **tên** dự án — danh sách lọc theo thời gian thực. Lưu ý: tìm kiếm chỉ khớp theo tên dự án, không khớp theo mã định danh.
2. Dùng bộ lọc **Workspace** để chỉ xem dự án của một workspace cụ thể. Danh sách trong dropdown hiển thị theo tên phòng ban và chỉ gồm các workspace bạn có quyền truy cập.
3. Dùng hai ô ngày **From** và **To** để lọc dự án theo ngày tạo.
4. Bật nút **Archived** để xem các dự án đã lưu trữ — khi bật, danh sách hiển thị dự án đã lưu trữ thay cho dự án đang hoạt động.

{{screenshot:du-an-toan-ngan-hang-filters}}

### Sao chép liên kết dự án

1. Trên mỗi thẻ dự án có sẵn biểu tượng **liên kết** (🔗) ở góc dưới bên phải ảnh bìa.
2. Nhấp biểu tượng đó để sao chép đường dẫn trực tiếp vào clipboard.
3. Dán vào email, chat hoặc tài liệu để chia sẻ với đồng nghiệp.

### Đánh dấu dự án là Dự án toàn ngân hàng (dành cho Admin dự án)

1. Vào dự án → **Cài đặt** (Settings) → mục **Dự án toàn ngân hàng** (trong nhóm General). Chỉ **Quản trị viên dự án** mới thấy mục này.
2. Bật công tắc **Đánh dấu là Dự án toàn ngân hàng**.
3. Dự án xuất hiện ngay trong danh bạ Dự án toàn hàng của toàn hệ thống.
4. Tắt công tắc để gỡ khỏi danh bạ.

{{screenshot:du-an-toan-ngan-hang-bank-wide-setting}}

## Mẹo & lưu ý

- **Danh sách hiển thị theo quyền của bạn**:
  - **Quản trị viên hệ thống** thấy mọi dự án toàn hàng trên toàn bộ workspace.
  - **Trưởng phòng ban** thấy các dự án toàn hàng trong những phòng ban mình quản lý (kể cả phòng ban con) cộng dự án đã tham gia.
  - **Quản trị viên workspace** thấy dự án đã tham gia cộng dự án toàn hàng trong workspace mình làm Admin.
  - **Thành viên** thường chỉ thấy những dự án toàn hàng mà mình đã được thêm vào (đã là thành viên dự án). Nếu danh bạ trống/thiếu dự án, đây là điều bình thường theo quyền, không phải lỗi.
- **Mở dự án ngoài workspace của mình**: chỉ áp dụng cho admin/trưởng phòng (những vai trò thấy được dự án ngoài phạm vi mình tham gia); quyền xem nội dung vẫn phụ thuộc _network_ của dự án (Public/Secret).
- **Dự án Private**: dự án có khóa 🔒 là Secret network — bạn cần được mời mới vào được dù nó có trong danh bạ.
- **Nhóm theo workspace**: khi nhiều dự án của cùng một workspace được đánh dấu bank-wide, chúng xếp chung vào một nhóm để dễ đọc.
- **Không hiển thị dự án cá nhân**: chỉ dự án được Admin đánh dấu bank-wide mới xuất hiện — dự án thông thường không tự hiện ở đây.

## Liên quan

- [Làm việc với dự án](/help/a/lam-viec-voi-du-an)
- [Head Office Dashboard](/help/a/head-office-dashboard)
- [Cấu hình dự án](/help/a/cau-hinh-du-an)
