# Phase 03 — Cài đặt PRODUCTION (HDCĐ PROD)

## Context

- **Output location:** `docs/shbvn-deployment/02-installation/prod/`
- **Build station bundle docs:** `docs/shbvn-deployment/02-installation/{00-prerequisites.md, 01-build-station-bundle.md}`
- **Depends on:** Phase 01 (TKHT) ≥ 🟠 Review
- **Plan:** [`./plan.md`](./plan.md)

## Overview

- **Priority:** P0 — quan trọng nhất cho team SRE thực thi
- **Status:** 🟠 Review (7/7 drafts xong — chờ duyệt SRE/DBA)
- **Mô tả:** Quy trình step-by-step cài PROD trong môi trường air-gap

## Key insights

- Tất cả lệnh phải offline-compatible (không `dnf install`, không `docker pull`, không `pip install`, không `git clone`)
- Build station tạo bundle trước → copy USB/SFTP vào bank
- Mỗi step phải có verification (md5/GPG/test command)
- Mỗi step có rollback procedure

## Todo list

### Chung (cấp `02-installation/`)

- [x] `00-prerequisites.md` — Hardware checklist, network ready, account, cert, bundle
- [x] `01-build-station-bundle.md` — Quy trình tạo offline bundle (build-shb-images.sh + prepare-deploy-package.sh)

### PROD (`prod/`)

- [x] `01-data-node-os.md` — Cài RHEL 9.x, multipath SAN, XFS, LVM, kernel tuning
- [x] `02-data-node-postgres.md` — Cài PG 15.7 native từ offline RPM, init, postgresql.conf, pg_hba.conf, PgBouncer
- [x] `03-data-node-backup.md` — pgBackRest config, cron, test restore
- [x] `04-app-node-docker.md` — Cài Docker CE offline, load images, deploy qua deploy-shb.sh
- [x] `05-validation-checklist.md` — Smoke test 5 layer, sign-off

> **Đã viết 2026-05-27.** Cần SRE/DBA duyệt + chốt các câu hỏi mở (RHEL minor, IP, WWID, NAS, cách tắt plane-db trên APP node).

## Success criteria

- Một người mới đọc theo từng bước → cài thành công được PROD
- Mỗi file có verification command (không chỉ là "should work")
- Test cài lại trên VM staging trước khi đưa cho team bank

## Risk

| Risk                          | Mitigation                                         |
| ----------------------------- | -------------------------------------------------- |
| Bundle thiếu dependency       | Test cài trên VM staging clone từ RHEL 9.4 minimal |
| Cert internal CA issue        | Có section riêng + escalation contact              |
| SAN multipath không tự detect | Manual config, kèm troubleshooting                 |

## Next steps

Sau phase này → Phase 06 (HDVH runbooks) — vận hành sau khi cài.
