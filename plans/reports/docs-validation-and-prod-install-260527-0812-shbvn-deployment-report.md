# Report — Validate plan SHBVN deployment + viết HDCĐ PROD

**Date:** 2026-05-27 · **Author:** Claude (orchestrator) · **Branch:** `duonglx/docs/shbvn-deployment-docs`
**Plan:** `plans/260515-1156-shbvn-plane-deployment-docs/`

## 1. Việc đã làm

### Validate (reconcile plan ↔ docs thực tế)

Plan stale nặng — commit `f41583d0a3` tạo nhiều docs nhưng không cập nhật plan. Đã sync:

- Phase 01 TKHT: plan ghi 1/10 → thực tế **10/10** drafts. Cập nhật 🟠 Review.
- Phase 06 Ops: plan ghi 0/13 → thực tế **8/13** (5 runbook + 3 ops docs). Cập nhật 🟡.
- Phase 02 ADR: plan ghi 8 ADR → thực tế **0/8** file (chỉ adr-009 ngoài kế hoạch). Index sửa.
- plan.md: rename **SHWS**, bảng status, mục tồn đọng.

### 3 fix nhỏ (user duyệt)

- ✅ ADR index `decisions/README.md`: ADR-001..008 `🟡 Proposed` → `⬜ Planned` (+legend) — hết hiểu lầm "đã có file". ADR-002 title bỏ số version (tránh assert 9.4/9.6).
- ✅ `assets/diagrams/architecture-prod-overview.mmd`: was rỗng → Mermaid v11 khớp `01-architecture-prod §2`. Bỏ `(TODO)` ở doc nguồn.
- ⏳ Split `06-database-design.md` (800 dòng): **hoãn** — xem §3.

### Viết HDCĐ PROD (Phase 03, 7 file — đều <800 dòng, link verify OK)

`02-installation/`: `00-prerequisites.md` (138), `01-build-station-bundle.md` (202).
`02-installation/prod/`: `01-data-node-os` (232), `02-data-node-postgres` (258), `03-data-node-backup` (208), `04-app-node-docker` (243), `05-validation-checklist` (168).

- Theo workflow deploy thực: `build-shb-images.sh` → `prepare-deploy-package.sh` → `dist/` + `docker-compose.shb.yml` + `deploy-shb.sh`; base `docker-compose.yml` plane-selfhost.
- Mỗi file giữ 6 phần (Prereq/Verify/Step/Validate/Rollback/Troubleshoot) + cross-link design + runbook.
- Cập nhật `02-installation/README.md` index + phase-03 + plan.md.

## 2. Drift phát hiện trong design docs (không tự sửa — cần chốt)

- **RHEL 9.4 vs 9.6:** plan + `01-architecture-prod §3.1` = 9.4; arch header + `06-database-design` = 9.6. Ảnh hưởng RPM bundle (version-specific). Install docs để **RHEL 9.x** + note xác nhận Infra.
- **IP DATA node:** `04-network-design` = `10.94.10.11`; `06-database-design §3.1/§5.3` = `10.94.10.20`. Install docs dùng **.11** (network design là nguồn IP canonical). Cần sửa db-design.

## 3. Hoãn: split `06-database-design.md`

800 dòng (đúng ngưỡng, chưa vượt). Grep cho thấy **~20 inbound cross-link dùng anchor SỐ** (§4, §5.1, §6, §7.2, §9, §9.4, §12.4, §14, §16, §18) từ ≥12 file (design docs + runbooks). Tách file → renumber section → **vỡ ~20 link** = phạm "Cross-link không broken" (success criterion). Conflict với lựa chọn "split" của user → chờ user quyết (split+rewrite refs / trim under 800 / giữ nguyên).

## 3b. Split 06-database-design — ĐÃ XỬ LÝ (trim)

User chọn **trim under 800**. Đã cắt comment/prose dư (footer reviewer, §5.1 config comments, §6.3 table, §11.3 sample, §12.1/§13.3/§14/§15 prose) → **800 → 747 dòng**. Giữ nguyên §1–§19 + mọi giá trị config + mọi subsection được anchor (§4/§5.1/§6/§7.2/§9.4/§12.4/§14/§16/§18) → **0 link vỡ**. Headroom 53 dòng.

## 3c. Broken link tồn đọng (forward-reference — KHÔNG do edit này)

Link-check docs-wide: 19 link trỏ file **chưa viết** (sẽ resolve khi làm phase tương ứng):

- 8 design doc → `adr-001..008` (Phase 02 chưa làm)
- `04-testing/README` + `app-deploy-new-version` → `load-test-procedure`, `data-cleanup-after-test`, `uat-acceptance-criteria`, `security-test-plan` (Phase 06 còn lại + Phase 07)
- 7 file install MỚI: link đều resolve OK ✅.

## 4. Còn lại của plan (chưa làm)

- Phase 02: 8 ADR file (001-008)
- Phase 04: TEST/UAT install (3)
- Phase 05: DR install (2)
- Phase 06: 5 runbook còn lại
- Phase 07: KHKT (4)

## 5. Câu hỏi mở

1. Split `06-database-design.md` theo hướng nào? (§3)
2. Chốt RHEL minor (9.4/9.6)?
3. Đồng bộ IP DATA node về `.11` trong `06-database-design`?
4. Mảng tiếp theo hoàn thiện (ADR / Phase 04-05 / runbook / KHKT)?
