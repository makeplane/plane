---
category: du-an-cong-viec
slug: phan-quyen-truong-du-lieu
sort_order: 110000
title: "Phân quyền theo trường"
status: published
---

## Mục đích

Phân quyền theo trường (Field Permissions) cho phép Admin dự án **khoá một số trường** của công việc để thành viên thường không thể tự ý thay đổi — ví dụ: khoá ngày đến hạn sau khi đã được phê duyệt kế hoạch.

## Khi nào dùng / Yêu cầu

- Chỉ **Admin dự án** mới vào được trang này.
- Truy cập: **Cài đặt dự án → Quyền chỉnh sửa trường** (Field Permissions).

---

## Các trường được kiểm soát

Hiện tại Shinhan Workspace hỗ trợ khoá các trường sau:

| Trường                                    | Mô tả                                             |
| ----------------------------------------- | ------------------------------------------------- |
| **Ngày bắt đầu** (Start Date)             | Khoá không cho thành viên thay đổi ngày bắt đầu   |
| **Ngày đến hạn** (Due Date)               | Khoá không cho thành viên thay đổi ngày đến hạn   |
| **Ngày hoàn thành** (Completed Date)      | Khoá không cho chỉnh sửa thủ công ngày hoàn thành |
| **Xóa công việc** (Delete Work Item)      | Ngăn thành viên xóa công việc                     |

{{screenshot:phan-quyen-truong-du-lieu}}

---

## Cách khoá / mở khoá trường

1. Vào **Cài đặt dự án → Quyền chỉnh sửa trường**.
2. Mỗi trường hiển thị một toggle với hai trạng thái: **Cho phép thành viên** (bật) và **Chỉ quản trị viên** (tắt).
3. Bật toggle (**Cho phép thành viên**) → Thành viên (Member) được chỉnh sửa trường đó.
4. Tắt toggle (**Chỉ quản trị viên**) → trường bị **khoá**, chỉ Admin dự án sửa được.

> **Mặc định mọi trường đều ở trạng thái _Chỉ quản trị viên_ (khoá)** ngay từ khi tạo dự án — Thành viên chưa thể sửa ngày hoặc xóa công việc cho tới khi Admin bật toggle tương ứng.
>
> Thay đổi có hiệu lực ngay lập tức, không cần tải lại trang.

---

## Trải nghiệm với thành viên bị khoá

- Trên công việc, trường ngày bị khoá hiển thị dạng **chỉ đọc**; khi hover hiện tooltip _"Bị khóa bởi quản trị viên dự án"_. (Icon ổ khoá chỉ xuất hiện trong trang Cài đặt khi toggle ở trạng thái _Chỉ quản trị viên_.)
- **Ngoại lệ (chỉ áp dụng cho 3 trường ngày)**: nếu trường ngày đang **trống**, Thành viên vẫn được điền giá trị lần đầu; chỉ khoá việc _thay đổi_ giá trị đã có.
- **Xóa công việc** không có ngoại lệ — khi bị khoá, Thành viên hoàn toàn không xóa được công việc nào.

---

## Quy tắc phân quyền

| Vai trò         | Trường bị khoá                           |
| --------------- | ---------------------------------------- |
| **Quản trị viên** (Admin dự án) | Không bị ảnh hưởng — luôn chỉnh sửa được |
| **Thành viên** (Member) | Bị khoá — chỉ đọc                |
| **Khách** (Guest)       | Bị khoá — chỉ đọc                |

## Mẹo & lưu ý

- Khoá ngày đến hạn thường dùng sau khi dự án đã được phê duyệt kế hoạch — tránh thành viên tự ý dời deadline mà không thông qua Admin.
- Yêu cầu **nhập lý do** khi thay đổi ngày đến hạn hoặc ngày hoàn thành là cơ chế **luôn bật**, độc lập với khoá trường — kể cả Admin cũng phải nhập lý do (xem [Thuộc tính công việc](/help/a/thuoc-tinh-cong-viec)).
- Khoá **Xóa công việc** đặc biệt hữu ích trong dự án lưu trữ hồ sơ — tránh mất dữ liệu do thao tác nhầm.

## Liên quan

- [Cấu hình dự án](/help/a/cau-hinh-du-an)
- [Thuộc tính công việc](/help/a/thuoc-tinh-cong-viec)
- [Tự động hóa & quy trình](/help/a/tu-dong-hoa-va-quy-trinh)
