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

Chỉ tài khoản có vai trò **Instance Admin** mới truy cập được God Mode. Quyền này được kiểm soát ở tầng máy chủ (backend) — người không phải Instance Admin sẽ bị từ chối ngay cả khi mở trực tiếp đường dẫn.

## Các bước truy cập God Mode

1. Đăng nhập vào Shinhan Workspace bằng tài khoản Instance Admin.
2. Truy cập trực tiếp địa chỉ `/god-mode/` trên trình duyệt (vd: `https://<domain>/god-mode/`).
3. Trình duyệt mở trang quản trị tại `/god-mode/` — giao diện tiếng Anh riêng biệt với Shinhan Workspace thông thường.

{{screenshot:god-mode-dashboard}}

## Tổng quan bảng điều khiển God Mode

Sau khi vào God Mode, thanh bên hiển thị **13 mục**. Bảng dưới liệt kê thêm Job Positions (truy cập qua URL, không nằm trên thanh bên):

| Mục                   | Mô tả ngắn                                     |
| --------------------- | ---------------------------------------------- |
| **General**           | Tên instance, ID, bật/tắt telemetry            |
| **Authentication**    | Cấu hình phương thức đăng nhập (local, SSO...) |
| **Email**             | Thiết lập SMTP để gửi email hệ thống           |
| **Artificial intelligence** | API key cho tính năng AI (Ask Pi)        |
| **Images in Plane**   | API key thư viện ảnh (Unsplash)                |
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

- Sửa **tên định danh instance** (Name of instance).
- Xem **email admin** và **Instance ID** (chỉ đọc — dùng khi liên hệ hỗ trợ).
- Bật/tắt **thu thập dữ liệu ẩn danh** (telemetry) — không thu thập thông tin cá nhân. Trang còn có cụm **Chat + telemetry** (live chat Intercom): tắt telemetry sẽ tự động tắt luôn Intercom.

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
