# Phase 05 — Cài đặt DR site (HDCĐ DR)

## Context

- **Output location:** `docs/shbvn-deployment/02-installation/dr-site/`
- **Depends on:** Phase 03 (PROD install) ≥ 🟠 Review
- **Plan:** [`./plan.md`](./plan.md)

## Overview

- **Priority:** P1 — DR site quan trọng cho RTO/RPO target bank
- **Status:** 🟠 Review (2/2 — viết xong 2026-05-27)
- **Mô tả:** Cài DATA node thứ 2 ở DR site, streaming replication từ PROD

## Key insights

- DR site có WAN bandwidth khác LAN — replication mode = async giai đoạn 1
- DR DATA node cấu hình giống PROD DATA node (RHEL 9.6 + PG 15.7 native + SAN)
- DR APP node cold standby (cài sẵn nhưng không serve traffic) — TBD nếu bank yêu cầu
- Failover manual giai đoạn 1, auto (Patroni) giai đoạn 2

## Todo list

- [x] `01-data-node-replica.md` — Cài PG standby, pg_basebackup từ primary, slot `shws_dr_slot`, standby.signal, mTLS, verify lag
- [x] `02-failover-test.md` — Partial/shadow drill promote replica → primary + revert + re-sync

## Success criteria

- Replication lag < 30 giây trên WAN bandwidth thực tế
- Failover drill < 30 phút (manual procedure)
- Cross-site backup verified (pgBackRest có thể restore từ DR backup nếu PROD chết hoàn toàn)

## Risk

| Risk                              | Mitigation                                                              |
| --------------------------------- | ----------------------------------------------------------------------- |
| WAN ngắt → replication lag tăng   | Async mode chấp nhận lag, monitor + alert                               |
| Promote replica sai → split-brain | Manual procedure có verification step, isolate master trước khi promote |
| DR site SAN khác model            | Test config trên DR SAN trước, có thể cần khác filesystem param         |

## Next steps

Sau phase này → Runbook DR failover trong Phase 06.
