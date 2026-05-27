# Phase 02 — Architecture Decision Records (ADR)

## Context

- **Output location:** `docs/shbvn-deployment/05-change-log/decisions/`
- **Template:** `docs/shbvn-deployment/05-change-log/README.md` (Michael Nygard format)
- **Plan:** [`./plan.md`](./plan.md)

## Overview

- **Priority:** P0 — justify quyết định trong TKHT
- **Status:** 🟡 In progress (0/8 viết — index liệt kê nhưng file chưa có; adr-009 đã viết ngoài kế hoạch)
- **Mô tả:** Viết 8 ADR đã đăng ký, mỗi ADR ghi lại context + decision + alternatives + consequences

> **Tồn đọng validate (2026-05-27):**
>
> - `decisions/README.md` index liệt kê ADR-001..008 status "Proposed" (date 2026-05-14) nhưng **chưa có file**. Cần viết file hoặc sửa index để không gây hiểu lầm "đã có".
> - `adr-009-dc-dr-replication-layering.md` **đã viết** (2026-05-26, ngoài 8 ADR gốc) — chốt EMC 2-layer replication, boundary SHWS/ICTP. Liên quan ADR-006 + ADR-008.

## Key insights

- ADR là **forever record** — không xóa, không sửa nội dung đã chốt
- Mỗi ADR < 200 dòng, focus 1 quyết định
- Có thể viết song song với Phase 01 (TKHT)

## Todo list

- [ ] `adr-001-postgres-native-vs-docker.md` — Native PG cho PROD, Docker cho UAT
- [ ] `adr-002-rhel-version.md` — RHEL 9.4 LTS
- [ ] `adr-003-postgres-version.md` — PostgreSQL 15.7
- [ ] `adr-004-backup-tool-pgbackrest.md` — pgBackRest chứ không pg_dump
- [ ] `adr-005-air-gap-bundle-strategy.md` — Build station + offline bundle
- [ ] `adr-006-dr-replication-mode.md` — Streaming async (giai đoạn 1)
- [ ] `adr-007-app-stack-docker-compose.md` — Docker compose cho app tier
- [ ] `adr-008-storage-emc-san.md` — SAN multipath + XFS + LVM

## Success criteria

- 8 ADR đã accept (🟢) trước khi finalize TKHT
- Mỗi ADR có ≥ 3 alternatives considered
- Mỗi ADR có consequences (positive + negative + risks)
- Index trong `decisions/README.md` cập nhật status

## Risk

| Risk                            | Mitigation                                                       |
| ------------------------------- | ---------------------------------------------------------------- |
| Quyết định bị đảo ngược sau này | OK — tạo ADR mới Supersedes, không sửa cũ                        |
| Stakeholder không đồng ý        | Đưa vào review meeting, ADR ở status Proposed cho tới khi accept |

## Next steps

Sau khi ADR accept → TKHT có thể move sang status 🟠 Review.
