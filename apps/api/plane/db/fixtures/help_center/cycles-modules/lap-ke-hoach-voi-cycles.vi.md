---
category: cycles-modules
slug: lap-ke-hoach-voi-cycles
sort_order: 10000
title: "Lập kế hoạch với Cycles và Modules"
status: published
---

## Mục đích

**Cycles** và **Modules** là hai công cụ lập kế hoạch bổ sung cho nhau trong Shinhan Workspace: Cycles giúp bạn chia công việc theo giai đoạn thời gian (sprint, tuần, tháng), còn Modules giúp nhóm công việc theo chủ đề hoặc tính năng — bất kể thời điểm nào.

## Khi nào dùng Cycle, khi nào dùng Module?

| Tiêu chí                        | Cycle                                          | Module                                   |
| ------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| Gắn với khoảng thời gian cụ thể | **Có** (bắt buộc ngày bắt đầu/kết thúc)        | Tùy chọn                                 |
| Mục tiêu                        | Hoàn thành một lượng công việc trong giai đoạn | Nhóm công việc cùng tính năng/chủ đề     |
| Theo dõi tiến độ                | Burndown/Burnup theo ngày                      | Phân bố trạng thái                       |
| Ví dụ điển hình                 | Sprint 2 tuần, Milestone Q1                    | Tính năng "Onboarding", Mô-đun "Báo cáo" |
| Một công việc thuộc nhiều nhóm  | Mỗi lần chỉ thuộc 1 Cycle active               | Có thể thuộc nhiều Module                |

> **Gợi ý cho nhân viên ngân hàng:** Dùng Cycle cho các giai đoạn triển khai (ví dụ: "Triển khai T4/2025"), dùng Module để nhóm theo nghiệp vụ (ví dụ: "Phân hệ KH cá nhân", "Báo cáo MIS").

## Yêu cầu

- Tính năng Cycles và Modules phải được bật cho từng dự án. Quản trị viên dự án có thể bật tại: **Cài đặt dự án → Tính năng → Cycles / Modules**.
- Vai trò cần thiết để tạo/sửa: **Member** trở lên.

{{screenshot:cycles-modules-feature-overview}}

## Các bước bắt đầu

### Truy cập Cycles của dự án

1. Mở dự án từ thanh bên trái.
2. Chọn **Cycles** trong menu dự án.
3. Trang hiển thị Cycle **đang chạy** (Active) nổi bật ở đầu, kèm hai nhóm có thể mở/thu: **Upcoming** (sắp tới) và **Completed** (đã kết thúc).

### Truy cập Modules của dự án

1. Mở dự án từ thanh bên trái.
2. Chọn **Modules** trong menu dự án.
3. Trang hiển thị danh sách các module, có thể chuyển giữa các bố cục **List** (Danh sách), **Gallery** (Thư viện) và **Timeline** (Dòng thời gian) bằng các biểu tượng bố cục góc trên phải.

## Mẹo & lưu ý

- Một công việc có thể thuộc nhiều Module cùng lúc, nhưng chỉ thuộc **một Cycle đang active** trong cùng thời điểm.
- Khi một Cycle đã kết thúc (completed) mà còn công việc chưa hoàn thành, nút **Transfer work items** sẽ hiện ở đầu danh sách công việc để chuyển sang Cycle khác. Nút này chỉ xuất hiện khi mở Cycle đã kết thúc và vẫn còn việc dang dở — không thấy nút này khi Cycle còn đang chạy.
- Bên trong một Cycle hoặc Module, công việc có thể xem theo nhiều bố cục: List, Board, Calendar, Table và Timeline — chọn bố cục phù hợp với cách làm việc của nhóm.
- **Module** có thể gán **Lead** (người phụ trách chính) và danh sách **Members** riêng — điểm khác biệt so với Cycle, phù hợp khi cần tổ chức công việc theo nhóm chức năng.
- **Member** trở lên có thể tạo và sửa Cycle/Module, nhưng **xóa** Cycle/Module chỉ dành cho **Quản trị viên** hoặc người đã tạo ra nó — Thành viên không xóa được Cycle/Module do người khác tạo.
- Nếu mục **Cycles** hoặc **Modules** không xuất hiện trong menu dự án, hãy yêu cầu quản trị viên dự án bật tính năng.

## Liên quan

- [Tạo & quản lý Cycles](/help/a/tao-va-quan-ly-cycles)
- [Tạo & quản lý Modules](/help/a/tao-va-quan-ly-modules)
- [Theo dõi tiến độ Cycle](/help/a/theo-doi-tien-do-cycle)
