# ADR-007: App stack — Docker Compose

**Date:** 2026-05-27
**Status:** 🟡 Proposed
**Deciders:** Architect, SRE Lead

## Context

App tier SHWS gồm nhiều service: `web`, `space`, `admin`, `live`, `api`, `worker`, `beat-worker`, `proxy` + `redis`/`rabbitmq`. Cần cách triển khai:

- Đồng nhất giữa các môi trường, deploy version mới dễ + rollback nhanh.
- Khớp cách đóng gói của Plane upstream (Docker-based, plane-selfhost).
- Vận hành được bởi team SRE quy mô nhỏ, không cần cluster orchestrator nặng GĐ1.

## Decision

**Docker Compose** trên APP node: base `docker-compose.yml` (plane-selfhost) + override `docker-compose.shb.yml` (chỉ đổi image tag → image SHWS `shb_vX`), deploy qua `deploy-shb.sh`. Stateful (PostgreSQL native, MinIO) đặt ở DATA node, **không** chạy `plane-db` trên APP node.

## Alternatives considered

- **Option A — Kubernetes (K8s/OpenShift):** Loại GĐ1. Over-engineering cho 1 APP node; ops/training nặng; air-gap registry phức tạp. Cân nhắc GĐ2 nếu cần scale ngang.
- **Option B — Native systemd từng service:** Loại. Plane đóng gói Docker; build/chạy native từng app phức tạp, lệch upstream, khó cập nhật.
- **Option C — Docker Compose (base + override):** **CHỌN.** Đồng nhất, rollback bằng đổi tag image, khớp upstream, vận hành đơn giản.

## Consequences

- **Positive:** Deploy/rollback nhanh (đổi tag); khớp plane-selfhost; log/healthcheck/restart policy chuẩn; build image tách (build station).
- **Negative:** Single APP node compose → không auto-scale/HA app GĐ1 (chấp nhận, app stateless restart nhanh).
- **Risks:** Base compose bundle sẵn `plane-db`/`plane-minio` → phải disable cho mô hình 2-node (external native PG) — mitigation: override `profiles: disabled` + env trỏ DATA node (xem [`prod/04-app-node-docker.md`](../../02-installation/prod/04-app-node-docker.md)).

## Liên kết

- Kiến trúc PROD §3.1: [`../../01-system-design/01-architecture-prod.md`](../../01-system-design/01-architecture-prod.md)
- Cài app node: [`../../02-installation/prod/04-app-node-docker.md`](../../02-installation/prod/04-app-node-docker.md)
- Runbook deploy version: [`../../03-operations/runbooks/app-deploy-new-version.md`](../../03-operations/runbooks/app-deploy-new-version.md)
- Liên quan: [ADR-001](./adr-001-postgres-native-vs-docker.md), [ADR-005](./adr-005-air-gap-bundle-strategy.md)
