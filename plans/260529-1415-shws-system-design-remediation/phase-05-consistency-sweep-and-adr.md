---
phase: 5
title: Consistency-Sweep-and-ADR
status: completed
priority: P2
effort: 0.5d
dependencies:
  - 1
  - 2
  - 3
  - 4
---

# Phase 5: Consistency-Sweep-and-ADR

## Overview

Chạy cuối: rà nhất quán toàn bộ 11 file sau khi Phase 1–4 sửa, chốt các quyết định còn TBD lặp lại, tạo/cập nhật ADR, dedupe câu hỏi mở, cập nhật status/phiên bản.

## Key Insights

- **Encryption-at-rest** là TBD lặp ở `05 §10.1` (⚠️), `05 §14`, `06 §18` (TDE), `07 §10` — Thông tư 09 yêu cầu "encryption at rest". Cần 1 quyết định canonical (default: dựa VLAN+physical+pgBackRest repo encryption; EMC array-level do ICTP xác nhận) → tránh 4 nơi nói mơ hồ khác nhau.
- **ADR gap:** `adr-001..009` đã có. `05 §12` tham chiếu `adr-010` (secret mgmt), `adr-011` (audit 5 năm), `adr-012` (container hardening) — **chưa tạo**. Phase 1 sinh thêm quyết định **mô hình user no-root** (nên có ADR). Phase 4 PA-1 DR seeding có thể cần ADR hoặc cập nhật `adr-006`.
- **Open questions trùng/đã chốt còn để mở:** vd `01 §13` monitoring VM (đã chốt ở 08), MinIO site-replication (đã chốt loại bỏ ở 03). Cần dọn cho khớp trạng thái thực.
- **Status/phiên bản:** mọi file đang `🟡 Draft`; sau remediation nâng version + ghi changelog.

## Requirements

- 0 mâu thuẫn còn lại giữa 11 file (whole-plan consistency sweep).
- Encryption-at-rest có 1 phát biểu canonical, các nơi khác trỏ về.
- ADR phản ánh đúng quyết định đã chốt; không tham chiếu ADR không tồn tại.
- Open questions: gộp, bỏ mục đã chốt, đánh dấu rõ mục còn chờ bank.

## Related Code Files

- **Modify (sweep):** toàn bộ `01-system-design/*.md` — pass nhất quán cuối.
- **Modify:** chọn 1 file làm nguồn encryption-at-rest (đề xuất `05 §10.1` hoặc mục mới `05 §4.5`), các nơi khác (`06 §18`, `07 §10`, `05 §14`) trỏ về + bỏ phát biểu mâu thuẫn.
- **Create:** `05-change-log/decisions/adr-010-os-user-privilege-model.md` (mô hình 3-user no-root-login — từ Phase 1).
- **Create (nếu chốt nội dung):** `adr-011-secret-management-env-0600.md`, `adr-012-audit-retention-5y.md`, `adr-013-container-hardening.md` — hoặc cập nhật `05 §12` để đánh số đúng theo file thực tạo. (Quyết định số ADR khi tạo, tránh lệch.)
- **Modify:** `06-database-design.md` §18, `01 §13`, `03 §12`, các §"Câu hỏi mở": dedupe.
- **Modify:** `README.md` (01-system-design) bảng status nếu nâng version.
- **Modify:** `05-change-log/` changelog/decisions README — ghi nhận đợt remediation.

## Implementation Steps

1. Whole-plan consistency sweep: grep các token rủi ro across 11 file:
   - `12 vCPU|28 GB`, `10.X.Y`, `owner root|root:postgres`, `\bapp\b/\bsre\b/\bdba\b` (account), `hot_standby = off`, `64 MB`, `pgbackrest-cipher.txt`, `/opt/shws/deployment`, `redis:`/`rabbitmq:` (service-name cũ), `beat\b` (vs beat-worker), thiếu `live`.
   - Mỗi hit → resolve hoặc xác nhận đã xử lý ở Phase 1–4.
2. Chốt encryption-at-rest canonical; sửa 4 nơi về 1 phát biểu nhất quán.
3. Tạo ADR-010 user model; rà `05 §12` đánh số ADR khớp file thực; tạo/đánh dấu adr-011/012/013 theo quyết định.
4. Dedupe open questions: bỏ mục đã chốt (monitoring VM, MinIO site-repl), gộp mục trùng (NAS path xuất hiện ở 06/07; cert ACME ở 04/05).
5. Nâng version + cập nhật "Cập nhật" date + status các file đã sửa; ghi 1 dòng changelog `05-change-log/`.
6. Final read-through 11 file đảm bảo cross-ref (§ số, tên file) còn đúng sau khi sửa.

## Todo List

- [ ] Grep sweep tokens rủi ro → 0 unresolved
- [ ] Encryption-at-rest canonical 1 nơi
- [ ] ADR-010 user model + đồng bộ số ADR
- [ ] Dedupe open questions
- [ ] Nâng version + changelog
- [ ] Final cross-ref read-through

## Success Criteria

- [ ] Grep sweep: 0 token mâu thuẫn còn lại (hoặc có giải thích hợp lệ cho daemon-OS-root).
- [ ] Encryption-at-rest phát biểu nhất quán mọi nơi.
- [ ] Mọi ADR tham chiếu trong docs đều tồn tại file; quyết định mới có ADR.
- [ ] Câu hỏi mở không còn mục đã-chốt; mục còn lại đều thực sự chờ bank.

## Risk Assessment

- Một số "câu hỏi mở" thực sự cần bank trả lời (NAS path, IP, SIEM protocol, ACME, encryption-at-rest policy) — KHÔNG tự chốt thay bank; chỉ ghi default đề xuất + đánh dấu "chờ bank xác nhận".

## Security Considerations

- ADR user-model + encryption-at-rest là input cho Security Officer duyệt (00 §3 stakeholder).

## Next Steps

- Sau remediation: chuyển trạng thái docs `🟡 Draft` → `🟠 Review` để Security/DBA/Infra duyệt.
- Propagate xuống `02-installation` (script cài đặt dùng `shbvn`/`postgres`/`mon`, no-root) — plan riêng khi viết HDCĐ.
