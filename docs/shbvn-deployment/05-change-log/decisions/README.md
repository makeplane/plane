# ADR — Architecture Decision Records

Quyết định kiến trúc đã chốt cho dự án. **Mỗi quyết định không bao giờ xóa.** Nếu đảo ngược → tạo ADR mới với status `Supersedes ADR-XXX`.

## Index

| ID                                                 | Tiêu đề                                                | Status      | Date       |
| -------------------------------------------------- | ------------------------------------------------------ | ----------- | ---------- |
| [ADR-001](./adr-001-postgres-native-vs-docker.md)  | PostgreSQL native (PROD/DR) vs Docker (UAT)            | 🟡 Proposed | 2026-05-27 |
| [ADR-002](./adr-002-rhel-version.md)               | RHEL version (9.6)                                     | 🟡 Proposed | 2026-05-27 |
| [ADR-003](./adr-003-postgres-version.md)           | PostgreSQL version (15.7)                              | 🟡 Proposed | 2026-05-27 |
| [ADR-004](./adr-004-backup-tool-pgbackrest.md)     | Backup tool — pgBackRest                               | 🟡 Proposed | 2026-05-27 |
| [ADR-005](./adr-005-air-gap-bundle-strategy.md)    | Air-gap bundle strategy (build station)                | 🟡 Proposed | 2026-05-27 |
| [ADR-006](./adr-006-dr-replication-mode.md)        | DR replication mode (streaming async)                  | 🟡 Proposed | 2026-05-27 |
| [ADR-007](./adr-007-app-stack-docker-compose.md)   | App stack — Docker Compose                             | 🟡 Proposed | 2026-05-27 |
| [ADR-008](./adr-008-storage-emc-san.md)            | Storage — EMC SAN multipath + LVM + XFS                | 🟡 Proposed | 2026-05-27 |
| [ADR-009](./adr-009-dc-dr-replication-layering.md) | DC-DR replication 2 layer (EMC storage + PG streaming) | 🟡 Proposed | 2026-05-26 |
| [ADR-010](./adr-010-os-user-privilege-model.md)    | OS user/privilege model (3-user, no-root-login)        | 🟡 Proposed | 2026-05-29 |

> **Lưu ý:** 10 ADR đã có file, status 🟡 Proposed (chờ duyệt stakeholder để chuyển 🟢 Accepted). Quyết định đã phản ánh trong tài liệu thiết kế (`01-system-design/`). ADR-011 (secret mgmt), ADR-012 (audit retention), ADR-013 (container hardening) — planned, chưa viết file.

## Status legend

- ⬜ **Planned** — đã đăng ký, **chưa viết file**
- 🟡 **Proposed** — đã viết, chờ duyệt
- 🟢 **Accepted** — đã duyệt, áp dụng
- 🔴 **Deprecated** — không còn áp dụng
- ⚪ **Superseded** — bị thay thế bởi ADR khác

## File naming

`adr-NNN-kebab-case-title.md` — số tăng dần, không reset.

## Khi nào tạo ADR mới

- Chọn 1 trong nhiều option kỹ thuật (DB engine, OS, tool)
- Quyết định ảnh hưởng nhiều tầng (network, security, performance)
- Trade-off có hệ quả lâu dài
- Đảo ngược / sửa quyết định trước đó (tạo ADR mới `Supersedes ADR-XXX`)

## Khi nào KHÔNG cần ADR

- Lựa chọn cosmetic (tên biến, format file)
- Lựa chọn đã rõ ràng theo standard (PEP 8, kebab-case)
- Implementation detail trong 1 module nhỏ
