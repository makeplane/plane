---
category: cycles-modules
slug: tao-va-quan-ly-cycles
sort_order: 20000
title: "Tạo & quản lý Cycles"
status: published
---

## Mục đích

Tạo Cycle để chia công việc của dự án thành các giai đoạn có ngày bắt đầu và kết thúc rõ ràng — giúp nhóm tập trung hoàn thành một lượng công việc cụ thể trong mỗi giai đoạn và theo dõi tiến độ qua biểu đồ tiến độ (burndown).

## Yêu cầu

- Tính năng Cycles phải được bật cho dự án (**Cài đặt dự án → Tính năng → Cycles**).
- Vai trò **Member** trở lên mới có thể tạo và chỉnh sửa Cycle.

## Các bước

### Tạo Cycle mới

1. Mở dự án, chọn **Cycles** trong menu bên trái.
2. Nhấn nút **Add cycle** (Thêm chu kỳ) ở góc trên phải.
3. Nhập thông tin trong hộp thoại:
   - **Tên** — bắt buộc (ví dụ: "Sprint 12 — Tháng 6/2025").
   - **Mô tả** — tuỳ chọn.
   - **Ngày bắt đầu** và **Ngày kết thúc** — chọn bằng bộ chọn ngày; hai trường này quyết định Cycle thuộc nhóm nào (Active / Upcoming / Completed).
4. Nhấn **Create cycle** để tạo.

{{screenshot:tao-cycle-modal}}

### Thêm công việc vào Cycle

Sau khi tạo Cycle, mở Cycle bằng cách nhấn vào tên:

1. Nhấn **Add work item** (góc trên phải của Cycle) để tạo công việc mới ngay trong Cycle.
2. Để thêm công việc đã có sẵn, chọn **Add existing work item**, tìm theo tên hoặc mã công việc (ví dụ: SHB-123), chọn rồi nhấn **Add**.
3. Trong bố cục List hoặc Board cũng có nút thêm công việc ngay tại mỗi nhóm.

{{screenshot:tao-va-quan-ly-cycles}}

### Chuyển công việc chưa xong sang Cycle mới (Transfer)

Khi một Cycle đã kết thúc (completed) mà còn công việc chưa hoàn thành:

1. Mở Cycle đã kết thúc bằng cách nhấn vào tên. Nếu còn công việc chưa hoàn thành, nút **Transfer work items** sẽ hiện ở đầu danh sách công việc — nhấn nút này. (Nút chỉ xuất hiện khi Cycle đã ở trạng thái completed và vẫn còn việc dang dở; không có nút này trong menu ⋯.)
2. Chọn Cycle đích từ danh sách các Cycle _sắp tới_ (Upcoming) hoặc _đang active_.
3. Nhấn **Transfer** — các công việc chưa hoàn thành sẽ được chuyển sang Cycle được chọn.

{{screenshot:transfer-issues-cycle}}

### Chỉnh sửa và quản lý Cycle

Từ danh sách Cycles, nhấn **⋯** trên thẻ Cycle để xem các tuỳ chọn:

| Hành động           | Mô tả                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| **Edit**            | Sửa tên, mô tả, ngày (chỉ dùng được khi Cycle chưa hoàn thành)          |
| **Open in new tab** | Mở Cycle trong tab trình duyệt mới                                     |
| **Copy Link**       | Sao chép đường dẫn trực tiếp                                            |
| **Archive**         | Lưu trữ Cycle (ẩn khỏi danh sách chính) — **chỉ Cycle đã hoàn thành** mới lưu trữ được |
| **Delete**          | Xoá vĩnh viễn, không thể khôi phục (chỉ dùng được khi Cycle chưa hoàn thành) |

> **Lưu ý:** Để ghim Cycle vào Yêu thích, nhấn biểu tượng **ngôi sao** trên thẻ Cycle (không nằm trong menu ⋯). Khi Cycle đã hoàn thành, các mục **Edit** và **Delete** trong menu ⋯ sẽ bị vô hiệu hoá.

### Xem Cycles đã lưu trữ

Các Cycle lưu trữ được chuyển sang trang **Archives → Cycles** (menu bên trái dự án). Từ đây có thể **Restore** để đưa Cycle trở lại danh sách chính.

## Mẹo & lưu ý

- Mỗi thời điểm chỉ có **một Cycle active** (ngày hiện tại nằm trong khoảng start–end). Nếu tạo Cycle có ngày trùng hoặc giao với **bất kỳ Cycle nào đã có ngày** (đang chạy, sắp tới hay đã kết thúc), hệ thống sẽ cảnh báo xung đột — gợi ý xoá ngày để tạo Cycle dạng Draft.
- Cycle không có ngày bắt đầu/kết thúc sẽ nằm ở trạng thái **Draft** — không hiển thị burndown.
- Xóa Cycle **không** xóa các công việc bên trong; chúng trở về dự án mà không thuộc Cycle nào.
- Tab **Completed** tự động cập nhật khi ngày kết thúc qua đi.

## Liên quan

- [Theo dõi tiến độ Cycle](/help/a/theo-doi-tien-do-cycle)
- [Lập kế hoạch với Cycles và Modules](/help/a/lap-ke-hoach-voi-cycles)
