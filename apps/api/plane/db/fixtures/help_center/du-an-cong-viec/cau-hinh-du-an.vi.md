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

Chỉ thành viên có vai trò **Admin** của dự án (hoặc Admin workspace) mới truy cập được phần lớn cài đặt dưới đây.

## Mở Cài đặt dự án

1. Bấm biểu tượng **bánh răng** cạnh tên dự án ở sidebar.
2. Hoặc vào trang dự án → bấm **Cài đặt** ở thanh điều hướng trên cùng.

{{screenshot:cau-hinh-du-an}}

---

## Thông tin chung

| Trường             | Mô tả                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| **Tên**            | Tên hiển thị của dự án                                                  |
| **Mã dự án**       | Tiền tố mã công việc (ví dụ `SHB`) — **không thể thay đổi sau khi tạo** |
| **Mô tả**          | Giới thiệu ngắn về mục đích dự án                                       |
| **Múi giờ**        | Dùng để tính toán báo cáo và thống kê                                   |
| **Quyền truy cập** | Secret (chỉ thành viên) hoặc Public (toàn workspace xem)                |
| **Icon & Bìa**     | Biểu tượng và ảnh bìa hiển thị trong danh sách dự án                    |

---

## Trạng thái (States)

Vào **Cài đặt → Trạng thái** để quản lý vòng đời công việc:

1. Bấm **+ Thêm trạng thái** → nhập tên, chọn nhóm (_Backlog / Unstarted / Started / Completed / Cancelled_) và màu sắc.
2. Kéo-thả để sắp xếp lại thứ tự.
3. Bấm biểu tượng bút chì để sửa; biểu tượng thùng rác để xóa (chỉ xóa được nếu không có công việc đang dùng trạng thái đó).

---

## Nhãn (Labels)

Vào **Cài đặt → Nhãn** để tạo và quản lý nhãn phân loại công việc:

- Bấm **+ Thêm nhãn** → nhập tên và chọn màu.
- Nhãn dùng chung cho tất cả công việc trong dự án.

---

## Ước lượng (Estimates)

Vào **Cài đặt → Ước lượng** để bật tính năng và chọn kiểu: _Điểm_ (1, 2, 3, 5, 8…) hoặc _Giờ_. Khi bật, trường Ước lượng xuất hiện trong mỗi công việc.

---

## Thành viên & vai trò

Vào **Cài đặt → Thành viên**:

- **Mời thành viên**: nhập email → chọn vai trò (Viewer / Member / Admin) → Gửi lời mời.
- **Đổi vai trò**: bấm vai trò hiện tại của thành viên → chọn vai trò mới.
- **Xóa thành viên**: bấm menu `…` → Xóa khỏi dự án.

---

## Tính năng bật/tắt

Vào **Cài đặt → Tính năng** để bật/tắt:

| Tính năng                  | Chú thích                       |
| -------------------------- | ------------------------------- |
| **Cycles**                 | Vòng lặp sprint                 |
| **Modules**                | Nhóm công việc theo chủ đề      |
| **Intake**                 | Cổng tiếp nhận yêu cầu          |
| **Trang tài liệu (Pages)** | Ghi chú và tài liệu trong dự án |

---

## Lưu trữ và xóa dự án

Xem hướng dẫn tại [Làm việc với dự án](/help/a/lam-viec-voi-du-an) — mục _Lưu trữ_ và _Xóa dự án_.

## Liên quan

- [Làm việc với dự án](/help/a/lam-viec-voi-du-an)
- [Tự động hóa & quy trình](/help/a/tu-dong-hoa-va-quy-trinh)
- [Phân quyền theo trường](/help/a/phan-quyen-truong-du-lieu)
