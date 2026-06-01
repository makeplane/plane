# Phase 02 — Architecture Decision Records (ADR)

## Context

- **Output location:** `docs/shbvn-deployment/05-change-log/decisions/`
- **Template:** `docs/shbvn-deployment/05-change-log/README.md` (Michael Nygard format)
- **Plan:** [`./plan.md`](./plan.md)

## Overview

- **Priority:** P0 — justify quyết định trong TKHT
- **Status:** 🟠 Review (8/8 viết xong 2026-05-27 — chờ duyệt stakeholder → 🟢 Accepted)
- **Mô tả:** Viết 8 ADR đã đăng ký, mỗi ADR ghi lại context + decision + alternatives + consequences

> **Đã hoàn thành (2026-05-27):** 8 ADR viết theo template Michael Nygard (Context/Decision/Alternatives/Consequences), mỗi file 31–40 dòng (<200), ≥3 alternatives + consequences (positive/negative/risks). Index `decisions/README.md` cập nhật 🟡 Proposed + link. Resolve 8 broken forward-link từ design docs. adr-009 (EMC 2-layer) đã có từ trước.

## Key insights

- ADR là **forever record** — không xóa, không sửa nội dung đã chốt
- Mỗi ADR < 200 dòng, focus 1 quyết định
- Có thể viết song song với Phase 01 (TKHT)

## Todo list

- [x] `adr-001-postgres-native-vs-docker.md` — Native PG cho PROD/DR, Docker cho UAT
- [x] `adr-002-rhel-version.md` — RHEL 9.6
- [x] `adr-003-postgres-version.md` — PostgreSQL 15.7
- [x] `adr-004-backup-tool-pgbackrest.md` — pgBackRest chứ không pg_dump
- [x] `adr-005-air-gap-bundle-strategy.md` — Build station + offline bundle
- [x] `adr-006-dr-replication-mode.md` — Streaming async (giai đoạn 1)
- [x] `adr-007-app-stack-docker-compose.md` — Docker compose cho app tier
- [x] `adr-008-storage-emc-san.md` — SAN multipath + XFS + LVM

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
