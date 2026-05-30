---
category: huong-dan-quan-tri
slug: quan-ly-nguoi-dung-va-workspace
sort_order: 40000
title: "Quản lý người dùng & workspace"
status: published
---

## Mục đích

Trang **Users** và **Workspaces** trong God Mode cho phép Instance Admin xem toàn bộ tài khoản và workspace trên hệ thống, tạo hoặc import người dùng hàng loạt, gán workspace, và kiểm soát ai được phép tạo workspace mới.

## Khi nào dùng / Yêu cầu

- Vai trò: **Instance Admin**.
- Dùng khi onboarding nhân viên mới hàng loạt, cần tra cứu tài khoản, hoặc cần khóa quyền tự tạo workspace.

---

## A. Quản lý người dùng

### 1. Xem danh sách người dùng

1. Vào **God Mode** → **Users**.
2. Trang hiển thị tất cả tài khoản trên instance với thanh tìm kiếm theo tên hoặc email.
3. Cuộn xuống hoặc nhấn **Load more** để xem thêm (danh sách phân trang).

{{screenshot:god-mode-users-list}}

### 2. Tạo người dùng đơn lẻ

1. Nhấn **Create user** (góc trên phải).
2. Điền họ tên, email, và mật khẩu ban đầu.
3. Nhấn **Create** — tài khoản tạo ngay, người dùng có thể đăng nhập và đổi mật khẩu.

{{screenshot:god-mode-create-user-form}}

### 3. Import người dùng hàng loạt (CSV / Excel)

1. Nhấn **Bulk import** → trang import mở ra.
2. Tải về file mẫu để xem đúng định dạng cột (email, first name, last name, role...).
3. Điền dữ liệu vào file mẫu, lưu dưới dạng CSV hoặc Excel.
4. Tải file lên → xem trước danh sách → nhấn **Import**.
5. Hệ thống tạo tài khoản cho tất cả dòng hợp lệ; các dòng lỗi hiển thị riêng để sửa lại.

{{screenshot:god-mode-bulk-import-users}}

### 4. Xem chi tiết & đặt lại mật khẩu

1. Nhấn vào tên người dùng trong danh sách → trang chi tiết mở.
2. Tại đây xem thông tin tài khoản, các workspace đã tham gia.
3. Nhấn **Reset password** để gửi email đặt lại mật khẩu cho người dùng đó.

{{screenshot:god-mode-user-detail}}

---

## B. Quản lý workspace

### 1. Xem danh sách workspace

1. Vào **God Mode** → **Workspaces**.
2. Trang hiển thị tất cả workspace kèm thông tin thành viên.
3. Dùng ô tìm kiếm để lọc theo tên hoặc slug.
4. Nhấn **Export** để tải danh sách workspace ra file Excel.

{{screenshot:god-mode-workspaces-list}}

### 2. Kiểm soát quyền tạo workspace

Ở đầu trang Workspaces có toggle:

> _"Prevent anyone else from creating a workspace."_

- **Bật toggle** → chỉ Instance Admin mới tạo được workspace mới. Toàn bộ nhân viên muốn có workspace phải qua Admin.
- **Tắt toggle** (mặc định) → bất kỳ người dùng nào cũng tự tạo workspace.

Khuyến nghị SHBVN: **bật toggle** để kiểm soát số lượng workspace theo đúng cơ cấu tổ chức.

### 3. Tạo workspace đơn lẻ

1. Nhấn **Create workspace** → điền tên, slug (URL định danh), và chọn owner.
2. Nhấn **Create** — workspace sẵn sàng sử dụng ngay.

### 4. Tạo workspace hàng loạt & gán thành viên

God Mode cung cấp ba luồng hàng loạt:

| Nút                       | Chức năng                                   |
| ------------------------- | ------------------------------------------- |
| **Bulk Create Workspace** | Tạo nhiều workspace từ file import          |
| **Bulk Assign Workspace** | Gán nhiều người dùng vào workspace cùng lúc |
| **Bulk Import Projects**  | Import dự án vào workspace từ file          |
| **Bulk Import Modules**   | Import module từ file                       |

Mỗi luồng đều có trang riêng với hướng dẫn định dạng file và xem trước trước khi thực thi.

{{screenshot:god-mode-workspace-bulk-actions}}

## Mẹo & lưu ý

- Chỉ vào được trang chi tiết workspace nếu Instance Admin là **thành viên hoặc Admin** của workspace đó — không phải mọi workspace đều truy cập trực tiếp được từ God Mode.
- Khi import người dùng hàng loạt, email trùng lặp sẽ bị bỏ qua (không ghi đè tài khoản hiện có).
- Đặt lại mật khẩu gửi email — yêu cầu SMTP đã cấu hình hoạt động (xem [Email, AI & thư viện ảnh](/help/a/email-ai-va-thu-vien-anh)).

## Liên quan

- [Giới thiệu God Mode](/help/a/gioi-thieu-god-mode)
- [Cấu hình xác thực & SSO](/help/a/cau-hinh-xac-thuc)
- [Quản lý nhân sự & tổ chức](/help/a/quan-ly-nhan-su-va-to-chuc)
