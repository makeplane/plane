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
> - Nếu được bật, bạn cũng có thể đăng nhập bằng **mã dùng một lần** gửi qua email (magic link) thay vì mật khẩu — hữu ích cho lần đầu hoặc khi quên mật khẩu (mỗi giờ chỉ gửi được tối đa vài mã).

## Đặt mật khẩu lần đầu

Nếu đây là lần đầu bạn truy cập và chưa có mật khẩu:

1. Quản trị viên cấp **mật khẩu ban đầu** khi tạo hoặc nhập tài khoản nhân viên (hoặc gửi liên kết đặt lại mật khẩu cho bạn).
2. Khi đăng nhập lần đầu mà tài khoản chưa có mật khẩu, hệ thống đưa bạn tới trang **đặt mật khẩu** (`/accounts/set-password`).
3. Nhập **mật khẩu mới** và **xác nhận mật khẩu** (hai ô phải khớp nhau).
4. Hệ thống hiển thị **thanh đo độ mạnh mật khẩu**. Mật khẩu phải có ít nhất **8 ký tự**, gồm **chữ hoa**, **chữ thường**, **chữ số** và **ít nhất 1 ký tự đặc biệt**; khi đủ điều kiện, thanh đo hiển thị **Password is strong** và nút mới bật.
5. Nhấn **Set password** để hoàn tất.

## Quên mật khẩu

{{screenshot:dang-nhap-quen-mat-khau}}

1. Trên màn hình đăng nhập, nhấn liên kết **Forgot password?** (hiển thị bên dưới ô mật khẩu).
   - Nếu đã nhập mã nhân viên hoặc email ở bước trước, hệ thống tự điền email vào form quên mật khẩu.
2. Trên trang **Reset password**, xác nhận địa chỉ email và nhấn **Send reset link**.
3. Kiểm tra hộp thư — nhấn liên kết **Reset password** trong email nhận được.
4. Nhập **mật khẩu mới** và **xác nhận mật khẩu**, sau đó nhấn **Set password**.

> **Lưu ý:** Liên kết đặt lại mật khẩu chỉ có hiệu lực trong một khoảng thời gian ngắn. Nếu hết hạn, thực hiện lại từ bước 1.
>
> Nếu không nhận được email, kiểm tra thư mục **Spam/Junk** hoặc liên hệ quản trị viên IT để xác nhận SMTP đã được cấu hình.

## Đăng xuất

1. Nhấn vào **ảnh đại diện** của bạn ở **góc trên bên phải** màn hình (cạnh biểu tượng hộp thư và trợ giúp).
2. Chọn **Sign out** từ menu hiện ra.

> Luôn đăng xuất khi sử dụng máy tính chung hoặc rời khỏi bàn làm việc.

## Mẹo & lưu ý

- Nếu Swing SSO đang được bật, nút **Forgot password?** có thể không hiển thị — mật khẩu được quản lý qua hệ thống SSO của ngân hàng, liên hệ IT để đặt lại.
- Nếu hệ thống chưa cấu hình gửi email (SMTP), liên kết **Forgot password?** sẽ chuyển thành một thông báo cho biết không thể gửi email đặt lại — khi đó hãy liên hệ quản trị viên IT thay vì chờ email.
- Mật khẩu mới bắt buộc có **ít nhất 1 ký tự đặc biệt** (ngoài chữ hoa, chữ thường, chữ số và 8 ký tự) thì nút đặt mật khẩu mới bật.
- Nếu gửi quá nhiều yêu cầu trong thời gian ngắn, hệ thống có thể tạm thời từ chối (lỗi **Too many requests**); chờ ít phút rồi thử lại.
- Mật khẩu phân biệt chữ hoa/chữ thường.

## Liên quan

- [Gia nhập workspace & onboarding](/help/a/gia-nhap-workspace-va-onboarding)
- [Hồ sơ cá nhân](/help/a/ho-so-ca-nhan)
- [Bảo mật & email](/help/a/bao-mat-va-email)
