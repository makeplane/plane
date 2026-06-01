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

- **Thành viên** (Member) hoặc **Quản trị viên** (Admin) được giao công việc mới log được giờ cho công việc đó. **Khách** (Guest) không log được. Công việc đã hoàn thành/đã hủy hoặc có công việc con cũng không log được.
- Tính năng có ở cấp **dự án** (Timesheet tab trong dự án) và cấp **workspace** (Time Tracking trong sidebar).
- Worklog được tính theo ngày; mỗi mục log lưu: ngày, số giờ/phút, mô tả (tùy chọn).

## Các bước

### Log giờ trực tiếp từ công việc

1. Mở chi tiết một công việc bạn được giao (chưa hoàn thành/hủy, không có công việc con).
2. Nhấp nút **Log Time** (đồng hồ) trên thanh hành động phía trên bên phải. Nếu không thấy nút này, kiểm tra các điều kiện trên (bạn không được giao, công việc đã đóng/có công việc con, hoặc dự án tắt Time Tracking).
3. Cửa sổ **Log Time** hiện ra — điền:
   - **Ngày** (mặc định là hôm nay; chọn ngày trong quá khứ nếu cần).
   - **Giờ** và **Phút** đã làm.
   - **Mô tả** (tùy chọn) — ghi chú nội dung công việc đã làm.
4. Nhấp **Log Time** để lưu.

{{screenshot:cham-cong-worklog-modal}}

> **Lưu ý:** Chỉ **Quản trị viên dự án** (Admin) mới sửa/xóa được worklog, và chỉ trong vòng **60 ngày làm việc** gần nhất khi công việc chưa hoàn thành/hủy. Một Thành viên thường **không** tự sửa/xóa được worklog của chính mình — nếu cần điều chỉnh, hãy báo Admin dự án.

1. Mở chi tiết công việc → cuộn xuống phần **Activity** → mở rộng nhóm worklog (dòng "... logged time").
2. Di chuột vào dòng worklog cần sửa để hiện menu ba chấm (**...**) → chọn **Edit** hoặc **Delete**.
3. Khi **Edit**: cập nhật số giờ/phút, sau đó nhấp **Update**.
4. Khi **Delete**: cửa sổ xác nhận yêu cầu nhập **Lý do** (bắt buộc) trước khi xóa.

{{screenshot:cham-cong-worklog-edit}}

### Xem Timesheet theo tuần (cấp dự án)

> **Lưu ý:** Bảng Timesheet là **chỉ đọc** — không thể nhấp ô để nhập giờ trực tiếp. Để ghi nhận hoặc chỉnh sửa giờ, dùng nút **Log Time** trên từng công việc (xem mục [Log giờ trực tiếp từ công việc](#log-giờ-trực-tiếp-từ-công-việc) ở trên).

1. Vào dự án → chọn **Time Tracking** (biểu tượng đồng hồ) trong sidebar dự án. Tiêu đề trang là **My Timesheet**. Mục này chỉ hiện khi dự án đã bật Time Tracking.
2. Bảng hiển thị các công việc bạn đã log trong tuần hiện tại — mỗi hàng là một công việc, mỗi cột là một ngày trong tuần.
3. Nhấp **< >** (mũi tên tuần) để chuyển sang tuần trước/sau, hoặc nhấp **Tuần này** (This Week) để quay về tuần hiện tại.
4. Mỗi ô hiển thị tổng giờ đã log cho công việc đó trong ngày hôm đó (ví dụ: `2h 30m`); ô hiển thị dấu `-` nếu chưa log.
5. Hàng cuối bảng hiển thị **tổng giờ** mỗi ngày và **tổng cả tuần**.

{{screenshot:cham-cong-timesheet-grid}}

### Xem Timesheet toàn workspace (đa dự án)

1. Từ sidebar, chọn **Time Tracking** (biểu tượng đồng hồ).
2. Công tắc **Cross teams & workspaces** (góc phải trên) mặc định **bật** — gộp giờ từ tất cả workspace bạn tham gia. Tắt công tắc này để chỉ xem dữ liệu workspace hiện tại.
3. Bảng hiển thị thêm cột **Workspace** để phân biệt nguồn gốc công việc.
4. Nhấp nút **Export** trên thanh trên bảng để xuất bảng timesheet ra file Excel (.xlsx) — tiện cho việc nộp báo cáo. Nút Export có sẵn ở cả timesheet cấp dự án và cấp workspace.

{{screenshot:cham-cong-timesheet}}

## Mẹo & lưu ý

- **Bảng Timesheet là chỉ đọc**: không thể chỉnh sửa trực tiếp trong bảng — dùng nút **Log Time** trên từng công việc để ghi nhận hoặc sửa giờ.
- **Giới hạn ngày log**: chỉ log được ngày hôm nay hoặc ngày đã qua (không được ngày tương lai), và không quá **60 ngày làm việc** gần nhất.
- **Giới hạn số giờ**: tối đa **12 giờ** (720 phút) mỗi lần log, và tối đa **12 giờ** tổng cộng mỗi ngày. Vượt giới hạn này hệ thống sẽ từ chối.
- **Lý do sửa bắt buộc**: khi chỉnh sửa worklog đã lưu, trường _Lý do thay đổi_ là bắt buộc — nhằm đảm bảo tính minh bạch trong kiểm tra chéo.
- **Log giờ hiển thị trong HO Dashboard**: worklog của bạn được tổng hợp tại Head Office Dashboard cho cấp quản lý xem.

## Liên quan

- [Capacity & báo cáo](/help/a/capacity-va-bao-cao)
- [Head Office Dashboard](/help/a/head-office-dashboard)
- [Chi tiết công việc](/help/a/chi-tiet-cong-viec)
