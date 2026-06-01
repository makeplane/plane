# ADR-008: Storage — EMC SAN multipath + LVM + XFS (3 LUN)

**Date:** 2026-05-27
**Status:** 🟡 Proposed
**Deciders:** DBA Lead, Infra/ICTP, Architect

## Context

DATA node PROD cần tầng lưu trữ: hiệu năng cho DB OLTP, mở rộng online, tách I/O pattern, và theo convention DBA banking. Bank đã có **EMC SAN** với LUN cấp qua nhiều path (HBA/fabric).

## Decision

**3 LUN trên EMC SAN**, multipath + LVM + XFS, convention `/u0X`:

| Mount  | LUN   | Size   | RAID    | Mục đích         |
| ------ | ----- | ------ | ------- | ---------------- |
| `/u01` | LUN-1 | 600 GB | RAID-10 | PGDATA + MinIO   |
| `/u02` | LUN-2 | 100 GB | RAID-10 | WAL (tách riêng) |
| `/u03` | LUN-3 | 1 TB   | RAID-5  | pgBackRest repo  |

`device-mapper-multipath` (failover < 1s), LVM (`lvextend`+`xfs_growfs` online), XFS `noatime`. Cấu hình array (RAID group, cache, **cross-site replication**) thuộc ICTP.

## Alternatives considered

- **Option A — 1 LUN gộp tất cả:** Loại. WAL (sequential write) tranh I/O với heap (random) → giảm throughput; `/u01` đầy làm DB freeze cả WAL.
- **Option B — Local VHDX cho data:** Loại. Không HA storage, không multipath, không mở rộng online; không đạt resilience bank.
- **Option C — ZFS:** Loại. Không chuẩn trên RHEL bank (out-of-tree); thêm phức tạp/licensing; SAN đã cung cấp RAID + replication.
- **Option D — SAN multipath + LVM + XFS, 3 LUN:** **CHỌN.** Tách I/O, mở rộng online, multipath failover, đúng convention DBA.

## Consequences

- **Positive:** Tách WAL/data/backup theo I/O pattern (+~20% throughput WAL); mở rộng online; multipath chịu lỗi path; convention banking audit dễ.
- **Negative:** Phụ thuộc ICTP cấp **WWID** + **stripe size** (`su/sw`) cho align XFS; XFS không shrink (sizing dư từ đầu).
- **Risks:** IOPS LUN thực tế kém kỳ vọng — mitigation: test IOPS trước go-live (xem [`../../04-testing/`](../../04-testing/)).

## Liên kết

- Storage design: [`../../01-system-design/07-storage-design.md`](../../01-system-design/07-storage-design.md)
- Cài OS/storage DATA node: [`../../02-installation/prod/01-data-node-os.md`](../../02-installation/prod/01-data-node-os.md)
- Liên quan: [ADR-009](./adr-009-dc-dr-replication-layering.md) (EMC cross-site replication — ICTP)
