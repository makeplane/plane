---
category: tim-kiem-va-dieu-huong
slug: tim-kiem-toan-cuc
sort_order: 30000
title: "Tìm kiếm toàn cục"
status: published
---

## Mục đích

Tìm kiếm toàn cục cho phép bạn tra cứu nhanh **công việc, dự án, trang tài liệu, cycle, module và view** trong toàn bộ workspace — chỉ bằng vài từ khóa, không cần nhớ tên đầy đủ hay biết công việc thuộc dự án nào.

{{screenshot:tim-kiem-toan-cuc}}

---

## Các bước sử dụng

### 1. Mở tìm kiếm

Có hai cách:

- **Nhấn `Cmd/Ctrl + K`** rồi gõ từ khóa vào ô tìm kiếm — kết quả hiện ngay bên dưới trong bảng lệnh.
- **Click vào thanh tìm kiếm** trên thanh điều hướng ngang (top navigation) và bắt đầu gõ.

Kết quả được lọc theo thời gian thực với độ trễ khoảng 500ms sau khi bạn ngừng gõ.

{{screenshot:tim-kiem-toan-cuc-results}}

### 2. Đọc kết quả

Kết quả được **nhóm theo loại**:

| Nhóm                   | Nội dung                                |
| ---------------------- | --------------------------------------- |
| **Công việc (Issues)** | Tiêu đề + mã định danh (ví dụ: SHB-123) |
| **Dự án**              | Tên dự án trong workspace               |
| **Trang**              | Tiêu đề trang tài liệu                  |
| **Cycles**             | Tên cycle                               |
| **Modules**            | Tên module                              |
| **Views**              | Tên view đã lưu                         |
| **Workspaces**         | Tên workspace khớp từ khóa              |

Mỗi kết quả hiển thị tên và thuộc dự án/nhóm nào. Click vào để điều hướng trực tiếp.

### 3. Tìm theo mã định danh

Nếu bạn biết mã công việc (ví dụ: `SHB-456`), gõ trực tiếp mã đó — hoặc chỉ gõ phần số `456` — vào ô tìm kiếm. Hệ thống khớp theo số thứ tự của công việc và trả về đúng công việc đó trong kết quả.

### 4. Chuyển phạm vi tìm kiếm

Khi **không** ở trong dự án nào, tìm kiếm luôn quét toàn bộ workspace (mọi dự án bạn tham gia). Khi đang ở trong một dự án cụ thể, mặc định tìm kiếm **chỉ trong dự án đó**; bật công tắc **Cấp không gian làm việc** (Workspace level) ở chân bảng lệnh để mở rộng tìm kiếm ra toàn workspace. Công tắc chỉ khả dụng khi bạn đang ở trong một dự án.

### 5. Điều hướng kết quả bằng phím

| Phím      | Hành động                 |
| --------- | ------------------------- |
| `↑` / `↓` | Di chuyển qua các kết quả |
| `Enter`   | Mở kết quả đang chọn      |
| `Escape`  | Xóa từ khóa / đóng bảng   |

---

## Mẹo & lưu ý

- **Tìm kiếm không phân biệt hoa/thường**: gõ "shinhan" hay "Shinhan" đều cho kết quả như nhau.
- **Độ trễ debounce 500ms**: hệ thống chờ bạn ngừng gõ trước khi gửi yêu cầu tìm kiếm — tránh tải quá nhiều lần.
- **Không tìm nội dung bên trong trang tài liệu**: chỉ tìm theo _tiêu đề_. Để tìm nội dung bên trong trang, mở trang và dùng `Ctrl/Cmd + F` của trình duyệt.
- **Phạm vi giới hạn bởi quyền**: bạn chỉ thấy kết quả từ các dự án và workspace mà bạn được phép truy cập.
- **Không bao gồm mục đã lưu trữ**: dự án, công việc, cycle, module, view hay trang đã được lưu trữ (archived) sẽ không xuất hiện trong kết quả.
- **Giới hạn 100 công việc**: danh sách công việc trả về tối đa 100 kết quả. Nếu không thấy công việc cần tìm, hãy gõ từ khóa cụ thể hơn để thu hẹp.
- Nếu từ khóa để trống, bảng kết quả không hiện gì — cần gõ ít nhất 1 ký tự.
- Kết quả không được lưu — mỗi lần mở bảng lệnh mới là tìm kiếm mới.

---

## Liên quan

- [Command Palette (Cmd+K)](/help/a/command-palette-cmd-k)
- [Thanh bên & Thanh điều hướng trên cùng](/help/a/dieu-huong-thanh-ben-va-app-rail)
- [Lưu & chia sẻ Views](/help/a/luu-va-chia-se-views)
