---
category: tinh-nang-shbvn
slug: capacity-va-bao-cao
sort_order: 30000
title: "Capacity & báo cáo"
status: published
---

## Mục đích

**Capacity & Báo cáo** so sánh giờ ước lượng với giờ thực tế đã log của từng thành viên, hiển thị trạng thái tải công việc (bình thường / quá tải / thiếu việc) theo dạng heatmap và bảng tóm tắt — giúp trưởng nhóm phân bổ nguồn lực hợp lý.

## Khi nào dùng / Yêu cầu

- Dành cho **Trưởng dự án**, **Trưởng phòng ban** và **Quản lý cấp cao**.
- Có ở hai cấp: **dự án** (tab Capacity trong dự án) và **workspace** (Time Tracking → Capacity).
- Thành viên cần đã log giờ (worklog) để dữ liệu xuất hiện.

## Các bước

### Xem Capacity Dashboard

1. Vào dự án → chọn tab **Capacity**, hoặc từ sidebar chọn **Time Tracking** → tab **Capacity**.
2. Dashboard hiển thị:
   - **Thẻ tổng giờ đã log** (góc trên bên trái).
   - **Heatmap** — mỗi hàng là một thành viên, mỗi cột là một ngày; màu ô thể hiện mức độ tải: xanh nhạt (bình thường), cam (quá tải), xám (thiếu việc/chưa log).
   - **Bảng danh mục**: phân bố giờ log theo Danh mục chính và Danh mục phụ.
3. Bật công tắc **Cross Workspaces** (góc phải trên) để gộp dữ liệu từ tất cả workspace.

{{screenshot:capacity-va-bao-cao}}

### Lọc theo thành viên và khoảng thời gian

1. Nhấp **Assignee** để chọn một hoặc nhiều thành viên cần xem (chỉ hiện ở chế độ dự án, khi Cross Workspaces tắt).
2. Nhấp **Date Range** để giới hạn khoảng thời gian phân tích.
3. Heatmap cập nhật ngay sau khi thay đổi bộ lọc.

{{screenshot:capacity-filters}}

### Xem chi tiết một ngày cụ thể

1. Nhấp vào ô bất kỳ trên heatmap.
2. Popover **Chi tiết ngày** hiện ra — liệt kê từng công việc đã log trong ngày đó của thành viên, kèm số giờ từng mục.

{{screenshot:capacity-day-details-popover}}

### Xuất báo cáo

1. Nhấp **Export** (góc phải trên Capacity Dashboard).
2. Chọn loại xuất:
   - **Summary CSV** — bảng tóm tắt tổng giờ mỗi thành viên.
   - **Detailed Export** — mở modal chọn thành viên cụ thể, sau đó xuất file chi tiết từng ngày.
3. File tải xuống tự động; các lần xuất trước được lưu tại tab **Exports** trong HO Dashboard.

{{screenshot:capacity-export-menu}}

## Mẹo & lưu ý

- **Ngưỡng màu heatmap**: được tính dựa trên lịch làm việc (business calendar) cấu hình trong God Mode — ngày lễ và ngày nghỉ tự động loại khỏi phép tính.
- **Không có ước lượng**: nếu công việc chưa điền _Estimate_, heatmap chỉ hiển thị giờ thực tế; cột "vs ước lượng" sẽ trống.
- **Cross Workspaces**: khi bật, dữ liệu gộp từ tất cả workspace người dùng tham gia — hữu ích cho nhân viên làm việc liên phòng ban.
- **Bảng danh mục**: chỉ xuất hiện nếu công việc được gán Danh mục chính/phụ (cấu hình bởi admin dự án).

## Liên quan

- [Chấm công & timesheet](/help/a/cham-cong-va-timesheet)
- [Head Office Dashboard](/help/a/head-office-dashboard)
- [Thuộc tính công việc](/help/a/thuoc-tinh-cong-viec)
