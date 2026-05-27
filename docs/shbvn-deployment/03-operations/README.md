# 03 — Hướng dẫn Vận hành (HDVH)

Tài liệu vận hành cho oncall, DBA, ops team sau khi go-live.

## Danh sách tài liệu

### Runbooks (quy trình thao tác — SOP)

| File                                                                           | Mục đích                                  | Tần suất          | Status   |
| ------------------------------------------------------------------------------ | ----------------------------------------- | ----------------- | -------- |
| [`runbooks/backup-restore.md`](./runbooks/backup-restore.md)                   | Backup hàng ngày + restore khi cần        | Daily auto        | 🟡 Draft |
| [`runbooks/dr-failover.md`](./runbooks/dr-failover.md)                         | Promote DR replica → master khi prod chết | On-demand         | 🟡 Draft |
| [`runbooks/postgres-minor-upgrade.md`](./runbooks/postgres-minor-upgrade.md)   | Upgrade PG 15.x → 15.y (security patch)   | Quarterly         | 🟡 Draft |
| [`runbooks/postgres-major-upgrade.md`](./runbooks/postgres-major-upgrade.md)   | Upgrade PG 15 → 16 (pg_upgrade)           | Multi-year        | 🟡 Draft |
| [`runbooks/app-deploy-new-version.md`](./runbooks/app-deploy-new-version.md)   | Deploy version mới của Plane app          | Per release       | 🟡 Draft |
| [`runbooks/load-test-procedure.md`](./runbooks/load-test-procedure.md)         | Quy trình chạy load test trước release    | Per major release | 🟡 Draft |
| [`runbooks/data-cleanup-after-test.md`](./runbooks/data-cleanup-after-test.md) | Reset/dọn dữ liệu test trên UAT           | After load test   | 🟡 Draft |
| [`runbooks/ldap-sso-troubleshoot.md`](./runbooks/ldap-sso-troubleshoot.md)     | Troubleshoot auth LDAP/SwingSSO           | On-demand         | 🟡 Draft |
| [`runbooks/disk-full-recovery.md`](./runbooks/disk-full-recovery.md)           | Disk đầy (/u02 WAL, /u03 backup, /u01)    | On-demand (P1/P2) | 🟡 Draft |
| [`runbooks/postgres-vacuum-bloat.md`](./runbooks/postgres-vacuum-bloat.md)     | Manual VACUUM / xử lý bloat               | On-demand         | 🟡 Draft |

### Tài liệu vận hành chung

| File                                                 | Nội dung                                                  | Status   |
| ---------------------------------------------------- | --------------------------------------------------------- | -------- |
| [`monitoring-alerting.md`](./monitoring-alerting.md) | Cấu hình Prometheus/Grafana (bank đã có sẵn), alert rules | 🟡 Draft |
| [`incident-response.md`](./incident-response.md)     | Quy trình xử lý sự cố (P1/P2/P3), escalation              | 🟡 Draft |
| [`routine-maintenance.md`](./routine-maintenance.md) | Daily/Weekly/Monthly/Quarterly checklists                 | 🟡 Draft |

## Cấu trúc runbook chuẩn

Mỗi runbook phải có 6 phần:

1. **Khi nào dùng** — trigger condition rõ ràng
2. **Pre-check** — verify trạng thái trước khi action
3. **Action steps** — lệnh chính xác, có expected output
4. **Verification** — verify thành công
5. **Rollback** — nếu sai
6. **Escalation** — khi nào báo ai

## Severity matrix

| Severity | Định nghĩa                                | RTO      | Escalation               |
| -------- | ----------------------------------------- | -------- | ------------------------ |
| **P1**   | Toàn bộ hệ thống down, mất dữ liệu        | < 1 giờ  | Báo ngay TL + DBA + Mgmt |
| **P2**   | Tính năng chính lỗi, performance degraded | < 4 giờ  | Báo TL + DBA             |
| **P3**   | Tính năng phụ lỗi, có workaround          | < 24 giờ | Ticket bình thường       |
| **P4**   | Cosmetic / minor                          | < 1 tuần | Backlog                  |

## Maintenance windows

| Loại                | Tần suất           | Thời điểm        | Tài liệu                    |
| ------------------- | ------------------ | ---------------- | --------------------------- |
| Daily backup        | 02:00 hàng ngày    | Auto cron        | `backup-restore.md`         |
| Weekly full backup  | Chủ nhật 02:00     | Auto cron        | `backup-restore.md`         |
| Monthly maintenance | Chủ nhật đầu tháng | Manual           | `routine-maintenance.md`    |
| DR drill            | Quý                | Lên lịch trước   | `dr-failover.md`            |
| Postgres patching   | Quý                | Sau khi UAT pass | `postgres-minor-upgrade.md` |

## Liên kết

- Test plan validation: [`../04-testing/`](../04-testing/)
- Incident log: [`../05-change-log/incident-log.md`](../05-change-log/incident-log.md)
- Deployment history: [`../05-change-log/deployment-history.md`](../05-change-log/deployment-history.md)
