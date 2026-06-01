---
category: xem-va-bo-cuc
slug: tuy-chinh-cot-va-thuoc-tinh
sort_order: 30000
title: "Tùy chỉnh cột & thuộc tính hiển thị"
status: published
---

## Mục đích

Shinhan Workspace cho phép bạn chọn **những thuộc tính nào hiện ra** bên cạnh tiêu đề công việc — ví dụ người phụ trách, ngày hết hạn, nhãn, ưu tiên — và bật thêm các cột đặc thù của SHBVN như Phòng ban, Danh mục, Tổng giờ công. Nhờ đó mỗi người có thể tạo ra màn hình gọn gàng, chỉ hiện đúng thông tin mình cần.

## Khi nào dùng

Mọi thành viên dự án đều chỉnh được. Thay đổi là **cài đặt cá nhân** — không ảnh hưởng đến người khác. Nếu muốn lưu và chia sẻ cho cả nhóm, hãy tạo View từ cấu hình đó (xem [Lưu & chia sẻ Views](/help/a/luu-va-chia-se-views)).

## Các bước

### Bật / tắt thuộc tính hiển thị

1. Mở dự án, vào trang **Công việc**.
2. Nhấn nút **Hiển thị** (Display) trên thanh tiêu đề.
3. Phần **Thuộc tính** (Properties) liệt kê tất cả cột có thể bật/tắt. Nhấn vào tên thuộc tính để bật (nền xanh) hoặc tắt (nền trắng/xám).

{{screenshot:tuy-chinh-cot-va-thuoc-tinh-display-menu}}

Danh sách thuộc tính tiêu chuẩn:

| Thuộc tính           | Ý nghĩa                              |
| -------------------- | ------------------------------------ |
| **ID**               | Mã định danh công việc (vd: SHB-123) |
| **Người phụ trách**  | Avatar thành viên được gán           |
| **Ngày bắt đầu**     | Ngày bắt đầu theo kế hoạch           |
| **Ngày hết hạn**     | Deadline                             |
| **Nhãn**             | Các nhãn phân loại                   |
| **Ưu tiên**          | Mức độ ưu tiên                       |
| **Trạng thái**       | Trạng thái công việc                 |
| **Công việc con**    | Số lượng công việc con               |
| **Tệp đính kèm**     | Số tệp đính kèm                      |
| **Liên kết**         | Số liên kết ngoài                    |
| **Ước tính**         | Điểm ước tính công sức               |
| **Module / Cycle**   | Thuộc module hoặc cycle nào          |
| **Theo dõi tiến độ** | Thanh % hoàn thành                   |

{{screenshot:tuy-chinh-cot-va-thuoc-tinh-properties-list}}

**Thuộc tính riêng của SHBVN** (chủ yếu hiển thị trong Spreadsheet):

| Thuộc tính               | Ý nghĩa                                 |
| ------------------------ | --------------------------------------- |
| **Phòng ban**            | Tên phòng ban phụ trách                 |
| **Dự án**                | Tên dự án chứa công việc                |
| **Trưởng nhóm/dự án**    | Người lead dự án                        |
| **Dự án toàn ngân hàng** | Đánh dấu bank-wide                      |
| **Danh mục chính / phụ** | Phân loại công việc theo danh mục SHBVN |
| **Ngày hoàn thành**      | Thời điểm thực tế đóng công việc        |
| **Liên kết tham chiếu**  | URL tài liệu liên quan                  |
| **Tổng thời gian ghi**   | Tổng thời gian đã log                   |

> Hầu hết các cột SHBVN chỉ hiển thị trong bố cục **Spreadsheet**. Ở **List/Kanban**, chỉ **Theo dõi tiến độ** và **Ngày hoàn thành** hiển thị bên cạnh công việc (dù toggle vẫn xuất hiện trong menu Hiển thị).

### Sửa inline trực tiếp trên bảng

Sau khi bật thuộc tính, bạn có thể **nhấp thẳng vào giá trị** trên hàng công việc (bố cục List hoặc Spreadsheet) để chỉnh sửa mà không cần mở chi tiết:

1. Nhấp vào ô thuộc tính trên hàng công việc cần sửa.
2. Dropdown hoặc date-picker hiện ra — chọn giá trị mới.
3. Nhấp ra ngoài để xác nhận.

{{screenshot:tuy-chinh-cot-va-thuoc-tinh-inline-edit}}

### Sắp xếp nhanh theo cột (Spreadsheet)

Trong bố cục **Spreadsheet**, mỗi tiêu đề cột có một menu nhỏ để sắp xếp theo cột đó (tăng/giảm dần — ví dụ A→Z, Mới→Cũ, Thấp→Cao). Nhấn vào tiêu đề cột để mở menu sắp xếp — thao tác tiện khi cần rà soát hàng loạt theo một thuộc tính.

> Để tìm kiếm một công việc theo tên, dùng thanh tìm kiếm toàn cục **Power-K** (`Ctrl/Cmd + K`). Lưu ý: đây là tìm kiếm trên toàn workspace, không lọc danh sách trong view đang mở.

## Mẹo & lưu ý

- **Spreadsheet** hiển thị nhiều cột nhất và hỗ trợ đầy đủ thuộc tính SHBVN; đây là bố cục được khuyến nghị khi cần xem/cập nhật hàng loạt thuộc tính.
- Trong **Spreadsheet**, một số cột mặc định bị ẩn (**ID**, nhãn, ước tính, ngày tạo, ngày cập nhật, liên kết, tệp đính kèm, Module, Cycle) — bật trong menu Hiển thị nếu cần.
- Cột **Công việc con** trong Spreadsheet hiển thị số lượng công việc con; bấm vào số để mở danh sách công việc con trong chi tiết.
- Trong Spreadsheet, cột **Cycle** và **Module** chỉ hiện khi dự án đã bật tính năng tương ứng; nếu dự án tắt thì hai cột này tự ẩn.
- **Quyền chỉnh sửa trường**: Quản trị viên dự án có thể giới hạn việc **chỉnh sửa** các trường ngày (bắt đầu / đến hạn / hoàn thành) và việc **xóa** công việc, qua trang Cài đặt > Quyền chỉnh sửa trường. Đây là quyền sửa, không phải quyền ẩn/hiện cột — không có cơ chế giới hạn quyền xem từng thuộc tính.
- Thay đổi hiển thị trong session hiện tại; muốn lưu lâu dài cho cả nhóm thì tạo View.

## Liên quan

- [Các bố cục hiển thị](/help/a/cac-bo-cuc-hien-thi)
- [Lọc, nhóm & sắp xếp](/help/a/loc-nhom-va-sap-xep)
- [Lưu & chia sẻ Views](/help/a/luu-va-chia-se-views)
