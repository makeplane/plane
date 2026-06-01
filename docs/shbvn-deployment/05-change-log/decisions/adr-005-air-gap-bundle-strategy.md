# ADR-005: Air-gap bundle strategy (build station)

**Date:** 2026-05-27
**Status:** 🟡 Proposed
**Deciders:** SRE Lead, Architect, Security

## Context

Mạng nội bộ bank **không có internet** (air-gap). Trên server bank KHÔNG chạy được `dnf install` (online), `docker pull`, `pip install`, `git clone`. Mọi software (RPM, Docker image, source/dist SHWS) phải được chuẩn bị ngoài bank rồi đưa vào.

## Decision

Dùng **build station** (`shws-build`, mgmt VLAN, có internet) tạo **offline bundle** gồm: RPM (PG/Docker/pgBackRest + deps), Docker base image (`.tar`), `dist/` image SHWS + `docker-compose.shb.yml` + `deploy-shb.sh`, os-tuning configs, `CHECKSUMS.txt`. Transfer vào bank qua **USB/SFTP** (đã security-scan), verify sha256 trên server target trước khi cài.

## Alternatives considered

- **Option A — Internal mirror repo trong bank (Red Hat Satellite / Nexus / private registry):** Loại GĐ1. Setup hạ tầng nặng, cần phê duyệt + vận hành riêng; cân nhắc GĐ2 nếu tần suất update cao.
- **Option B — Tải thủ công từng RPM/image khi cần:** Loại. Dễ thiếu dependency; không reproducible; khó audit.
- **Option C — Build station tạo bundle offline:** **CHỌN.** Kiểm soát + reproducible (`dnf download --resolve --alldeps`, `docker save`, `build-shb-images.sh`); verify checksum; phù hợp tần suất update thấp GĐ1.

## Consequences

- **Positive:** Tái lập được; kiểm soát đúng version; audit qua checksum; tách biệt rõ "ngoài bank build, trong bank cài".
- **Negative:** Quy trình thủ công nhiều bước; build station phải **cùng RHEL minor** ([ADR-002](./adr-002-rhel-version.md)) để RPM khớp.
- **Risks:** Bundle thiếu dependency → fail khi cài trong bank — mitigation: **cài thử trên VM staging** clone RHEL 9.6 minimal trước khi đưa vào bank.

## Liên kết

- Quy trình tạo bundle: [`../../02-installation/01-build-station-bundle.md`](../../02-installation/01-build-station-bundle.md)
- Prerequisites (verify bundle): [`../../02-installation/00-prerequisites.md`](../../02-installation/00-prerequisites.md)
- Liên quan: [ADR-002](./adr-002-rhel-version.md), [ADR-007](./adr-007-app-stack-docker-compose.md)
