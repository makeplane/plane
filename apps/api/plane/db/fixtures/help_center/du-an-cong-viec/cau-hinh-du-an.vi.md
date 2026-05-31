---
category: du-an-cong-viec
slug: cau-hinh-du-an
sort_order: 90000
title: "Cấu hình dự án"
status: published
---

## Mục đích

Cài đặt dự án cho phép Admin điều chỉnh tên, mã, múi giờ, bộ trạng thái, nhãn, ước lượng, thành viên và các tính năng bật/tắt — giúp dự án phù hợp với quy trình làm việc của nhóm.

## Khi nào dùng / Yêu cầu

Phần lớn cài đặt dưới đây chỉ dành cho **Quản trị viên** của dự án (hoặc Admin workspace). Tuy nhiên **Thành viên** cũng truy cập được các mục _Trạng thái_, _Nhãn_ và _Workflows_; mục _Thông tin chung_ và _Thành viên_ thì cả _Khách_ cũng xem được.

## Mở Cài đặt dự án

1. Di chuột tới dự án ở sidebar → bấm biểu tượng **…** (thêm) → chọn **Cài đặt** (Settings).
2. Hoặc trên trang Nhóm/Dự án, mở menu **…** của thẻ dự án → **Cài đặt**.

{{screenshot:cau-hinh-du-an}}

---

## Thông tin chung

| Trường             | Mô tả                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| **Tên**            | Tên hiển thị của dự án                                                  |
| **Mã dự án (Project ID)** | Tiền tố mã công việc (ví dụ `SHB`), tối đa 10 ký tự; Admin có thể đổi (hệ thống kiểm tra trùng) |
| **Mô tả**          | Giới thiệu ngắn về mục đích dự án                                       |
| **Múi giờ**        | Dùng để tính toán báo cáo và thống kê                                   |
| **Quyền truy cập** | Riêng tư (chỉ truy cập bằng lời mời) hoặc Công khai (mọi người trong workspace, trừ Khách, có thể tham gia) |
| **Icon & Bìa**     | Biểu tượng và ảnh bìa hiển thị trong danh sách dự án                    |

---

## Trạng thái (States)

Vào **Cài đặt → Trạng thái** để quản lý vòng đời công việc:

1. Bấm **+ Thêm trạng thái** → nhập tên, chọn nhóm (_Backlog / Unstarted / Started / Completed / Cancelled_) và màu sắc.
2. Kéo-thả để sắp xếp lại thứ tự.
3. Bấm biểu tượng bút chì để sửa; biểu tượng thùng rác để xóa. Không xóa được trạng thái **mặc định**, hoặc trạng thái **duy nhất còn lại** trong một nhóm; nếu còn công việc đang dùng trạng thái đó, hãy chuyển chúng sang trạng thái khác trước.
4. Bấm **Đánh dấu mặc định** để chọn trạng thái khởi tạo cho công việc mới (trạng thái mặc định không thể xóa).

---

## Nhãn (Labels)

Vào **Cài đặt → Nhãn** để tạo và quản lý nhãn phân loại công việc:

- Bấm **+ Thêm nhãn** → nhập tên và chọn màu.
- Nhãn dùng chung cho tất cả công việc trong dự án.

---

## Ước lượng (Estimates)

Vào **Cài đặt → Ước lượng** để bật tính năng và chọn kiểu: _Điểm_ (1, 2, 3, 5, 8…) hoặc _Phân loại_ (ví dụ T-Shirt Sizes: XS/S/M/L…). Khi bật, trường Ước lượng xuất hiện trong mỗi công việc.

---

## Thành viên & vai trò

Vào **Cài đặt → Thành viên**:

- **Thêm thành viên**: bấm **Thêm thành viên** → chọn đồng nghiệp đã có trong workspace từ danh sách → gán vai trò (Khách / Thành viên / Quản trị viên) → bấm **Thêm**. (Mời người mới qua email được thực hiện ở cấp workspace, không phải ở đây.)
- **Đổi vai trò**: bấm vai trò hiện tại của thành viên → chọn vai trò mới.
- **Xóa thành viên**: bấm menu `…` → Xóa khỏi dự án.

---

## Tính năng bật/tắt

Trong nhóm **Tính năng** của Cài đặt dự án, mỗi tính năng là một mục riêng có công tắc bật/tắt:

| Tính năng                       | Chú thích                       |
| ------------------------------- | ------------------------------- |
| **Cycles**                      | Vòng lặp sprint                 |
| **Modules**                     | Nhóm công việc theo chủ đề      |
| **Views (Chế độ xem)**          | Chế độ xem tùy biến của dự án   |
| **Trang tài liệu (Pages)**      | Ghi chú và tài liệu trong dự án |
| **Intake**                      | Cổng tiếp nhận yêu cầu          |
| **Time-tracking (Theo dõi thời gian)** | Ghi nhận thời gian làm việc |

---

## Lưu trữ và xóa dự án

Xem hướng dẫn tại [Làm việc với dự án](/help/a/lam-viec-voi-du-an) — mục _Lưu trữ_ và _Xóa dự án_.

## Liên quan

- [Làm việc với dự án](/help/a/lam-viec-voi-du-an)
- [Tự động hóa & quy trình](/help/a/tu-dong-hoa-va-quy-trinh)
- [Phân quyền theo trường](/help/a/phan-quyen-truong-du-lieu)
