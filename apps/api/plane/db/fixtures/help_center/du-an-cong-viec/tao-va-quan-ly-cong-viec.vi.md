---
category: du-an-cong-viec
slug: tao-va-quan-ly-cong-viec
sort_order: 10000
title: "Tạo và quản lý công việc"
status: published
---

## Mục đích

Tạo, gán và quản lý công việc (work item) trong Shinhan Workspace. Mỗi công việc thuộc một dự án, mang trạng thái, người phụ trách và ngày hạn — giúp cả nhóm theo dõi tiến độ rõ ràng.

## Khi nào dùng / Yêu cầu

- Tất cả thành viên có vai trò **Member** trở lên đều tạo được công việc trong dự án mình tham gia.
- Để tạo công việc _nháp_ (chưa gán vào dự án), xem bài [Công việc nháp & Intake](/help/a/cong-viec-nhap-va-intake).

## Các bước

### Tạo công việc mới

1. Mở dự án từ thanh bên trái.
2. Trong bất kỳ chế độ xem nào (List, Kanban, v.v.), bấm **+ Tạo công việc** ở cuối danh sách hoặc nhấn `C` để mở hộp thoại nhanh.

{{screenshot:tao-cong-viec-modal}}

3. Nhập **Tiêu đề** (bắt buộc).
4. (Tuỳ chọn) Điền thêm:
   - **Mô tả** — rich-text, hỗ trợ danh sách, bảng, ảnh, đoạn code.
   - **Trạng thái** — mặc định là trạng thái đầu tiên của dự án.
   - **Người phụ trách** — có thể chọn nhiều người.
   - **Ưu tiên** — Khẩn cấp / Cao / Trung bình / Thấp / Không có.
   - **Ngày bắt đầu** và **Ngày đến hạn**.
   - **Nhãn**, **Module**, **Cycle** (nếu dự án đã cấu hình).
5. Bấm **Tạo công việc** để lưu; hoặc bấm **Lưu nháp** để lưu vào mục Công việc nháp mà không xuất hiện trong dự án.

> **Tạo thêm liên tiếp:** Bật toggle **Tạo thêm** ngay trước nút Tạo — sau khi lưu, hộp thoại mở lại sẵn sàng để nhập công việc tiếp theo.

### Thêm nhanh từ dòng trống (inline)

Trong chế độ **List**, bấm dấu `+` ở cuối nhóm trạng thái → gõ tiêu đề → `Enter`. Công việc được tạo ngay với trạng thái của nhóm đó.

{{screenshot:them-nhanh-inline}}

### Sử dụng mẫu (template)

1. Trong hộp thoại tạo công việc, bấm biểu tượng **Mẫu** (template) ở góc trên bên phải.
2. Chọn mẫu — tiêu đề, mô tả và thuộc tính sẽ được điền sẵn.
3. Chỉnh sửa thêm nếu cần, rồi bấm **Tạo công việc**.

### Chỉnh sửa công việc hiện có

1. Bấm vào tiêu đề công việc để mở trang Chi tiết.
2. Sửa trực tiếp tiêu đề, mô tả hoặc bất kỳ thuộc tính nào ở cột bên phải.
3. Thay đổi được lưu tự động — không cần bấm nút lưu.

### Xóa công việc

1. Mở công việc hoặc bấm chuột phải lên dòng công việc trong danh sách.
2. Chọn **Xóa** → xác nhận.

> Lưu ý: Xóa là hành động vĩnh viễn. Nếu muốn ẩn mà vẫn giữ lại, hãy **Lưu trữ** thay vì xóa (xem [Lưu trữ công việc](/help/a/luu-tru-cong-viec)).

## Mẹo & lưu ý

- **Mã định danh** (ví dụ `SHB-42`) được tạo tự động và không thể thay đổi — dùng để tìm kiếm nhanh hoặc tham chiếu trong bình luận.
- Khi bật **Phát hiện trùng lặp**, hệ thống sẽ gợi ý các công việc có tiêu đề tương tự ngay khi bạn gõ — giúp tránh tạo trùng.
- Công việc tạo từ **Intake** (yêu cầu bên ngoài) có thể nhập vào dự án sau khi được duyệt — xem [Công việc nháp & Intake](/help/a/cong-viec-nhap-va-intake).
- Một công việc chỉ thuộc **một dự án** tại một thời điểm.

## Liên quan

- [Chi tiết công việc](/help/a/chi-tiet-cong-viec)
- [Thuộc tính công việc](/help/a/thuoc-tinh-cong-viec)
- [Công việc nháp & Intake](/help/a/cong-viec-nhap-va-intake)
