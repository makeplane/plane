---
category: xem-va-bo-cuc
slug: cac-bo-cuc-hien-thi
sort_order: 10000
title: "Các bố cục hiển thị"
status: published
---

## Mục đích

Shinhan Workspace cho phép bạn xem danh sách công việc theo 5 kiểu bố cục khác nhau — **List, Kanban, Calendar, Gantt** và **Spreadsheet** — giúp bạn chọn cách trình bày phù hợp nhất với từng loại công việc và thói quen làm việc.

## Khi nào dùng

Không yêu cầu quyền đặc biệt. Mọi thành viên dự án đều có thể chuyển bố cục bất cứ lúc nào. Bố cục được lưu riêng cho từng người — thay đổi của bạn không ảnh hưởng đến đồng nghiệp.

## Các bước

### Chuyển bố cục

1. Mở một dự án và vào trang **Công việc** (Issues).
2. Nhìn lên góc phải thanh tiêu đề — bạn sẽ thấy nhóm biểu tượng bố cục nhỏ (List / Board / Calendar / Spreadsheet / Gantt).
3. Nhấp vào biểu tượng bố cục mong muốn. Danh sách công việc lập tức chuyển sang kiểu hiển thị mới.

{{screenshot:cac-bo-cuc-hien-thi-layout-switcher}}

### Mô tả từng bố cục

| Bố cục                      | Biểu tượng        | Dùng khi nào                                                                      |
| --------------------------- | ----------------- | --------------------------------------------------------------------------------- |
| **List** (Danh sách)        | Danh sách kẻ dòng | Xem tất cả công việc theo thứ tự; thêm công việc nhanh bằng phím Enter            |
| **Kanban** (Bảng)           | Các cột thẻ       | Theo dõi tiến trạng thái; kéo-thả công việc giữa các cột                          |
| **Calendar** (Lịch)         | Ô lịch tháng/tuần | Theo dõi deadline và ngày bắt đầu theo thời gian                                  |
| **Gantt** (Thanh ngang)     | Thanh tiến độ     | Lập kế hoạch phụ thuộc; xem tổng quan thời gian toàn dự án                        |
| **Spreadsheet** (Bảng tính) | Lưới ô            | Chỉnh sửa nhiều thuộc tính cùng lúc theo hàng-cột; phù hợp xem/cập nhật hàng loạt |

{{screenshot:cac-bo-cuc-hien-thi-five-layouts}}

### Thêm công việc nhanh (Quick Add)

- **List/Kanban**: Nhấn nút **+ Thêm công việc** ở cuối nhóm hoặc gõ trực tiếp vào ô nhập nhanh, nhấn **Enter** để tạo.
- **Spreadsheet**: Nhấn **+ Add issue** ở dòng cuối bảng.
- **Calendar/Gantt**: Không hỗ trợ thêm nhanh trực tiếp — cần mở modal tạo công việc đầy đủ.

{{screenshot:cac-bo-cuc-hien-thi-quick-add}}

### Bố cục mặc định của dự án

Bố cục bạn chọn lần cuối được ghi nhớ tự động cho dự án đó. Lần sau mở lại, hệ thống sẽ dùng bố cục bạn đã chọn.

## Mẹo & lưu ý

- **Kanban** hỗ trợ **swimlane** (nhóm phụ) khi bạn bật thêm tùy chọn **Nhóm phụ** trong menu Hiển thị — hữu ích khi muốn chia cột theo trạng thái _và_ người phụ trách cùng lúc.
- **Gantt** yêu cầu công việc có ngày bắt đầu hoặc ngày hết hạn thì mới hiển thị thanh tiến độ; công việc không có ngày sẽ không xuất hiện trên thanh.
- **Calendar** hiển thị công việc theo ngày hết hạn (`due_date`). Nếu công việc không có `due_date`, nó sẽ không xuất hiện trên lịch.
- **Spreadsheet** cho phép sửa inline trực tiếp trên bảng: nhấp vào ô thuộc tính (trạng thái, người phụ trách, ngày…) để chỉnh sửa mà không cần mở chi tiết công việc.
- Bố cục chỉ áp dụng trong phạm vi một dự án. Để xem công việc từ nhiều dự án cùng lúc, dùng **Global Views** (Hiển thị toàn workspace).

## Liên quan

- [Lọc, nhóm & sắp xếp](/help/a/loc-nhom-va-sap-xep)
- [Tùy chỉnh cột & thuộc tính hiển thị](/help/a/tuy-chinh-cot-va-thuoc-tinh)
- [Lưu & chia sẻ Views](/help/a/luu-va-chia-se-views)
