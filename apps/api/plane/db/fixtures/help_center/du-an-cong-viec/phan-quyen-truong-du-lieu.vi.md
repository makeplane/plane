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
- Truy cập: **Cài đặt dự án → Phân quyền theo trường** (Field Permissions).

---

## Các trường được kiểm soát

Hiện tại Shinhan Workspace hỗ trợ khoá các trường sau:

| Trường                                    | Mô tả                                             |
| ----------------------------------------- | ------------------------------------------------- |
| **Ngày bắt đầu** (Start Date)             | Khoá không cho thành viên thay đổi ngày bắt đầu   |
| **Ngày đến hạn** (Due Date / Target Date) | Khoá không cho thành viên thay đổi ngày đến hạn   |
| **Ngày hoàn thành** (Completed Date)      | Khoá không cho chỉnh sửa thủ công ngày hoàn thành |
| **Xóa công việc** (Delete Work Item)      | Ngăn thành viên xóa công việc                     |

{{screenshot:phan-quyen-truong-du-lieu}}

---

## Cách khoá / mở khoá trường

1. Vào **Cài đặt dự án → Phân quyền theo trường**.
2. Mỗi trường hiển thị một toggle bật/tắt.
3. Bật toggle → trường bị **khoá** với thành viên vai trò _Member_ và _Viewer_.
4. Tắt toggle → trường được **mở** — mọi thành viên chỉnh sửa bình thường.

> Thay đổi có hiệu lực ngay lập tức, không cần tải lại trang.

---

## Trải nghiệm với thành viên bị khoá

- Trường bị khoá hiển thị **icon ổ khoá** và tooltip _"Trường bị khoá"_ khi hover.
- Trường hiển thị dạng **chỉ đọc** — không mở bộ chọn khi bấm.
- **Ngoại lệ**: nếu trường đang **trống**, thành viên vẫn được điền giá trị lần đầu; chỉ khoá việc _thay đổi_ giá trị đã có.

---

## Quy tắc phân quyền

| Vai trò         | Trường bị khoá                           |
| --------------- | ---------------------------------------- |
| **Admin dự án** | Không bị ảnh hưởng — luôn chỉnh sửa được |
| **Member**      | Bị khoá — chỉ đọc                        |
| **Viewer**      | Bị khoá — chỉ đọc                        |

## Mẹo & lưu ý

- Khoá ngày đến hạn thường dùng sau khi dự án đã được phê duyệt kế hoạch — tránh thành viên tự ý dời deadline mà không thông qua Admin.
- Kết hợp với yêu cầu **lý do thay đổi ngày** (xem [Thuộc tính công việc](/help/a/thuoc-tinh-cong-viec)) để có thêm lớp kiểm soát khi Admin cần điều chỉnh.
- Khoá **Xóa công việc** đặc biệt hữu ích trong dự án lưu trữ hồ sơ — tránh mất dữ liệu do thao tác nhầm.

## Liên quan

- [Cấu hình dự án](/help/a/cau-hinh-du-an)
- [Thuộc tính công việc](/help/a/thuoc-tinh-cong-viec)
- [Tự động hóa & quy trình](/help/a/tu-dong-hoa-va-quy-trinh)
