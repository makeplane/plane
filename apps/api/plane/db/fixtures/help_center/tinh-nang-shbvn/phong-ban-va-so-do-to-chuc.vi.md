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

- **Xem sơ đồ tổ chức**: mọi nhân viên — truy cập từ sidebar workspace → **Org Chart**.
- **Quản lý phòng ban** (tạo/sửa/xóa, liên kết workspace, import/export): yêu cầu quyền **Instance Admin** — thực hiện trong **God Mode → Departments**.

---

## Xem sơ đồ tổ chức (nhân viên)

### Các bước

1. Từ sidebar, chọn **Org Chart** (biểu tượng sơ đồ tổ chức).
2. Cây phòng ban hiển thị theo phân cấp — mỗi nút là một phòng ban, nhánh con là các bộ phận trực thuộc.
3. Nhấp vào nút phòng ban để xem thông tin và danh sách nhân sự (nếu được cấu hình).
4. Nếu chưa có phòng ban nào được thiết lập, trang hiển thị trạng thái trống — liên hệ quản trị viên để cấu hình.

{{screenshot:phong-ban-va-so-do-to-chuc}}

---

## Quản lý phòng ban trong God Mode (Admin)

> Thao tác dưới đây thực hiện tại **God Mode → Departments** (giao diện tiếng Anh).

### Tạo phòng ban mới

1. Vào **God Mode** → **Departments**.
2. Nhấp **Add Department** (nút xanh, góc phải trên).
3. Điền tên phòng ban, chọn phòng ban cha (nếu là bộ phận trực thuộc).
4. Nhấp **Save** — phòng ban xuất hiện ngay trong cây.

{{screenshot:phong-ban-god-mode-department-tree}}

### Sửa và xóa phòng ban

1. Tìm phòng ban trong cây → nhấp **Edit** (bút chì) hoặc **Delete** (thùng rác) trên dòng tương ứng.
2. Xóa phòng ban cha sẽ xóa toàn bộ nhánh con — hệ thống yêu cầu xác nhận trước khi thực hiện.

### Liên kết workspace với phòng ban

1. Trên dòng phòng ban → nhấp **Link Workspace**.
2. Chọn workspace muốn liên kết — mỗi phòng ban có thể liên kết một hoặc nhiều workspace.
3. Liên kết này giúp HO Dashboard nhóm công việc đúng theo phòng ban.

### Cấu hình Auto-join

Khi bật _Auto-join_ cho một phòng ban, nhân viên mới thuộc phòng ban đó tự động được thêm vào workspace liên kết:

1. Nhấp **Auto Join** trên dòng phòng ban.
2. Chọn workspace và vai trò mặc định → **Save**.

### Import / Export phòng ban

- **Export Dept**: tải về file CSV danh sách phòng ban hiện tại.
- **Import Dept**: vào **Departments → Import** → tải lên file CSV theo mẫu để tạo hàng loạt.
- **Export Workspace Linked**: xuất danh sách liên kết phòng ban ↔ workspace.
- **Export Linked Categories**: xuất danh sách liên kết phòng ban ↔ danh mục công việc.

{{screenshot:phong-ban-god-mode-import-export}}

### Liên kết danh mục công việc với phòng ban

1. Nhấp **Bulk Linked Categories** để gán hàng loạt danh mục công việc (Task Categories) cho các phòng ban.
2. Danh mục được liên kết sẽ tự động gợi ý khi nhân viên phòng ban đó tạo công việc.

## Mẹo & lưu ý

- **Rejoin All**: nút **Rejoin** trong God Mode → Departments chạy lại toàn bộ tự động gán workspace cho tất cả nhân viên theo cấu hình Auto-join hiện tại — dùng khi có thay đổi cơ cấu lớn.
- **Org Chart rỗng**: nếu org chart hiển thị trống với người dùng, kiểm tra xem phòng ban đã được liên kết đúng workspace trong God Mode chưa.
- **Phân cấp không giới hạn**: cây phòng ban hỗ trợ nhiều cấp lồng nhau, nhưng nên giữ dưới 4 cấp để org chart dễ đọc.
- **Quản lý nhân sự (Staff)**: danh sách nhân viên và trạng thái tuyển dụng quản lý riêng tại **God Mode → Staff** — xem bài [Hướng dẫn Quản trị (God Mode)](/help/a/quan-ly-nhan-su-va-to-chuc).

## Liên quan

- [Head Office Dashboard](/help/a/head-office-dashboard)
- [Quản lý thành viên](/help/a/quan-ly-thanh-vien)
- [Hướng dẫn Quản trị (God Mode)](/help/a/quan-ly-nhan-su-va-to-chuc)
