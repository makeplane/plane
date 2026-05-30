---
category: du-an-cong-viec
slug: quan-he-va-cong-viec-con
sort_order: 60000
title: "Quan hệ & công việc con"
status: published
---

## Mục đích

Liên kết các công việc có mối quan hệ với nhau (liên quan, trùng lặp, chặn) và chia nhỏ công việc lớn thành **công việc con** để theo dõi tiến độ chi tiết hơn.

## Quan hệ giữa các công việc

### Các loại quan hệ

| Loại              | Ý nghĩa                                                 |
| ----------------- | ------------------------------------------------------- |
| **Liên quan đến** | Hai việc có liên hệ nhưng không phụ thuộc               |
| **Chặn**          | Công việc này chặn việc kia — việc kia chưa thể bắt đầu |
| **Bị chặn bởi**   | Công việc này đang bị chặn bởi việc khác                |
| **Trùng lặp**     | Nội dung giống nhau, nên gộp hoặc xử lý song song       |

### Thêm quan hệ

1. Mở trang Chi tiết công việc.
2. Trong panel bên phải, bấm **+ Thêm quan hệ**.
3. Chọn loại quan hệ → tìm và chọn công việc liên quan.
4. Bấm **Xác nhận**.

{{screenshot:quan-he-va-cong-viec-con}}

> Quan hệ **Chặn / Bị chặn** hiển thị cảnh báo khi bạn cố chuyển trạng thái một công việc đang bị chặn.

---

## Công việc con (Sub-issues)

### Khi nào nên dùng

Dùng công việc con khi một nhiệm vụ có thể chia thành các bước nhỏ độc lập, mỗi bước cần giao cho người khác nhau hoặc theo dõi riêng.

### Thêm công việc con

1. Trong trang Chi tiết, cuộn đến mục **Công việc con** hoặc bấm **+ Thêm công việc con**.
2. Nhập tiêu đề và bấm **Tạo** — công việc con được tạo cùng dự án với công việc cha.
3. Hoặc bấm **Thêm việc hiện có** để gắn một công việc đã tồn tại làm con.

### Breadcrumb cha–con

Công việc con hiển thị **breadcrumb** phía trên tiêu đề để điều hướng về công việc cha. Công việc cha hiển thị thanh tiến độ tổng hợp dựa trên trạng thái các con.

### Phát hiện trùng lặp

Khi tạo công việc mới, nếu tiêu đề giống với công việc đã có, hệ thống gợi ý danh sách **có thể trùng lặp**. Bạn có thể đánh dấu quan hệ _Trùng lặp_ ngay từ bước tạo, thay vì tạo thêm.

## Mẹo & lưu ý

- Công việc con **kế thừa dự án** của cha — không thể gán vào dự án khác.
- Xóa công việc cha sẽ **không tự xóa** công việc con — các con trở thành công việc độc lập.
- Tối đa **2 cấp** lồng nhau (công việc → con → cháu) trong giao diện mặc định; tránh lồng sâu hơn để giữ cho luồng công việc rõ ràng.

## Liên quan

- [Tạo và quản lý công việc](/help/a/tao-va-quan-ly-cong-viec)
- [Chi tiết công việc](/help/a/chi-tiet-cong-viec)
- [Theo dõi & lịch sử công việc](/help/a/theo-doi-va-thong-bao-cong-viec)
