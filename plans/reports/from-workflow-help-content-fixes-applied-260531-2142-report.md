# Help Center — Hoàn thiện nội dung (sửa cuốn chiếu + bài mới)

**Ngày:** 2026-05-31 | **Branch:** `duonglx/feat/help-center`
**Nền:** báo cáo review sâu `from-workflow-help-content-accuracy-deep-review-260531-2042-report.md`. Mọi sửa đổi verify-before-fix với code thật.

## Kết quả

- **355 lỗi sửa** · 2 skip (xác nhận đúng/không bịa) · **60 term-fix** · **181 mục thiếu bổ sung** · 8 defer.
- **Gỡ 1 bài** (`cycles-modules-tab-active` — Active Cycles toàn workspace chỉ là màn Upgrade/Pro trong build CE) + dọn 2 inbound link.
- **Thêm 5 bài mới** (code-grounded): `phan-tich-analytics`, `dashboard-tuy-chinh` (xem-va-bo-cuc); `lo-trinh-nhan-vien-moi`, `cau-hoi-thuong-gap-va-khac-phuc-su-co`, `thuat-ngu` (bat-dau).
- **Tổng: 58 bài / 11 danh mục.** Validate: 0 link gãy, 0 marker lỗi, frontmatter/slug/category/sort_order OK.
- **Test:** 100/100 test backend help_center PASS (loader render, seed 58, reader API, search, terminology, injection).

## Sửa cấu trúc / cross-cutting (tự verify code)

- **App Rail TẮT trong CE** (`apps/web/ce/hooks/app-rail/provider.tsx` → `isEnabled={false}`; `content-wrapper.tsx:41` gate). Đồng bộ lại 6 bài + 5 cross-link-text: điều hướng = thanh trên cùng (Workspace menu + Cmd+K + Inbox icon chấm-đỏ + Help + avatar) + sidebar trái. Đổi tiêu đề bài `dieu-huong-thanh-ben-va-app-rail` → 'Thanh bên & Thanh điều hướng trên cùng' (slug giữ).
- **Term canon (nhãn shipped):** Khách/Thành viên/Quản trị viên (bỏ Viewer); Overall Management (HO); Dự án toàn hàng (sidebar) vs cờ 'Dự án toàn ngân hàng'; Pi/Ask Pi (bỏ 'AI Pi'); Trưởng phòng ban.
- **Brand-test:** giữ nhãn God Mode thật 'Images in Plane' (`apps/admin/hooks/use-sidebar-menu/core.ts:93`) + allowlist trong `test_help_center_seed.py`; gỡ 1 chỗ 'Plane' thừa.

## Lỗi nặng tiêu biểu đã sửa (mẫu)

- **cycles-modules:** Fixed all 4 cycles-modules help articles. Re-verified every cited finding against current code (quick-actions-helper, module.ts, EIssueLayoutTypes, transfer-issues.tsx, cycle/module detail headers, CE analytics base.tsx, progress-stats default tab, backend ove
- **trang-tai-lieu:** All 4 articles edited in place. Every finding re-verified against current code; all 26 issues confirmed real (0 refuted). Two blockers required removing whole sections: AI Pi (extension "ai" hard-disabled in CE use-editor-flagging.ts:37) and Move page (usePage
- **cai-dat:** Edited all 3 cai-dat help articles. Re-verified every cited finding against current code (web components, i18n VI labels, backend views, constants) — all 15 issues across the 3 articles CONFIRMED real, 0 false positives. Applied all fixes plus 10 grounded miss
- **thong-bao-va-cong-viec-cua-ban:** Fixed all 3 articles in category thong-bao-va-cong-viec-cua-ban. Re-verified all 21 issues against current code — every finding confirmed real (0 false positives). Applied all fixes: corrected My Work/Hộp thư đến/Ghi chú nhanh labels, profile tab gating (viewe
- **ho-so-va-tai-khoan:** All 24 findings across 4 articles re-verified against current code; 23 confirmed and fixed, 1 made moot by a blocker-driven section removal. Two blocker findings confirmed: StaffProfileSection has 0 usages (only its own definition) and the profile general tab 
- **tinh-nang-shbvn:** Edited all 5 articles in category tinh-nang-shbvn. Re-verified every cited finding against current code (capacity_report.py, capacity-heatmap.tsx, worklog.py/serializers, bank_wide.py, ho.py + HO components, admin departments components + department.py model).
- **huong-dan-quan-tri:** Edited all 6 admin-guide articles. Re-verified every cited finding against current code (apps/admin God Mode UI, apps/web user-menu, apps/api license views) — all 37 issues confirmed real (0 refuted), all applied. Added 16 small code-grounded missing items; de
- **du-an-cong-viec:** Re-verified and applied all 45 findings (across 6 articles) against current code — every cited finding confirmed real, 0 false positives. Fixed major correctness errors: comment Private/Reply/Enter-Ctrl shortcut, attachment delete permission + file-type claim,
- **du-an-cong-viec:** Fixed all 6 assigned articles in du-an-cong-viec. Re-verified every finding against current code (apps/web/ce/**, apps/web/core/**, apps/api/plane/**, packages/**): all 39 issues across the 6 slugs CONFIRMED real (0 false positives). Applied all 39 issue fixes
- **bat-dau:** Fixed all 4 bat-dau help articles. Re-verified all 27 findings against current code (apps/web CE + core, packages/i18n, apps/api templates) — every issue confirmed real, 0 false positives. Applied UI-label corrections (Set password, Sign out, Continue, Accept 
- **xem-va-bo-cuc:** Fixed all 4 articles in xem-va-bo-cuc. Re-verified every cited finding against current code (apps/web/core, apps/web/ce, packages/constants, packages/i18n, apps/api). Confirmed and applied 27 of 28 findings; skipped 1 (bank-wide column rename) because the term
- **tim-kiem-va-dieu-huong:** Verified and fixed all 20 issues across 4 articles (search & navigation category). Every finding re-verified against current code and confirmed real — 0 skipped. Key corrections: sequence shortcuts (g*/n*) are GLOBAL page shortcuts that don't work inside the p

## Skip (xác nhận KHÔNG sửa — đúng/không bịa)

- `ho-so-ca-nhan` ho-so-ca-nhan-9: Moot: the entire 'Xem thông tin nhân sự SHBVN' section (the only place the 'Vị trí'/'Chức vụ' field appeared) was removed per blocker issues 1 & 2 because StaffProfileSection has 0 usages in code; no 
- `tuy-chinh-cot-va-thuoc-tinh` tuy-chinh-cot-va-thuoc-tinh-4 (partial: bank-wide label only): Finding wants 'Dự án toàn ngân hàng'->'Dự án toàn hàng' for the SHBVN attribute row. But the row describes the bank-wide FLAG/attribute ('Đánh dấu bank-wide'), and per the terminology canon the flag/a

## Mục thiếu lớn đã hoãn (cân nhắc bài/section sau)

- `quan-ly-va-chia-se-trang`: Phân biệt menu '...' ở danh sách vs khi mở trang (block-item-action vs options-dropdown) — large restructure of multiple sections, not applied to avoid bloat
- `ho-so-ca-nhan`: Nút/đường dẫn thay thế để mở Cài đặt hồ sơ qua route /settings/profile/:tab — borderline/secondary entry point; kept doc focused on the primary menu flow to avoid noise (route exis
- `cau-hinh-du-an`: Workflows (Quy trình) — bài đã có cross-link tu-dong-hoa-va-quy-trinh; thêm cả section là quá lớn
- `cau-hinh-du-an`: Field permissions / Bank-wide liệt kê trong cây Cài đặt — đã cross-link phan-quyen-truong-du-lieu; full settings-tree listing quá lớn cho bài này
- `gia-nhap-workspace-va-onboarding`: Buoc chon Vai tro / Linh vuc chuyen mon (role/use_case) - DEFERRED-as-removal: confirmed handleStepChange (root.tsx:67-89) never routes to ROLE_SETUP/USE_CASE_SETUP and profile/roo
- `cac-bo-cuc-hien-thi`: Default initial layout = Kanban: contested/ambiguous in code — workspace_seed_task.py member-default sets kanban, but project signal default is spreadsheet and frontend computed de
- `loc-nhom-va-sap-xep`: Detailed rich-filter operator mechanics (per-condition operators, negation, toggle rows): largely addressed by the filter-button fix; full operator walkthrough is a larger section 
- `dieu-huong-thanh-ben-va-app-rail`: Drafts auto-hide when no drafts exist — payload itself flagged as light caveat needing UI confirmation (gating lives in SidebarUserMenuItem, not in personalPreferences render path)

## Câu hỏi mở (product/owner)

1. **Dashboard tùy chỉnh:** route hoạt động nhưng link sidebar đang **ẩn tạm** (`packages/constants/src/workspace.ts:243` comment). Bài hiện hướng dẫn vào qua URL. Giữ vậy / reframe 'sắp ra mắt' / bỏ bài?
2. **Org Chart:** vẫn 'đang triển khai' (chưa wire route) — quyết định cũ còn treo.
3. **Screenshot cho bài mới:** 4 marker mới (analytics/dashboard) chưa có ảnh — cần chạy capture pipeline.
4. **EN/KO:** toàn bộ vẫn VI-only (reader fallback VI). Dịch khi nào?