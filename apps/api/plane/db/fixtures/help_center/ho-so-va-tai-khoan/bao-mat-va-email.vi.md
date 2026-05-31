---
category: ho-so-va-tai-khoan
slug: bao-mat-va-email
sort_order: 20000
title: "Bảo mật & email"
status: published
---

## Mục đích

Trang Bảo mật cho phép bạn đổi mật khẩu đăng nhập Shinhan Workspace. Nếu quản trị viên đã cấu hình email, bạn cũng có thể đổi địa chỉ email tài khoản từ trang Hồ sơ cá nhân.

## Khi nào dùng / Yêu cầu

- Đổi mật khẩu định kỳ hoặc khi nghi ngờ tài khoản bị lộ thông tin.
- Tài khoản đăng nhập bằng **SSO nội bộ (Swing)** không đổi mật khẩu tại đây — liên hệ bộ phận IT.
- Tài khoản đặt mật khẩu lần đầu (autoset) sẽ **không** yêu cầu nhập mật khẩu hiện tại.

## Các bước

### Đổi mật khẩu

1. Nhấn **ảnh đại diện** → chọn **Cài đặt** để mở cửa sổ Cài đặt hồ sơ → chọn tab **Bảo mật** trong menu bên trái.
2. Điền vào form đổi mật khẩu:
   - **Mật khẩu hiện tại** — bắt buộc nếu tài khoản đã có mật khẩu trước đó.
   - **Mật khẩu mới** — phải đạt đủ độ mạnh (xem thanh chỉ báo phía dưới ô nhập).
   - **Xác nhận mật khẩu mới** — phải khớp với mật khẩu mới.

{{screenshot:bao-mat-va-email}}

3. Nhấn **Đổi mật khẩu**.
4. Thông báo xác nhận xuất hiện; mật khẩu có hiệu lực ngay lập tức.

### Yêu cầu mật khẩu hợp lệ

Thanh **Độ mạnh mật khẩu** hiển thị khi mật khẩu chưa hợp lệ (thông điệp bằng tiếng Anh: _Password is weak_ / _Password is strong_); khi mật khẩu đạt yêu cầu, thanh này ẩn đi. Mật khẩu phải:

- Có ít nhất **8 ký tự**.
- Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.
- **Khác hoàn toàn** với mật khẩu hiện tại — hệ thống sẽ báo lỗi nếu trùng.
- **Tránh mật khẩu phổ biến/dễ đoán**: dù đủ ký tự theo quy tắc trên, hệ thống vẫn có thể từ chối với lỗi _mật khẩu quá yếu_ (ví dụ `Password1!`). Nên chọn chuỗi không theo từ điển hay khuôn mẫu dễ đoán.

> Nút **Đổi mật khẩu** chỉ kích hoạt khi các điều kiện ký tự được thỏa mãn và hai ô mật khẩu mới khớp nhau.

{{screenshot:bao-mat-password-strength}}

### Xem/ẩn mật khẩu đang nhập

Nhấn biểu tượng **mắt** ở phía phải mỗi ô nhập để chuyển đổi giữa hiện và ẩn ký tự.

### Đổi địa chỉ email

Đổi email được thực hiện từ tab **Hồ sơ** (không phải tab Bảo mật):

1. Vào **Cài đặt tài khoản** → tab **Hồ sơ**.
2. Bên dưới trường **Email** (chỉ đọc), nhấn liên kết **Đổi địa chỉ email**.
3. Làm theo hướng dẫn 2 bước trong cửa sổ xác nhận:
   - Bước 1: nhập email mới.
   - Bước 2: nhập mã xác minh gửi đến email mới.

> Sau khi xác minh thành công, hệ thống **đăng xuất phiên hiện tại** — bạn cần đăng nhập lại bằng **email mới**. (Khác với đổi mật khẩu: đổi mật khẩu không đăng xuất bạn.)
>
> Liên kết đổi email chỉ xuất hiện khi quản trị viên đã bật tính năng gửi email (SMTP). Nếu không thấy liên kết, liên hệ quản trị viên.

## Mẹo & lưu ý

- Sau khi đổi mật khẩu thành công, phiên đăng nhập hiện tại **vẫn tiếp tục** — bạn không bị đăng xuất ngay.
- Nếu quên mật khẩu, dùng chức năng **Quên mật khẩu** trên trang đăng nhập; xem bài [Đăng nhập & khôi phục mật khẩu](/help/a/dang-nhap-va-khoi-phuc-mat-khau).
- Tính năng **Vô hiệu hóa tài khoản** hiện đang được ẩn — liên hệ quản trị viên nếu cần xử lý tài khoản.

## Liên quan

- [Hồ sơ cá nhân](/help/a/ho-so-ca-nhan)
- [Đăng nhập & khôi phục mật khẩu](/help/a/dang-nhap-va-khoi-phuc-mat-khau)
- [API token & nhật ký hoạt động](/help/a/api-token-va-nhat-ky-hoat-dong)
