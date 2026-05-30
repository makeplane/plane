---
category: du-an-cong-viec
slug: tu-dong-hoa-va-quy-trinh
sort_order: 100000
title: "Tự động hóa & quy trình"
status: published
---

## Mục đích

Shinhan Workspace cung cấp hai công cụ để giảm thao tác thủ công: **Workflow** (kiểm soát luồng chuyển trạng thái) và **Automations** (tự động lưu trữ hoặc đóng công việc theo điều kiện). Cả hai được cấu hình ở cấp dự án bởi Admin.

## Khi nào dùng / Yêu cầu

- Chỉ **Admin dự án** mới xem và chỉnh sửa được Workflow và Automations.
- Vào **Cài đặt dự án → Workflow** hoặc **→ Automations**.

---

## Workflow — Kiểm soát chuyển trạng thái

{{screenshot:tu-dong-hoa-va-quy-trinh}}

### Workflow là gì

Workflow định nghĩa **trạng thái nào có thể chuyển sang trạng thái nào**. Khi Workflow được bật (_Live_), thành viên chỉ có thể chuyển trạng thái theo các đường dẫn được phép — giúp đảm bảo quy trình phê duyệt không bị bỏ qua.

### Bật / tắt Workflow

1. Vào **Cài đặt → Workflow**.
2. Bật toggle **Áp dụng Workflow** — trạng thái chuyển sang _Live_.
3. Để tắt, bật lại toggle → chọn **Tắt** trong hộp xác nhận.

### Cấu hình quy tắc chuyển trạng thái

1. Trong trang Workflow, mỗi trạng thái hiển thị danh sách **trạng thái được phép chuyển tới**.
2. Bấm **+ Thêm chuyển tiếp** trên một trạng thái → chọn trạng thái đích → Lưu.
3. Xóa một đường chuyển tiếp bằng cách bấm `×` cạnh tên trạng thái đích.

> **Reset Workflow**: Bấm **Đặt lại về mặc định** để cho phép chuyển tự do giữa mọi trạng thái (mọi → mọi).

### Khi thành viên bị chặn

Nếu cố chuyển sang trạng thái không được phép, hệ thống hiển thị thông báo **"Chuyển trạng thái không hợp lệ"** và không thực hiện thay đổi. Thành viên cần hỏi Admin để mở thêm đường chuyển tiếp.

---

## Automations — Tự động hóa hành động

Automations thực thi hành động tự động dựa trên điều kiện thời gian hoặc trạng thái.

### Tự động lưu trữ công việc hoàn thành

1. Vào **Cài đặt → Automations**.
2. Bật **Tự động lưu trữ** → chọn số ngày sau khi công việc đạt trạng thái _Completed_ (ví dụ: 30 ngày).
3. Lưu — hệ thống tự chạy hằng ngày, lưu trữ công việc đủ điều kiện.

### Tự động đóng công việc không hoạt động

1. Bật **Tự động đóng** → chọn số ngày không có hoạt động.
2. Công việc đủ điều kiện sẽ tự chuyển sang trạng thái _Cancelled_ hoặc trạng thái đóng được cấu hình.

## Mẹo & lưu ý

- Workflow chỉ áp dụng cho **thành viên vai trò Member** — Admin dự án vẫn có thể chuyển trạng thái tự do.
- Khi Workflow đang _Live_, icon nhỏ xuất hiện cạnh tên trạng thái trong Kanban/List để nhắc nhở.
- Automations chạy theo lịch server — không tức thời; có thể trễ vài giờ so với thời điểm đủ điều kiện.

## Liên quan

- [Cấu hình dự án](/help/a/cau-hinh-du-an)
- [Lưu trữ công việc](/help/a/luu-tru-cong-viec)
- [Thuộc tính công việc](/help/a/thuoc-tinh-cong-viec)
