# Plan — Tài liệu triển khai Shinhan Workspace (SHWS) cho SHBVN

**Ngày tạo:** 2026-05-15
**Cập nhật:** 2026-05-27 (reconcile với docs thực tế)
**Owner:** duonglx
**Status:** 🟠 Review — tất cả 7 phase drafted (chờ stakeholder duyệt → 🟢 Accepted)

> **Lưu ý rename:** Dự án đổi tên thành **Shinhan Workspace (SHWS)** — hệ quản lý dự án nội bộ SHBVN xây trên nền Plane.so. Boundary trách nhiệm: **SHWS** quản DB tier; **ICTP (hạ tầng)** quản platform/storage tier (EMC). Xem [`adr-009`](../../docs/shbvn-deployment/05-change-log/decisions/adr-009-dc-dr-replication-layering.md).

## Mục tiêu

Hoàn thiện bộ tài liệu vòng đời triển khai SHWS cho ngân hàng SHBVN tại `docs/shbvn-deployment/`, bao gồm:

- TKHT (Thiết kế Hệ thống) — 10 files
- HDCĐ (Hướng dẫn Cài đặt) — 10 files (PROD + TEST/UAT + DR)
- HDVH (Hướng dẫn Vận hành) — 10 runbooks + 3 docs chung
- KHKT (Kế hoạch Kiểm thử) — 4 files
- ADR (Quyết định kiến trúc) — 8 records

Tổng: ~40 markdown files theo chuẩn ngân hàng VN.

## Ràng buộc

- Air-gap environment (mọi cài đặt offline)
- RHEL 9.6 + PG 15.7 native + EMC SAN + Hyper-V VMs
- RPO < 15p, RTO < 1h
- 1000 user / 100 CCU peak
- Mỗi file < 800 dòng (modularize nếu vượt)

## Phases

| #   | File                                                                       | Phạm vi                                  | Status    | Progress                                             |
| --- | -------------------------------------------------------------------------- | ---------------------------------------- | --------- | ---------------------------------------------------- |
| 01  | [`phase-01-system-design-docs.md`](./phase-01-system-design-docs.md)       | TKHT 10 files                            | 🟠 Review | 10/10 (100%) — drafts xong, chờ duyệt                |
| 02  | [`phase-02-adr-records.md`](./phase-02-adr-records.md)                     | ADR 8 files                              | 🟠 Review | 8/8 (100%) — viết xong 2026-05-27 (+adr-009 = 9 ADR) |
| 03  | [`phase-03-installation-prod.md`](./phase-03-installation-prod.md)         | HDCĐ PROD 5 files + build-station bundle | 🟠 Review | 7/7 (100%) — drafts xong 2026-05-27                  |
| 04  | [`phase-04-installation-test-uat.md`](./phase-04-installation-test-uat.md) | HDCĐ TEST/UAT 3 files                    | 🟠 Review | 3/3 (100%) — viết xong 2026-05-27                    |
| 05  | [`phase-05-installation-dr.md`](./phase-05-installation-dr.md)             | HDCĐ DR 2 files                          | 🟠 Review | 2/2 (100%) — viết xong 2026-05-27                    |
| 06  | [`phase-06-operations-runbooks.md`](./phase-06-operations-runbooks.md)     | HDVH 10 runbooks + 3 docs                | 🟠 Review | 13/13 (100%) — 10 runbooks + 3 ops docs xong         |
| 07  | [`phase-07-testing-plans.md`](./phase-07-testing-plans.md)                 | KHKT 4 files                             | 🟠 Review | 4/4 (100%) — viết xong 2026-05-27                    |

**Tổng tiến độ nội dung:** ~48 file drafted (TKHT 10 + HDCĐ 12 [PROD 7 + UAT 3 + DR 2] + HDVH 13 + ADR 9 + KHKT 4) + extras + diagram prod. **Tất cả 7 phase ở 🟠 Review.** Drift đã sync, 3 diagram đủ, 0 broken link. Còn lại: **stakeholder duyệt** + trả lời câu hỏi mở (bank/Infra: IP thực, WWID, NAS, LDAP/SMTP, patch RHEL).

### Tồn đọng validate (cập nhật 2026-05-27)

- ✅ `assets/diagrams/architecture-prod-overview.mmd` — đã điền Mermaid v11 (was rỗng).
- ✅ `decisions/README.md` — ADR-001..008 đổi sang ⬜ Planned (was "Proposed" gây hiểu lầm có file).
- ✅ `06-database-design.md` — user chọn **trim** (giữ 1 file để không vỡ ~20 cross-link anchor số): cắt comment/prose dư **800 → 747 dòng**, giữ nguyên §1–§19 + giá trị config. 0 link vỡ.
- ✅ **8 ADR (001–008) viết xong 2026-05-27** — resolve 8 broken forward-link; index 🟡 Proposed + link.
- ✅ **Phase 06 hoàn tất (5 runbook cuối) 2026-05-27** — resolve 2 broken link.
- ✅ **Phase 04+05+07 hoàn tất 2026-05-27** — UAT(3) + DR(2) + KHKT(4). **0 broken link** docs-wide (đã verify).
- ✅ **Drift slot DR synced 2026-05-27:** `03-architecture-dr-site` đổi `dr_replica_slot`→`shws_dr_slot` + auth password→mTLS cert + IP `.11` (khớp 06-db + install).
- ✅ **UAT compose approach** ghi chú trong `02-architecture-test-uat` §3.1 (air-gap: image SHB prebuilt + override, giữ plane-db).
- ✅ **3 diagram `.mmd`** đã đủ: prod-overview, test-uat, dr-replication (Mermaid v11). Bỏ marker (TODO).
- ✅ Drift RHEL→9.6 + IP DATA→10.94.10.11 đã đồng bộ toàn bộ docs.
- ✅ **Drift RHEL** — chốt **9.6** (2026-05-27), đồng bộ overview/arch/README/install docs. Còn xác nhận patch 9.6.z với Infra.
- ✅ **Drift IP DATA node** — chốt **10.94.10.11** (PROD) / **10.94.20.11** (DR) theo network design; đã sync `06-database-design`.
- ✅ **Deep-review TKHF production (2026-05-27)** — sửa 9 drift HIGH/MEDIUM, đồng bộ 01/04/05 về canonical 06 + ADR-009:
  - `max_connections` 200→**300** (01, khớp alert 250/290); `wal_keep_size` 1GB→**4GB** + thêm `max_slot_wal_keep_size` (01).
  - **pgBackRest KHÔNG ship qua WAN** (repo độc lập/site) — gỡ QoS "WAL ship 200Mbps" + ASCII WAN (04 §9/§3); sửa 06 §10.2 (bỏ server-start TLS push, để open question seed WAL DR-local).
  - **MinIO sync = EMC storage (ICTP)** — gỡ tàn dư `mc mirror`/daily-sync ở 04 §6.3/§9/§10.2 + risk 03 §9.
  - **replicator = mTLS cert (no password)** — gỡ `replicator_password` (05 §2.4/§4.1).
  - **Cert PG về PGDATA** `/u01/pgsql/15/data/{server,replicator,bank-ca}` (05 §4.2/§5.2 khớp 06/03).
  - Vặt: RTO failover 01 §7 (~45-70p, <1h); RAM trigger 01 §8 (16→24GB); PG log path 05 → `/var/log/postgresql`; thêm `idle_in_transaction_session_timeout` (06 §5.1, theo DB-R-02).
- ✅ **PgBouncer → bỏ khỏi GĐ1, chuyển GĐ2 (2026-05-27)** — sau phân tích định lượng đối chiếu code Plane gốc (verify: Plane KHÔNG dùng pooler, chỉ `max_connections=1000`; `CONN_MAX_AGE=0`; gunicorn UvicornWorker). Nhu cầu thực ~13–17 conn đồng thời → multiplexing vô ích ở GĐ1. **Quyết định: app nối trực tiếp `5432` + `CONN_MAX_AGE=300`**; PgBouncer là trigger GĐ2 (≥2 APP node / read replica / CCU>200). Gỡ pooler khỏi **12 file** (01/04/06/09 + install prod 02/04/05 + prereq/build-bundle + runbook minor-upgrade/load-test + testing scenarios): bỏ `pgbouncer.service`/role `pgbouncer_auth`+`pgbouncer_admin`/DB `pgbouncer_auth`/`pgbouncer.ini`/userlist/6432, rewrite 06 §6 → "Connection model (Django persistent)", thêm trigger 06 §14. Đồng thời sửa 3 sai gunicorn/celery ở 01 §4.1 (sync→UvicornWorker; workers 8 vs env 2; celery 4 vs default CPU).

## Dependencies

```
Phase 01 (TKHT) ──► Phase 02 (ADR) ──► Phase 03/04/05 (HDCĐ) ──► Phase 06 (HDVH)
                                                              ──► Phase 07 (KHKT)
```

- Phase 02 (ADR) có thể viết song song Phase 01 từ những quyết định đã chốt
- Phase 06 (HDVH) cần Phase 03/04/05 xong trước (runbook reference cài đặt)
- Phase 07 (KHKT) độc lập với Phase 06

## Reports / Research liên quan

- `plans/reports/architecture-260513-1608-plane-2node-deployment.md` — raw draft kiến trúc (đã migrate vào TKHT)

## Cross-references

- Tài liệu output: [`../../docs/shbvn-deployment/`](../../docs/shbvn-deployment/)
- ADR home: [`../../docs/shbvn-deployment/05-change-log/decisions/`](../../docs/shbvn-deployment/05-change-log/decisions/)

## Success criteria

- 40+ markdown files hoàn chỉnh, mỗi file < 800 dòng
- Tất cả 8 ADR ở status 🟢 Accepted
- Stakeholder review pass (architect, security, DBA, SRE, QA)
- Cross-link không broken
- Diagram source files cho mọi sơ đồ chính
