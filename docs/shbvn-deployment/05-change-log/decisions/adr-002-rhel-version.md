# ADR-002: RHEL version (9.6)

**Date:** 2026-05-27
**Status:** 🟡 Proposed
**Deciders:** Architect, Infra/ICTP, SRE Lead

## Context

OS chuẩn của SHBVN là Red Hat Enterprise Linux. Cần **chốt minor version** cụ thể vì:

- Air-gap: bundle RPM (PostgreSQL, Docker, pgBackRest, deps) phải khớp **đúng minor** đã cài trên server (xem [ADR-005](./adr-005-air-gap-bundle-strategy.md)).
- Build station phải cùng minor để `dnf download --resolve --alldeps` ra đúng gói.
- Tài liệu thiết kế ban đầu còn vênh 9.4 vs 9.6 → cần một nguồn chuẩn.

## Decision

Chuẩn hóa **RHEL 9.6** cho mọi node SHWS (PROD APP/DATA, DR, UAT, build station). Patch level chính xác (9.6.z) xác nhận với Infra trước khi build bundle.

## Alternatives considered

- **Option A — RHEL 9.4:** Loại. Cũ hơn trong dòng 9.x; chọn bản mới hơn đã được bank chứng nhận để hưởng bản vá bảo mật/kernel mới.
- **Option B — RHEL 8.x:** Loại. Vòng đời ngắn hơn; package nền (kernel, multipath, container runtime) cũ hơn so với 9.x.
- **Option C — RHEL 10 (mới ra):** Loại GĐ1. Chưa chín trong môi trường bank; PGDG/Docker matrix cho 10 chưa đầy đủ bằng 9.
- **Option D — RHEL 9.6:** **CHỌN.** Trong vòng đời RHEL 9 (đến 2032), package nền hiện đại, tương thích PGDG 15 + Docker CE.

## Consequences

- **Positive:** Support dài hạn; package nền mới; nhất quán 1 minor giữa build station và server → bundle reproducible.
- **Negative:** Bundle RPM phải khớp đúng 9.6.z; nâng minor OS sau này cần rebuild bundle + test.
- **Risks:** Bank chứng nhận một minor khác (vd 9.4) trên hạ tầng thực — mitigation: xác nhận với Infra ở [`../../02-installation/00-prerequisites.md`](../../02-installation/00-prerequisites.md) trước khi build.

## Liên kết

- Overview §7: [`../../01-system-design/00-overview.md`](../../01-system-design/00-overview.md)
- Prerequisites cài đặt: [`../../02-installation/00-prerequisites.md`](../../02-installation/00-prerequisites.md)
- Liên quan: [ADR-005](./adr-005-air-gap-bundle-strategy.md) (bundle khớp minor)
