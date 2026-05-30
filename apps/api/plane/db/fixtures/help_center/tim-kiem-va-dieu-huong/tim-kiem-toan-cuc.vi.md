---
category: tim-kiem-va-dieu-huong
slug: tim-kiem-toan-cuc
sort_order: 30000
title: "Tìm kiếm toàn cục"
status: published
---

## Mục đích

Tìm kiếm toàn cục cho phép bạn tra cứu nhanh **công việc, dự án, trang tài liệu, cycle, module, view và nhãn** trong toàn bộ workspace — chỉ bằng vài từ khóa, không cần nhớ tên đầy đủ hay biết công việc thuộc dự án nào.

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
| **Workspace**          | Thông tin cấp workspace                 |

Mỗi kết quả hiển thị tên và thuộc dự án/nhóm nào. Click vào để điều hướng trực tiếp.

### 3. Tìm theo mã định danh

Nếu bạn biết mã công việc (ví dụ: `SHB-456`), gõ trực tiếp mã đó vào ô tìm kiếm — hệ thống sẽ trả về đúng công việc đó ở đầu kết quả.

### 4. Chuyển phạm vi tìm kiếm

Mặc định, tìm kiếm chạy ở cấp **workspace** (toàn bộ dự án bạn tham gia). Khi đang ở trong một dự án cụ thể, bạn có thể thu hẹp phạm vi chỉ trong dự án đó bằng toggle **Workspace / Project** ở chân bảng lệnh.

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
- Nếu từ khóa để trống, bảng kết quả không hiện gì — cần gõ ít nhất 1 ký tự.
- Kết quả không được lưu — mỗi lần mở bảng lệnh mới là tìm kiếm mới.

---

## Liên quan

- [Command Palette (Cmd+K)](/help/a/command-palette-cmd-k)
- [Điều hướng thanh bên & App Rail](/help/a/dieu-huong-thanh-ben-va-app-rail)
- [Lưu & chia sẻ Views](/help/a/luu-va-chia-se-views)
