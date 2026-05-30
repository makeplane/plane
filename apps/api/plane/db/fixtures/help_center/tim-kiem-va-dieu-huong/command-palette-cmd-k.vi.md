---
category: tim-kiem-va-dieu-huong
slug: command-palette-cmd-k
sort_order: 20000
title: "Command Palette (Cmd+K)"
status: published
---

## Mục đích

Command Palette cho phép bạn điều hướng đến bất kỳ trang nào, tạo nhanh công việc hoặc thực hiện các thao tác thường dùng mà **không cần rời tay khỏi bàn phím**. Đây là công cụ dành cho người dùng muốn làm việc nhanh hơn bằng phím tắt.

{{screenshot:command-palette-cmd-k}}

---

## Mở Command Palette

| Hệ điều hành    | Phím tắt   |
| --------------- | ---------- |
| macOS           | `Cmd + K`  |
| Windows / Linux | `Ctrl + K` |

Bạn cũng có thể gõ trực tiếp vào **thanh tìm kiếm trên thanh điều hướng ngang** (top navigation) — khi click hoặc bắt đầu gõ, bảng lệnh sẽ mở ra tại chỗ.

---

## Các bước sử dụng

### 1. Điều hướng nhanh

1. Nhấn `Cmd/Ctrl + K` để mở bảng lệnh.
2. Gõ tên trang cần đến (ví dụ: "Inbox", "Analytics", "Settings") hoặc dùng phím tắt chuỗi bên dưới.
3. Nhấn `Enter` hoặc click để điều hướng — bảng lệnh tự đóng.

**Phím tắt chuỗi** (gõ liên tiếp trong bảng lệnh):

| Chuỗi phím | Đích đến                             |
| ---------- | ------------------------------------ |
| `g` `h`    | Trang chủ                            |
| `g` `x`    | Inbox / Thông báo                    |
| `g` `y`    | Công việc của bạn                    |
| `g` `p`    | Danh sách dự án                      |
| `g` `s`    | Cài đặt workspace                    |
| `g` `a`    | Analytics                            |
| `g` `j`    | Nháp                                 |
| `g` `r`    | Lưu trữ                              |
| `o` `w`    | Chuyển workspace (chọn từ danh sách) |
| `o` `p`    | Mở dự án (chọn từ danh sách)         |

_Khi đang ở trong một dự án, thêm các phím tắt:_

| Chuỗi phím | Đích đến            |
| ---------- | ------------------- |
| `g` `i`    | Công việc của dự án |
| `g` `c`    | Cycles của dự án    |
| `g` `m`    | Modules của dự án   |
| `g` `d`    | Trang tài liệu      |
| `g` `v`    | Views của dự án     |
| `g` `k`    | Intake của dự án    |

### 2. Tạo công việc / trang nhanh

1. Mở bảng lệnh.
2. Gõ "Create" hoặc cuộn đến nhóm **Create**.
3. Chọn loại (công việc, trang, cycle, module, v.v.).
4. Điền thông tin trong form tạo nhanh, nhấn **Lưu**.

{{screenshot:command-palette-create-commands}}

### 3. Lệnh theo ngữ cảnh

Khi đang ở trong một dự án hoặc trang cụ thể, bảng lệnh hiển thị thêm các thao tác liên quan đến nội dung hiện tại — ví dụ: chỉnh sửa trạng thái cycle đang mở, thêm công việc vào module. Nhấn `Backspace` khi ô tìm kiếm trống để ẩn các lệnh ngữ cảnh và chỉ giữ lệnh toàn cục.

### 4. Điều hướng bằng bàn phím trong bảng lệnh

| Phím                      | Hành động                                        |
| ------------------------- | ------------------------------------------------ |
| `↑` / `↓`                 | Di chuyển qua các lệnh                           |
| `Enter`                   | Thực hiện lệnh đang chọn                         |
| `Escape`                  | Xóa từ khóa tìm kiếm (lần 1) / Đóng bảng (lần 2) |
| `Backspace` (khi ô trống) | Ẩn lệnh ngữ cảnh hoặc quay về trang trước        |
| `Cmd/Ctrl + K`            | Đóng bảng lệnh                                   |

---

## Mẹo & lưu ý

- **Tìm kiếm mờ**: bảng lệnh lọc theo từ khóa tiếng Anh (tên lệnh). Ví dụ: gõ "inbox" hoặc "notif" để tìm lệnh chuyển đến Inbox.
- **Phạm vi tìm kiếm**: khi bảng lệnh mở ở cấp workspace (không trong dự án), chỉ thấy lệnh workspace. Khi đang ở trong dự án, thêm lệnh cấp dự án.
- Chuyển đổi **Workspace / Project scope** bằng toggle ở chân bảng lệnh — giúp tìm kiếm nội dung đúng phạm vi.
- Bảng lệnh **không** lưu lịch sử tìm kiếm — mỗi lần mở bắt đầu mới.
- Trên thanh top navigation, thanh tìm kiếm **mở rộng** từ 364px sang 554px khi được focus — đây là thiết kế của bản fork.

---

## Liên quan

- [Tìm kiếm toàn cục](/help/a/tim-kiem-toan-cuc)
- [Điều hướng thanh bên & App Rail](/help/a/dieu-huong-thanh-ben-va-app-rail)
- [Tùy chỉnh điều hướng](/help/a/tuy-chinh-dieu-huong)
