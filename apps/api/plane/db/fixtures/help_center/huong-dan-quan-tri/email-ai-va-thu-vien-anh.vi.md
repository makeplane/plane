---
category: huong-dan-quan-tri
slug: email-ai-va-thu-vien-anh
sort_order: 30000
title: "Email, AI & thư viện ảnh"
status: published
---

## Mục đích

Ba trang cấu hình này trong God Mode cho phép Instance Admin thiết lập máy chủ email gửi thông báo hệ thống, kết nối dịch vụ AI cho tính năng Ask Pi, và cấp quyền truy cập thư viện ảnh bìa Unsplash.

## Khi nào dùng / Yêu cầu

- Vai trò: **Instance Admin**.
- **Email**: bắt buộc cấu hình để hệ thống gửi được thông báo, lời mời thành viên, và đặt lại mật khẩu.
- **AI** và **Images**: tùy chọn — chỉ cần thiết khi muốn bật tính năng Ask Pi hoặc cho phép chọn ảnh bìa từ Unsplash.

---

## A. Cấu hình Email (SMTP)

### Các bước

1. Vào **God Mode** → **Email** ở thanh bên.
2. Điền các trường trong phần cấu hình SMTP:

| Trường           | Ví dụ                                       |
| ---------------- | ------------------------------------------- |
| **Host**         | `smtp.office365.com`                        |
| **Port**         | `587`                                       |
| **From address** | `no-reply@shbvn.com.vn`                     |
| **Username**     | Tài khoản email gửi                         |
| **Password**     | Mật khẩu hoặc app password                  |
| **Security**     | Chọn `TLS`, `SSL`, hoặc `No email security` |

{{screenshot:god-mode-email-smtp-form}}

3. Nhấn **Save changes**.
4. Nhấn **Send Test Email** → nhập địa chỉ email nhận thử → xác nhận email đến để kiểm tra kết nối.

{{screenshot:god-mode-email-test-modal}}

### Mẹo & lưu ý

- Nếu chưa cấu hình SMTP, Shinhan Workspace không gửi được email mời thành viên hoặc thông báo.
- Toggle **ENABLE_SMTP** phải bật để sử dụng cấu hình vừa điền.
- Mật khẩu SMTP được lưu mã hóa; lưu lại riêng trước khi nhập.

---

## B. Cấu hình AI

Tính năng **Ask Pi** trong trình soạn thảo Trang sử dụng model ngôn ngữ lớn (LLM) qua API key. Mặc định, Shinhan Workspace kết nối OpenAI.

### Các bước

1. Vào **God Mode** → **AI** ở thanh bên.
2. Điền hai trường trong phần **OpenAI**:

| Trường        | Mô tả                                             |
| ------------- | ------------------------------------------------- |
| **LLM Model** | Tên model, ví dụ `gpt-4o-mini`                    |
| **API key**   | Khóa API từ tài khoản OpenAI (bắt đầu bằng `sk-`) |

{{screenshot:god-mode-ai-config}}

3. Nhấn **Save changes**.

### Mẹo & lưu ý

- Nếu để trống, tính năng Ask Pi bị vô hiệu hóa với toàn bộ người dùng.
- API key được lưu mã hóa; không hiển thị lại toàn bộ sau khi lưu.
- Muốn dùng nhà cung cấp AI khác (không phải OpenAI), liên hệ nhóm kỹ thuật — cần cấu hình backend thêm.

---

## C. Cấu hình thư viện ảnh (Unsplash)

Khi tạo hoặc chỉnh sửa dự án và trang tài liệu, người dùng có thể chọn ảnh bìa từ Unsplash. Tính năng này yêu cầu Access Key từ tài khoản Unsplash developer.

### Các bước

1. Vào **God Mode** → **Images** ở thanh bên.
2. Điền trường **Access key from your Unsplash account**.

{{screenshot:god-mode-image-unsplash-form}}

3. Nhấn **Save changes**.

### Mẹo & lưu ý

- Nếu để trống, ô chọn ảnh từ Unsplash sẽ không hiển thị ảnh gợi ý — người dùng vẫn tải ảnh lên trực tiếp từ máy tính được.
- Lấy Access Key miễn phí tại [unsplash.com/developers](https://unsplash.com/developers) → tạo ứng dụng → sao chép **Access Key** (không phải Secret key).

---

## Liên quan

- [Giới thiệu God Mode](/help/a/gioi-thieu-god-mode)
- [Cộng tác & AI trên trang](/help/a/cong-tac-va-ai-tren-trang)
- [Viết tài liệu trên Trang](/help/a/viet-tai-lieu-tren-trang)
