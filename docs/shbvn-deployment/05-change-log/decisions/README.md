# ADR — Architecture Decision Records

Quyết định kiến trúc đã chốt cho dự án. **Mỗi quyết định không bao giờ xóa.** Nếu đảo ngược → tạo ADR mới với status `Supersedes ADR-XXX`.

## Index

| ID                                                 | Tiêu đề                                                | Status      | Date       |
| -------------------------------------------------- | ------------------------------------------------------ | ----------- | ---------- |
| ADR-001                                            | PostgreSQL native vs Docker cho production             | ⬜ Planned  | —          |
| ADR-002                                            | RHEL major version (9.x)                               | ⬜ Planned  | —          |
| ADR-003                                            | PostgreSQL version (15.7)                              | ⬜ Planned  | —          |
| ADR-004                                            | Backup tool — pgBackRest                               | ⬜ Planned  | —          |
| ADR-005                                            | Air-gap bundle strategy (build station)                | ⬜ Planned  | —          |
| ADR-006                                            | DR replication mode (streaming async)                  | ⬜ Planned  | —          |
| ADR-007                                            | App stack — Docker compose                             | ⬜ Planned  | —          |
| ADR-008                                            | Storage — EMC SAN multipath + XFS + LVM                | ⬜ Planned  | —          |
| [ADR-009](./adr-009-dc-dr-replication-layering.md) | DC-DR replication 2 layer (EMC storage + PG streaming) | 🟡 Proposed | 2026-05-26 |

> **Lưu ý:** ADR-001..008 đã **đăng ký** trong kế hoạch nhưng **chưa có file** (status ⬜ Planned). Các quyết định tương ứng đã phản ánh trong tài liệu thiết kế (`01-system-design/`); ADR chính thức sẽ viết sau để ghi lại context + alternatives + consequences. Chỉ ADR-009 đã có file.

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
