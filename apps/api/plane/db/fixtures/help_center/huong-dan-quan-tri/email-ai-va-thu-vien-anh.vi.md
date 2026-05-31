---
category: huong-dan-quan-tri
slug: email-ai-va-thu-vien-anh
sort_order: 30000
title: "Email, AI & thư viện ảnh"
status: published
---

## Mục đích

Ba trang cấu hình này trong God Mode cho phép Instance Admin thiết lập máy chủ email gửi thông báo hệ thống, kết nối dịch vụ AI cho tính năng Ask Pi, và cấp quyền truy cập thư viện ảnh bìa Unsplash dùng cho ảnh bìa dự án và hồ sơ cá nhân.

## Khi nào dùng / Yêu cầu

- Vai trò: **Instance Admin**.
- **Email**: bắt buộc cấu hình để hệ thống gửi được thông báo, lời mời thành viên, và đặt lại mật khẩu.
- **Artificial intelligence** và **Images in Plane**: tùy chọn — chỉ cần thiết khi muốn bật tính năng Ask Pi hoặc cho phép chọn ảnh bìa từ Unsplash.

---

## A. Cấu hình Email (SMTP)

### Các bước

1. Vào **God Mode** → **Email** ở thanh bên.
2. Bật **công tắc (toggle)** ở góc trên trang Email — form cấu hình SMTP chỉ hiện sau khi toggle được bật.
3. Điền các trường bắt buộc trong form SMTP:

| Trường                     | Ví dụ                                       |
| -------------------------- | ------------------------------------------- |
| **Host**                   | `smtp.office365.com`                        |
| **Port**                   | `587`                                       |
| **Sender's email address** | `no-reply@shbvn.com.vn`                     |
| **Security**               | Chọn `TLS`, `SSL`, hoặc `No email security` |

Trong mục **Authentication** (tùy chọn, khuyến nghị) có thêm **Username** (tài khoản email gửi) và **Password** (mật khẩu hoặc app password) — không bắt buộc nhưng nên điền cho máy chủ SMTP yêu cầu xác thực.

{{screenshot:god-mode-email-smtp-form}}

4. Nhấn **Save changes**.
5. Nhấn **Send test email** → nhập địa chỉ email nhận thử → nhấn **Send email** → xác nhận email đến để kiểm tra kết nối. Nên test trước khi lưu vì cấu hình sai có thể gây lỗi gửi (bounce).

{{screenshot:god-mode-email-test-modal}}

### Mẹo & lưu ý

- Nếu chưa cấu hình SMTP, Shinhan Workspace không gửi được email mời thành viên hoặc thông báo.
- Công tắc ở góc trên trang phải bật thì cấu hình vừa điền mới có hiệu lực; tắt công tắc sẽ vô hiệu hóa toàn bộ tính năng email (hiện thông báo _"Email feature disabled"_).
- Cấu hình sai có thể gây lỗi gửi (bounce) — luôn dùng **Send test email** để kiểm tra trước khi lưu.
- Mật khẩu SMTP được lưu mã hóa; lưu lại riêng trước khi nhập.

---

## B. Cấu hình AI

Tính năng **Ask Pi** trong trình soạn thảo Trang sử dụng model ngôn ngữ lớn (LLM) qua API key. Mặc định, Shinhan Workspace kết nối OpenAI.

### Các bước

1. Vào **God Mode** → **Artificial intelligence** ở thanh bên.
2. Điền trường trong phần **OpenAI**:

| Trường        | Mô tả                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| **API key**   | Bắt buộc để bật Ask Pi — khóa API từ tài khoản OpenAI (bắt đầu bằng `sk-`) |
| **LLM Model** | Tùy chọn — tên model (vd: `gpt-4o-mini`); để trống thì dùng mặc định `gpt-4o-mini` |

{{screenshot:god-mode-ai-config}}

3. Nhấn **Save changes**.

### Mẹo & lưu ý

- Nếu để trống, tính năng Ask Pi bị vô hiệu hóa với toàn bộ người dùng.
- API key được lưu mã hóa; không hiển thị lại toàn bộ sau khi lưu.
- Muốn dùng nhà cung cấp AI khác (không phải OpenAI), liên hệ nhóm kỹ thuật — cần cấu hình backend thêm.

---

## C. Cấu hình thư viện ảnh (Unsplash)

Khi tạo hoặc chỉnh sửa dự án (và khi đặt ảnh bìa hồ sơ cá nhân), người dùng có thể chọn ảnh bìa từ Unsplash. Tính năng này yêu cầu Access Key từ tài khoản Unsplash developer.

### Các bước

1. Vào **God Mode** → **Images in Plane** ở thanh bên (đây là tên màn hình gốc; sản phẩm nội bộ vẫn là Shinhan Workspace).
2. Điền trường **Access key from your Unsplash account**.

{{screenshot:god-mode-image-unsplash-form}}

3. Nhấn **Save changes**.

### Mẹo & lưu ý

- Nếu để trống, tab Unsplash trong bộ chọn ảnh bìa sẽ bị ẩn. Hai tab còn lại luôn khả dụng: **Images** (bộ ảnh tĩnh có sẵn) và **Upload** (tải ảnh lên trực tiếp từ máy tính).
- Lấy Access Key miễn phí tại [unsplash.com/developers](https://unsplash.com/developers) → tạo ứng dụng → sao chép **Access Key** (không phải Secret key).

---

## Liên quan

- [Giới thiệu God Mode](/help/a/gioi-thieu-god-mode)
- [Cộng tác & AI trên trang](/help/a/cong-tac-va-ai-tren-trang)
- [Viết tài liệu trên Trang](/help/a/viet-tai-lieu-tren-trang)
