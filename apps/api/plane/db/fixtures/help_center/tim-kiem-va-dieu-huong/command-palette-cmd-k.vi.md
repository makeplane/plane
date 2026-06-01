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
2. Gõ tên trang cần đến (ví dụ: "Inbox", "Analytics", "Settings") rồi nhấn `Enter`, hoặc dùng phím tắt điều hướng nhanh bên dưới.
3. Nhấn `Enter` hoặc click để điều hướng — bảng lệnh tự đóng.

**Phím tắt điều hướng nhanh** — gõ trực tiếp trên trang khi con trỏ **không** nằm trong ô nhập liệu (không cần mở bảng lệnh trước). Ví dụ gõ `g` rồi `h` để về Trang chủ:

| Chuỗi phím | Đích đến                                            |
| ---------- | --------------------------------------------------- |
| `g` `h`    | Trang chủ                                           |
| `g` `x`    | Inbox / Thông báo                                   |
| `g` `y`    | Công việc của tôi                                   |
| `g` `p`    | Danh sách dự án                                     |
| `g` `s`    | Cài đặt workspace                                   |
| `g` `a`    | Analytics                                           |
| `g` `j`    | Bản nháp                                            |
| `g` `r`    | Lưu trữ                                             |
| `o` `w`    | Mở bảng lệnh để chọn workspace từ danh sách         |
| `o` `p`    | Mở bảng lệnh để chọn dự án từ danh sách             |

> Lưu ý: các phím `g…` điều hướng thẳng từ trang hiện tại; còn `o w` / `o p` sẽ mở bảng lệnh tới danh sách để bạn chọn. Khi đang gõ trong ô tìm kiếm của bảng lệnh hoặc bất kỳ ô nhập liệu nào, các phím tắt này tạm ngừng (ký tự được nhập vào ô thay vì điều hướng).

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

**Phím tắt tạo nhanh** — gõ trực tiếp trên trang (ngoài ô nhập liệu) để mở thẳng form tạo:

| Chuỗi phím | Tạo nhanh   |
| ---------- | ----------- |
| `n` `i`    | Công việc   |
| `n` `d`    | Trang       |
| `n` `v`    | View        |
| `n` `c`    | Cycle       |
| `n` `m`    | Module      |
| `n` `p`    | Dự án       |

> Các phím tạo View / Cycle / Module / Trang chỉ hoạt động khi bạn đang ở trong một dự án có bật tính năng tương ứng và có quyền Thành viên trở lên.

{{screenshot:command-palette-create-commands}}

### 3. Lệnh theo ngữ cảnh

Khi đang ở trong một dự án hoặc trang cụ thể, bảng lệnh hiển thị thêm các thao tác liên quan đến nội dung hiện tại — ví dụ: chỉnh sửa trạng thái cycle đang mở, thêm công việc vào module. Nhấn `Backspace` khi ô tìm kiếm trống để ẩn các lệnh ngữ cảnh và chỉ giữ lệnh toàn cục.

### 4. Điều hướng bằng bàn phím trong bảng lệnh

| Phím                      | Hành động                                                            |
| ------------------------- | ------------------------------------------------------------------- |
| `↑` / `↓`                 | Di chuyển qua các lệnh                                              |
| `Enter`                   | Thực hiện lệnh đang chọn                                            |
| `Escape`                  | Xóa từ khóa tìm kiếm (lần 1) / Đóng bảng (lần 2)                    |
| `Backspace` (khi ô trống) | Quay lại từ trang chọn trong bảng lệnh; nếu đang ở trang chính thì ẩn các lệnh theo ngữ cảnh |
| `Cmd/Ctrl + K`            | Đóng bảng lệnh                                                      |

**Phím tắt toàn cục** (hoạt động cả khi không mở bảng lệnh):

| Phím             | Hành động                                  |
| ---------------- | ------------------------------------------ |
| `Cmd/Ctrl + B`   | Ẩn/hiện thanh bên (sidebar)                |
| `Cmd/Ctrl + Shift + C` | Sao chép đường dẫn (URL) trang hiện tại |
| `Cmd/Ctrl + F`   | Đưa con trỏ vào ô tìm kiếm trên thanh trên cùng |

---

## Mẹo & lưu ý

- **Tìm kiếm mờ**: bảng lệnh lọc theo từ khóa tiếng Anh (tên lệnh). Ví dụ: gõ "inbox" hoặc "notif" để tìm lệnh chuyển đến Inbox.
- **Phạm vi tìm kiếm**: khi bảng lệnh mở ở cấp workspace (không trong dự án), chỉ thấy lệnh workspace. Khi đang ở trong dự án, thêm lệnh cấp dự án.
- Bật công tắc **Cấp không gian làm việc** (Workspace level) ở chân bảng lệnh để mở rộng tìm kiếm ra toàn workspace; công tắc chỉ khả dụng khi bạn đang ở trong một dự án.
- **Lệnh hiển thị theo quyền và tính năng**: một số lệnh điều hướng chỉ hiện khi bạn đủ quyền hoặc khi dự án bật tính năng tương ứng — ví dụ Analytics, Bản nháp, Lưu trữ cần quyền Thành viên trở lên; Cycles/Modules/Trang/Views/Intake chỉ hiện khi dự án bật tính năng đó. Nhân viên là **Khách** hoặc dự án tắt tính năng sẽ không thấy phím tắt tương ứng.
- Bảng lệnh **không** lưu lịch sử tìm kiếm — mỗi lần mở bắt đầu mới.
- Trên thanh điều hướng trên cùng, ô tìm kiếm tự **mở rộng** khi bạn bấm vào, tạo thêm không gian gõ từ khóa.

---

## Liên quan

- [Tìm kiếm toàn cục](/help/a/tim-kiem-toan-cuc)
- [Thanh bên & Thanh điều hướng trên cùng](/help/a/dieu-huong-thanh-ben-va-app-rail)
- [Tùy chỉnh điều hướng](/help/a/tuy-chinh-dieu-huong)
