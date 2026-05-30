# Help Content Taxonomy — Shinhan Workspace (grounding report)

> Source: 12-agent inventory workflow (10 domain sweeps + completeness critic + synthesis), run 2026-05-30 against the actual codebase. **203 user-facing features** inventoried, **31 gaps** recovered by the critic, synthesized into **54 articles / 11 categories**. This is the authoritative feature→content map that grounds the help-content plan. Reader = instance-global `/help`; authoring = God Mode; per-article VI/EN/KO.

This taxonomy covers the entire staff-facing surface of **Shinhan Workspace**. It **extends** the 5 seeded categories (`bat-dau`, `du-an-cong-viec`, `cycles-modules`, `trang-tai-lieu`, `cai-dat`) — reusing their exact slugs — and adds 6 new categories. Conventions follow the seed: Lucide icon names, brand color `#174EFD`, per-locale VI/EN/KO. `[CUSTOM]` marks articles documenting SHBVN-specific features. DRY applied: tightly related sub-features merge into one article.

---

## 1. `bat-dau` — Getting Started _(extends seed)_

- **names:** VI `Bắt đầu` / EN `Getting Started` / KO `시작하기` · **icon:** `rocket`
- **VI desc:** Những bước đầu tiên để đăng nhập, làm quen giao diện và tạo công việc đầu tiên.

| slug                                    | Titles (VI / EN / KO)                                                | key points                                                                                                     | screenshots                             | prio |
| --------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---- |
| `lam-quen-shinhan-workspace` _(seeded)_ | Làm quen với Shinhan Workspace / Get to know / 알아보기              | Shinhan Workspace là gì; tổng quan màn hình; Workspace vs Dự án vs Công việc; tạo công việc đầu tiên           | Home dashboard, app rail + sidebar      | P1   |
| `dang-nhap-va-khoi-phuc-mat-khau`       | Đăng nhập & khôi phục mật khẩu / Sign in & recover / 로그인 및 복구  | đăng nhập nội bộ / SSO Swing; quên & đặt lại mật khẩu; đặt mật khẩu lần đầu; đăng xuất                         | Sign-in, forgot-password, set-password  | P1   |
| `gia-nhap-workspace-va-onboarding`      | Gia nhập workspace & onboarding / Join & onboarding / 참여 및 온보딩 | chấp nhận lời mời; onboarding lần đầu; tạo workspace; chuyển workspace                                         | Invitation accept, onboarding, switcher | P1   |
| `tong-quan-trang-chu-workspace`         | Tổng quan Trang chủ / Home overview / 홈 개요                        | lời chào; widgets (Quick Links, Recent Activity, My Stickies, Tutorial); bật/tắt & sắp xếp widget; empty state | Home dashboard, widget settings         | P2   |

## 2. `du-an-cong-viec` — Projects & Work Items _(extends seed)_

- **names:** VI `Dự án & Công việc` / EN `Projects & Work Items` / KO `프로젝트 및 작업` · **icon:** `folder-kanban`

| slug                                  | Titles (VI)               | key points                                                                                                                                     | prio |
| ------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `tao-va-quan-ly-cong-viec` _(seeded)_ | Tạo và quản lý công việc  | modal tạo: tiêu đề/mô tả/dự án; gán người/trạng thái/ưu tiên/ngày; template; tạo trực tiếp hoặc nháp                                           | P1   |
| `lam-viec-voi-du-an`                  | Làm việc với dự án        | duyệt/tìm/lọc; tạo dự án (mã, network, bìa, icon); yêu thích; gia nhập; lưu trữ/khôi phục                                                      | P1   |
| `chi-tiet-cong-viec`                  | Chi tiết công việc        | mở & sửa đầy đủ; mô tả rich-text + version; mã định danh (SHB-123) & copy link; browse by identifier; reactions                                | P1   |
| `thuoc-tinh-cong-viec` [CUSTOM]       | Thuộc tính công việc      | sidebar trạng thái/người/ưu tiên/nhãn; ngày bắt đầu/đến hạn (+lý do thay đổi bắt buộc); phân loại danh mục; tần suất lặp; thời điểm hoàn thành | P1   |
| `binh-luan-tep-va-lien-ket`           | Bình luận, tệp & liên kết | bình luận/trả lời/mention; công khai/riêng tư; đính kèm; liên kết ngoài                                                                        | P2   |
| `quan-he-va-cong-viec-con`            | Quan hệ & công việc con   | liên quan/trùng/chặn; cha–con + breadcrumb; phát hiện trùng lặp                                                                                | P2   |
| `theo-doi-va-thong-bao-cong-viec`     | Theo dõi & lịch sử        | đăng ký/hủy theo dõi; nhật ký hoạt động; lọc/sắp xếp; reason capture (CE)                                                                      | P2   |
| `cong-viec-nhap-va-intake` [CUSTOM]   | Công việc nháp & Intake   | nháp → công việc thật; intake Accept/Snooze/Decline; lý do từ chối/trùng; source pill                                                          | P3   |
| `cau-hinh-du-an`                      | Cấu hình dự án            | chung (tên/mã/múi giờ/bìa); States/Nhãn/Ước lượng; thành viên & vai trò; lưu trữ/xóa                                                           | P2   |
| `tu-dong-hoa-va-quy-trinh` [CUSTOM]   | Tự động hóa & quy trình   | Workflows (enforcement, reset, rule chuyển trạng thái); Automations (tự lưu trữ/đóng); admin                                                   | P3   |
| `phan-quyen-truong-du-lieu` [CUSTOM]  | Phân quyền theo trường    | ma trận trường × vai trò; xem/sửa/bình luận từng trường; theo vai trò; admin dự án                                                             | P3   |
| `luu-tru-cong-viec`                   | Lưu trữ công việc         | lưu trữ hoàn thành/hủy; xem & khôi phục; lưu trữ dự án (cycles/modules/issues)                                                                 | P3   |

## 3. `cycles-modules` — Cycles & Modules _(extends seed)_

- **names:** VI/EN `Cycles & Modules` / KO `사이클 및 모듈` · **icon:** `refresh-cw`

| slug                                 | Titles (VI)                        | key points                                                                                           | prio |
| ------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------- | ---- |
| `lap-ke-hoach-voi-cycles` _(seeded)_ | Lập kế hoạch với Cycles và Modules | Cycles = lặp theo thời gian; Modules = nhóm công việc; khi nào dùng cái nào; feature toggle          | P1   |
| `tao-va-quan-ly-cycles`              | Tạo & quản lý Cycles               | tạo cycle + ngày; thêm công việc; current/upcoming/completed; transfer; lưu trữ & quick actions      | P2   |
| `theo-doi-tien-do-cycle`             | Theo dõi tiến độ Cycle             | sidebar analytics (lead/thành viên/số việc); burndown/burnup; theo số việc hoặc điểm; phân bố        | P2   |
| `tao-va-quan-ly-modules`             | Tạo & quản lý Modules              | tạo module (lead/thành viên/trạng thái/ngày); List/Board/Gantt; module links; lưu trữ; activity (CE) | P2   |
| `cycles-modules-tab-active` [CUSTOM] | Active Cycles toàn workspace       | tổng quan cycle đang chạy; snapshot tiến độ/deadline; Pro feature (upgrade CTA)                      | P3   |

## 4. `trang-tai-lieu` — Pages & Docs _(extends seed)_

- **names:** VI `Trang & Tài liệu` / EN `Pages & Docs` / KO `페이지 및 문서` · **icon:** `file-text`

| slug                                  | Titles (VI)              | key points                                                                                                     | prio |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- | ---- |
| `viet-tai-lieu-tren-trang` _(seeded)_ | Viết tài liệu trên Trang | tạo trang (icon, công khai/riêng); editor (chữ/list/bảng/ảnh/code/quote); toolbar & full-width; tiêu đề & logo | P1   |
| `quan-ly-va-chia-se-trang`            | Quản lý & chia sẻ trang  | tab Công khai/Riêng/Lưu trữ; khóa/mở khóa; quyền truy cập/yêu thích/copy link; nhân bản/copy MD/di chuyển      | P2   |
| `lich-su-phien-ban-va-xuat-trang`     | Lịch sử phiên bản & xuất | xem & khôi phục version; lưu trữ/xóa; xuất PDF (A4–Tabloid)/Markdown; navigation pane (Outline/Info/Assets)    | P2   |
| `cong-tac-va-ai-tren-trang` [CUSTOM]  | Cộng tác & AI trên trang | real-time nhiều người; sync/offline badge; AI Ask Pi (tạo/cải thiện/đổi giọng); giới hạn dung lượng            | P3   |

## 5. `cai-dat` — Settings _(extends seed — workspace admin)_

- **names:** VI `Cài đặt` / EN `Settings` / KO `설정` · **icon:** `settings`

| slug                                   | Titles (VI)                 | key points                                                                                       | prio |
| -------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------ | ---- |
| `quan-ly-cai-dat-workspace` _(seeded)_ | Quản lý cài đặt workspace   | tên/logo/URL/quy mô/múi giờ; cờ Board of Director (instance admin); xóa workspace; tổng quan mục | P2   |
| `quan-ly-thanh-vien` [CUSTOM]          | Quản lý thành viên          | mời nhiều email; đổi vai trò/đình chỉ/xóa; lời mời chờ; export Excel; cảnh báo hạ cấp admin      | P2   |
| `webhooks-export-tich-hop`             | Webhooks, export & tích hợp | tạo webhook (URL/sự kiện/secret); export workspace (CSV/JSON) + lịch sử; tích hợp; billing & gói | P3   |

## 6. `xem-va-bo-cuc` — Views & Layouts _(NEW)_

- **names:** VI `Hiển thị & Bố cục` / EN `Views & Layouts` / KO `보기 및 레이아웃` · **icon:** `layout-grid`

| slug                          | Titles (VI)                | key points                                                                                         | prio |
| ----------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------- | ---- |
| `cac-bo-cuc-hien-thi`         | Các bố cục hiển thị        | List/Kanban/Calendar/Gantt/Spreadsheet; khi nào dùng; quick-add; chuyển & ghi nhớ bố cục           | P1   |
| `loc-nhom-va-sap-xep`         | Lọc, nhóm & sắp xếp        | lọc trạng thái/người/ưu tiên/nhãn/ngày; nhóm & nhóm phụ (swimlanes); sắp xếp; applied-filter pills | P1   |
| `tuy-chinh-cot-va-thuoc-tinh` | Tùy chỉnh cột & thuộc tính | bật/tắt cột/thuộc tính; extra options (sub-issues, nhóm rỗng); sửa inline; tìm trong view          | P2   |
| `luu-va-chia-se-views`        | Lưu & chia sẻ Views        | saved views (dự án); Global Views (workspace, đa dự án); quyền; mặc định; export Excel             | P2   |

## 7. `tim-kiem-va-dieu-huong` — Search & Navigation _(NEW)_

- **names:** VI `Tìm kiếm & Điều hướng` / EN `Search & Navigation` / KO `검색 및 탐색` · **icon:** `search`

| slug                                        | Titles (VI)                     | key points                                                                                        | prio |
| ------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- | ---- |
| `dieu-huong-thanh-ben-va-app-rail` [CUSTOM] | Điều hướng thanh bên & App Rail | sidebar (Home/Inbox/Your Work/Stickies/Drafts/Projects); app rail; menu dự án; tab nav + overflow | P1   |
| `command-palette-cmd-k` [CUSTOM]            | Command Palette (Cmd+K)         | mở Cmd/Ctrl+K; lệnh điều hướng & tạo nhanh; lệnh theo ngữ cảnh; điều hướng bàn phím               | P2   |
| `tim-kiem-toan-cuc`                         | Tìm kiếm toàn cục               | tìm dự án/việc/trang/cycle/module/nhãn; nhóm theo loại; lọc realtime + phím; mã định danh         | P2   |
| `tuy-chinh-dieu-huong` [CUSTOM]             | Tùy chỉnh điều hướng            | tab mặc định & ẩn tab; bật/tắt Stickies/Your Work/Drafts; chế độ App Rail; kéo-thả sắp xếp        | P3   |

## 8. `thong-bao-va-cong-viec-cua-ban` — Notifications & Your Work _(NEW)_

- **names:** VI `Thông báo & Công việc của bạn` / EN `Notifications & Your Work` / KO `알림 및 내 작업` · **icon:** `bell`

| slug                          | Titles (VI)              | key points                                                                             | prio |
| ----------------------------- | ------------------------ | -------------------------------------------------------------------------------------- | ---- |
| `inbox-va-thong-bao`          | Inbox & thông báo        | danh sách + lọc/sắp xếp; peek preview; xóa từng cái; theo dõi/hủy điều khiển thông báo | P1   |
| `cong-viec-cua-ban-dashboard` | Công việc của bạn        | việc hôm nay; phân bố khối lượng/ưu tiên/trạng thái; nhật ký cá nhân; biểu đồ          | P2   |
| `stickies-ghi-chu-nhanh`      | Stickies — ghi chú nhanh | tạo & quản lý ghi chú; virtual scroll; widget My Stickies; bật/tắt sidebar             | P3   |

## 9. `ho-so-va-tai-khoan` — Profile & Account _(NEW)_

- **names:** VI `Hồ sơ & Tài khoản` / EN `Profile & Account` / KO `프로필 및 계정` · **icon:** `user-cog`

| slug                              | Titles (VI)                     | key points                                                                                | prio |
| --------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------- | ---- |
| `ho-so-ca-nhan` [CUSTOM]          | Hồ sơ cá nhân                   | avatar/bìa/họ tên/tên hiển thị; chức danh; hồ sơ NS SHBVN (mã NV/phòng ban/vị trí); email | P1   |
| `bao-mat-va-email`                | Bảo mật & email                 | đổi mật khẩu + độ mạnh; xác minh mật khẩu; đổi email 2 bước; vô hiệu hóa tài khoản        | P2   |
| `ngon-ngu-giao-dien-va-thong-bao` | Ngôn ngữ, giao diện & thông báo | VI/EN/KO; múi giờ & ngày đầu tuần; sáng/tối/contrast; email theo loại sự kiện             | P2   |
| `api-token-va-nhat-ky-hoat-dong`  | API token & nhật ký             | tạo/xóa token; nhật ký cá nhân phân trang; điều hướng workspace từ profile                | P3   |

## 10. `tinh-nang-shbvn` — SHBVN Custom Features _(NEW — fork-specific)_

- **names:** VI `Tính năng riêng SHBVN` / EN `SHBVN-Specific Features` / KO `SHBVN 전용 기능` · **icon:** `building-2`

| slug                                  | Titles (VI)               | key points                                                                                                                   | prio |
| ------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---- |
| `head-office-dashboard` [CUSTOM]      | Head Office Dashboard     | tổng hợp đa workspace; tab Department/Datasheet/Category/Exports; phân quyền theo phòng ban; lọc + 18 cột; worklog breakdown | P2   |
| `cham-cong-va-timesheet` [CUSTOM]     | Chấm công & timesheet     | log giờ theo việc & danh mục; timesheet workspace/dự án; tự lưu, tuần/tháng; worklog modal & lịch sử                         | P2   |
| `capacity-va-bao-cao` [CUSTOM]        | Capacity & báo cáo        | ước lượng vs thực tế; thẻ capacity (normal/overloaded/under); biểu đồ; export CSV + HO exports; analytics admin              | P3   |
| `du-an-toan-ngan-hang` [CUSTOM]       | Dự án toàn ngân hàng      | đánh dấu bank-wide (admin); danh bạ; tìm/lọc workspace/ngày/lưu trữ; truy cập sidebar                                        | P3   |
| `phong-ban-va-so-do-to-chuc` [CUSTOM] | Phòng ban & sơ đồ tổ chức | cây phòng ban; tạo/sửa/xóa + liên kết workspace; quản lý staff & trạng thái tuyển; import/export CSV; org chart              | P3   |

## 11. `huong-dan-quan-tri` — Admin / God Mode Guide _(NEW — instance admin; English UI)_

- **names:** VI `Hướng dẫn Quản trị (God Mode)` / EN `Admin / God Mode Guide` / KO `관리자 가이드` · **icon:** `shield`
- Note: apps/admin is English-only (no i18n). VI/KO articles describe the English UI; screenshots show the English God Mode panel.

| slug                                  | Titles (VI)                    | key points                                                                                            | prio |
| ------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- | ---- |
| `gioi-thieu-god-mode`                 | Giới thiệu God Mode            | God Mode là gì & ai vào được; truy cập User Menu → God Mode; dashboard quản trị; cài đặt chung        | P3   |
| `cau-hinh-xac-thuc` [CUSTOM]          | Cấu hình xác thực & SSO        | local/Google/GitHub/GitLab/Gitea/LDAP; Swing SSO (URL/client/company code); chính sách đăng ký        | P3   |
| `email-ai-va-thu-vien-anh`            | Email, AI & thư viện ảnh       | SMTP + email thử; API key OpenAI/Anthropic; Unsplash/Pexels/Pixabay                                   | P3   |
| `quan-ly-nguoi-dung-va-workspace`     | Quản lý người dùng & workspace | tạo/import (CSV/Excel)/chi tiết; reset mật khẩu; gán workspace; bulk; tắt tạo workspace               | P3   |
| `quan-ly-nhan-su-va-to-chuc` [CUSTOM] | Quản lý nhân sự & tổ chức      | Staff (thống kê/lọc/tạo/import); Departments (cây/auto-join/liên kết); Job positions; Task categories | P3   |
| `lich-lam-viec-va-giam-sat`           | Lịch làm việc & giám sát       | business calendar (ca/lễ/override VN Banking); monitoring (email logs/jobs/worker); Help Center admin | P3   |

---

## Summary

- **Total: 54 articles / 11 categories** (5 seeded categories extended; 6 new; 5 seeded articles reused, 39 new).
- Per category: Getting Started 4 · Projects & Work Items 12 · Cycles & Modules 5 · Pages & Docs 4 · Settings 3 · Views & Layouts 4 · Search & Navigation 4 · Notifications & Your Work 3 · Profile & Account 4 · SHBVN Custom 5 · Admin/God Mode 6.
- Priority spread: **P1 = 9** · **P2 = 17** · **P3 = 18**.

**Intentionally excluded:** pure-dev/API internals (only config UI documented), per-provider auth deep-config (folded into one admin article), plan-gated upgrade-CTA features (documented lightly), CE stub/placeholder controls, backend seed/migration mechanics, the Help Center itself (avoid meta-recursion).

**Open questions (carried to plan decisions):**

1. Admin guide (cat 11) is instance-global → visible to all staff; write generically or accept admin-only relevance?
2. God Mode articles VI/KO copy (English UI) — recommend yes (reader supports fallback).
3. SHBVN-custom priority — promote Time-tracking/Capacity/HO to P1 if daily-use for most staff?
4. Projects (12 articles) — keep granular or merge automations+field-perms+settings into one "Project administration"?
5. Confirm proposed Lucide icon names resolve in the God Mode icon picker.
