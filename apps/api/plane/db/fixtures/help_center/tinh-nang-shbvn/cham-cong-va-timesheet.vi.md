---
category: tinh-nang-shbvn
slug: cham-cong-va-timesheet
sort_order: 20000
title: "Chấm công & timesheet"
status: published
---

## Mục đích

Tính năng **Chấm công & Timesheet** cho phép nhân viên ghi nhận giờ làm việc trực tiếp trên từng công việc và xem lại bảng tổng hợp theo tuần — giúp bộ phận quản lý theo dõi khối lượng công việc thực tế và đối chiếu với kế hoạch.

## Khi nào dùng / Yêu cầu

- Mọi nhân viên có tài khoản Shinhan Workspace đều có thể log giờ.
- Tính năng có ở cấp **dự án** (Timesheet tab trong dự án) và cấp **workspace** (Time Tracking trong sidebar).
- Worklog được tính theo ngày; mỗi mục log lưu: ngày, số giờ/phút, mô tả (tùy chọn).

## Các bước

### Log giờ trực tiếp từ công việc

1. Mở chi tiết một công việc bất kỳ.
2. Nhấp nút **Log Time** (đồng hồ) trên thanh hành động phía trên bên phải.
3. Cửa sổ **Log Time** hiện ra — điền:
   - **Ngày** (mặc định là hôm nay; chọn ngày trong quá khứ nếu cần).
   - **Giờ** và **Phút** đã làm.
   - **Mô tả** (tùy chọn) — ghi chú nội dung công việc đã làm.
4. Nhấp **Log Time** để lưu.

{{screenshot:cham-cong-worklog-modal}}

### Sửa hoặc xóa mục đã log

1. Mở chi tiết công việc → cuộn xuống phần **Activity**.
2. Mục worklog xuất hiện trong nhật ký hoạt động — nhấp biểu tượng **chỉnh sửa** (bút chì) bên cạnh mục cần sửa.
3. Cửa sổ **Edit Log** hiện thêm trường **Lý do thay đổi** (bắt buộc điền khi sửa).
4. Cập nhật số giờ/phút và lý do, sau đó nhấp **Update**.
5. Để xóa, nhấp biểu tượng **thùng rác** và xác nhận.

{{screenshot:cham-cong-worklog-edit}}

### Xem Timesheet theo tuần (cấp dự án)

> **Lưu ý:** Bảng Timesheet là **chỉ đọc** — không thể nhấp ô để nhập giờ trực tiếp. Để ghi nhận hoặc chỉnh sửa giờ, dùng nút **Log Time** trên từng công việc (xem mục [Log giờ trực tiếp từ công việc](#log-giờ-trực-tiếp-từ-công-việc) ở trên).

1. Vào dự án → chọn tab **Time Tracking** (hoặc **Timesheet**) trên thanh điều hướng dự án.
2. Bảng hiển thị các công việc bạn đã log trong tuần hiện tại — mỗi hàng là một công việc, mỗi cột là một ngày trong tuần.
3. Nhấp **< >** (mũi tên tuần) để chuyển sang tuần trước hoặc tuần sau.
4. Mỗi ô hiển thị tổng giờ đã log cho công việc đó trong ngày hôm đó (ví dụ: `2h 30m`); ô trống nếu chưa log.
5. Hàng cuối bảng hiển thị **tổng giờ** mỗi ngày và **tổng cả tuần**.

{{screenshot:cham-cong-timesheet-grid}}

### Xem Timesheet toàn workspace (đa dự án)

1. Từ sidebar, chọn **Time Tracking** (biểu tượng đồng hồ).
2. Công tắc **Cross teams & workspaces** (góc phải trên) mặc định **bật** — gộp giờ từ tất cả workspace bạn tham gia. Tắt công tắc này để chỉ xem dữ liệu workspace hiện tại.
3. Bảng hiển thị thêm cột **Workspace** để phân biệt nguồn gốc công việc.

{{screenshot:cham-cong-timesheet}}

## Mẹo & lưu ý

- **Bảng Timesheet là chỉ đọc**: không thể chỉnh sửa trực tiếp trong bảng — dùng nút **Log Time** trên từng công việc để ghi nhận hoặc sửa giờ.
- **Ngày log không được trong tương lai**: hệ thống chỉ chấp nhận log ngày hôm nay hoặc các ngày đã qua.
- **Lý do sửa bắt buộc**: khi chỉnh sửa worklog đã lưu, trường _Lý do thay đổi_ là bắt buộc — nhằm đảm bảo tính minh bạch trong kiểm tra chéo.
- **Log giờ hiển thị trong HO Dashboard**: worklog của bạn được tổng hợp tại Head Office Dashboard cho cấp quản lý xem.

## Liên quan

- [Capacity & báo cáo](/help/a/capacity-va-bao-cao)
- [Head Office Dashboard](/help/a/head-office-dashboard)
- [Chi tiết công việc](/help/a/chi-tiet-cong-viec)
