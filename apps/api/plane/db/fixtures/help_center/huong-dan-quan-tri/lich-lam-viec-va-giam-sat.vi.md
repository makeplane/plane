---
category: huong-dan-quan-tri
slug: lich-lam-viec-va-giam-sat
sort_order: 60000
title: "Lịch làm việc & giám sát"
status: published
---

## Mục đích

Ba mục vận hành trong God Mode: **Business Calendar** quản lý lịch làm việc và ngày lễ của ngân hàng; **Monitoring** theo dõi email gửi đi, tác vụ nền định kỳ, và tình trạng worker; **Help Center** để Instance Admin soạn thảo và quản lý các bài hướng dẫn này.

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

- **Chỉnh mẫu tuần làm việc** (week pattern): nhấn chip **Working:** để mở hộp thoại bật/tắt từng ngày làm việc — thay đổi tự lưu sau khoảng 300ms.
- **Thêm ngày lễ** (holidays): nhập tên và ngày → lưu. Các ngày lễ ảnh hưởng đến tính toán ngày làm việc (deadline).
- **Override ngày cụ thể**: đánh dấu một ngày thường thành ngày nghỉ (nghỉ bù) hoặc ngày lễ thành ngày làm việc bù.

### Mẹo & lưu ý

- Lịch làm việc ảnh hưởng đến **chấm công** và **tính ngày làm việc / deadline** — cập nhật ngày lễ đúng đầu mỗi năm để số liệu chính xác.
- Shinhan Workspace hiện hỗ trợ **một lịch duy nhất** toàn instance (VN Banking). Không tạo thêm lịch song song.
- Tuần làm việc có thể chỉnh trực tiếp qua chip **Working:** (tự lưu). Riêng **múi giờ** hiển thị cố định ở trang chi tiết — liên hệ kỹ thuật nếu cần đổi múi giờ.

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

Hiển thị danh sách email thông báo đã gửi, gồm các cột: **Receiver** (người nhận), **Triggered By** (người kích hoạt), **Entity** (loại đối tượng), **Created** (ngày tạo), và **Status**. Trạng thái gồm **Sent** / **Processed** / **Pending**.

- Dùng để xác minh email đến tay người nhận khi có phản ánh "không nhận được thông báo".
- Có thể lọc theo **Date From** / **Date To** / **Entity**.
- Nếu email mãi ở trạng thái **Pending**/**Processed** mà không đến nơi, kiểm tra lại cấu hình SMTP và địa chỉ email người nhận.

{{screenshot:god-mode-email-logs-tab}}

### Tab: Scheduled Jobs

Liệt kê các tác vụ Celery beat đã lên lịch với các cột: **Name** (tên), **Task**, **Schedule** (lịch chạy), **Enabled** (chấm xanh = bật, đỏ = tắt), **Last Run** (lần chạy cuối), **Run Count** (số lần đã chạy).

- Dùng để kiểm tra xem tác vụ tự động (lưu trữ, tổng hợp dữ liệu...) có được bật và chạy đúng giờ không.
- Tác vụ trễ hoặc không chạy thường do worker bị dừng — kiểm tra tab Worker Health.

{{screenshot:god-mode-scheduled-jobs-tab}}

### Tab: Worker Health

Hiển thị danh sách worker đang chạy — mỗi worker gồm: tên, **Active Tasks** (số tác vụ đang xử lý), **Pool**, **Uptime** (thời gian hoạt động). Trên cùng có thanh tổng quan (tổng số Workers, tổng Active Tasks, tự động làm mới mỗi 30 giây, nút Refresh).

- Nếu không kết nối được worker, trang hiển thị cảnh báo **"Could not reach Celery workers"** — liên hệ nhóm hạ tầng để khởi động lại container/service Celery.
- Có worker đang chạy là điều kiện cần cho email thông báo và tác vụ nền hoạt động bình thường.

{{screenshot:god-mode-worker-health-tab}}

---

## C. Help Center — Quản lý nội dung hướng dẫn

1. Vào **God Mode** → **Help Center**.
2. Trang chia làm hai cột: **Categories** (trái) và **Articles** (phải).

### Quản lý category

- Nhấn **Add Category** để thêm category (chọn icon, đánh dấu **Active**, và điền tên theo từng ngôn ngữ VI / EN / KO qua các tab). Category không có trường slug hay thứ tự nhập tay.
- Nhấn biểu tượng chỉnh sửa trên category để sửa; bỏ chọn **Active** để ẩn category (hiển thị nhãn _Hidden_).
- Đổi thứ tự category (và bài viết) bằng nút mũi tên lên/xuống ngay trên từng dòng.

### Quản lý bài viết

1. Chọn category ở cột trái → danh sách bài trong category hiển thị ở cột phải.
2. Nhấn **New Article** → chọn category, chọn ngôn ngữ đầu tiên (VI / EN / KO), điền tiêu đề → nhấn **Create & edit**. Slug được sinh tự động từ tiêu đề; có thể sửa slug sau trong panel khi bài còn ở trạng thái nháp (slug bị khóa sau khi Publish).
3. Nhấn vào bài để mở panel soạn thảo bên phải. Đây là trình soạn thảo rich text (WYSIWYG) với thanh công cụ định dạng luôn hiển thị (heading, danh sách, bảng, code, link, chèn ảnh qua nút upload), kèm nút **Preview/Edit** để xem trước. Chọn ngôn ngữ qua các tab locale.
4. Trong mỗi tab ngôn ngữ, nhấn nút **Save VI / Save EN / Save KO** để lưu nội dung bản dịch đó (không có phím tắt Ctrl/Cmd+S). Dùng nút **Publish** để công bố bài và **Unpublish** để gỡ. Bài chỉ Publish được khi đã có ít nhất một tiêu đề bản dịch.

{{screenshot:god-mode-help-center-editor}}

### Mẹo & lưu ý

- Trình soạn thảo định dạng nội dung qua thanh công cụ (heading, danh sách, bảng, code, link, ảnh) và lưu dưới dạng HTML — không phải Markdown. Không gõ cú pháp `{{screenshot:...}}` trong trình soạn thảo: đó là cú pháp dành riêng cho nội dung khởi tạo bằng file `.md` trong mã nguồn và sẽ bị loại bỏ nếu lưu lại qua God Mode.
- Khi một tab ngôn ngữ còn trống, trình soạn thảo hiện dòng _"This language is empty. Copy from:"_ để sao chép nhanh nội dung từ ngôn ngữ đã có — tiện khi dịch VI/EN/KO.
- Nhấn **Publish** có hiệu lực ngay — nhân viên thấy bài mới khi mở `/help` lần sau.
- Nên soạn thảo đủ cả 3 ngôn ngữ (VI/EN/KO) để đáp ứng nhân viên người Hàn công tác tại SHBVN.
- Xóa category sẽ khiến các bài trong đó không còn category; xóa bài viết không thể hoàn tác — thao tác cẩn trọng.

---

## Liên quan

- [Giới thiệu God Mode](/help/a/gioi-thieu-god-mode)
- [Email, AI & thư viện ảnh](/help/a/email-ai-va-thu-vien-anh)
- [Chấm công & timesheet](/help/a/cham-cong-va-timesheet)
