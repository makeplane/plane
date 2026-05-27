# ADR-003: PostgreSQL version (15.7)

**Date:** 2026-05-27
**Status:** 🟡 Proposed
**Deciders:** Architect, DBA Lead

## Context

Cần chốt major version PostgreSQL cho SHWS. Ràng buộc:

- **Plane upstream** test đầy đủ trên PostgreSQL 14/15.
- Cần extension `pgaudit` (audit compliance) + `pg_stat_statements` + `pgcrypto`.
- Streaming replication built-in cho DR (không Patroni GĐ1).
- Vòng đời đủ dài để tránh major upgrade sớm.

## Decision

**PostgreSQL 15.7** (PGDG RHEL9 RPM), native cho PROD/DR, `postgres:15.7-alpine` cho UAT.

## Alternatives considered

- **Option A — PostgreSQL 14:** Loại. Cũ hơn, vòng đời ngắn hơn 15, không có cải tiến của 15 (vd hiệu năng sort, `MERGE`).
- **Option B — PostgreSQL 16/17:** Loại GĐ1. Plane upstream chưa test/chứng nhận đầy đủ trên 16+; rủi ro tương thích ORM/migration; pgaudit/extension maturity trên 15 ổn định hơn.
- **Option C — PostgreSQL 15.7:** **CHỌN.** Plane test tốt; support cộng đồng đến **2027-11**; pgaudit 1.7 hỗ trợ tốt PG 15; streaming replication built-in.

## Consequences

- **Positive:** Ổn định, tương thích Plane đã kiểm chứng; extension đầy đủ; tài liệu/hỗ trợ phong phú.
- **Negative:** Phải lên kế hoạch major upgrade 15→16 trong ~2 năm trước EOL (dự án riêng, `pg_upgrade`).
- **Risks:** Plane upstream đổi support matrix (drop 15) — mitigation: theo dõi upstream, runbook [`postgres-major-upgrade.md`](../../03-operations/runbooks/postgres-major-upgrade.md).

## Liên kết

- Database design §2: [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md)
- Runbook minor upgrade: [`../../03-operations/runbooks/postgres-minor-upgrade.md`](../../03-operations/runbooks/postgres-minor-upgrade.md)
- Liên quan: [ADR-001](./adr-001-postgres-native-vs-docker.md)
