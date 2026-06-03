# Help Center — Review chất lượng nội dung, điều hướng, khả năng tiếp cận + Coverage ảnh chụp

**Ngày:** 2026-05-30 | **Branch:** `duonglx/feat/help-center`
**Phương pháp:** 1 workflow soạn target (11 agent) + capture Playwright + 1 workflow review (5 chiều, grounded vào code). Mọi finding đều có `file:line`.

## 1. Ảnh chụp màn hình — coverage

| | Trước | Sau |
| --- | --- | --- |
| Marker có ảnh | 20 | **131 / 154 (85%)** |
| Asset live | 20 | 132 |
| Capture | — | 131/131 OK (0 fail), gồm 30 màn God Mode :3001 |

**23 marker còn trống** (nhóm "manual" — không tự động hóa được với demo data):
`dang-nhap-man-hinh-chinh`, `dang-nhap-quen-mat-khau`, `gia-nhap-chap-nhan-loi-moi`, `gia-nhap-onboarding-buoc-ho-so` (4 màn auth/onboarding — cần phiên CHƯA đăng nhập), `tong-quan-quan-ly-widget` (CE stub nút), `transfer-issues-cycle`, `module-archived`, `page-version-history-view`, `page-realtime-collaboration-cursors`, `page-sync-offline-badge`, `page-archive-restore-action`, `cham-cong-worklog-edit`, `ly-do-thay-doi-ngay`, `workspace-member-role-downgrade-modal`, `workspace-webhook-detail-page`, `workspace-webhook-secret-key`, `workspace-members-excel-export`, `inbox-thong-bao-menu-hanh-dong`, `inbox-thong-bao-peek-preview`, `stickies-quan-ly-ghi-chu`, `ho-so-nhan-su-shbvn`, `app-rail-context-menu`, `ten-kebab` (ví dụ tài liệu, không phải ảnh thật).

> **CAVEAT quan trọng:** "OK" = đã chụp được 1 ảnh. Với target **tương tác** (mở modal, hover, Cmd+K), nếu bước click/hover thất bại thì `capture.mjs` vẫn chụp ảnh route nền → ảnh có thể KHÔNG đúng trạng thái mong muốn. 45 target interactive cần **QA mắt thường từng ảnh** trước khi coi là chuẩn.

## 2. Verdict theo chiều review

| Chiều | Verdict | Blocker | Major | Minor/Nit |
| --- | --- | --- | --- | --- |
| Nội dung — 9 danh mục lõi | acceptable-with-fixes | 0 | 2 | 3 |
| Nội dung — SHBVN + God Mode | **needs-work** | **2** | 2 | 6 |
| Điều hướng & IA (/help) | acceptable-with-fixes | 0 | 3 | 4 |
| Khả năng tiếp cận & UX | acceptable-with-fixes | 0 | 2 | 3 |
| Rà soát thiếu sót | acceptable-with-fixes | 0 | 0 | 3 |

## 3. BLOCKER (phải sửa trước khi publish) — đã tự kiểm chứng

1. **Timesheet mô tả sửa-được nhưng thực tế CHỈ ĐỌC.** Bài `tinh-nang-shbvn/cham-cong-va-timesheet.vi.md:48,62-68,72` nói "Nhấp ô để sửa trực tiếp… lưu tự động" + nút "+ Add Issue". Code `apps/web/ce/components/time-tracking/timesheet/timesheet-table.tsx:6,88,98-104` = grid read-only, không input, không nút Add. → Nhân viên làm theo sẽ không thực hiện được. Cách log giờ thật: nút **Log Time** trên từng công việc.
2. **Org Chart không truy cập được.** Bài `tinh-nang-shbvn/phong-ban-va-so-do-to-chuc.vi.md:15,24` bảo "từ sidebar chọn Org Chart". **Đã verify:** `/org-chart` KHÔNG có trong `apps/web/app/routes/{core,extended}.ts`, KHÔNG có entry sidebar (chỉ `ho`, `bank-wide-projects`, `time-tracking` được wire). Trang tồn tại trên đĩa nhưng chưa nối route/nav. → Cần product quyết: gỡ mục / "sắp ra mắt" / wire route.

## 4. MAJOR (sai khiến người dùng làm sai)

- **Vai trò "Viewer" không tồn tại.** 4 bài (`du-an-cong-viec/cau-hinh-du-an.vi.md:68`, `du-an-cong-viec/phan-quyen-truong-du-lieu.vi.md:39,60`, `trang-tai-lieu/viet-tai-lieu-tren-trang.vi.md:18`, `trang-tai-lieu/quan-ly-va-chia-se-trang.vi.md:19`) dùng "Viewer". Hệ thống chỉ có **Guest/Member/Admin** (`packages/types/src/enums.ts:8-10`). Bài `quan-ly-thanh-vien.vi.md:31` lại dùng đúng "Guest" → mâu thuẫn nội bộ. Sửa: Viewer → Guest (Khách).
- **Menu AI mô tả 6 tác vụ, thực tế chỉ "Ask Pi".** `trang-tai-lieu/cong-tac-va-ai-tren-trang.vi.md:69-76` vs `apps/web/core/constants/ai.ts:7-9` (chỉ ASK_ANYTHING) + `menu.tsx:34-44`. Tone = 3 nút (Default/Professional/Casual) hiện SAU khi Ask Pi.
- **"Rejoin" = chỉ trưởng phòng, không phải mọi nhân viên.** `phong-ban-va-so-do-to-chuc.vi.md:80` + `quan-ly-nhan-su-va-to-chuc.vi.md:92` vs `apps/admin/.../departments/components/rejoin-all-modal.tsx:49,82` ("Rejoin All Managers… Join all department managers as Admin").
- **IA:** taxonomy lệch nặng (du-an-cong-viec 12 bài vs cai-dat/thong-bao 3 bài); trang duyệt danh mục **thiếu tiêu đề danh mục** (`help-center-home.tsx:69-84`); **bug marker** literal `{{screenshot:ten-kebab}}` trong inline-code bị loader nuốt thành span rỗng (`loader.py:39,54` + `lich-lam-viec-va-giam-sat.vi.md:119`).
- **UX:** `/help` bị `AuthenticationWrapper` mặc định AUTHENTICATED → user **đang onboarding** bị đẩy về `/onboarding`, không đọc được trợ giúp đúng lúc cần nhất (`apps/web/app/(all)/help/layout.tsx:19` + `authentication-wrapper.tsx:130-140`).

## 5. MINOR/NIT (chọn lọc)
- Capacity: bài nói export lưu ở "HO Dashboard", thật ra ở `/time-tracking/exports` (`capacity-va-bao-cao.vi.md:53`). Nhãn "Cross Workspaces" → thật là "Cross teams & workspaces", mặc định BẬT; Detailed Export bị disable khi bật.
- God Mode nhãn: "AI"→"Artificial intelligence", "Images"→"Images in Plane"; "Job Positions" không có trên sidebar (chỉ vào bằng URL); Swing SSO bật sẽ tự tắt LDAP (thiếu caveat).
- A11y: thiếu `<main>` landmark + skip-link (`help/layout.tsx:20-25`); thiếu focus-ring khi tab (`category-card.tsx`, `article-list.tsx`, `help-search-box.tsx:30`).
- Search UX: không có "N kết quả", không hiện tên danh mục trong kết quả; breadcrumb hiện slug thô khi deep-link.
- Danh mục đầu lặp 2 lần (Featured + Grid) trong `help-center-home.tsx:91-92`.
- Topic gap (tùy chọn): chưa có bài FAQ/khắc phục sự cố; chưa có bài app di động/desktop.

## 6. Điểm mạnh (xác nhận)
- Độ chính xác kỹ thuật phần lõi rất cao (16/16 phím tắt, 4 trường Field Permissions, debounce, theme reload, các trường SHBVN… đều khớp code).
- 54/54 bài published, body dày (mỏng nhất 407 từ), 0 link chéo gãy, fallback VI cho EN/KO hoạt động.
- God Mode (Swing SSO, email TLS/SSL, AI, Unsplash, departments toolbar, HO dashboard, bank-wide) verify khớp 100%.
- 3 entry point /help (sidebar, Cmd+K, URL) đều nhãn VI rõ, mở in-app; i18n VI đầy đủ.

## Câu hỏi cần quyết (product/owner)
1. Org Chart: gỡ mục / "sắp ra mắt" / wire route + sidebar?
2. Tách `du-an-cong-viec` (12 bài) thành 2 danh mục con?
3. Cho user đang onboarding đọc `/help`? (đổi auth gating)
4. Bổ sung bài FAQ/khắc phục sự cố? App di động (nếu có)?
5. Sửa loader để bỏ qua marker trong `<code>` (bền) hay chỉ sửa 1 dòng bài (nhanh)?
