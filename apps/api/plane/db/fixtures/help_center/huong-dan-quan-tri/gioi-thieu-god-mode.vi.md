---
category: huong-dan-quan-tri
slug: gioi-thieu-god-mode
sort_order: 10000
title: "Giới thiệu God Mode"
status: published
---

## Mục đích

God Mode là bảng điều khiển quản trị toàn hệ thống dành riêng cho **Instance Administrator** — người cài đặt và vận hành Shinhan Workspace. Tại đây, quản trị viên cấu hình mọi thứ từ phương thức đăng nhập, email, đến quản lý người dùng và tổ chức, mà không cần vào bất kỳ workspace cụ thể nào.

## Khi nào dùng / Yêu cầu

Chỉ tài khoản có vai trò **Instance Admin** mới truy cập được God Mode. Nhân viên thông thường không thấy mục này trong giao diện.

## Các bước truy cập God Mode

1. Đăng nhập vào Shinhan Workspace bằng tài khoản Instance Admin.
2. Nhấn vào **avatar** ở góc dưới bên trái thanh bên để mở User Menu.
3. Chọn **God Mode** trong menu xuất hiện.

{{screenshot:god-mode-user-menu}}

4. Trình duyệt chuyển sang trang quản trị tại địa chỉ `/god-mode/` — giao diện tiếng Anh riêng biệt với Shinhan Workspace thông thường.

{{screenshot:god-mode-dashboard}}

## Tổng quan bảng điều khiển God Mode

Sau khi vào God Mode, thanh bên hiển thị các mục chính:

| Mục                   | Mô tả ngắn                                     |
| --------------------- | ---------------------------------------------- |
| **General**           | Tên instance, ID, bật/tắt telemetry            |
| **Authentication**    | Cấu hình phương thức đăng nhập (local, SSO...) |
| **Email**             | Thiết lập SMTP để gửi email hệ thống           |
| **Artificial intelligence** | API key cho tính năng AI (Ask Pi)        |
| **Images**            | API key thư viện ảnh (Unsplash)                |
| **Users**             | Danh sách, tạo, import người dùng              |
| **Workspaces**        | Quản lý tất cả workspace trên instance         |
| **Staff**             | Hồ sơ nhân sự SHBVN                            |
| **Departments**       | Cây phòng ban, liên kết workspace              |
| **Job Positions**     | Ngạch, chức danh — truy cập qua URL `/god-mode/job-positions` (không hiển thị trên thanh bên) |
| **Task Categories**   | Danh mục công việc                             |
| **Business Calendar** | Lịch làm việc & ngày lễ                        |
| **Monitoring**        | Email log, scheduled jobs, worker health       |
| **Help Center**       | Soạn thảo bài hướng dẫn này                    |

### Cấu hình chung (General)

Tại trang **General**, quản trị viên có thể:

- Sửa **tên instance** (hiện thị trong một số email hệ thống).
- Xem **email admin** và **Instance ID** (chỉ đọc — dùng khi liên hệ hỗ trợ).
- Bật/tắt **thu thập dữ liệu ẩn danh** (telemetry) — không thu thập thông tin cá nhân.

{{screenshot:god-mode-general-settings}}

Nhấn **Save changes** để lưu sau mỗi thay đổi.

## Mẹo & lưu ý

- God Mode chạy trên cổng/đường dẫn riêng — không phải workspace Shinhan Workspace thông thường. URL dạng `https://<domain>/god-mode/`.
- Toàn bộ giao diện God Mode là **tiếng Anh**; bài hướng dẫn này mô tả đúng giao diện tiếng Anh đó.
- Chỉ nên có **một hoặc một vài** Instance Admin. Tránh cấp quyền này rộng rãi.
- Thay đổi trong God Mode có hiệu lực ngay với toàn bộ người dùng trên instance.

## Liên quan

- [Cấu hình xác thực & SSO](/help/a/cau-hinh-xac-thuc)
- [Quản lý người dùng & workspace](/help/a/quan-ly-nguoi-dung-va-workspace)
- [Lịch làm việc & giám sát](/help/a/lich-lam-viec-va-giam-sat)
