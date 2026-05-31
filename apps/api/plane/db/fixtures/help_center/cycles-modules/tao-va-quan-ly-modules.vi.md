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
- Vai trò **Member** trở lên có thể tạo Module và thêm/tạo công việc. Việc **chỉnh sửa, lưu trữ hoặc xóa** Module yêu cầu vai trò **Quản trị viên** — Thành viên sẽ không thấy các tuỳ chọn này trong menu ⋯.

## Các bước

### Tạo Module mới

1. Mở dự án, chọn **Modules** trong menu bên trái.
2. Nhấn **Add Module** (Thêm mô-đun) ở góc trên phải.
3. Nhập thông tin trong hộp thoại:
   - **Tên** — bắt buộc (ví dụ: "Phân hệ KH cá nhân").
   - **Mô tả** — tuỳ chọn.
   - **Trạng thái** — chọn một trong: _Backlog_, _Planned_, _In Progress_, _Paused_, _Completed_, _Cancelled_.
   - **Lead** — người phụ trách chính của Module.
   - **Members** — thêm các thành viên tham gia.
   - **Ngày bắt đầu** / **Ngày kết thúc** — tuỳ chọn, dùng khi Module có kế hoạch thời gian.
4. Nhấn **Create Module** để tạo (khi đang sửa, nút hiển thị là **Update module**).

{{screenshot:tao-va-quan-ly-modules}}

### Thêm công việc vào Module

Sau khi tạo Module, nhấn vào tên để mở trang chi tiết:

1. Nhấn **Add work item** (góc trên phải) để tạo công việc mới ngay trong Module.
2. Để thêm công việc đã có sẵn, chọn **Add existing work item**, tìm theo tên hoặc mã (ví dụ: SHB-456), chọn rồi nhấn **Add**.
3. Trong bố cục List hoặc Board cũng có nút thêm công việc ngay tại mỗi nhóm.

> Một công việc có thể thuộc **nhiều Module** cùng lúc.

### Chuyển đổi bố cục hiển thị

Bên trong Module, dùng các biểu tượng góc trên phải để chuyển bố cục:

| Bố cục       | Dùng khi                            |
| ------------ | ----------------------------------- |
| **List**     | Xem danh sách công việc chi tiết    |
| **Board**    | Theo dõi theo trạng thái (Kanban)   |
| **Calendar** | Xem công việc theo lịch ngày        |
| **Table**    | Xem dạng bảng tính (Spreadsheet)    |
| **Timeline** | Lập kế hoạch theo thời gian (Gantt) |

{{screenshot:module-layout-switch}}

### Chỉnh sửa thông tin Module từ Sidebar

Khi đang ở trang chi tiết Module:

1. Nhấn biểu tượng **khung bên phải** (Sidebar / PanelRight) ở góc trên phải để mở thanh thông tin.
2. Chỉnh sửa trực tiếp: **Lead**, **Members**, **Status**, **Start Date**, **Target Date**.
3. Xem phân bố tiến độ công việc (Progress Stats) theo nhóm trạng thái.

> **Mẹo:** Trên thanh tiêu đề trang chi tiết Module còn có nút **Analytics** mở bảng phân tích tiến độ chi tiết của Module.

### Thêm liên kết vào Module

Trong Sidebar của Module, mục **Links**:

1. Nhấn **+ Add link**.
2. Nhập **URL** (bắt buộc) và **Display title** (tiêu đề hiển thị — tùy chọn).
3. Nhấn **Add link** — liên kết xuất hiện trong danh sách Links của Module.

Dùng tính năng này để gắn tài liệu thiết kế, spec nghiệp vụ hoặc tài liệu tham chiếu vào Module.

### Quản lý Module từ danh sách

Từ trang danh sách Modules, nhấn **⋯** trên thẻ Module:

| Hành động           | Mô tả                                                                          |
| ------------------- | ------------------------------------------------------------------------------ |
| **Edit**            | Sửa tên, mô tả, ngày, lead, thành viên                                         |
| **Open in new tab** | Mở Module trong tab trình duyệt mới                                            |
| **Copy Link**       | Sao chép đường dẫn trực tiếp                                                    |
| **Archive**         | Lưu trữ Module — **chỉ Module ở trạng thái Completed hoặc Cancelled** mới lưu trữ được |
| **Restore**         | Khôi phục Module (chỉ hiện khi Module đã lưu trữ)                              |
| **Delete**          | Xoá vĩnh viễn                                                                  |

> **Lưu ý:** Các tuỳ chọn trong menu ⋯ yêu cầu vai trò **Quản trị viên**. Để ghim Module vào Yêu thích, nhấn biểu tượng **ngôi sao** trên thẻ Module (không nằm trong menu ⋯).

### Xem nhật ký hoạt động Module

Trong Sidebar của Module, cuộn xuống mục **Activity** để xem lịch sử thay đổi: ai thêm/xóa công việc, đổi trạng thái, sửa thông tin.

### Xem Modules đã lưu trữ

Modules lưu trữ chuyển sang **Archives → Modules** (menu bên trái dự án). Từ đây có thể **Restore** để đưa Module trở lại danh sách chính.

{{screenshot:module-archived}}

## Mẹo & lưu ý

- Không có giới hạn số Module trong một dự án.
- Xóa Module **không** xóa công việc bên trong; chúng trở về dự án mà không thuộc Module nào.
- Bố cục **Timeline** (Gantt) trong Module hữu ích để hình dung tiến trình theo thời gian khi Module có ngày bắt đầu/kết thúc.
- Chỉ có thể **lưu trữ** Module khi trạng thái là **Completed** hoặc **Cancelled**; với Module đang chạy, mục Archive trong menu ⋯ sẽ bị vô hiệu hoá.
- Trạng thái Module (Backlog, Planned, In Progress…) là trường thủ công — không tự động thay đổi theo tiến độ công việc.

## Liên quan

- [Lập kế hoạch với Cycles và Modules](/help/a/lap-ke-hoach-voi-cycles)
- [Tạo & quản lý Cycles](/help/a/tao-va-quan-ly-cycles)
- [Theo dõi tiến độ Cycle](/help/a/theo-doi-tien-do-cycle)
