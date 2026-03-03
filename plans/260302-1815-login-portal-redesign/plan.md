# Đề Xuất Cải Tiến Giao Diện Login Portal (Standard Enterprise)

## 1. Mục Tiêu

Cải tiến trang đăng nhập của hệ thống Plane.so để phù hợp với chuẩn Enterprise của nền tảng tài chính/ngân hàng, mang đặc trưng bộ nhận diện thương hiệu của Shinhan Bank Vietnam.

## 2. Các Thay Đổi Đề Xuất

### Phân Bố Bố Cục (Layout)

- **Thiết kế Split-Screen (Chia đôi màn hình):** Đây là thiết kế tiêu chuẩn cho các hệ thống Enterprise SaaS và ngân hàng.
  - **Phía trái:** Khu vực hình ảnh thương hiệu (Brand Hero Image / Abstract Graphic) kết hợp với màu gradient Shinhan Blue và câu khẩu hiệu (Slogan/Tagline).
  - **Phía phải:** Khu vực Form đăng nhập (Login Form) đặt trên nền trắng tinh khiết hoặc xám nhạt (`bg-surface-1`), tạo cảm giác an toàn, tập trung và đáng tin cậy.

### Typography & Màu Sắc (Brand Identity)

- **Màu chủ đạo (Primary):** Shinhan Blue (`#0b51a1` hoặc `#0046AA`), được dùng cho các CTA (Nút Đăng nhập), link text và các điểm nhấn nhận diện thương hiệu.
- **Màu phụ trợ (Secondary/Surface):** Trắng, xám (`#f3f4f6`, `#e5e7eb` tương ứng với các token `bg-surface-1`, `border-color-subtle`).
- **Typography:** Sử dụng Font chữ rõ ràng, hiện đại (Inter / Roboto) phù hợp với cả tiếng Việt và tiếng Anh. Kích thước chữ được tinh chỉnh để tăng độ dễ đọc.

### Form Đăng Nhập

- Các trường nhập liệu (Inputs) sử dụng `bg-layer-2` theo chuẩn framework của Plane, có viền tinh tế và rõ nét khi user focus.
- Thêm icon trong placeholder (ví dụ: icon User/Email và Key/Password).
- Nút bấm (Button) bo góc nhẹ (rounded-md hoặc rounded-lg), tối ưu hiệu ứng hover/active/focus.
- **Loại bỏ form Đăng ký (Sign Up):** Phù hợp với thông tin BRD cho nhân viên nội bộ, không cho phép tự do đăng ký. Chỉ còn Đăng nhập bằng Email/Mã nhân viên (Swing SSO).

## 3. Bản Mẫu Prototype

Tôi đã tạo một file Prototype tĩnh viết bằng HTML/Tailwind CSS để bạn có thể xem trước giao diện trực quan ngay trên trình duyệt mà không cần can thiệp vào code hệ thống hiện tại.

Vui lòng mở file sau trên trình duyệt (Chrome/Edge/Safari/Firefox...) để xem thiết kế đề xuất:
👉 **[prototype.html](./prototype.html)** (Nằm cùng thư mục folder `plans/260302-1815-login-portal-redesign/prototype.html`)

---

**Quyết định phê duyệt:** Vui lòng xác nhận để tôi có thể tiến hành tích hợp mẫu thiết kế này vào mã nguồn React/Tailwind chuẩn của ứng dụng `apps/web/app/(all)/[workspaceSlug]` (hoặc module auth) theo đúng quy tắc sử dụng token của repo.
