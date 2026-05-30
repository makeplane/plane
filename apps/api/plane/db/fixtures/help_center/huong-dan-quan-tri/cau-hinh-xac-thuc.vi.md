---
category: huong-dan-quan-tri
slug: cau-hinh-xac-thuc
sort_order: 20000
title: "Cấu hình xác thực & SSO"
status: published
---

## Mục đích

Trang **Authentication** trong God Mode cho phép Instance Admin bật/tắt các phương thức đăng nhập và kiểm soát chính sách đăng ký. Shinhan Workspace hỗ trợ đăng nhập nội bộ (email + mật khẩu), SSO Swing (đặc thù SHBVN), và các nhà cung cấp OAuth tiêu chuẩn.

## Khi nào dùng / Yêu cầu

- Vai trò: **Instance Admin**.
- Thực hiện khi onboarding hệ thống lần đầu, hoặc khi thay đổi chính sách đăng nhập của ngân hàng.

## Các bước cấu hình

### 1. Mở trang Authentication

1. Vào **God Mode** → chọn **Authentication** ở thanh bên trái.
2. Trang hiển thị toggle _Allow anyone to sign up even without an invite_ và danh sách **Available authentication modes**.

{{screenshot:god-mode-authentication-page}}

### 2. Kiểm soát chính sách đăng ký

- **Toggle bật** (_Allow sign up without invite_): bất kỳ ai có email hợp lệ đều tự đăng ký được.
- **Toggle tắt** (khuyến nghị SHBVN): chỉ người nhận lời mời mới tạo được tài khoản.

Thay đổi có hiệu lực ngay, không cần nhấn Save.

### 3. Bật/tắt từng phương thức xác thực

Mỗi phương thức hiển thị dưới dạng thẻ có toggle riêng. Nhấn toggle để bật hoặc tắt:

| Phương thức          | Ghi chú                                |
| -------------------- | -------------------------------------- |
| **Email — Password** | Đăng nhập bằng email + mật khẩu nội bộ |
| **Google**           | OAuth Google Workspace                 |
| **GitHub**           | OAuth GitHub                           |
| **GitLab**           | OAuth GitLab                           |
| **Gitea**            | OAuth Gitea tự host                    |
| **LDAP**             | Active Directory / LDAP nội bộ         |
| **Swing SSO**        | SSO riêng của SHBVN — xem mục bên dưới |

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

4. Sau khi lưu, nhấn **Test Authentication** để xác minh kết nối hoạt động trước khi triển khai cho toàn bộ nhân viên.

{{screenshot:god-mode-swing-sso-config}}

### 5. Cấu hình OAuth khác (Google, GitHub, GitLab, Gitea)

Mỗi nhà cung cấp OAuth có trang cấu hình riêng với trường **Client ID** và **Client Secret**. Quy trình chung:

1. Nhấn **Configure** trên thẻ tương ứng.
2. Điền Client ID và Client Secret lấy từ console của nhà cung cấp.
3. Nhấn **Save changes** và quay lại trang Authentication.

### 6. Cấu hình LDAP

Tương tự OAuth: nhấn **Configure** → điền thông tin máy chủ LDAP (host, port, bind DN, base DN, filter...) → **Save changes**.

## Mẹo & lưu ý

- Khi Swing SSO được bật và cấu hình đúng, nhân viên có thể đăng nhập bằng tài khoản mạng nội bộ ngân hàng mà không cần nhớ mật khẩu Shinhan Workspace riêng.
- Nên **tắt đăng ký tự do** (toggle Allow sign up) để chỉ nhân viên được mời mới vào hệ thống.
- Client Secret được lưu mã hóa — không hiển thị lại sau khi lưu; lưu lại ở nơi an toàn trước khi nhập.
- Nếu cần kiểm tra lại cấu hình hiện tại, vào trang Configure của từng phương thức — các trường sẽ hiển thị giá trị đã lưu (trừ Secret).

## Liên quan

- [Giới thiệu God Mode](/help/a/gioi-thieu-god-mode)
- [Quản lý người dùng & workspace](/help/a/quan-ly-nguoi-dung-va-workspace)
- [Hồ sơ cá nhân](/help/a/ho-so-ca-nhan)
