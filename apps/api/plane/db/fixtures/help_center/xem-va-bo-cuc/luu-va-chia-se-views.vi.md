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

| Loại View                  | Ai tạo được                               | Ai xem được                    |
| -------------------------- | ----------------------------------------- | ------------------------------ |
| View dự án — **Công khai** | Thành viên dự án (vai trò Member trở lên) | Toàn bộ thành viên dự án       |
| View dự án — **Riêng tư**  | Bất kỳ thành viên nào                     | Chỉ người tạo                  |
| Global View                | Thành viên workspace (Admin hoặc Member)  | Toàn workspace (nếu công khai) |

## Các bước

### Tạo View dự án

1. Mở dự án → vào mục **Views** (biểu tượng kính mắt) ở thanh điều hướng trái.
2. Nhấn **+ Tạo View** (hoặc nút **+** góc trên phải).
3. Điền tên, mô tả (tùy chọn) và chọn **Icon** đại diện.
4. Chọn **quyền truy cập**: Công khai (Public) hoặc Riêng tư (Private).
5. Chọn **bố cục mặc định** (List, Kanban, v.v.).
6. Cấu hình **Bộ lọc** (Filters) và **Hiển thị** (Display) theo nhu cầu.
7. Nhấn **Tạo View**.

{{screenshot:luu-va-chia-se-views-project-view-form}}

### Tạo Global View

1. Từ thanh bên trái, nhấn **Workspace Views** (hoặc vào `/{workspace}/workspace-views`).
2. Trên thanh tab phía trên, nhấn biểu tượng **+** bên phải danh sách tab.
3. Điền tên, mô tả, chọn bộ lọc đa dự án (có thể lọc theo nhiều dự án, trạng thái, người dùng cùng lúc).
4. Nhấn **Tạo View**.

{{screenshot:luu-va-chia-se-views-global-view-create}}

> Global View mặc định sẵn có: **Tất cả công việc**, **Công việc của tôi**, **Được tạo bởi tôi**, **Đề cập đến tôi**. Các view này không thể xóa.

### Mở và dùng lại View đã lưu

- **View dự án**: Mở dự án → mục **Views** → nhấp vào tên view.
- **Global View**: Nhấp vào tab tên view trên thanh **Workspace Views**.

Mỗi lần mở, hệ thống áp dụng ngay bộ lọc + bố cục đã lưu.

### Chỉnh sửa hoặc xóa View

1. Tìm view trong danh sách (Views dự án) hoặc tab (Global View).
2. Nhấn menu **···** (ba chấm) bên cạnh tên.
3. Chọn **Chỉnh sửa** để mở lại form; hoặc **Xóa** (xác nhận) để xóa.

> Chỉ người tạo hoặc Admin mới có thể sửa/xóa view công khai. View mặc định (Default) không thể sửa/xóa.

### Đặt View làm mặc định

View mặc định sẽ mở tự động khi bạn vào trang Views của dự án. Trong menu **···** → chọn **Đặt làm mặc định** (Set as default).

### Xuất Excel từ Global View

Khi đang xem một Global View, nhấn nút **Xuất Excel** (Export) trên thanh tiêu đề. File `.xlsx` sẽ được tải xuống máy bạn, chứa tất cả công việc đang hiển thị trong view — bao gồm các cột SHBVN như Phòng ban, Danh mục, Tổng giờ công.

> Nếu view có hơn 500 công việc, hệ thống sẽ hiện cảnh báo trước khi xuất để tránh chờ lâu.

{{screenshot:luu-va-chia-se-views-excel-export}}

## Mẹo & lưu ý

- **View riêng tư** chỉ có bạn thấy — phù hợp khi bạn muốn lọc "việc của mình hôm nay" mà không muốn chia sẻ với nhóm.
- **Global View** lọc được công việc từ nhiều dự án; View dự án chỉ hiện công việc trong một dự án.
- Bộ lọc trong View là **tĩnh** — nếu bạn thêm công việc mới thỏa điều kiện, chúng tự động xuất hiện trong view; không cần cập nhật thủ công.
- Thay đổi bộ lọc khi đang xem View **không tự động lưu** lại vào View đó — bạn phải nhấn Chỉnh sửa → lưu để cập nhật.
- Tính năng **Xuất Excel** chỉ có ở Global View, không có ở View dự án.

## Liên quan

- [Các bố cục hiển thị](/help/a/cac-bo-cuc-hien-thi)
- [Lọc, nhóm & sắp xếp](/help/a/loc-nhom-va-sap-xep)
- [Tùy chỉnh cột & thuộc tính hiển thị](/help/a/tuy-chinh-cot-va-thuoc-tinh)
