# ADR-001: PostgreSQL native (PROD/DR) vs Docker (UAT)

**Date:** 2026-05-27
**Status:** 🟡 Proposed
**Deciders:** Architect, DBA Lead, SRE Lead

## Context

SHWS cần chọn cách triển khai PostgreSQL cho 3 môi trường (PROD/DR/UAT). Ràng buộc:

- **PROD ngân hàng:** ưu tiên hiệu năng, tier separation (stateless ↔ stateful), và tuân thủ compliance.
- **DBA bank:** chuyên PostgreSQL **native**, không quen Docker ops (`docker exec`, volume, log driver).
- **Kernel tuning:** PROD cần `vm.nr_hugepages`, `shmmax`, multipath SAN — khó/không tinh chỉnh đầy đủ trong container.
- **UAT:** cần reset nhanh, tải nhẹ, không cần SAN/HA.

## Decision

**Hybrid:**

- **PROD + DR:** PostgreSQL **15.7 native** (systemd `postgresql-15.service`) trên RHEL, data trên EMC SAN LUN.
- **TEST/UAT:** PostgreSQL trong **Docker** (`postgres:15.7-alpine`), all-in-one compose, reset bằng `docker compose down -v`.

## Alternatives considered

- **Option A — PG trong Docker cho mọi môi trường:** Loại. DBA khó thao tác native tooling; kernel/hugepages tuning hạn chế trong container; blast radius app+DB chung; backup phức tạp hơn.
- **Option B — Native cho mọi môi trường (kể cả UAT):** Loại. UAT cần reset/teardown nhanh và môi trường nhẹ; cài native trên UAT tốn công không tương xứng.
- **Option C — Hybrid (native PROD/DR + Docker UAT):** **CHỌN.** Cân bằng hiệu năng/tooling cho PROD và tiện lợi cho UAT.

## Consequences

- **Positive:** Hiệu năng + tuning đầy đủ cho PROD; DBA dùng tooling native quen thuộc; tier separation rõ; backup pgBackRest native low-latency; UAT linh hoạt, reset nhanh.
- **Negative:** Phải maintain **2 cách triển khai** (native + Docker); tài liệu cài đặt tách riêng.
- **Risks:** Schema/version parity PROD (native) vs UAT (Docker) — mitigation: cùng PG 15.7, migration test trên UAT trước, theo dõi `django_migrations`.

## Liên kết

- Kiến trúc PROD: [`../../01-system-design/01-architecture-prod.md`](../../01-system-design/01-architecture-prod.md) §9
- Kiến trúc UAT: [`../../01-system-design/02-architecture-test-uat.md`](../../01-system-design/02-architecture-test-uat.md)
- Liên quan: [ADR-003](./adr-003-postgres-version.md) (PG version), [ADR-007](./adr-007-app-stack-docker-compose.md) (app stack)
