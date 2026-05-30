---
category: cycles-modules
slug: tao-va-quan-ly-modules
sort_order: 40000
title: "Tạo & quản lý Modules"
status: published
---

## Mục đích

Tạo Module để nhóm các công việc liên quan theo chủ đề, tính năng hoặc nghiệp vụ — giúp quản lý phạm vi công việc theo mảng chức năng thay vì theo thời gian, và theo dõi tiến độ hoàn thành của từng nhóm.

## Yêu cầu

- Tính năng Modules phải được bật cho dự án (**Cài đặt dự án → Tính năng → Modules**).
- Vai trò **Member** trở lên mới có thể tạo và chỉnh sửa Module.

## Các bước

### Tạo Module mới

1. Mở dự án, chọn **Modules** trong menu bên trái.
2. Nhấn **+ Module** (góc trên phải).
3. Nhập thông tin trong hộp thoại:
   - **Tên** — bắt buộc (ví dụ: "Phân hệ KH cá nhân").
   - **Mô tả** — tuỳ chọn.
   - **Trạng thái** — chọn một trong: _Backlog_, _In Progress_, _Paused_, _Completed_, _Cancelled_.
   - **Lead** — người phụ trách chính của Module.
   - **Members** — thêm các thành viên tham gia.
   - **Ngày bắt đầu** / **Ngày kết thúc** — tuỳ chọn, dùng khi Module có kế hoạch thời gian.
4. Nhấn **Save** để tạo.

{{screenshot:tao-va-quan-ly-modules}}

### Thêm công việc vào Module

Sau khi tạo Module, nhấn vào tên để mở trang chi tiết:

1. Nhấn **+ Add work items** để thêm công việc hiện có từ dự án.
2. Tìm theo tên hoặc mã (ví dụ: SHB-456), chọn rồi nhấn **Add**.
3. Tạo công việc mới trực tiếp trong Module bằng **+ New work item** trong bố cục List hoặc Board.

> Một công việc có thể thuộc **nhiều Module** cùng lúc.

### Chuyển đổi bố cục hiển thị

Bên trong Module, dùng các biểu tượng góc trên phải để chuyển bố cục:

| Bố cục    | Dùng khi                          |
| --------- | --------------------------------- |
| **List**  | Xem danh sách công việc chi tiết  |
| **Board** | Theo dõi theo trạng thái (Kanban) |
| **Gantt** | Lập kế hoạch theo thời gian       |

{{screenshot:module-layout-switch}}

### Chỉnh sửa thông tin Module từ Sidebar

Khi đang ở trang chi tiết Module:

1. Nhấn biểu tượng **ⓘ** (Sidebar) góc trên phải để mở thanh thông tin.
2. Chỉnh sửa trực tiếp: **Lead**, **Members**, **Status**, **Start Date**, **Target Date**.
3. Xem phân bố tiến độ công việc (Progress Stats) theo nhóm trạng thái.

### Thêm liên kết vào Module

Trong Sidebar của Module, mục **Links**:

1. Nhấn **+ Add link**.
2. Nhập URL và tiêu đề hiển thị.
3. Nhấn **Save** — liên kết xuất hiện trong danh sách Links của Module.

Dùng tính năng này để gắn tài liệu thiết kế, spec nghiệp vụ hoặc tài liệu tham chiếu vào Module.

### Quản lý Module từ danh sách

Từ trang danh sách Modules, nhấn **⋯** trên thẻ Module:

| Hành động            | Mô tả                                  |
| -------------------- | -------------------------------------- |
| **Edit**             | Sửa tên, mô tả, ngày, lead, thành viên |
| **Copy Link**        | Sao chép đường dẫn trực tiếp           |
| **Add to Favorites** | Ghim vào yêu thích                     |
| **Archive**          | Lưu trữ Module                         |
| **Delete**           | Xoá vĩnh viễn                          |

### Xem nhật ký hoạt động Module

Trong Sidebar của Module, cuộn xuống mục **Activity** để xem lịch sử thay đổi: ai thêm/xóa công việc, đổi trạng thái, sửa thông tin.

### Xem Modules đã lưu trữ

Modules lưu trữ chuyển sang **Archives → Modules** (menu bên trái dự án). Từ đây có thể **Restore** để đưa Module trở lại danh sách chính.

{{screenshot:module-archived}}

## Mẹo & lưu ý

- Không có giới hạn số Module trong một dự án.
- Xóa Module **không** xóa công việc bên trong; chúng trở về dự án mà không thuộc Module nào.
- Bố cục Gantt trong Module hữu ích để hình dung tiến trình theo thời gian khi Module có ngày bắt đầu/kết thúc.
- Trạng thái Module (Backlog, In Progress…) là trường thủ công — không tự động thay đổi theo tiến độ công việc.

## Liên quan

- [Lập kế hoạch với Cycles và Modules](/help/a/lap-ke-hoach-voi-cycles)
- [Tạo & quản lý Cycles](/help/a/tao-va-quan-ly-cycles)
- [Theo dõi tiến độ Cycle](/help/a/theo-doi-tien-do-cycle)
