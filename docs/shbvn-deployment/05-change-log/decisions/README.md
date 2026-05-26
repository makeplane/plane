# ADR — Architecture Decision Records

Quyết định kiến trúc đã chốt cho dự án. **Mỗi quyết định không bao giờ xóa.** Nếu đảo ngược → tạo ADR mới với status `Supersedes ADR-XXX`.

## Index

| ID                                                 | Tiêu đề                                                | Status      | Date       |
| -------------------------------------------------- | ------------------------------------------------------ | ----------- | ---------- |
| ADR-001                                            | PostgreSQL native vs Docker cho production             | 🟡 Proposed | 2026-05-14 |
| ADR-002                                            | RHEL version (9.4)                                     | 🟡 Proposed | 2026-05-14 |
| ADR-003                                            | PostgreSQL version (15.7)                              | 🟡 Proposed | 2026-05-14 |
| ADR-004                                            | Backup tool — pgBackRest                               | 🟡 Proposed | 2026-05-14 |
| ADR-005                                            | Air-gap bundle strategy (build station)                | 🟡 Proposed | 2026-05-14 |
| ADR-006                                            | DR replication mode (streaming async)                  | 🟡 Proposed | 2026-05-14 |
| ADR-007                                            | App stack — Docker compose                             | 🟡 Proposed | 2026-05-13 |
| ADR-008                                            | Storage — EMC SAN multipath + XFS + LVM                | 🟡 Proposed | 2026-05-14 |
| [ADR-009](./adr-009-dc-dr-replication-layering.md) | DC-DR replication 2 layer (EMC storage + PG streaming) | 🟡 Proposed | 2026-05-26 |

## Status legend

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
