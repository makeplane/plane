# Routine Maintenance — Checklist Vận hành SHWS

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-26
**Owner:** duonglx
**Audience:** Ops team, DBA, SRE oncall

> Checklist vận hành định kỳ cho **Shinhan Workspace (SHWS)**. Mỗi mục: **[ ] tick khi xong**, ghi `OK / giá trị đo / bất thường` vào cột ghi chú, lưu lại làm bằng chứng vận hành (compliance). Bất thường → mở ticket theo severity (xem `incident-response.md`).

---

## 0. Cách dùng

- **Tần suất:** Daily → Weekly → Monthly → Quarterly → Annual. Mục tần suất dài bao trùm mục ngắn (làm Monthly thì cũng đã làm Daily trong tháng).
- **Người làm:** cột **Ai** ghi vai trò chịu trách nhiệm (Ops / DBA / SRE / Storage).
- **Ghi nhận:** điền kết quả + người ký vào **form ghi nhận** mỗi lần check (Daily đầu giờ là bắt buộc). Tổng hợp form cho Quarterly review nộp Compliance.
- **Host tham chiếu:** `shwsap1p` (APP PROD) · `shwsdb1p` (DATA PROD) · `shwsap1dr`/`shwsdb1dr` (DR).
- **Maintenance window:** thao tác có rủi ro (restart, patch) chỉ làm trong window cuối tuần ngoài giờ giao dịch (xem README §Maintenance windows).

---

## 1. DAILY — kiểm status service **đầu giờ làm việc** (mỗi ngày — ~15 phút)

> Bắt buộc đầu mỗi ngày làm việc. Ghi kết quả vào **form**. Đây là lớp xác nhận thủ công, KHÔNG thay thế alert tự động của Prometheus.

| #   | Hạng mục                   | Ai          | Cách kiểm / lệnh                                                                                                                     | Ngưỡng OK                                                      | Ghi chú |
| --- | -------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ------- |
| D1  | Health endpoint API        | Ops         | `curl -k https://shwsap1p.bank.local/api/health`                                                                                     | HTTP 200                                                       |         |
| D2  | Container app UP đủ        | Ops         | `docker compose ps` trên `shwsap1p`                                                                                                  | tất cả `Up`/healthy                                            |         |
| D3  | PostgreSQL service         | DBA         | `systemctl status postgresql-15` trên `shwsdb1p`                                                                                     | active (running)                                               |         |
| D4  | Backup đêm qua thành công  | DBA         | `pgbackrest --stanza=shws-prod info`                                                                                                 | có backup mới trong 24h, status ok                             |         |
| D5  | WAL archiving chạy         | DBA         | `psql -c "SELECT last_archived_time, failed_count FROM pg_stat_archiver;"`                                                           | `last_archived_time` < 5 phút trước, `failed_count` không tăng |         |
| D6  | Replication lag DC→DR (DB) | DBA         | `psql -c "SELECT application_name, state, pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes FROM pg_stat_replication;"` | state=`streaming`, lag < 64 MB                                 |         |
| D7  | Disk free các LUN          | Ops         | `df -h /u01 /u02 /u03 /`                                                                                                             | free > 20% mọi LUN                                             |         |
| D8  | EMC multipath OK           | Storage/Ops | `multipath -ll` trên `shwsdb1p`                                                                                                      | mọi path `active ready`, không `failed`                        |         |
| D9  | Alert đang nổ trên Grafana | Ops         | Dashboard bank Prometheus/Grafana                                                                                                    | không alert P1/P2 chưa xử lý                                   |         |
| D10 | Error rate API             | Ops         | Grafana (4xx/5xx ratio)                                                                                                              | < 1%                                                           |         |

> **Lưu ý:** D1–D2, D7, D9–D10 nên đưa vào alert tự động (Prometheus) — daily check là lớp xác nhận thủ công, không thay thế alerting.

---

## 2. WEEKLY (mỗi tuần — ~30 phút)

| #   | Hạng mục                                          | Ai   | Cách kiểm / lệnh                                                                                                    | Ngưỡng OK                              | Ghi chú                     |
| --- | ------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------- |
| W1  | Full backup Chủ nhật chạy                         | DBA  | `pgbackrest --stanza=shws-prod info`                                                                                | có `full backup` mới trong tuần        |                             |
| W2  | Dung lượng tăng trưởng DB                         | DBA  | `psql -c "SELECT pg_size_pretty(pg_database_size('plane'));"`                                                       | so với tuần trước, ghi xu hướng        |                             |
| W3  | Top bảng lớn / bloat                              | DBA  | query `pg_stat_user_tables` (n_dead_tup)                                                                            | dead tuples không phình bất thường     |                             |
| W4  | Autovacuum hoạt động                              | DBA  | `psql -c "SELECT relname, last_autovacuum FROM pg_stat_user_tables ORDER BY last_autovacuum NULLS FIRST LIMIT 10;"` | bảng nóng có autovacuum gần đây        |                             |
| W5  | Log lỗi PostgreSQL                                | DBA  | `grep -iE 'ERROR\|FATAL\|PANIC' /var/log/pgsql/*.log` (tuần)                                                        | review, không lỗi lặp lại nghiêm trọng |                             |
| W6  | Log app (api/worker)                              | Ops  | `docker compose logs --since 168h api worker \| grep -iE 'error\|traceback'`                                        | review pattern bất thường              |                             |
| W7  | Celery queue tồn đọng                             | Ops  | RabbitMQ mgmt UI / `celery inspect`                                                                                 | queue không tồn đọng kéo dài           |                             |
| W8  | Redis memory                                      | Ops  | `redis-cli info memory`                                                                                             | `used_memory` < maxmemory, ít eviction |                             |
| W9  | Image / container restart bất thường              | Ops  | `docker ps` (cột restarts)                                                                                          | không container restart loop           |                             |
| W10 | EMC storage replication (file) — xác nhận healthy | ICTP | Hỏi/nhận trạng thái từ ICTP (hạ tầng)                                                                               | ICTP báo healthy                       | SHWS không thao tác storage |

---

## 3. MONTHLY (Chủ nhật đầu tháng, trong maintenance window — ~1-2 giờ)

| #   | Hạng mục                                     | Ai      | Hành động                                                                                                                      | Ghi chú |
| --- | -------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| M1  | **Restore drill nhỏ**                        | DBA     | Restore backup mới nhất vào instance/throwaway, verify mở DB + đếm row 1 bảng chính. **Bắt buộc** (xem `backup-restore.md` §5) |         |
| M2  | Verify checksum backup                       | DBA     | `pgbackrest --stanza=shws-prod check`                                                                                          |         |
| M3  | Cập nhật OS security (nếu có bundle)         | SRE     | Patch OS theo bundle air-gap đã duyệt; reboot trong window                                                                     |         |
| M4  | Rà chứng chỉ TLS sắp hết hạn                 | SRE     | Liệt kê cert PG/proxy/replication, hạn còn > 30 ngày                                                                           |         |
| M5  | Rà dung lượng & dự báo                       | Ops     | Xu hướng /u01 /u02 /u03 trong tháng → ước tính khi nào chạm 80%                                                                |         |
| M6  | Review user/role bất thường                  | DBA     | `\du` PostgreSQL + audit account login                                                                                         |         |
| M7  | Kiểm Grafana dashboard & alert rule còn đúng | Ops     | Dashboard hiển thị đủ metric, alert threshold hợp lý                                                                           |         |
| M8  | Dọn log cũ / xác nhận logrotate              | Ops     | `/var/log` không phình; logrotate chạy                                                                                         |         |
| M9  | Verify NTP đồng bộ                           | Ops     | `chronyc tracking` — lệch < 100ms                                                                                              |         |
| M10 | Tabletop DR walkthrough                      | DBA+SRE | Đọc lại `dr-failover.md` trên giấy (xem DR doc §7.1)                                                                           |         |

---

## 4. QUARTERLY (mỗi quý, lên lịch trước — nửa ngày)

| #   | Hạng mục                                  | Ai              | Hành động                                                                                               | Ghi chú |
| --- | ----------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------- | ------- |
| Q1  | **DR drill (partial)**                    | DBA+SRE+Storage | Promote DR ở mode shadow, smoke test, đo RTO/RPO thực tế, revert (DR doc §7.2). **Compliance bắt buộc** |         |
| Q2  | **Full restore drill**                    | DBA             | Restore toàn bộ stanza vào môi trường isolated, verify integrity                                        |         |
| Q3  | PostgreSQL minor upgrade                  | DBA             | Áp security patch PG 15.x (nếu có), theo `postgres-minor-upgrade.md`, sau khi UAT pass                  |         |
| Q4  | Renew cert sắp hết hạn                    | SRE             | Renew theo internal CA workflow bank                                                                    |         |
| Q5  | Review capacity & scaling                 | Ops+DBA         | Đối chiếu growth với sizing 8vCPU/16GB; đề xuất scale nếu CPU>70% hoặc disk<20% kéo dài                 |         |
| Q6  | Security review nhẹ                       | SRE             | Rà pg_hba, firewall rule, account còn cần thiết, secret rotation                                        |         |
| Q7  | Xác nhận EMC storage replication với ICTP | ICTP            | Nhận xác nhận file/platform DR vẫn được replicate tốt (chi tiết storage do ICTP)                        |         |
| Q8  | Cập nhật runbook & doc theo thực tế       | Ops             | Sửa runbook nếu lệnh/topology đổi                                                                       |         |
| Q9  | Báo cáo compliance                        | Ops Lead        | Tổng hợp kết quả Q1–Q8 nộp Compliance/Audit                                                             |         |

---

## 5. ANNUAL / AD-HOC

| #   | Hạng mục                              | Ai         | Hành động                                             |
| --- | ------------------------------------- | ---------- | ----------------------------------------------------- |
| A1  | Full failover drill (bi-annual)       | All        | Failover thật trong window có planning (DR doc §7.1)  |
| A2  | PostgreSQL major upgrade (multi-year) | DBA        | PG 15→16 theo `postgres-major-upgrade.md`             |
| A3  | Disaster recovery plan review         | TL+DBA+SRE | Rà toàn bộ RPO/RTO, approval chain, liên hệ           |
| A4  | Rotate toàn bộ secret/credential      | SRE        | DB password, replicator, MinIO key, cipher pgBackRest |
| A5  | Review & renew RHEL / license         | SRE        | Trước khi license/subscription hết hạn                |

---

## 6. Bất thường → làm gì

1. Ghi rõ hạng mục + giá trị đo bất thường.
2. Phân loại severity (README §Severity matrix).
3. P1/P2 → kích `incident-response.md` ngay; P3/P4 → ticket backlog.
4. Sự cố production → ghi `../05-change-log/incident-log.md`.

---

## 7. Liên kết

- Backup/restore chi tiết: [`runbooks/backup-restore.md`](./runbooks/backup-restore.md)
- DR failover: [`runbooks/dr-failover.md`](./runbooks/dr-failover.md)
- Deploy version mới: [`runbooks/app-deploy-new-version.md`](./runbooks/app-deploy-new-version.md)
- Monitoring/alert: [`monitoring-alerting.md`](./monitoring-alerting.md) (TODO)
- Incident response: [`incident-response.md`](./incident-response.md) (TODO)
- Thiết kế DB (backup, tuning): [`../01-system-design/06-database-design.md`](../01-system-design/06-database-design.md)
- Thiết kế DR: [`../01-system-design/03-architecture-dr-site.md`](../01-system-design/03-architecture-dr-site.md)

## 8. Ghi chú đã chốt

- **Daily window:** kiểm status service **đầu giờ làm việc** mỗi ngày.
- **Công cụ ghi nhận:** **form** (mỗi lần check điền + ký).
- **EMC storage replication:** do **ICTP (hạ tầng)** đảm nhiệm; SHWS chỉ xác nhận trạng thái, không thao tác/định ngưỡng storage.
