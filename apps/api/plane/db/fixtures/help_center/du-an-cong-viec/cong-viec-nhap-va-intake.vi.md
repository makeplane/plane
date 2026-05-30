---
category: du-an-cong-viec
slug: cong-viec-nhap-va-intake
sort_order: 80000
title: "Công việc nháp & Intake"
status: published
---

## Mục đích

**Công việc nháp** là công việc chưa gán vào dự án — dùng để ghi nhanh ý tưởng hoặc yêu cầu trước khi xử lý. **Intake** là cổng tiếp nhận yêu cầu từ bên ngoài nhóm, giúp quản lý quyết định duyệt, trì hoãn hoặc từ chối trước khi đưa vào dự án.

## Công việc nháp (Drafts)

### Tạo công việc nháp

1. Trong hộp thoại tạo công việc, bấm **Lưu nháp** thay vì _Tạo công việc_.
2. Hoặc vào **Nháp** (Drafts) trên thanh bên trái → bấm **+ Tạo nháp**.

{{screenshot:cong-viec-nhap-va-intake}}

### Xem và quản lý nháp

- Vào **Nháp** ở sidebar để xem tất cả công việc nháp của bạn trong workspace.
- Nháp **chỉ hiển thị với người tạo** — không xuất hiện trong dự án hay view công khai.

### Chuyển nháp thành công việc thật

1. Mở công việc nháp → bấm **Chuyển vào dự án** (hoặc _Move to Project_).
2. Chọn dự án đích.
3. Gán trạng thái, người phụ trách nếu chưa có → bấm **Xác nhận**.
4. Công việc xuất hiện trong dự án như một công việc bình thường.

---

## Intake (Tiếp nhận yêu cầu)

Intake cho phép người dùng **ngoài nhóm** (hoặc bất kỳ thành viên nào) gửi yêu cầu vào dự án. Quản lý dự án xem xét từng yêu cầu trước khi đưa vào backlog.

> Intake phải được **bật** trong Cài đặt dự án → Tính năng. Chỉ Admin dự án mới bật/tắt được.

### Gửi yêu cầu qua Intake

1. Vào dự án → tab **Intake**.
2. Bấm **+ Tạo yêu cầu** → điền tiêu đề và mô tả → Gửi.

### Xử lý yêu cầu Intake (dành cho Admin / Lead)

Mỗi yêu cầu Intake có 3 hành động:

| Hành động             | Kết quả                                             |
| --------------------- | --------------------------------------------------- |
| **Duyệt (Accept)**    | Tạo công việc chính thức trong dự án từ yêu cầu này |
| **Trì hoãn (Snooze)** | Ẩn yêu cầu tạm thời, xem lại sau theo ngày đã đặt   |
| **Từ chối (Decline)** | Đóng yêu cầu; yêu cầu nhập **lý do từ chối**        |

> Khi từ chối, lý do được lưu trong Activity và có thể gửi thông báo cho người gửi.

### Nhận biết nguồn gốc (source pill)

Mỗi công việc được tạo từ Intake hiển thị nhãn **Intake** màu sắc riêng biệt trong trang Chi tiết — giúp phân biệt với công việc tạo trực tiếp.

### Phát hiện trùng lặp khi duyệt

Khi bấm **Duyệt**, hệ thống tự động kiểm tra xem có công việc tương tự đã tồn tại không và gợi ý danh sách trùng. Bạn có thể chọn **gộp** vào việc đã có thay vì tạo mới.

## Mẹo & lưu ý

- Công việc nháp **không bị mất** khi đóng trình duyệt — được lưu server.
- Yêu cầu Intake bị từ chối vẫn lưu trong tab _Đã từ chối_ để tham chiếu sau.
- Nếu dự án không hiển thị tab Intake, hãy yêu cầu Admin bật tính năng trong Cài đặt dự án.

## Liên quan

- [Tạo và quản lý công việc](/help/a/tao-va-quan-ly-cong-viec)
- [Cấu hình dự án](/help/a/cau-hinh-du-an)
- [Quan hệ & công việc con](/help/a/quan-he-va-cong-viec-con)
