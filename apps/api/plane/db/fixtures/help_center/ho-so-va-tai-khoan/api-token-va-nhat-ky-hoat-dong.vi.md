---
category: ho-so-va-tai-khoan
slug: api-token-va-nhat-ky-hoat-dong
sort_order: 40000
title: "API token & nhật ký hoạt động"
status: published
---

## Mục đích

Tab **API Tokens** cho phép tạo và xóa token để tích hợp hoặc tự động hóa qua API bên ngoài. Tab **Hoạt động** lưu lịch sử toàn bộ thao tác bạn đã thực hiện trên Shinhan Workspace, hỗ trợ tra soát và kiểm toán.

## Khi nào dùng / Yêu cầu

- **API Token**: dành cho nhân viên kỹ thuật hoặc người dùng cần kết nối công cụ ngoài (script, Zapier, v.v.) với Shinhan Workspace. Token xác thực theo tài khoản cá nhân — **không chia sẻ token cho người khác**.
- **Nhật ký hoạt động**: bất kỳ ai cũng có thể xem nhật ký cá nhân của mình; không xem được nhật ký của người khác từ đây.

## Các bước

### Tạo API Token mới

1. Nhấn **ảnh đại diện** → **Cài đặt tài khoản** → tab **API Tokens** (nhóm _Developer_ trong menu bên trái).
2. Nhấn nút **Thêm token** ở góc trên phải.
3. Cửa sổ tạo token mở ra — điền:
   - **Tên token**: mô tả mục đích (ví dụ: `ci-pipeline`, `report-script`).
   - **Hết hạn**: chọn ngày hết hạn hoặc để trống nếu không giới hạn thời gian.
4. Nhấn **Tạo token**.
5. **Sao chép token ngay lập tức** — hệ thống chỉ hiển thị giá trị token một lần duy nhất. Sau khi đóng cửa sổ, bạn không thể xem lại.

{{screenshot:api-token-va-nhat-ky-hoat-dong}}

> Lưu token vào nơi an toàn (ví dụ: trình quản lý mật khẩu hoặc biến môi trường CI/CD). Không lưu token trực tiếp trong mã nguồn.

### Xóa API Token

1. Trong danh sách token, tìm token cần xóa.
2. Nhấn biểu tượng **xóa** (thùng rác) ở cuối hàng.
3. Xác nhận — token bị thu hồi ngay lập tức; mọi tích hợp dùng token đó sẽ ngừng hoạt động.

### Xem nhật ký hoạt động cá nhân

1. Nhấn **ảnh đại diện** → **Cài đặt tài khoản** → tab **Hoạt động** _(Activity)_ trong menu bên trái.
2. Danh sách hiển thị các thao tác gần nhất — mỗi mục gồm: thời gian, mô tả hành động, đối tượng bị tác động.
3. Cuộn xuống cuối trang và nhấn **Tải thêm** nếu còn kết quả (mỗi lần tải 100 bản ghi).

{{screenshot:nhat-ky-hoat-dong}}

> Nhật ký không thể xóa hay chỉnh sửa — đây là bản ghi kiểm toán chỉ đọc.

## Mẹo & lưu ý

- Mỗi token gắn với tài khoản cá nhân: nếu tài khoản bị đình chỉ, tất cả token của tài khoản đó cũng mất hiệu lực.
- Nên đặt **ngày hết hạn** cho token dùng trong dự án tạm thời để tự động thu hồi sau khi xong việc.
- Nhật ký hoạt động cá nhân hiển thị **tối đa 100 bản ghi mỗi trang**; nhấn **Tải thêm** để xem tiếp các trang trước.
- Nếu cần nhật ký ở cấp workspace (toàn bộ thành viên), liên hệ quản trị viên workspace — tính năng xuất nhật ký workspace nằm trong **Cài đặt workspace → Xuất dữ liệu**.

## Liên quan

- [Hồ sơ cá nhân](/help/a/ho-so-ca-nhan)
- [Bảo mật & email](/help/a/bao-mat-va-email)
- [Webhooks, export & tích hợp](/help/a/webhooks-export-tich-hop)
