---
category: cai-dat
slug: webhooks-export-tich-hop
sort_order: 30000
title: "Webhooks, export & tích hợp"
status: published
---

## Mục đích

Admin workspace có thể tạo webhook để tự động thông báo cho hệ thống bên ngoài khi có sự kiện xảy ra trong Shinhan Workspace, đồng thời xuất toàn bộ dữ liệu công việc ra file CSV, Excel hoặc JSON để lưu trữ hoặc phân tích.

## Khi nào dùng / Yêu cầu

- **Webhooks và Export:** chỉ **Admin workspace** mới truy cập và thao tác được.
- **Phù hợp khi:** kết nối với hệ thống nội bộ ngân hàng (CI/CD, audit log, BI tool) hoặc cần sao lưu dữ liệu dự án định kỳ.

---

## Webhooks

### Mở trang Webhooks

1. Từ thanh bên trái, nhấn tên workspace → **Cài đặt** → **Webhooks**.

{{screenshot:workspace-webhooks-settings-page}}

### Tạo webhook mới

2. Nhấn nút **Thêm webhook** (Add Webhook) ở góc phải.
3. Trong cửa sổ tạo mới, nhập **URL endpoint** — địa chỉ nhận sự kiện từ Shinhan Workspace.
4. Chọn loại sự kiện cần theo dõi:
   - **Tất cả sự kiện** — tự động nhận mọi loại.
   - **Từng sự kiện riêng** — tick chọn trong số: Dự án, Cycle, Module, Công việc, Bình luận công việc.
5. Nhấn **Tạo webhook**.

{{screenshot:workspace-create-webhook-modal}}

6. Sau khi tạo, hệ thống hiển thị **Secret Key** một lần duy nhất — sao chép và lưu lại ngay. Secret Key dùng để xác minh chữ ký (HMAC) của từng request gửi đến endpoint.

{{screenshot:workspace-webhook-secret-key}}

### Bật / tắt webhook

7. Trong danh sách webhook, dùng **công tắc toggle** bên phải URL để bật hoặc tắt tức thì mà không cần xóa.

### Chỉnh sửa hoặc xóa webhook

8. Nhấn vào URL webhook để vào trang chi tiết.
9. Tại đây có thể sửa URL, thay đổi sự kiện, xem lại Secret Key (không hiển thị lại giá trị gốc), hoặc nhấn **Xóa webhook**.

{{screenshot:workspace-webhook-detail-page}}

---

## Export dữ liệu workspace

### Mở trang Export

10. Từ Cài đặt, chọn **Export** trong menu bên trái.

{{screenshot:workspace-exports-settings-page}}

### Tạo yêu cầu export

11. Chọn **định dạng** xuất: **CSV**, **Excel (.xlsx)** hoặc **JSON**.
12. Chọn một hoặc nhiều **dự án** cần xuất từ danh sách (có ô tìm kiếm).
13. Nhấn **Export** để gửi yêu cầu.

{{screenshot:workspace-export-form}}

> Hệ thống xử lý export ở nền (background). File sẽ sẵn sàng tải về sau vài giây đến vài phút tùy số lượng công việc.

### Xem lịch sử và tải file

14. Bảng **Lịch sử export** bên dưới form liệt kê tất cả yêu cầu đã tạo với trạng thái: _Đang xử lý_, _Hoàn thành_, _Thất bại_.
15. Khi trạng thái chuyển sang **Hoàn thành**, nhấn liên kết tải về ở cột tương ứng để tải file về máy.
16. Dùng nút **Làm mới** (refresh icon) để cập nhật trạng thái thủ công nếu đang chờ file lớn.

{{screenshot:workspace-export-history-table}}

> Danh sách hỗ trợ phân trang (10 bản ghi mỗi trang); dùng nút **Trước** / **Tiếp theo** để điều hướng.

---

## Mẹo & lưu ý

- **Secret Key chỉ hiển thị một lần** khi tạo webhook. Nếu mất, phải xóa và tạo lại webhook — không có tính năng hiển thị lại.
- **Cấu trúc payload webhook** tuân theo schema sự kiện của Shinhan Workspace; liên hệ nhóm kỹ thuật để xem tài liệu schema chi tiết.
- **Export chứa tất cả trường công việc** (tiêu đề, mô tả, trạng thái, người giao, ngày, nhãn, v.v.) của các dự án đã chọn.
- **Giới hạn:** file export lớn (>10.000 công việc) có thể mất vài phút; không đóng tab trong khi chờ, hoặc quay lại sau và tải từ bảng lịch sử.
- Tính năng **tích hợp bên thứ ba** (Import từ Jira/GitHub/...) không được kích hoạt trong bản SHBVN — liên hệ Instance Admin nếu có nhu cầu.

## Liên quan

- [Quản lý cài đặt workspace](/help/a/quan-ly-cai-dat-workspace)
- [Quản lý thành viên](/help/a/quan-ly-thanh-vien)
- [Capacity & báo cáo](/help/a/capacity-va-bao-cao)
