---
category: huong-dan-quan-tri
slug: cau-hinh-xac-thuc
sort_order: 20000
title: "Cấu hình xác thực & SSO"
status: published
---

## Mục đích

Trang **Authentication** trong God Mode cho phép Instance Admin bật/tắt các phương thức đăng nhập và kiểm soát chính sách đăng ký. Shinhan Workspace hỗ trợ đăng nhập bằng mã gửi qua email (Unique codes), email + mật khẩu, LDAP/Active Directory, và SSO Swing (đặc thù SHBVN).

## Khi nào dùng / Yêu cầu

- Vai trò: **Instance Admin**.
- Thực hiện khi onboarding hệ thống lần đầu, hoặc khi thay đổi chính sách đăng nhập của ngân hàng.

## Các bước cấu hình

### 1. Mở trang Authentication

1. Vào **God Mode** → chọn **Authentication** ở thanh bên trái.
2. Trang hiển thị toggle _Allow anyone to sign up even without an invite_ và danh sách **Available authentication modes**.

{{screenshot:god-mode-authentication-page}}

### 2. Kiểm soát chính sách đăng ký

- **Toggle bật** (_Allow anyone to sign up even without an invite_): bất kỳ ai có email hợp lệ đều tự đăng ký được.
- **Toggle tắt** (khuyến nghị SHBVN): chỉ người nhận lời mời mới tạo được tài khoản.

Thay đổi có hiệu lực ngay, không cần nhấn Save.

### 3. Bật/tắt từng phương thức xác thực

Trang hiển thị đúng 4 phương thức, mỗi phương thức là một thẻ có toggle riêng. Nhấn toggle để bật hoặc tắt:

| Phương thức       | Ghi chú                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| **Unique codes**  | Đăng nhập/đăng ký bằng mã gửi qua email — yêu cầu đã cấu hình SMTP        |
| **Passwords**     | Đăng nhập bằng email + mật khẩu nội bộ                                    |
| **LDAP**          | Active Directory / LDAP nội bộ                                           |
| **Swing SSO**     | SSO riêng của SHBVN — xem mục bên dưới                                   |

> **Lưu ý bảo vệ:** Hệ thống không cho phép tắt phương thức **cuối cùng** đang bật. Nếu cố tắt, thông báo lỗi xuất hiện: _"At least one authentication method must remain enabled."_

{{screenshot:god-mode-auth-methods-list}}

### 4. Cấu hình Swing SSO (đặc thù SHBVN)

Swing SSO là phương thức đăng nhập một lần tích hợp với hệ thống nội bộ ngân hàng. Để cấu hình:

1. Nhấn **Configure** (hoặc nhấn vào thẻ Swing SSO).
2. Điền đầy đủ 4 trường:

| Trường            | Mô tả                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| **Swing SSO URL** | Endpoint API xác thực Swing (vd: `https://swing.example.com/api/auth`) |
| **Client ID**     | ID ứng dụng đã đăng ký với Swing                                       |
| **Client secret** | Khóa bí mật — được lưu mã hóa                                          |
| **Company code**  | Mã công ty gửi lên Swing, mặc định `VN`                                |

3. Nhấn **Save changes**.

> **Lưu ý quan trọng:** Khi bật Swing SSO, hệ thống tự động tắt LDAP (hai phương thức loại trừ lẫn nhau). Nếu đang dùng LDAP, hãy đảm bảo nhân viên đã sẵn sàng chuyển sang Swing SSO trước khi kích hoạt.

4. Nút **Test Authentication** chỉ hiện sau khi đã lưu đủ Swing SSO URL, Client ID và Client Secret. Nhấn nút này để mở hộp thoại thử đăng nhập: nhập username và mật khẩu của một tài khoản mạng nội bộ để xác minh kết nối hoạt động trước khi triển khai cho toàn bộ nhân viên.

{{screenshot:god-mode-swing-sso-config}}

### 5. Cấu hình LDAP

Nhấn **Configure** trên thẻ LDAP → điền các trường máy chủ LDAP → **Save changes**:

| Trường               | Mô tả                                                                  |
| -------------------- | ---------------------------------------------------------------------- |
| **Server URI**       | Địa chỉ máy chủ LDAP (vd: `ldap://ad.example.com:389`)                  |
| **Bind DN**          | DN của tài khoản dịch vụ dùng để tra cứu người dùng                    |
| **Bind password**    | Mật khẩu tài khoản dịch vụ — được lưu mã hóa                           |
| **User search base** | Base DN để tìm người dùng (vd: `OU=Users,DC=example,DC=com`)           |
| **User filter**      | Bộ lọc tìm người dùng, dùng `%(user)s` thay cho tên đăng nhập          |

Bật thêm toggle **Use STARTTLS** nếu máy chủ yêu cầu mã hóa kết nối.

## Mẹo & lưu ý

- Khi Swing SSO được bật và cấu hình đúng, nhân viên có thể đăng nhập bằng tài khoản mạng nội bộ ngân hàng mà không cần nhớ mật khẩu Shinhan Workspace riêng.
- Nên **tắt đăng ký tự do** (toggle Allow sign up) để chỉ nhân viên được mời mới vào hệ thống.
- Client Secret được lưu mã hóa — không hiển thị lại sau khi lưu; lưu lại ở nơi an toàn trước khi nhập.
- Nếu cần kiểm tra lại cấu hình hiện tại, vào trang Configure của từng phương thức — các trường sẽ hiển thị giá trị đã lưu (trừ Secret).

## Liên quan

- [Giới thiệu God Mode](/help/a/gioi-thieu-god-mode)
- [Quản lý người dùng & workspace](/help/a/quan-ly-nguoi-dung-va-workspace)
- [Hồ sơ cá nhân](/help/a/ho-so-ca-nhan)
