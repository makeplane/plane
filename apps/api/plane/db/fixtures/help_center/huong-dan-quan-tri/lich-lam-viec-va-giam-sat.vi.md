---
category: huong-dan-quan-tri
slug: lich-lam-viec-va-giam-sat
sort_order: 60000
title: "Lịch làm việc & giám sát"
status: published
---

## Mục đích

Hai mục cuối trong God Mode phục vụ vận hành hệ thống hằng ngày: **Business Calendar** quản lý lịch làm việc và ngày lễ của ngân hàng; **Monitoring** theo dõi email gửi đi, tác vụ nền định kỳ, và tình trạng worker. Ngoài ra, God Mode còn chứa mục **Help Center** để Instance Admin soạn thảo và quản lý các bài hướng dẫn này.

## Khi nào dùng / Yêu cầu

- Vai trò: **Instance Admin**.
- Business Calendar: thiết lập một lần khi triển khai, cập nhật định kỳ đầu năm (ngày lễ, ngày nghỉ bù).
- Monitoring: kiểm tra khi có sự cố gửi email hoặc tác vụ nền không chạy đúng.

---

## A. Business Calendar — Lịch làm việc

### Khởi tạo lịch mặc định

Lần đầu vào **God Mode → Business Calendar**, nếu chưa có lịch nào, trang hiển thị:

> _"No business calendar yet — Initialize the default 'VN Banking' schedule to start managing working days and holidays."_

1. Nhấn **Initialize default schedule**.
2. Hệ thống tạo lịch **VN Banking** với múi giờ `Asia/Ho_Chi_Minh`, làm việc từ Thứ Hai đến Thứ Sáu.

{{screenshot:god-mode-calendar-init}}

### Xem và chỉnh sửa lịch

Sau khi khởi tạo, trang **Business Calendar** hiển thị chi tiết lịch hiện tại:

{{screenshot:god-mode-calendar-detail}}

Từ trang chi tiết, quản trị viên có thể:

- **Xem mẫu tuần làm việc** (week pattern): các ngày được đánh dấu là ngày làm việc.
- **Thêm ngày lễ** (holidays): nhập tên và ngày → lưu. Các ngày lễ ảnh hưởng đến tính toán deadline và capacity.
- **Override ngày cụ thể**: đánh dấu một ngày thường thành ngày nghỉ (nghỉ bù) hoặc ngày lễ thành ngày làm việc bù.

### Mẹo & lưu ý

- Lịch làm việc ảnh hưởng đến tính năng **chấm công** và **capacity** — cập nhật ngày lễ đúng đầu mỗi năm để số liệu báo cáo chính xác.
- Shinhan Workspace hiện hỗ trợ **một lịch duy nhất** toàn instance (VN Banking). Không tạo thêm lịch song song.
- Múi giờ và ngày đầu tuần cố định theo cấu hình VN Banking — liên hệ kỹ thuật nếu cần thay đổi.

---

## B. Monitoring — Giám sát hệ thống

### Các tab giám sát

1. Vào **God Mode** → **Monitoring**.
2. Trang có 3 tab:

| Tab                  | Nội dung                                 |
| -------------------- | ---------------------------------------- |
| **Issue Email Logs** | Nhật ký email thông báo công việc gửi đi |
| **Scheduled Jobs**   | Tác vụ nền định kỳ (Celery beat)         |
| **Worker Health**    | Tình trạng Celery worker                 |

{{screenshot:god-mode-monitoring-tabs}}

### Tab: Issue Email Logs

Hiển thị danh sách email thông báo đã gửi, gồm: người nhận, tiêu đề, thời gian gửi, và trạng thái (thành công / thất bại).

- Dùng để xác minh email đến tay người nhận khi có phản ánh "không nhận được thông báo".
- Trạng thái **Failed** cho thấy SMTP chưa cấu hình đúng hoặc địa chỉ email không hợp lệ.

{{screenshot:god-mode-email-logs-tab}}

### Tab: Scheduled Jobs

Liệt kê các tác vụ Celery beat đã lên lịch: tên tác vụ, lần chạy cuối, lần chạy tiếp theo, trạng thái.

- Dùng để kiểm tra xem tác vụ tự động (lưu trữ, tổng hợp dữ liệu...) có chạy đúng giờ không.
- Tác vụ trễ hoặc không chạy thường do worker bị dừng — kiểm tra tab Worker Health.

{{screenshot:god-mode-scheduled-jobs-tab}}

### Tab: Worker Health

Hiển thị tình trạng các Celery worker: **Online / Offline**, số tác vụ đang xử lý, thời gian hoạt động.

- Nếu worker **Offline**: liên hệ nhóm hạ tầng để khởi động lại container/service Celery.
- Worker online là điều kiện cần cho email thông báo và tác vụ nền hoạt động bình thường.

{{screenshot:god-mode-worker-health-tab}}

---

## C. Help Center — Quản lý nội dung hướng dẫn

1. Vào **God Mode** → **Help Center**.
2. Trang chia làm hai cột: **Categories** (trái) và **Articles** (phải).

### Quản lý category

- Nhấn **+** bên cạnh "Categories" để thêm category mới (tên, icon, slug, thứ tự).
- Nhấn biểu tượng chỉnh sửa trên category để sửa tên hoặc thứ tự.

### Quản lý bài viết

1. Chọn category ở cột trái → danh sách bài trong category hiển thị ở cột phải.
2. Nhấn **New article** → điền tiêu đề và slug → **Create**.
3. Nhấn vào bài để mở panel soạn thảo bên phải: chỉnh nội dung Markdown, chọn ngôn ngữ (VI / EN / KO) qua các tab locale.
4. Nhấn **Save** (hoặc tổ hợp Ctrl/Cmd+S) để lưu nháp; chuyển trạng thái sang **Published** khi sẵn sàng công bố.

{{screenshot:god-mode-help-center-editor}}

### Mẹo & lưu ý

- Bài viết hỗ trợ Markdown thuần — heading, danh sách, bảng, `code`, link, và placeholder ảnh `{{screenshot:ten-kebab}}`.
- Thay đổi trạng thái sang **Published** có hiệu lực ngay — nhân viên thấy bài mới khi mở `/help` lần sau.
- Nên soạn thảo đủ cả 3 ngôn ngữ (VI/EN/KO) để đáp ứng nhân viên người Hàn công tác tại SHBVN.

---

## Liên quan

- [Giới thiệu God Mode](/help/a/gioi-thieu-god-mode)
- [Email, AI & thư viện ảnh](/help/a/email-ai-va-thu-vien-anh)
- [Chấm công & timesheet](/help/a/cham-cong-va-timesheet)
