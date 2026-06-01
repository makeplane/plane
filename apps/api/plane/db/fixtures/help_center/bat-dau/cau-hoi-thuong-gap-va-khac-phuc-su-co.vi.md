---
category: bat-dau
slug: cau-hoi-thuong-gap-va-khac-phuc-su-co
sort_order: 50000
title: "Câu hỏi thường gặp & khắc phục sự cố"
status: published
---

## Mục đích

Bài viết này gom các tình huống hay gặp khi dùng Shinhan Workspace dưới dạng Hỏi → Đáp ngắn — từ đăng nhập, tìm kiếm, thông báo đến chấm công. Mỗi mục dẫn tới bài chi tiết nếu bạn cần hướng dẫn đầy đủ. Dành cho mọi nhân viên; phần liên quan đến quản trị có ghi rõ yêu cầu vai trò.

## Các bước

### Tôi quên mật khẩu, hoặc bị khóa đăng nhập?

Trên màn hình đăng nhập, nhấn **Forgot password?** dưới ô mật khẩu, xác nhận email và nhấn **Send reset link**, rồi mở email để đặt lại. Nếu **Swing SSO** đang bật, nút này có thể không hiển thị — mật khẩu do hệ thống SSO của ngân hàng quản lý, hãy liên hệ IT. Nếu gửi quá nhiều yêu cầu trong thời gian ngắn, hệ thống tạm từ chối (lỗi **Too many requests**); chờ vài phút rồi thử lại. Chi tiết: [Đăng nhập & khôi phục mật khẩu](/help/a/dang-nhap-va-khoi-phuc-mat-khau).

### Tôi không nhận được email đặt lại mật khẩu / lời mời?

Trước hết kiểm tra thư mục **Spam/Junk**. Nếu vẫn không có, có thể hệ thống chưa cấu hình máy chủ gửi email (SMTP) — lúc này liên kết **Forgot password?** chuyển thành thông báo không gửi được email. Đây là việc của quản trị: Instance Admin bật và điền cấu hình tại **God Mode → Email** (xem [Email, AI & thư viện ảnh](/help/a/email-ai-va-thu-vien-anh)). Bạn hãy liên hệ quản trị viên IT thay vì chờ email.

### Tôi đăng nhập được nhưng chưa thấy dự án nào?

Bạn cần được thêm vào ít nhất một dự án thì dự án mới hiện ở thanh bên. Quyền tạo dự án mới chỉ dành cho **Quản trị viên** hoặc **Thành viên** ở cấp workspace; nếu tài khoản bạn là **Khách** hoặc chưa được gán dự án, hãy nhờ quản trị viên thêm bạn vào dự án phù hợp. Khi chưa thuộc dự án nào, Trang chủ hiển thị khối **Hướng dẫn nhanh** (Quickstart Guide). Xem thêm: [Gia nhập workspace & onboarding](/help/a/gia-nhap-workspace-va-onboarding).

### Tôi tìm sơ đồ tổ chức (Org Chart) ở đâu?

Giao diện sơ đồ tổ chức dành cho nhân viên **đang được triển khai** — hiện chưa có mục này trên thanh bên. Nếu cần tra cứu cơ cấu phòng ban, liên hệ quản trị viên hệ thống. Việc quản lý cây phòng ban thực hiện trong **God Mode → Departments** và yêu cầu quyền Instance Admin. Chi tiết: [Phòng ban & sơ đồ tổ chức](/help/a/phong-ban-va-so-do-to-chuc).

### Trợ lý viết AI (Pi) đâu rồi?

Trợ lý viết AI **Pi** trong trình soạn thảo trang hiện **đang tắt** trên Shinhan Workspace, nên trình soạn thảo không hiển thị nút AI nào (trong menu lệnh `/`, trên thanh công cụ nổi hay ở lề khối nội dung). Khi tính năng được mở lại, hướng dẫn sẽ được cập nhật. Xem: [Cộng tác & AI trên trang](/help/a/cong-tac-va-ai-tren-trang).

### Tôi gõ tìm kiếm mà không ra kết quả?

Với **tìm kiếm trợ giúp** (Help Center), bạn có thể gõ **không dấu** vẫn ra (ví dụ `tai chinh` khớp "Tài chính") vì hệ thống bỏ dấu trước khi so khớp. Với **tìm kiếm toàn cục** (Cmd/Ctrl + K) trong sản phẩm, từ khóa không phân biệt hoa/thường nhưng có phân biệt dấu, nên hãy gõ đúng dấu tiếng Việt. Lưu ý tìm kiếm toàn cục chỉ khớp **tiêu đề** (không tìm nội dung bên trong trang), bỏ qua mục đã lưu trữ, và giới hạn 100 công việc — gõ từ khóa cụ thể hơn nếu thiếu kết quả. Chi tiết: [Tìm kiếm toàn cục](/help/a/tim-kiem-toan-cuc).

### Biểu tượng Inbox có chấm đỏ nghĩa là gì?

Biểu tượng **Hộp thư đến** trên thanh điều hướng trên cùng hiện một **chấm tròn đỏ** nhỏ khi có thông báo **chưa đọc** (không phải con số). Chấm này biến mất khi bạn đã đọc hết. Mở Inbox để xem các việc được gán, bình luận hay `@mention` liên quan đến bạn. Chi tiết: [Inbox & thông báo](/help/a/inbox-va-thong-bao).

### Tôi không nhập được giờ trực tiếp vào bảng Timesheet?

Bảng Timesheet là **chỉ đọc** — không nhấp ô để nhập giờ được. Để ghi nhận giờ, mở chi tiết một công việc bạn được giao và nhấn nút **Log Time** (đồng hồ) trên thanh hành động. Nếu không thấy nút này: công việc đã hoàn thành/hủy, có công việc con, bạn không được giao, hoặc dự án tắt Time Tracking. Chi tiết: [Chấm công & timesheet](/help/a/cham-cong-va-timesheet).

### Tôi tải ảnh / tệp đính kèm lên bị lỗi?

Mỗi tệp tải lên có **giới hạn dung lượng 5 MB**; tệp vượt mức sẽ bị từ chối — hãy nén hoặc thu nhỏ ảnh trước khi tải. Nếu tải vẫn lỗi, thử lại sau giây lát hoặc kiểm tra kết nối mạng. Cách đính kèm tệp và ảnh vào công việc: [Bình luận, tệp & liên kết](/help/a/binh-luan-tep-va-lien-ket).

## Mẹo & lưu ý

- Shinhan Workspace **không dùng thanh icon dọc (App Rail)** — điều hướng qua **thanh điều hướng trên cùng** (menu Workspace, ô tìm kiếm Cmd/Ctrl + K, biểu tượng Inbox, Trợ giúp, ảnh đại diện) và **thanh bên trái** (danh sách Dự án, Trang chủ, Công việc của bạn).
- Vai trò trong workspace chỉ có ba mức: **Khách** (Guest), **Thành viên** (Member), **Quản trị viên** (Admin). Nhiều thao tác bị giới hạn theo vai trò — nếu một nút bị mờ, có thể bạn chưa đủ quyền.
- Inbox chỉ hiển thị thông báo của **workspace hiện tại**; chuyển workspace để xem Inbox nơi khác.
- Luôn **đăng xuất** khi dùng máy tính chung: nhấn ảnh đại diện ở góc trên bên phải → **Sign out**.
- Nếu một tính năng được ghi là "đang triển khai" hoặc "đang tắt", đó là trạng thái thực tế của bản này — vui lòng không chờ tính năng đó cho đến khi có thông báo cập nhật.

## Liên quan

- [Đăng nhập & khôi phục mật khẩu](/help/a/dang-nhap-va-khoi-phuc-mat-khau)
- [Gia nhập workspace & onboarding](/help/a/gia-nhap-workspace-va-onboarding)
- [Tìm kiếm toàn cục](/help/a/tim-kiem-toan-cuc)
- [Inbox & thông báo](/help/a/inbox-va-thong-bao)
- [Chấm công & timesheet](/help/a/cham-cong-va-timesheet)
