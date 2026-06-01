---
category: huong-dan-quan-tri
slug: quan-ly-nhan-su-va-to-chuc
sort_order: 50000
title: "Quản lý nhân sự & tổ chức"
status: published
---

## Mục đích

God Mode cung cấp bốn mục quản lý cơ cấu tổ chức SHBVN: **Staff** (hồ sơ nhân sự), **Departments** (cây phòng ban), **Job Positions** (ngạch và chức danh), và **Task Categories** (danh mục công việc). Đây là các tính năng đặc thù của Shinhan Workspace — không có trong phiên bản gốc.

## Khi nào dùng / Yêu cầu

- Vai trò: **Instance Admin**.
- Thực hiện khi cập nhật cơ cấu tổ chức, onboarding nhân viên mới, hoặc định nghĩa danh mục công việc cho toàn ngân hàng.

---

## A. Staff — Hồ sơ nhân sự

### Xem và tìm kiếm

1. Vào **God Mode** → **Staff**.
2. Trang hiển thị 5 thẻ thống kê nhanh: **Total / Active / Probation / Resigned / Suspended**.
3. Dùng ô tìm kiếm (tên hoặc email), dropdown **Status** và **Department** để lọc.

{{screenshot:god-mode-staff-list}}

### Tạo hồ sơ nhân viên

1. Nhấn **Add Staff** (góc trên phải) — mở **trang tạo mới** riêng (không phải hộp thoại).
2. Điền các trường bắt buộc: **Staff ID**, **First name**, **Last name**, **Email** (cùng phòng ban, trạng thái Active / Probation...). Để chọn **Position** (chức danh), phải chọn **Job grade** (ngạch) trước.
3. Nhấn **Create staff** — hồ sơ gắn với tài khoản người dùng qua email.

### Import hàng loạt

1. Nhấn **Import** → mở hộp thoại **Bulk Import Staff**. Tải file mẫu (có sẵn cả **Template (.csv)** và **Template (.xlsx)**).
2. Điền dữ liệu nhân sự theo cột mẫu. Nhập **Default password** (tối thiểu 8 ký tự — dùng cho các tài khoản mới; nút Import bị vô hiệu nếu để trống). Hỗ trợ CSV hoặc Excel, tối đa **500 dòng** mỗi lần.
3. Chọn tùy chọn xử lý trùng: **Skip existing staff** (bỏ qua) hoặc **Update existing staff fields** (cập nhật). Nhấn **Import**.

### Export

Nhấn **Export** → tải về file `staff-export.csv` chứa toàn bộ hồ sơ nhân sự hiện tại.

### Chỉnh sửa hồ sơ

Nhấn nút **Edit** trên dòng nhân viên → hộp thoại **Edit Staff Profile** mở → sửa thông tin → **Save changes**.

Ngoài Edit, mỗi dòng nhân viên còn có các thao tác quản lý vòng đời: **Transfer** (chuyển phòng ban — có cảnh báo khi liên quan nhiều workspace), **Deactivate** (vô hiệu hóa), và **Delete** (xóa vĩnh viễn, không thể hoàn tác).

{{screenshot:god-mode-staff-edit-modal}}

---

## B. Departments — Cây phòng ban

### Xem cây phòng ban

1. Vào **God Mode** → **Departments**.
2. Danh sách hiển thị dạng **cây phân cấp** — phòng ban cha chứa phòng ban con, có thể mở rộng/thu gọn từng nhánh.

{{screenshot:god-mode-departments-tree}}

### Tạo phòng ban

1. Nhấn **Add Department**.
2. Điền tên và chọn phòng ban cha (nếu là phòng ban con).
3. Nhấn **Create** — phòng ban xuất hiện đúng vị trí trong cây. (Khi sửa, nút lưu là **Save changes**.)

### Sửa / Xóa

- Nhấn biểu tượng bút chì trên hàng phòng ban để chỉnh sửa.
- Nhấn biểu tượng thùng rác → xác nhận xóa. **Lưu ý:** xóa phòng ban cha sẽ xóa toàn bộ nhánh con — không thể hoàn tác.

### Liên kết workspace & Auto Join

Trên mỗi hàng phòng ban có **hai control riêng biệt**:

- **Link workspace** (biểu tượng liên kết): dropdown để gán phòng ban với **một** workspace. Sau khi gán, nhân viên trong phòng ban được thêm vào workspace và trưởng phòng được thêm làm **Admin** (không có ô chọn vai trò). Đây là cơ chế thực sự liên kết phòng ban ↔ workspace.
- **Auto Join** (biểu tượng thêm người): mở hộp thoại _"Auto Join — {tên phòng ban}"_ để join **trưởng phòng** làm **Admin** vào project. Chọn phạm vi **All Projects** (mọi project trong workspace đã liên kết) hoặc **Bank-wide Projects** (chỉ project được đánh dấu toàn ngân hàng). Auto Join **không** có ô chọn workspace hay vai trò.

### Import / Export phòng ban

| Nút                          | Chức năng                                                               |
| ---------------------------- | ----------------------------------------------------------------------- |
| **Export Dept**              | Tải cây phòng ban ra Excel (`.xlsx`)                                    |
| **Import Dept**              | Import cây phòng ban từ file Excel (`.xlsx`/`.xls`, theo mẫu tải về)     |
| **Export Workspace Linked**  | Danh sách phòng ban đã liên kết workspace                               |
| **Bulk Linked**              | Liên kết hàng loạt phòng ban với workspace                              |
| **Bulk Linked Categories**   | Gán danh mục công việc cho nhiều phòng ban                              |
| **Export Linked Categories** | Xuất danh sách gán danh mục                                             |
| **Rejoin**                   | Join lại tất cả **trưởng phòng** làm Admin vào project (chọn All Projects hoặc Bank-wide Projects) — áp dụng cho toàn bộ phòng ban, khác với Auto Join trên từng hàng |

{{screenshot:god-mode-departments-toolbar}}

---

## C. Job Positions — Ngạch và chức danh

> **Lưu ý truy cập:** Job Positions không hiển thị trên thanh bên God Mode. Truy cập trực tiếp qua URL: `/god-mode/job-positions`.

1. Vào **God Mode** → điều hướng trực tiếp đến `/god-mode/job-positions`.
2. Giao diện chia đôi: **Job Grades** (ngạch, bên trái) và **Job Positions** (chức danh thuộc ngạch, bên phải).

### Tạo ngạch (Job Grade)

1. Nhấn **Add Job Grade** → điền tên ngạch → **Create**.

### Tạo chức danh (Job Position)

1. Chọn ngạch ở danh sách bên trái.
2. Nhấn **Add Job Position** → điền tên chức danh → **Create**.

{{screenshot:god-mode-job-positions}}

### Import / Export

- **Export**: tải file Excel gồm cả ngạch và chức danh.
- **Import**: tải lên file Excel theo mẫu để tạo hàng loạt.

---

## D. Task Categories — Danh mục công việc

Danh mục công việc dùng để phân loại công việc khi chấm công và báo cáo (xem [Chấm công & timesheet](/help/a/cham-cong-va-timesheet)).

1. Vào **God Mode** → **Task Categories**.
2. Giao diện chia đôi: **Main categories** (danh mục chính, trái) và danh mục con của danh mục đang chọn (phải).

### Tạo danh mục chính

1. Nhấn **Add Main Category** → điền tên, mã (code), thứ tự sắp xếp → **Create**.

### Tạo danh mục con

1. Chọn danh mục chính ở cột trái.
2. Nhấn **Add Sub Category** ở cột phải → điền thông tin → **Create**.

{{screenshot:god-mode-task-categories}}

### Import / Export

- **Export**: tải file Excel gồm cả danh mục chính và con.
- **Import**: tải lên file Excel theo mẫu; hệ thống nhận diện `type` = `main` hoặc `sub` để phân loại.

## Mẹo & lưu ý

- Hồ sơ Staff liên kết với tài khoản người dùng qua **email** — đảm bảo email trùng khớp giữa Staff và Users.
- Xóa phòng ban **không** tự xóa tài khoản người dùng trong phòng ban đó; chỉ xóa thông tin cơ cấu.
- Task Categories sau khi tạo hiển thị trong màn hình log giờ công của nhân viên — cần đặt tên rõ ràng, ngắn gọn để nhân viên dễ chọn.
- Mã (code) của danh mục công việc dùng trong báo cáo export — nên đặt nhất quán theo quy ước nội bộ.

## Liên quan

- [Quản lý người dùng & workspace](/help/a/quan-ly-nguoi-dung-va-workspace)
- [Chấm công & timesheet](/help/a/cham-cong-va-timesheet)
- [Phòng ban & sơ đồ tổ chức](/help/a/phong-ban-va-so-do-to-chuc)
