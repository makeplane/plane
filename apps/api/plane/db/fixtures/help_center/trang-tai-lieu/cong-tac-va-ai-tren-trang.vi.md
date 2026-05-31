---
category: trang-tai-lieu
slug: cong-tac-va-ai-tren-trang
sort_order: 40000
title: "Cộng tác & AI trên trang"
status: published
---

## Mục đích

Shinhan Workspace cho phép nhiều thành viên cùng chỉnh sửa một trang đồng thời theo thời gian thực. Bài viết này mô tả cách cộng tác hoạt động và ý nghĩa của các badge trạng thái đồng bộ.

---

## Khi nào dùng / Yêu cầu

- **Thành viên** trở lên: soạn thảo đồng thời trên cùng một trang.
- Tính năng cộng tác thời gian thực hoạt động khi có kết nối internet ổn định.

---

## Các bước

### Cộng tác thời gian thực

Khi mở một trang, Shinhan Workspace tự động kết nối phiên làm việc của bạn với các thành viên khác đang mở cùng trang đó.

- **Thay đổi hiện ngay:** Nội dung đồng nghiệp gõ xuất hiện trên màn hình bạn mà không cần tải lại trang — toàn bộ thay đổi được đồng bộ tự động theo thời gian thực.
- **Tự gộp thay đổi:** Hai người sửa cùng lúc ở các vị trí khác nhau đều được giữ lại; hệ thống tự gộp mà không ghi đè lên nhau.

### Hiểu badge trạng thái đồng bộ

| Badge                   | Ý nghĩa                                    | Việc cần làm                                          |
| ----------------------- | ------------------------------------------ | ----------------------------------------------------- |
| _(không có badge)_      | Đang đồng bộ bình thường                   | Không cần làm gì                                      |
| **Syncing...**          | Đang gửi thay đổi lên server               | Chờ một vài giây                                      |
| **Connection lost**     | Mất kết nối tới máy chủ realtime           | Thay đổi vẫn được lưu mỗi 10 giây; chờ kết nối lại    |
| **Offline**             | Mất kết nối internet                       | Tiếp tục gõ — thay đổi sẽ đồng bộ khi có mạng trở lại |
| Banner vàng ở đầu trang | Trang đạt giới hạn dung lượng, đồng bộ tắt | Tạo trang mới hoặc chia nội dung sang trang con       |

{{screenshot:page-sync-offline-badge}}

**Chế độ Offline:** Khi mất mạng, badge **Offline** xuất hiện ở góc trên bên phải. Bạn vẫn gõ bình thường — nội dung được lưu cục bộ và đồng bộ ngay khi kết nối phục hồi. Không cần làm gì thêm.

### Trợ lý Pi trên trang

> **Hiện chưa khả dụng:** Trợ lý viết AI **Pi** trong trình soạn thảo trang đang được **tắt** trên Shinhan Workspace. Trình soạn thảo không hiển thị nút AI nào (trong menu lệnh `/`, trên thanh công cụ nổi, hay ở lề trái khối nội dung). Khi tính năng được mở lại, hướng dẫn sử dụng sẽ được cập nhật tại đây và thông báo tới người dùng.

---

## Mẹo & lưu ý

- **Xung đột chỉnh sửa:** Shinhan Workspace dùng cơ chế đồng bộ tự gộp thay đổi (công nghệ CRDT của Yjs) — thay đổi của hai người không ghi đè lên nhau mà được gộp thông minh.
- **Giới hạn dung lượng trang:** Khi trang quá lớn, đồng bộ thời gian thực tắt và banner cảnh báo xuất hiện. Tạo trang con (chia nhỏ nội dung) là cách khắc phục được khuyến nghị.
- **Mất kết nối máy chủ realtime:** Khi badge **Connection lost** xuất hiện, thay đổi vẫn được lưu mỗi 10 giây và sẽ đồng bộ lại khi kết nối phục hồi — không cần lo mất dữ liệu.
- **Thay đổi offline được bảo toàn:** Nếu trình duyệt đóng đột ngột khi offline, nội dung chưa đồng bộ được phục hồi lần mở tiếp theo nhờ cơ chế lưu cục bộ.

---

## Liên quan

- [Viết tài liệu trên Trang](/help/a/viet-tai-lieu-tren-trang)
- [Quản lý & chia sẻ trang](/help/a/quan-ly-va-chia-se-trang)
- [Lịch sử phiên bản & xuất trang](/help/a/lich-su-phien-ban-va-xuat-trang)
