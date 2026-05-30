---
category: cycles-modules
slug: theo-doi-tien-do-cycle
sort_order: 30000
title: "Theo dõi tiến độ Cycle"
status: published
---

## Mục đích

Xem tiến độ hoàn thành công việc trong một Cycle qua thanh sidebar phân tích — bao gồm biểu đồ burndown/burnup theo ngày, phân bố trạng thái, và thống kê thành viên/lead.

## Các bước

### Mở thanh phân tích (Analytics Sidebar)

1. Mở dự án, chọn **Cycles** trong menu bên trái.
2. Nhấn vào tên Cycle để vào trang chi tiết.
3. Nhấn biểu tượng **thông tin (ⓘ)** hoặc **Sidebar** góc trên phải để mở thanh phân tích bên phải màn hình.

{{screenshot:theo-doi-tien-do-cycle}}

### Đọc thông tin trong Sidebar

Thanh sidebar hiển thị các nhóm thông tin sau:

**Thông tin chung**

- **Lead** — người phụ trách Cycle (avatar + tên).
- **Members** — danh sách thành viên tham gia (avatar group).
- **Work items** — tổng số công việc đã hoàn thành / tổng số (ví dụ: `12/20`).
- **Points** — số điểm ước lượng hoàn thành / tổng (chỉ hiển thị nếu dự án bật Estimates theo điểm).

**Phần Progress (Tiến độ)**

Nhấn vào thanh **Progress** để mở rộng xem chi tiết:

{{screenshot:cycle-progress-sidebar}}

- **Biểu đồ Burndown/Burnup** — trực quan hóa tốc độ hoàn thành theo ngày. Chỉ hiển thị khi Cycle có ngày bắt đầu và kết thúc hợp lệ.
- **Chuyển loại biểu đồ**: chọn **Burn-down** hoặc **Burn-up** từ dropdown góc phải biểu đồ.
- **Chuyển đơn vị**: chọn **Work items** (số lượng công việc) hoặc **Estimates** (điểm ước lượng) — tùy chọn này chỉ xuất hiện khi dự án có bật Estimates.

### Xem phân bố trạng thái

Bên dưới biểu đồ, phần **Progress Stats** hiển thị số công việc (hoặc điểm) theo từng nhóm trạng thái:

| Nhóm          | Ý nghĩa                         |
| ------------- | ------------------------------- |
| **Backlog**   | Chưa bắt đầu, chưa ưu tiên      |
| **Unstarted** | Chưa bắt đầu nhưng đã vào queue |
| **Started**   | Đang thực hiện                  |
| **Completed** | Đã hoàn thành                   |
| **Cancelled** | Đã hủy                          |

Nhấn vào một nhóm trạng thái để lọc danh sách công việc theo nhóm đó ngay trong Cycle.

### Cycle đã kết thúc (Completed)

Khi Cycle chuyển sang trạng thái **Completed**, sidebar sẽ hiển thị số liệu từ **progress snapshot** — ảnh chụp trạng thái tại thời điểm kết thúc — thay vì số liệu thời gian thực.

## Mẹo & lưu ý

- Biểu đồ burndown/burnup **chỉ xuất hiện** khi Cycle có cả ngày bắt đầu lẫn ngày kết thúc hợp lệ, và ngày bắt đầu đã qua.
- Nếu không thấy phần **Points**, tính năng Estimates chưa được bật hoặc loại ước lượng của dự án không phải dạng điểm số.
- Lọc theo assignee hoặc nhãn từ sidebar sẽ thu hẹp danh sách công việc bên trái mà không mất dữ liệu phân bố.
- Cycle ở trạng thái **Draft** (chưa có ngày) không có biểu đồ tiến độ.

## Liên quan

- [Tạo & quản lý Cycles](/help/a/tao-va-quan-ly-cycles)
- [Active Cycles toàn workspace](/help/a/cycles-modules-tab-active)
- [Lập kế hoạch với Cycles và Modules](/help/a/lap-ke-hoach-voi-cycles)
