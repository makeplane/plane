---
category: tinh-nang-shbvn
slug: capacity-va-bao-cao
sort_order: 30000
title: "Capacity & báo cáo"
status: published
---

## Mục đích

**Capacity & Báo cáo** hiển thị tổng giờ thực tế mỗi thành viên đã log theo ngày, đối chiếu với chuẩn ngày công cố định (~7-8 giờ) để thể hiện trạng thái tải công việc (bình thường / quá tải / còn trống) theo dạng heatmap — giúp trưởng nhóm phân bổ nguồn lực hợp lý.

## Khi nào dùng / Yêu cầu

- Dành cho **Trưởng dự án**, **Trưởng phòng ban** và **Quản lý cấp cao**.
- Có ở hai cấp: **dự án** (tab Capacity trong dự án) và **workspace** (Time Tracking → Capacity).
- Capacity cấp **workspace** chỉ **Quản trị viên** (Admin) của workspace mới truy cập được; Capacity cấp **dự án** dành cho thành viên dự án.
- Thành viên cần đã log giờ (worklog) để dữ liệu xuất hiện.
- Capacity cấp dự án chỉ hiện khi dự án đã **bật Time Tracking** trong cài đặt dự án; nếu tắt, mục Time Tracking (kèm tab Capacity) sẽ không xuất hiện.

## Các bước

### Xem Capacity Dashboard

1. Vào dự án → chọn tab **Capacity**, hoặc từ sidebar chọn **Time Tracking** → tab **Capacity**.
2. Dashboard hiển thị **Heatmap** — mỗi hàng là một thành viên, mỗi cột là một ngày; cột **Total Logged** ở đầu bảng hiển thị tổng giờ mỗi thành viên đã log. Màu ô thể hiện mức độ tải:
   - **Xanh** — bình thường (~7-8 giờ, 420-480 phút).
   - **Cam** — còn trống / thiếu việc (dưới 7 giờ).
   - **Đỏ** — quá tải (trên 8 giờ).
   - **Xám** — chưa log giờ trong ngày đó.
3. Công tắc **Cross teams & workspaces** (góc phải trên) mặc định **bật** — gộp dữ liệu từ tất cả workspace bạn tham gia. Tắt công tắc này để chỉ xem dữ liệu workspace hiện tại. **Lưu ý:** khi Cross teams & workspaces đang bật, tùy chọn **Detailed Export** bị vô hiệu hóa.

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
   - **Summary CSV** — tổng giờ và chi tiết giờ theo từng ngày của mỗi thành viên; tải về ngay trong trình duyệt.
   - **Detailed Export** — mở modal chọn thành viên cụ thể, sau đó tạo job chạy nền. Hệ thống xếp hàng, gửi thông báo qua email khi xong, rồi bạn vào tab **My Exports** tải file XLSX chi tiết (file lưu có thời hạn, nên tải sớm). File gồm mỗi thành viên một sheet (kèm sheet Summary), các cột: Date, Project, Work Item, Main Category, Sub Category, State, Assignees, Priority, Time Spent (h).
3. Tab **My Exports** trong màn hình **Time Tracking** (sidebar → Time Tracking → tab My Exports) lưu các lần Detailed Export — chỉ hiển thị bản xuất của chính bạn; nhấp **Download** khi job ở trạng thái Ready.

{{screenshot:capacity-export-menu}}

## Mẹo & lưu ý

- **Ngưỡng màu heatmap**: dựa trên chuẩn ngày công cố định ~7-8 giờ (420-480 phút). Hệ thống **không** tự loại trừ ngày lễ/cuối tuần khỏi heatmap.
- **Cách log giờ**: dữ liệu chỉ xuất hiện khi thành viên đã log giờ qua nút **Log Time** trên từng công việc — xem bài [Chấm công & timesheet](/help/a/cham-cong-va-timesheet).
- **Cross teams & workspaces**: mặc định bật — gộp dữ liệu từ tất cả workspace người dùng tham gia, hữu ích cho nhân viên làm việc liên phòng ban. Khi bật, tùy chọn **Detailed Export** bị tắt. Detailed Export cũng bị vô hiệu nếu chưa chọn **Khoảng thời gian** (Date Range), hoặc vừa tạo một lần xuất trong 30 giây trước.

## Liên quan

- [Chấm công & timesheet](/help/a/cham-cong-va-timesheet)
- [Head Office Dashboard](/help/a/head-office-dashboard)
- [Thuộc tính công việc](/help/a/thuoc-tinh-cong-viec)
