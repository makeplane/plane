# Phase 04 — Cài đặt TEST/UAT (HDCĐ TEST/UAT)

## Context

- **Output location:** `docs/shbvn-deployment/02-installation/test-uat/`
- **Depends on:** Phase 01 (TKHT 02-architecture-test-uat.md) ≥ 🟠 Review
- **Plan:** [`./plan.md`](./plan.md)

## Overview

- **Priority:** P1 — môi trường test trước UAT user
- **Status:** ⬜ Not started (0/3)
- **Mô tả:** Cài đặt 1 VM all-in-one Docker compose mặc định

## Key insights

- Dùng `docker-compose.yml` mặc định (KHÔNG phải `docker-compose.shb.yml` của PROD)
- VM nhỏ hơn PROD: 2-4 vCPU / 8 GB / 100 GB
- Reset thoải mái bằng `docker compose down -v`
- KHÔNG cần SAN, không cần multipath, không cần WAL archiving

## Todo list

- [ ] `01-vm-prepare.md` — Chuẩn bị VM RHEL 9.4 (hoặc Ubuntu 22.04 nếu bank cho phép — TBD)
- [ ] `02-docker-allinone.md` — Cài Docker offline + load images + deploy compose
- [ ] `03-validation.md` — Smoke test UAT, sanity check

## Success criteria

- UAT VM cài trong < 2 giờ
- Smoke test pass
- Reset workflow đơn giản, documented

## Risk

| Risk                           | Mitigation                                                           |
| ------------------------------ | -------------------------------------------------------------------- |
| Bundle Docker images khác PROD | UAT dùng `docker-compose.yml` mặc định, image `postgres:15.7-alpine` |
| Reset hỏng config              | Document backup config files riêng trước khi reset                   |

## Next steps

Sau phase này → Phase 07 (KHKT) — test plan chạy trên UAT.
