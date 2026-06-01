# Phase 06 — Vận hành & Runbooks (HDVH)

## Context

- **Output location:** `docs/shbvn-deployment/03-operations/`
- **Depends on:** Phase 03/04/05 (Installation) ≥ 🟠 Review
- **Plan:** [`./plan.md`](./plan.md)

## Overview

- **Priority:** P0 — không có runbook là không thể vận hành sau go-live
- **Status:** 🟠 Review (13/13 — 10 runbooks + 3 ops docs xong; 5 runbook cuối viết 2026-05-27)
- **Mô tả:** 10 runbooks + 3 docs vận hành chung

## Key insights

- Runbook phải actionable — copy-paste vào terminal là chạy được
- Mỗi runbook 6 phần: When · Pre-check · Action · Verify · Rollback · Escalation
- Oncall đọc lúc 3h sáng phải hiểu ngay — không jargon
- DR drill quarterly là bắt buộc cho compliance bank

## Todo list

### Runbooks (`runbooks/`)

- [x] `backup-restore.md` — pgBackRest full/incr/restore + MinIO sync
- [x] `dr-failover.md` — Promote DR replica → master (manual)
- [x] `postgres-minor-upgrade.md` — PG 15.x → 15.y security patch
- [x] `postgres-major-upgrade.md` — PG 15 → 16 (pg_upgrade, multi-year)
- [x] `app-deploy-new-version.md` — Deploy version mới của Plane (zero-downtime nếu được)
- [x] `load-test-procedure.md` — Quy trình chạy load test trước release (k6)
- [x] `data-cleanup-after-test.md` — Reset/dọn dữ liệu test trên UAT
- [x] `ldap-sso-troubleshoot.md` — Sự cố auth LDAP/SwingSSO
- [x] `disk-full-recovery.md` — Khi /u02 WAL hoặc /u03 backup disk đầy
- [x] `postgres-vacuum-bloat.md` — Manual vacuum khi autovacuum không đủ

### Docs vận hành chung

- [x] `monitoring-alerting.md` — Prometheus + Grafana setup, alert rules
- [x] `incident-response.md` — P1/P2/P3 procedure, escalation chain
- [x] `routine-maintenance.md` — Daily/Weekly/Monthly/Quarterly checklists

## Success criteria

- Tất cả runbook đã test trên UAT trước go-live
- DR drill executed thành công ít nhất 1 lần trước go-live
- Oncall team training pass

## Risk

| Risk                                  | Mitigation                                    |
| ------------------------------------- | --------------------------------------------- |
| Runbook outdated khi infra thay đổi   | Review quarterly + sau mỗi change ảnh hưởng   |
| Oncall không tìm thấy runbook lúc cần | Index trong `03-operations/README.md` rõ ràng |

## Next steps

Phase này là phase cuối trước go-live (cùng Phase 07).
