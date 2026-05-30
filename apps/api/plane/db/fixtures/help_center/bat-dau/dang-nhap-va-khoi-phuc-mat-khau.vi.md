---
category: bat-dau
slug: dang-nhap-va-khoi-phuc-mat-khau
sort_order: 20000
title: "Đăng nhập & khôi phục mật khẩu"
status: published
---

## Mục đích

Bài viết này hướng dẫn cách đăng nhập vào Shinhan Workspace bằng mã nhân viên hoặc email, đặt mật khẩu lần đầu, khôi phục mật khẩu khi quên, và đăng xuất an toàn.

## Đăng nhập

{{screenshot:dang-nhap-man-hinh-chinh}}

1. Truy cập địa chỉ Shinhan Workspace do IT cung cấp (ví dụ: `workspace.shinhan.com.vn`).
2. Tại ô **Employee No. / Email**, nhập một trong hai:
   - **Mã nhân viên** gồm đúng **8 chữ số** (ví dụ: `20508888`).
   - **Địa chỉ email** đầy đủ (ví dụ: `nguyen.vanA@shinhan.com`).
3. Nhập **Mật khẩu**.
4. Nhấn **Sign In**.

> **Lưu ý về phương thức đăng nhập:** Tùy cấu hình của instance, hệ thống tự động chọn phương thức phù hợp:
>
> - Mã nhân viên 8 chữ số → đăng nhập qua **Swing SSO** (nếu được bật) hoặc chuyển thành email nội bộ `sh[mã]@swing.shinhan.com`.
> - Email đầy đủ → đăng nhập trực tiếp bằng mật khẩu hệ thống.
> - Nếu LDAP được bật, có thể nhập thêm **username** LDAP.

## Đặt mật khẩu lần đầu

Nếu đây là lần đầu bạn truy cập và chưa có mật khẩu:

1. Liên hệ quản trị viên hệ thống để được gửi **email kích hoạt tài khoản**.
2. Mở email, nhấn liên kết **Set Password** trong thư.
3. Nhập **mật khẩu mới** và **xác nhận mật khẩu** (hai ô phải khớp nhau).
4. Hệ thống hiển thị **thanh đo độ mạnh mật khẩu** — mật khẩu phải đạt mức **Valid** (thường cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số).
5. Nhấn **Update Password** để hoàn tất.

## Quên mật khẩu

{{screenshot:dang-nhap-quen-mat-khau}}

1. Trên màn hình đăng nhập, nhấn liên kết **Forgot password?** (hiển thị bên dưới ô mật khẩu).
   - Nếu đã nhập mã nhân viên hoặc email ở bước trước, hệ thống tự điền email vào form quên mật khẩu.
2. Trên trang **Forgot Password**, xác nhận địa chỉ email và nhấn **Send reset link**.
3. Kiểm tra hộp thư — nhấn liên kết **Reset Password** trong email nhận được.
4. Nhập **mật khẩu mới** và **xác nhận mật khẩu**, sau đó nhấn **Update Password**.

> **Lưu ý:** Liên kết đặt lại mật khẩu chỉ có hiệu lực trong một khoảng thời gian ngắn. Nếu hết hạn, thực hiện lại từ bước 1.
>
> Nếu không nhận được email, kiểm tra thư mục **Spam/Junk** hoặc liên hệ quản trị viên IT để xác nhận SMTP đã được cấu hình.

## Đăng xuất

1. Nhấn vào **ảnh đại diện** hoặc **tên** của bạn ở góc dưới thanh bên trái.
2. Chọn **Sign Out** từ menu hiện ra.

> Luôn đăng xuất khi sử dụng máy tính chung hoặc rời khỏi bàn làm việc.

## Mẹo & lưu ý

- Nếu Swing SSO đang được bật, nút **Forgot password?** có thể không hiển thị — mật khẩu được quản lý qua hệ thống SSO của ngân hàng, liên hệ IT để đặt lại.
- Đăng nhập thất bại nhiều lần liên tiếp có thể khoá tài khoản tạm thời — liên hệ quản trị viên để mở khoá.
- Mật khẩu phân biệt chữ hoa/chữ thường.

## Liên quan

- [Gia nhập workspace & onboarding](/help/a/gia-nhap-workspace-va-onboarding)
- [Hồ sơ cá nhân](/help/a/ho-so-ca-nhan)
- [Bảo mật & email](/help/a/bao-mat-va-email)
