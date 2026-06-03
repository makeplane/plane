---
category: tinh-nang-shbvn
slug: phong-ban-va-so-do-to-chuc
sort_order: 50000
title: "Phòng ban & sơ đồ tổ chức"
status: published
---

## Mục đích

Shinhan Workspace lưu trữ **cây phòng ban** phản ánh cơ cấu tổ chức của ngân hàng và hiển thị **sơ đồ tổ chức** (org chart) trực quan theo dạng cây. Quản trị viên dùng God Mode để duy trì cây phòng ban; nhân viên xem sơ đồ để tra cứu cơ cấu.

## Khi nào dùng / Yêu cầu

- **Xem sơ đồ tổ chức**: tính năng đang được triển khai — hiện liên hệ quản trị viên để tra cứu cơ cấu tổ chức.
- **Quản lý phòng ban** (tạo/sửa/xóa, liên kết workspace, import/export): yêu cầu quyền **Instance Admin** — thực hiện trong **God Mode → Departments**.

---

## Xem sơ đồ tổ chức (nhân viên)

> **Lưu ý:** Giao diện Org Chart dành cho nhân viên đang được triển khai. Hiện tại chưa có mục này trên thanh bên. Nếu cần tra cứu cơ cấu phòng ban, vui lòng liên hệ quản trị viên hệ thống.

---

## Quản lý phòng ban trong God Mode (Admin)

> Thao tác dưới đây thực hiện tại **God Mode → Departments** (giao diện tiếng Anh).

### Tạo phòng ban mới

1. Vào **God Mode** → **Departments**.
2. Nhấp **Add Department** (nút xanh, góc phải trên).
3. Điền **Name** (bắt buộc), chọn **Parent department** (nếu là bộ phận trực thuộc). Các trường tùy chọn: **Code**, **Short name** (IN HOA, tối thiểu 2 ký tự, duy nhất), **Dept code** (đúng 4 chữ số), **Dept Type** (HO / BRX / OSR), **Sort Order**.
4. Nhấp **Create** — phòng ban xuất hiện ngay trong cây. (Khi sửa phòng ban, nút này là **Save changes**.)

{{screenshot:phong-ban-god-mode-department-tree}}

### Sửa và xóa phòng ban

1. Tìm phòng ban trong cây → nhấp **Edit** (bút chì) hoặc **Delete** (thùng rác) trên dòng tương ứng.
2. Xóa phòng ban cha sẽ xóa toàn bộ nhánh con — hệ thống yêu cầu xác nhận trước khi thực hiện.

### Liên kết workspace với phòng ban

1. Trên dòng phòng ban → nhấp **Link workspace** (dropdown nội tuyến, chỉ hiện khi phòng ban chưa liên kết workspace nào).
2. Chọn workspace muốn liên kết — mỗi phòng ban liên kết **đúng một** workspace. Khi liên kết, hệ thống tự thêm toàn bộ nhân viên phòng ban vào workspace (chạy nền nếu trên 20 người) và thêm trưởng phòng làm **Admin** (có popup "Managers added as Admin").
3. Sau khi liên kết, dòng phòng ban hiện tên workspace cùng nút **Unlink**; muốn đổi, nhấp Unlink rồi liên kết lại.
4. Liên kết này giúp HO Dashboard nhóm công việc đúng theo phòng ban.

### Auto Join (join trưởng phòng vào project)

**Auto Join** (biểu tượng người+ trên dòng phòng ban) join **trưởng phòng** (manager) của phòng ban đó làm **Admin** vào các project trong workspace liên kết. Đây **không** phải toggle tự động thêm nhân viên mới vào workspace.

1. Trên dòng phòng ban → nhấp **Auto Join**.
2. Chọn phạm vi: **All Projects** (mọi project trong workspace liên kết) hoặc **Bank-wide Projects** → nhấp **Auto Join**. (Không có lựa chọn workspace hay vai trò — vai trò luôn là Admin.)

### Import / Export phòng ban

- **Export Dept**: tải về file Excel (.xlsx) danh sách phòng ban hiện tại.
- **Import Dept**: vào **Departments → Import** → nhấn **Download template** để lấy file mẫu, rồi tải lên file Excel (.xlsx/.xls) theo mẫu để tạo hàng loạt (CSV không được chấp nhận). Tối đa **500 dòng**, **5 MB**. Cột bắt buộc: `name`, `short_name`, `dept_code`, `dept_type`; cột tùy chọn: `code`, `parent_code`, `manager_email`.
- **Export Workspace Linked**: xuất danh sách liên kết phòng ban ↔ workspace.
- **Export Linked Categories**: xuất danh sách liên kết phòng ban ↔ danh mục công việc.

{{screenshot:phong-ban-god-mode-import-export}}

### Liên kết hàng loạt (Bulk)

1. Nhấp **Bulk Linked** để liên kết workspace cho nhiều phòng ban cùng lúc — mở modal "Bulk Link Departments to Workspaces", tải lên file Excel có 2 cột `code` và `workspace_slug` (tối đa 500 dòng). Hữu ích khi quản lý nhiều workspace.
2. Nhấp **Bulk Linked Categories** để gán hàng loạt danh mục công việc (Task Categories) cho các phòng ban.
3. Danh mục được liên kết sẽ tự động gợi ý khi nhân viên phòng ban đó tạo công việc — phạm vi gợi ý dựa trên phòng ban liên kết với workspace đó cộng các phòng ban cấp cha (ancestor), nên danh mục của phòng ban cha cũng có thể xuất hiện.

## Mẹo & lưu ý

- **Rejoin All Managers**: nút **Rejoin** trong God Mode → Departments join lại tất cả **trưởng phòng** (department managers) làm Admin vào project — có thể chọn All Projects hoặc chỉ Bank-wide Projects. Đây là phiên bản áp dụng cho mọi phòng ban; **Auto Join** (xem mục trên) làm điều tương tự nhưng chỉ cho trưởng phòng của một phòng ban cụ thể.
- **Org Chart rỗng**: nếu org chart hiển thị trống với người dùng, kiểm tra xem phòng ban đã được liên kết đúng workspace trong God Mode chưa.
- **Phân cấp tối đa 6 cấp**: cây phòng ban hỗ trợ lồng nhau đến 6 cấp, nên giữ dưới 4 cấp để org chart dễ đọc.
- **Quản lý nhân sự (Staff)**: danh sách nhân viên và trạng thái tuyển dụng quản lý riêng tại **God Mode → Staff** — xem bài [Hướng dẫn Quản trị (God Mode)](/help/a/quan-ly-nhan-su-va-to-chuc).

## Liên quan

- [Head Office Dashboard](/help/a/head-office-dashboard)
- [Quản lý thành viên](/help/a/quan-ly-thanh-vien)
- [Hướng dẫn Quản trị (God Mode)](/help/a/quan-ly-nhan-su-va-to-chuc)
