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
| **Ước lượng**        | Điểm ước tính công sức               |
| **Module / Cycle**   | Thuộc module hoặc cycle nào          |
| **Theo dõi tiến độ** | Thanh % hoàn thành                   |

{{screenshot:tuy-chinh-cot-va-thuoc-tinh-properties-list}}

**Thuộc tính riêng của SHBVN** (hiện trong Spreadsheet và một số bố cục):

| Thuộc tính               | Ý nghĩa                                 |
| ------------------------ | --------------------------------------- |
| **Phòng ban**            | Tên phòng ban phụ trách                 |
| **Dự án**                | Tên dự án chứa công việc                |
| **Trưởng dự án**         | Người lead dự án                        |
| **Dự án toàn ngân hàng** | Đánh dấu bank-wide                      |
| **Danh mục chính / phụ** | Phân loại công việc theo danh mục SHBVN |
| **Ngày hoàn thành**      | Thời điểm thực tế đóng công việc        |
| **Link tham chiếu**      | URL tài liệu liên quan                  |
| **Tổng giờ công**        | Tổng thời gian đã log                   |

### Sửa inline trực tiếp trên bảng

Sau khi bật thuộc tính, bạn có thể **nhấp thẳng vào giá trị** trên hàng công việc (bố cục List hoặc Spreadsheet) để chỉnh sửa mà không cần mở chi tiết:

1. Nhấp vào ô thuộc tính trên hàng công việc cần sửa.
2. Dropdown hoặc date-picker hiện ra — chọn giá trị mới.
3. Nhấp ra ngoài để xác nhận.

{{screenshot:tuy-chinh-cot-va-thuoc-tinh-inline-edit}}

### Tìm kiếm trong view hiện tại

Thanh tiêu đề có ô **Tìm kiếm** (biểu tượng kính lúp). Gõ từ khóa để lọc tức thì danh sách đang hiển thị theo tiêu đề công việc mà không thay đổi bộ lọc hay nhóm.

## Mẹo & lưu ý

- **Spreadsheet** hiển thị nhiều cột nhất và hỗ trợ đầy đủ thuộc tính SHBVN; đây là bố cục được khuyến nghị khi cần xem/cập nhật hàng loạt thuộc tính.
- Trong **Spreadsheet**, một số cột mặc định bị ẩn (nhãn, ước lượng, ngày tạo, ngày cập nhật, liên kết, tệp đính kèm) — bật trong menu Hiển thị nếu cần.
- Thuộc tính **Công việc con** (sub-issue) trong Spreadsheet luôn tắt vì bố cục này không hỗ trợ cây lồng nhau.
- **Phân quyền theo trường**: admin dự án có thể hạn chế ai được xem/sửa từng thuộc tính. Nếu một thuộc tính không hiện dù đã bật, bạn có thể không có quyền xem trường đó.
- Thay đổi hiển thị trong session hiện tại; muốn lưu lâu dài cho cả nhóm thì tạo View.

## Liên quan

- [Các bố cục hiển thị](/help/a/cac-bo-cuc-hien-thi)
- [Lọc, nhóm & sắp xếp](/help/a/loc-nhom-va-sap-xep)
- [Lưu & chia sẻ Views](/help/a/luu-va-chia-se-views)
