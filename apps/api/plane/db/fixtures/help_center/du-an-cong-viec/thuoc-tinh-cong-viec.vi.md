---
category: du-an-cong-viec
slug: thuoc-tinh-cong-viec
sort_order: 40000
title: "Thuộc tính công việc"
status: published
---

## Mục đích

Mỗi công việc trong Shinhan Workspace có một bộ thuộc tính giúp phân loại, giao việc và theo dõi tiến độ. Bài này giải thích ý nghĩa và cách dùng từng thuộc tính — bao gồm các tính năng riêng của SHBVN như lý do thay đổi ngày, danh mục công việc và tần suất lặp.

## Các thuộc tính cơ bản

### Trạng thái

Phản ánh giai đoạn xử lý: **Backlog → In Progress → Done** (hoặc bộ trạng thái tuỳ chỉnh theo dự án). Bấm vào icon trạng thái ở sidebar để thay đổi.

> Nếu dự án bật **Workflow**, một số chuyển trạng thái bị hạn chế theo quy tắc — xem [Tự động hóa & quy trình](/help/a/tu-dong-hoa-va-quy-trinh).

### Người phụ trách

Có thể gán **nhiều người**. Người phụ trách nhận thông báo khi công việc thay đổi. Bấm vào avatar hoặc trường _Người phụ trách_ để thêm/bớt.

### Ưu tiên

4 mức: **Khẩn cấp · Cao · Trung bình · Thấp** (và _Không có_). Ảnh hưởng đến thứ tự sắp xếp khi lọc theo ưu tiên.

### Nhãn

Gắn một hoặc nhiều nhãn màu để phân loại nội dung. Nhãn do Admin dự án tạo trong Cài đặt → Nhãn.

{{screenshot:thuoc-tinh-cong-viec}}

---

## Ngày bắt đầu & Ngày đến hạn

- **Ngày bắt đầu** (`start_date`): thời điểm dự kiến bắt tay vào việc.
- **Ngày đến hạn** (`target_date`): hạn chót hoàn thành. Hiển thị màu đỏ khi đã quá hạn.

### Lý do thay đổi ngày (SHBVN)

Khi bạn **thay đổi** ngày đến hạn (hoặc ngày hoàn thành) của một công việc **đã có ngày từ trước**, hệ thống yêu cầu nhập **lý do**. Quy tắc này giúp bộ phận quản lý theo dõi các thay đổi kế hoạch.

1. Chọn ngày mới trong bộ chọn ngày.
2. Hộp thoại **Lý do thay đổi** xuất hiện — nhập lý do (ví dụ: _Chờ phê duyệt từ Ban giám đốc_).
3. Bấm **Xác nhận** để lưu.

> Quy tắc nhập lý do chỉ áp dụng cho **ngày đến hạn** và **ngày hoàn thành** — **không** áp dụng cho ngày bắt đầu. Việc đặt ngày **lần đầu** (từ trống sang có ngày) cũng không yêu cầu lý do; chỉ việc **thay đổi** ngày đã có mới cần.
>
> Quy tắc này vẫn áp dụng khi cập nhật hàng loạt ở chế độ **Spreadsheet** — đổi ngày đến hạn trong lưới vẫn bị hỏi lý do.

{{screenshot:ly-do-thay-doi-ngay}}

---

## Danh mục công việc (SHBVN)

Trường **Danh mục** (Task Category) giúp phân loại mục đích công việc theo cấu trúc tổ chức ngân hàng (ví dụ: _Vận hành_, _Phát triển kinh doanh_, _Tuân thủ_). Danh mục do Admin instance cấu hình.

- Danh mục có **hai cấp**: chọn **Danh mục chính** trước trong sidebar; nếu danh mục chính có danh mục con thì hiện thêm trường **Danh mục con** để chọn.
- Đổi danh mục chính sẽ **xóa** lựa chọn danh mục con đang có.
- Trường Danh mục chỉ hiển thị khi workspace đã cấu hình ít nhất một danh mục chính (hoặc công việc đã có sẵn giá trị) — nếu workspace chưa cấu hình danh mục, bạn sẽ không thấy trường này.
- Danh mục ảnh hưởng đến báo cáo Worklog và bảng Head Office Dashboard.

---

## Tần suất lặp (Frequency)

Công việc định kỳ có thể gán **tần suất lặp**: Hằng ngày / Hai tuần một lần / Hằng tuần / Hằng tháng / Hằng quý / Nửa năm / Hằng năm / Đột xuất (Ad-hoc). Tần suất là **nhãn phân loại** cho công việc định kỳ, dùng để lọc và báo cáo.

- Bấm trường **Tần suất** trong sidebar → chọn chu kỳ.
- Để bỏ tần suất, chọn **Không có** (None).

> Lưu ý: tần suất chỉ là nhãn phân loại — hệ thống **không** tự tạo công việc của kỳ tiếp theo. Bạn vẫn cần tạo công việc cho mỗi kỳ thủ công.

---

## Thời điểm hoàn thành (Completed At)

Ghi lại **ngày giờ** công việc hoàn thành — dùng để tính thời gian xử lý thực tế trong báo cáo. Trường này chỉ xuất hiện khi công việc đang ở trạng thái thuộc nhóm **Hoàn thành** (Completed).

- Quản trị viên và Thành viên có thể chỉnh sửa thủ công ngày giờ hoàn thành.
- Giống ngày đến hạn, **mỗi lần thay đổi** giá trị đã có đều yêu cầu nhập **lý do**.
- Trường có thể bị khóa theo [Quyền chỉnh sửa trường](/help/a/phan-quyen-truong-du-lieu); khi bị khóa và đã có giá trị, trường hiển thị dạng chỉ đọc.

---

## Ước lượng (Estimate)

Điểm hoặc giờ ước tính khối lượng. Chỉ hiển thị nếu Admin dự án đã bật tính năng Ước lượng trong Cài đặt dự án.

## Mẹo & lưu ý

- Một số trường có thể bị **khoá** theo vai trò của bạn (xem [Phân quyền theo trường](/help/a/phan-quyen-truong-du-lieu)) — trường bị khoá hiển thị dạng chỉ đọc với tooltip "Bị khóa bởi quản trị viên dự án".
- Bạn có thể sửa nhiều thuộc tính cùng lúc từ chế độ **Spreadsheet** — tiện cho việc cập nhật hàng loạt.

## Liên quan

- [Chi tiết công việc](/help/a/chi-tiet-cong-viec)
- [Phân quyền theo trường](/help/a/phan-quyen-truong-du-lieu)
- [Tự động hóa & quy trình](/help/a/tu-dong-hoa-va-quy-trinh)
