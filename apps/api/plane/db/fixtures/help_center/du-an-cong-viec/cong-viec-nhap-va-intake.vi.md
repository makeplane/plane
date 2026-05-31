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

1. Khi đóng hộp thoại tạo công việc lúc còn nội dung chưa lưu, hệ thống hỏi **Save this draft?** → bấm **Lưu vào bản nháp** (Save to Drafts).
2. Hoặc vào **Bản nháp** ở sidebar → bấm **Nháp một mục công việc** (nút chỉ hiện khi bạn đã tham gia ít nhất một dự án).

{{screenshot:cong-viec-nhap-va-intake}}

### Xem và quản lý nháp

- Vào **Bản nháp** ở sidebar để xem tất cả công việc nháp của bạn trong workspace.
- Nháp **chỉ hiển thị với người tạo** — không xuất hiện trong dự án hay view công khai.
- Chỉ **Thành viên** và **Quản trị viên** cấp workspace mới tạo được nháp; **Khách** không tạo được.

### Chuyển nháp thành công việc thật

1. Mở công việc nháp → bấm **Di chuyển đến nhóm/dự án** (Move to team/project).
2. Chọn nhóm hoặc dự án đích.
3. Gán trạng thái, người phụ trách nếu chưa có → bấm **Thêm vào nhóm/dự án** (Add to project).
4. Công việc xuất hiện trong dự án như một công việc bình thường.

---

## Intake (Tiếp nhận yêu cầu)

Intake cho phép bất kỳ ai có quyền truy cập dự án (Khách / Thành viên / Quản trị viên) gửi yêu cầu vào dự án. Quản trị viên dự án xem xét từng yêu cầu trước khi đưa vào backlog.

> Intake phải được **bật** trong Cài đặt dự án → Tính năng. Chỉ Admin dự án mới bật/tắt được.

### Gửi yêu cầu qua Intake

1. Vào dự án → tab **Intake**.
2. Bấm **Thêm mục công việc** → điền tiêu đề và mô tả (và thuộc tính nếu cần) → bấm **Tạo mục công việc**.

> Khi gửi yêu cầu, nếu có tiêu đề/mô tả giống công việc đã có, hệ thống cảnh báo "tìm thấy N công việc trùng" để bạn kiểm tra trước.

### Xử lý yêu cầu Intake (dành cho Quản trị viên dự án)

Chỉ **Quản trị viên dự án** mới thực hiện được các hành động xử lý dưới đây (Thành viên thấy nút nhưng sẽ báo từ chối quyền khi bấm). Mỗi yêu cầu có 4 hành động:

| Hành động                          | Kết quả                                                              |
| ---------------------------------- | -------------------------------------------------------------------- |
| **Duyệt (Accept)**                 | Tạo công việc chính thức trong dự án từ yêu cầu này                  |
| **Từ chối (Decline)**              | Đóng yêu cầu (không thể hoàn tác); hệ thống chỉ hỏi xác nhận, không yêu cầu nhập lý do |
| **Trì hoãn / Bỏ trì hoãn (Snooze/Unsnooze)** | Ẩn yêu cầu tới ngày đã đặt; khi đang trì hoãn, mục menu đổi thành **Bỏ trì hoãn** để đưa lại danh sách mở |
| **Đánh dấu trùng (Mark as duplicate)** | Gõ tìm và chọn một công việc đã có để liên kết yêu cầu là bản trùng (đóng yêu cầu) |

> _Duyệt_ và _Từ chối_ là nút nổi trên thanh tiêu đề; _Trì hoãn_ và _Đánh dấu trùng_ nằm trong menu **…**.

> Hành động từ chối được ghi vào nhật ký **Hoạt động** của công việc; nguồn gốc Intake cũng thể hiện qua nhật ký (ví dụ "accepted this work item from intake").

## Mẹo & lưu ý

- Công việc nháp **không bị mất** khi đóng trình duyệt — được lưu server.
- Yêu cầu bị từ chối (cùng yêu cầu đã duyệt) nằm trong tab **Đã đóng** (Closed) để tham chiếu sau. Sidebar Intake chỉ có hai tab: _Đang mở_ và _Đã đóng_.
- Từ chối yêu cầu **không thể hoàn tác** — cân nhắc trước khi xác nhận.
- Nếu dự án không hiển thị tab Intake, hãy yêu cầu Admin bật tính năng trong Cài đặt dự án.

## Liên quan

- [Tạo và quản lý công việc](/help/a/tao-va-quan-ly-cong-viec)
- [Cấu hình dự án](/help/a/cau-hinh-du-an)
- [Quan hệ & công việc con](/help/a/quan-he-va-cong-viec-con)
