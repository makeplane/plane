# ADR-004: Backup tool — pgBackRest

**Date:** 2026-05-27
**Status:** 🟡 Proposed
**Deciders:** DBA Lead, SRE Lead, IT Audit

## Context

SHWS cần giải pháp backup PostgreSQL đạt:

- **RPO < 15 phút, RTO < 1 giờ** (mục tiêu bank).
- **PITR** (point-in-time recovery) cho kịch bản xóa nhầm dữ liệu.
- **Encryption at rest** cho backup (compliance).
- **Offsite copy** sang NAS bank.
- Hoạt động trong **air-gap** (không cloud).

## Decision

Dùng **pgBackRest 2.51+** (native RPM): full (tuần) + diff (ngày) + incr (giờ) + WAL archive liên tục; repo tại `/u03/pgbackup`; mã hóa `aes-256-cbc`; rsync offsite sang NAS.

## Alternatives considered

- **Option A — `pg_dump`/`pg_dumpall`:** Loại. Không PITR; logical dump chậm + tốn tài nguyên trên DB lớn; không incremental; lock dài.
- **Option B — Barman:** Loại. Tính năng tương đương nhưng DBA bank ít quen hơn; pgBackRest cấu hình stanza đơn giản + delta/parallel mạnh.
- **Option C — SAN/filesystem snapshot cho PG data dir:** Loại. Chỉ cho bản _crash-consistent_, không transaction-aware → rủi ro corruption khi restore (xem [ADR-009](./adr-009-dc-dr-replication-layering.md)).
- **Option D — pgBackRest:** **CHỌN.** PITR, parallel (`process-max`), delta restore, compression lz4, encryption built-in, WAL async archive.

## Consequences

- **Positive:** RPO ~30s (WAL + `archive_timeout=60s`); RTO mục tiêu đạt được; encryption + offsite; verify/check tích hợp.
- **Negative:** Cần học cấu hình stanza + retention; thêm repo disk `/u03`.
- **Risks:** **Mất cipher passphrase = mất khả năng restore** — mitigation: lưu KeePass 2 nơi (DBA + Infra Mgr); `/u03` đầy → alert >80% + expire daily.

## Liên kết

- Database design §9: [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md)
- Runbook backup/restore: [`../../03-operations/runbooks/backup-restore.md`](../../03-operations/runbooks/backup-restore.md)
- Cài đặt backup: [`../../02-installation/prod/03-data-node-backup.md`](../../02-installation/prod/03-data-node-backup.md)
- Liên quan: [ADR-006](./adr-006-dr-replication-mode.md), [ADR-009](./adr-009-dc-dr-replication-layering.md)
