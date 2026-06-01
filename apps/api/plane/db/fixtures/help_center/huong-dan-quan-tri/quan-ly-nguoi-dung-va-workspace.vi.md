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
2. Điền **First name** (bắt buộc), **Last name** (tùy chọn), **Email** (bắt buộc), và **Password** ban đầu (bắt buộc, tối thiểu 8 ký tự).
3. Nhấn **Create** — tài khoản tạo ngay, người dùng có thể đăng nhập và đổi mật khẩu.

{{screenshot:god-mode-create-user-form}}

### 3. Import người dùng hàng loạt (CSV)

1. Nhấn **Bulk import** → trang import mở ra.
2. Chuẩn bị file CSV (UTF-8) có dòng tiêu đề với đúng các cột: `first_name`, `last_name`, `email`, `password` (mật khẩu tối thiểu 8 ký tự). Trang không có file mẫu tải sẵn — làm theo danh sách cột hiển thị trên trang. Mỗi lần import tối đa **500 dòng**, file ≤ **5MB**.
3. Chọn file CSV → nhấn **Import users**.
4. Sau khi chạy, hệ thống hiển thị số tài khoản đã tạo và bảng các dòng bị bỏ qua kèm lý do (email trống/sai định dạng, thiếu tên, mật khẩu dưới 8 ký tự, hoặc email đã tồn tại).

{{screenshot:god-mode-bulk-import-users}}

### 4. Xem chi tiết & đặt lại mật khẩu

1. Nhấn vào tên người dùng trong danh sách → trang chi tiết mở.
2. Tại đây xem thông tin tài khoản và các workspace đã tham gia. Nhấn **Add to Workspace** để gán nhân viên vào một hoặc nhiều workspace và chọn vai trò (**Admin** / **Member** / **Guest**) — đây là cách chính để cấp quyền truy cập workspace cho nhân viên.
3. Nhấn **Reset Password** → hệ thống sinh một mật khẩu ngẫu nhiên mới và hiển thị ngay trong hộp thoại; Admin nhấn biểu tượng copy rồi gửi cho nhân viên qua kênh an toàn. Mật khẩu chỉ hiển thị một lần và **không** gửi email tự động.

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

1. Nhấn **Create workspace** → điền **Tên workspace**, **URL/slug** (URL định danh), và chọn **quy mô** (số người dùng dự kiến — bắt buộc; nút Create bị vô hiệu nếu để trống). Owner mặc định là Instance Admin đang tạo.
2. Nhấn **Create workspace** — workspace sẵn sàng sử dụng ngay.

### 4. Tạo workspace hàng loạt & gán thành viên

God Mode cung cấp các luồng hàng loạt:

| Nút                       | Chức năng                                   |
| ------------------------- | ------------------------------------------- |
| **Bulk Create Workspace** | Tạo nhiều workspace từ file import          |
| **Bulk Assign Workspace** | Gán nhiều người dùng vào workspace cùng lúc |
| **Bulk Import Projects**  | Import dự án vào workspace từ file          |
| **Bulk Import Modules**   | Import module từ file                       |

Khác với import người dùng, các luồng Bulk Workspace dùng định dạng **Excel (.xlsx)**, có nút **Download template** để tải file mẫu (vd: Bulk Create Workspace cần cột `name` + `organization_size`) và có bước **xem trước** trước khi thực thi.

{{screenshot:god-mode-workspace-bulk-actions}}

## Mẹo & lưu ý

- Chỉ vào được trang chi tiết workspace nếu Instance Admin là **thành viên hoặc Admin** của workspace đó — không phải mọi workspace đều truy cập trực tiếp được từ God Mode.
- Khi import người dùng hàng loạt, email trùng lặp sẽ bị bỏ qua (không ghi đè tài khoản hiện có).
- Mật khẩu mới (khi tạo tài khoản hoặc Reset Password) do Admin tự bàn giao thủ công; God Mode **không** gửi email tự động cho việc tạo/đổi mật khẩu nhân viên.

## Liên quan

- [Giới thiệu God Mode](/help/a/gioi-thieu-god-mode)
- [Cấu hình xác thực & SSO](/help/a/cau-hinh-xac-thuc)
- [Quản lý nhân sự & tổ chức](/help/a/quan-ly-nhan-su-va-to-chuc)
