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
| **Đang chặn**     | Công việc này chặn việc kia — việc kia chưa thể bắt đầu |
| **Bị chặn bởi**   | Công việc này đang bị chặn bởi việc khác                |
| **Trùng lặp với** | Nội dung giống nhau, nên gộp hoặc xử lý song song       |

### Thêm quan hệ

1. Mở trang Chi tiết công việc.
2. Cuộn xuống mục **Mối quan hệ** (nằm trong phần nội dung chính, dưới mô tả và trên Hoạt động).
3. Bấm nút biểu tượng **+** bên cạnh tiêu đề → chọn loại quan hệ.
4. Tìm và chọn công việc liên quan, rồi bấm **Thêm mục công việc đã chọn**.

{{screenshot:quan-he-va-cong-viec-con}}

> Quan hệ **Đang chặn / Bị chặn bởi** chỉ hiển thị trong widget Mối quan hệ để tham khảo; hệ thống **không** tự chặn việc chuyển trạng thái dựa trên quan hệ này.

---

## Công việc con (Sub-issues)

### Khi nào nên dùng

Dùng công việc con khi một nhiệm vụ có thể chia thành các bước nhỏ độc lập, mỗi bước cần giao cho người khác nhau hoặc theo dõi riêng.

### Thêm công việc con

1. Trong trang Chi tiết, cuộn đến mục **Mục công việc con** và bấm nút **+** bên cạnh tiêu đề.
2. Chọn **Tạo mới** để tạo công việc con mới (cùng dự án với công việc cha).
3. Hoặc chọn **Thêm mục hiện có** để gắn một công việc đã tồn tại làm con.

### Breadcrumb cha–con

Công việc con hiển thị **breadcrumb** phía trên tiêu đề để điều hướng về công việc cha. Công việc cha hiển thị thanh tiến độ tổng hợp dựa trên trạng thái các con.

### Đánh dấu công việc trùng lặp

Nếu phát hiện hai công việc trùng nội dung, hãy gắn quan hệ **Trùng lặp với** thủ công qua mục **Mối quan hệ** (bấm **+** → chọn _Trùng lặp với_ → chọn công việc kia). Sau đó gộp hoặc đóng bớt một trong hai.

## Mẹo & lưu ý

- Công việc con **kế thừa dự án** của cha — không thể gán vào dự án khác. (Quan hệ thông thường thì không giới hạn cùng dự án: modal thêm quan hệ có tuỳ chọn tìm ở **cấp workspace** để liên kết công việc ở dự án khác.)
- Bạn cũng có thể gán/đổi công việc cha trực tiếp qua thuộc tính **Công việc cha** ở panel bên phải trang Chi tiết.
- **Xóa công việc cha sẽ xóa luôn toàn bộ công việc con (và cháu) đi kèm.** Nếu muốn giữ lại một công việc con, hãy gỡ nó khỏi cha (đặt lại trường _Công việc cha_ về trống) **trước khi** xóa.
- Để gỡ một quan hệ, bấm nút xóa trên dòng quan hệ trong widget Mối quan hệ.
- Không có giới hạn kỹ thuật về số cấp lồng nhau, nhưng nên tránh lồng quá sâu để giữ cho luồng công việc rõ ràng.

## Liên quan

- [Tạo và quản lý công việc](/help/a/tao-va-quan-ly-cong-viec)
- [Chi tiết công việc](/help/a/chi-tiet-cong-viec)
- [Theo dõi & lịch sử công việc](/help/a/theo-doi-va-thong-bao-cong-viec)
