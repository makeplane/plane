---
category: xem-va-bo-cuc
slug: luu-va-chia-se-views
sort_order: 40000
title: "Lưu & chia sẻ Views"
status: published
---

## Mục đích

**View** (Hiển thị đã lưu) cho phép bạn đóng gói một bộ lọc, nhóm, sắp xếp và thuộc tính hiển thị thành một shortcut có tên — rồi dùng lại bất cứ lúc nào hoặc chia sẻ với cả nhóm. Shinhan Workspace có hai loại View:

- **View dự án** — gắn với một dự án cụ thể; chỉ hiện công việc trong dự án đó.
- **Global View** — ở cấp workspace; có thể lọc công việc từ **nhiều dự án** cùng lúc.

## Khi nào dùng / Yêu cầu

| Loại View   | Ai tạo được                                 | Ai xem được              |
| ----------- | ------------------------------------------- | ------------------------ |
| View dự án  | Thành viên dự án (vai trò Thành viên trở lên) | Toàn bộ thành viên dự án |
| Global View | Thành viên workspace (Quản trị viên hoặc Thành viên) | Toàn workspace   |

> Hiện mọi View đều hiển thị cho toàn bộ thành viên trong phạm vi của nó (View dự án: trong dự án; Global View: trong workspace). Bản đang chạy chưa hỗ trợ tạo View riêng tư qua giao diện.

## Các bước

### Tạo View dự án

1. Mở dự án → vào mục **Views** (biểu tượng kính mắt) ở thanh điều hướng trái.
2. Nhấn **Add view** (hoặc nút **+** góc trên phải).
3. Điền tên, mô tả (tùy chọn) và chọn **Icon** đại diện.
4. Chọn **bố cục mặc định** (List, Kanban, v.v.).
5. Cấu hình **Bộ lọc** (Filters) và **Hiển thị** (Display) theo nhu cầu.
6. Nhấn **Tạo chế độ xem** để lưu.

{{screenshot:luu-va-chia-se-views-project-view-form}}

### Tạo Global View

1. Từ thanh bên trái, nhấn mục **Chế độ xem** (Views ở cấp workspace; đường dẫn `/{workspace}/workspace-views`).
2. Trên thanh tab phía trên, nhấn biểu tượng **+** bên phải danh sách tab.
3. Điền tên, mô tả, chọn bộ lọc đa dự án (có thể lọc theo nhiều dự án, trạng thái, người dùng cùng lúc).
4. Nhấn **Tạo chế độ xem** để lưu.

{{screenshot:luu-va-chia-se-views-global-view-create}}

> Global View không có tùy chọn chọn bố cục khi tạo (khác View dự án); mặc định hiển thị dạng **Bảng tính** (Spreadsheet).
>
> Global View mặc định sẵn có: **Tất cả mục công việc**, **Đã giao**, **Đã tạo**, **Đã đăng ký**. Các view này không thể xóa.

### Mở và dùng lại View đã lưu

- **View dự án**: Mở dự án → mục **Views** → nhấp vào tên view.
- **Global View**: Nhấp vào tab tên view trên thanh **Chế độ xem** (Views ở cấp workspace).

Mỗi lần mở, hệ thống áp dụng ngay bộ lọc + bố cục đã lưu.

> Với **View dự án**, nhấn biểu tượng **ngôi sao** bên cạnh view để thêm vào mục yêu thích, giúp truy cập nhanh từ thanh bên.

### Chỉnh sửa, sao chép liên kết hoặc xóa View

1. Tìm view trong danh sách (Views dự án) hoặc tab (Global View).
2. Nhấn menu **···** (ba chấm) bên cạnh tên. Menu gồm: **Chỉnh sửa**, **Mở trong tab mới**, **Sao chép liên kết**, **Xóa**.
3. Chọn **Chỉnh sửa** để mở lại form; **Sao chép liên kết** để chia sẻ view cho đồng nghiệp; hoặc **Xóa** (xác nhận) để xóa.

> **Chỉ người tạo** mới sửa được view. **Người tạo hoặc Quản trị viên** có thể xóa view. View mặc định (Default, có biểu tượng khóa) do hệ thống tạo sẵn cho mỗi dự án — không thể tự đặt view khác làm mặc định và cũng không thể sửa/xóa view mặc định.

### Xuất Excel

Tính năng **Xuất** có ở **cả Global View và View dự án** (tại trang chi tiết view). Khi đang xem view, nhấn nút **Xuất** trên thanh tiêu đề. File `.xlsx` sẽ được tải xuống máy bạn, chứa tất cả công việc đang hiển thị trong view — bao gồm các cột SHBVN như **Bộ phận**, **Danh mục chính/phụ**, **Thời gian ghi**.

> Nếu view có hơn 500 công việc, hệ thống sẽ hiện cảnh báo trước khi xuất để tránh chờ lâu.

{{screenshot:luu-va-chia-se-views-excel-export}}

## Mẹo & lưu ý

- **Global View** lọc được công việc từ nhiều dự án; View dự án chỉ hiện công việc trong một dự án.
- **Định nghĩa bộ lọc** của View được lưu cố định, nhưng **áp dụng động** mỗi lần mở: thêm công việc mới thỏa điều kiện thì chúng tự xuất hiện, không cần cập nhật thủ công.
- Thay đổi bộ lọc khi đang xem View **không tự động lưu** lại vào View đó — bạn phải nhấn Chỉnh sửa → lưu để cập nhật.
- Tính năng **Xuất** ra Excel có ở **cả Global View và View dự án**.

## Liên quan

- [Các bố cục hiển thị](/help/a/cac-bo-cuc-hien-thi)
- [Lọc, nhóm & sắp xếp](/help/a/loc-nhom-va-sap-xep)
- [Tùy chỉnh cột & thuộc tính hiển thị](/help/a/tuy-chinh-cot-va-thuoc-tinh)
