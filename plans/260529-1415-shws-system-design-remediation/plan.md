---
title: SHWS System Design — Remediation (user model + cross-doc fixes)
description: >-
  Sửa mô hình user/quyền (shbvn/postgre/mon, no-root-login) + các mâu thuẫn
  cross-document trong docs/shbvn-deployment/01-system-design
status: completed
priority: P2
branch: duonglx/docs/shbvn-deployment-docs
tags:
  - docs
  - system-design
  - security
  - deployment
blockedBy: []
blocks: []
created: "2026-05-29T07:15:56.452Z"
createdBy: "ck:plan"
source: skill
---

# SHWS System Design — Remediation (user model + cross-doc fixes)

## Overview

Tài liệu thiết kế hệ thống SHWS (`docs/shbvn-deployment/01-system-design/`, 11 file) hoàn chỉnh về nội dung nhưng có (a) **mô hình user/quyền lệch** với yêu cầu vận hành thực tế và (b) một số **mâu thuẫn cross-document** + **thiếu sót so với compose thực tế**. Plan này sửa docs (KHÔNG đụng code/app) cho nhất quán và đúng mô hình quyền ngân hàng.

**Quyết định đã chốt với owner (2026-05-29):**

1. **No-root-login thực dụng** — tắt root login; routine ops chạy bằng `shbvn`/`postgre`/`mon` qua sudo giới hạn. Daemon OS (`dockerd`, `multipathd`, `systemd`, `auditd`, `rsyslog`, `postgresql` start-by-systemd) vẫn root vì là dịch vụ OS quản lý.
2. **Phân vai 3 user:** `shbvn` = app+Docker cả 2 node (kể cả minio/exporters trên data node) · `postgre` = PG service account **và** DBA ops qua sudo (`systemctl postgresql-*`, `pgbackrest`) · `mon` = read-only log/status mọi node.
3. **mon đọc log:** Docker `log-driver=journald`; `mon` ∈ nhóm `systemd-journal`,`adm`; dùng `journalctl` + `systemctl status` (không vào `docker` group, không sudo).

> Lưu ý canonical: OS user PG giữ tên chuẩn **`postgres`** (PGDG RPM hardcode). "postgre" trong yêu cầu = `postgres`. Tài liệu dùng nhất quán `postgres`.

## Phases

| Phase | Name                                                                       | Status    |
| ----- | -------------------------------------------------------------------------- | --------- |
| 1     | [User-Privilege-Model](./phase-01-user-privilege-model.md)                 | Completed |
| 2     | [Sizing-and-Service-Inventory](./phase-02-sizing-and-service-inventory.md) | Completed |
| 3     | [Network-and-Firewall](./phase-03-network-and-firewall.md)                 | Completed |
| 4     | [Database-Replication-Backup](./phase-04-database-replication-backup.md)   | Completed |
| 5     | [Consistency-Sweep-and-ADR](./phase-05-consistency-sweep-and-adr.md)       | Completed |

## Key Findings (nguồn của plan)

- **A. User model (P1):** `05-security §7` dùng `app/sre/dba`; secret/cron owner `root`; thiếu hẳn `mon`. → Phase 1.
- **B1 sizing tổng sai:** `01 §9`,`02 §8` ghi 12vCPU/28GB; thực 16/32. → Phase 2.
- **B3 thiếu service:** `live` + `migrator` (compose thực) không có trong bảng tài nguyên; `beat`→`beat-worker`. → Phase 2.
- **B2 firewall replication ngược hướng:** `04 §4.4/§5.2` mô tả push PROD→DR (sai); streaming là pull DR→PROD. → Phase 3.
- **B5 cổng exporter thiếu** (8080/9113/9121/15692); **B8 MinIO HTTP vs TLS**; **B9 scraper identity / monitoring stack**. → Phase 3.
- **B4 DR WAL repo seeding chưa giải quyết** (+ slot auto-drop ⇒ DR không catch-up). → Phase 4.
- **B6 pg_hba ≠ grant cho monitoring; role `backup` thiếu pg_hba + lệch tên**; **B7 cipher/secret path 3 chỗ khác nhau**; **B10 hot_standby**; **B11 EMC đè .env DR**; **B12 lag thresholds**. → Phase 4.
- **C consistency + ADR:** encryption-at-rest TBD lặp lại; `adr-010/011/012` chưa tạo + ADR user-model; dedupe open questions; IP placeholder; container naming. → Phase 5.

## Scope

- **Trong scope:** chỉ sửa 11 file `01-system-design/` + tạo file canonical user-model + (tùy) ADR mới. Cập nhật cross-ref tới `02-installation`/`03-operations` chỉ ở mức pointer, KHÔNG viết lại các thư mục đó.
- **Ngoài scope:** sửa code/app, viết lại HDCĐ/HDVH, PoC rootless.

## Dependencies

- Không có cross-plan dependency. Tự chứa.
- Thứ tự khuyến nghị: Phase 1 trước (mô hình user là nền, các phase sau tham chiếu). Phase 2–4 độc lập tương đối, có thể song song. Phase 5 chạy cuối (consistency sweep cần các phase trước xong).
