# 08 — Monitoring Design

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-29
**Phiên bản:** 0.2
**Owner:** duonglx
**Liên quan:** [01-architecture-prod.md](./01-architecture-prod.md), [06-database-design.md](./06-database-design.md) §16, [05-security-design.md](./05-security-design.md) §6, [`../03-operations/monitoring-alerting.md`](../03-operations/monitoring-alerting.md)

---

## 1. Phạm vi & nguyên tắc

Thiết kế quan sát (observability) cho **Shinhan Workspace (SHWS)** PROD/DR. Tài liệu này là **thiết kế** (metric catalog, exporter, dashboard, chiến lược alert); cấu hình cụ thể (scrape config, alert rule YAML, routing) nằm ở runbook [`monitoring-alerting.md`](../03-operations/monitoring-alerting.md).

**Quyết định nền:** Bank **đã có sẵn Prometheus + Grafana** → SHWS **tích hợp vào hạ tầng monitoring hiện hữu**, KHÔNG dựng stack mới. SHWS chỉ chịu trách nhiệm: (1) cài exporter trên node SHWS, (2) cung cấp scrape target + alert rule + dashboard cho team monitoring bank import.

**3 trụ observability:**

| Trụ         | Công cụ                              | Đích                       |
| ----------- | ------------------------------------ | -------------------------- |
| **Metrics** | Prometheus (bank) + exporters (SHWS) | Dashboard + alert          |
| **Logs**    | rsyslog → SIEM bank                  | Audit 5 năm + troubleshoot |
| **Traces**  | (không giai đoạn 1)                  | —                          |

---

## 2. Exporter inventory (cài trên node SHWS)

| Exporter                          | Node                    | Port              | Metrics                                               |
| --------------------------------- | ----------------------- | ----------------- | ----------------------------------------------------- |
| `node_exporter`                   | tất cả (app, data, DR)  | 9100              | CPU, RAM, disk, network, filesystem                   |
| `postgres_exporter`               | `shwsdb1p`, `shwsdb1dr` | 9187              | Connection, replication, query, cache, vacuum         |
| `cadvisor`                        | `shwsap1p` (app node)   | 8080              | Per-container CPU/RAM/restart                         |
| `nginx-prometheus-exporter`       | `shwsap1p`              | 9113              | Request rate, 4xx/5xx, latency (từ nginx stub_status) |
| `redis_exporter`                  | `shwsap1p`              | 9121              | Memory, eviction, hit ratio                           |
| `rabbitmq` (built-in plugin)      | `shwsap1p`              | 15692             | Queue depth, consumer, message rate                   |
| `pgbackrest` (textfile collector) | `shwsdb1p`              | qua node_exporter | Last backup time, status (script → `.prom`)           |

**Air-gap:** mọi exporter từ offline bundle (binary RPM hoặc Docker image `.tar`). postgres_exporter, node_exporter chạy Docker (xem [01-architecture-prod.md](./01-architecture-prod.md) §3.2).

**Bảo mật scrape:** Prometheus bank scrape qua **mgmt VLAN**; `postgres_exporter` dùng role `monitoring` (`pg_monitor`, read-only, xem [06](./06-database-design.md) §7.2). Firewall mở port exporter chỉ từ IP Prometheus bank (xem [04-network-design.md](./04-network-design.md)).

---

## 3. Metric catalog & golden signals

Theo **4 golden signals** (latency, traffic, errors, saturation) + DB/backup/DR specifics.

### 3.1 Application (golden signals)

| Metric                 | Source              | SLI target    | Alert            |
| ---------------------- | ------------------- | ------------- | ---------------- |
| API p95 latency        | nginx exporter      | < 500 ms      | warn > 500ms 5m  |
| API p99 latency        | nginx exporter      | < 1500 ms     | warn > 1500ms 5m |
| Request rate (traffic) | nginx exporter      | baseline ~CCU | — (capacity)     |
| Error rate 5xx         | nginx exporter      | < 1%          | crit > 1% 5m     |
| Health endpoint        | blackbox/curl probe | 200           | crit != 200 1m   |

### 3.2 Database

| Metric                  | Source query                 | Warn         | Crit     |
| ----------------------- | ---------------------------- | ------------ | -------- |
| Connection count        | `pg_stat_activity`           | > 250        | > 290    |
| Replication lag (s)     | `pg_stat_replication`        | > 30s        | > 5m     |
| Replication lag (bytes) | `pg_wal_lsn_diff`            | > 256 MB     | > 1 GB   |
| Replication slot size   | `pg_replication_slots`       | > 1 GB       | > 3 GB   |
| Cache hit ratio         | `pg_stat_database`           | < 95%        | < 90%    |
| Long-running query      | `pg_stat_activity`           | > 5 min      | > 15 min |
| Deadlocks               | `pg_stat_database.deadlocks` | > 0/h        | > 5/h    |
| Dead tuples (bloat)     | `pg_stat_user_tables`        | n_dead > 50% | —        |
| DB size growth          | `pg_database_size('plane')`  | > 5 GB/week  | —        |

### 3.3 System (saturation)

| Metric                         | Source                 | Warn          | Crit     |
| ------------------------------ | ---------------------- | ------------- | -------- |
| CPU sustained                  | node_exporter          | > 70% 10m     | > 90% 5m |
| RAM used                       | node_exporter          | > 80%         | > 90%    |
| Disk free `/u01`,`/u02`,`/u03` | node_exporter          | < 20%         | < 10%    |
| Disk inode free                | node_exporter          | < 20%         | < 10%    |
| Multipath path down            | node_exporter textfile | any failed    | —        |
| Swap usage                     | node_exporter          | > 0 sustained | > 256 MB |

### 3.4 Middleware

| Metric                    | Source         | Warn                      | Crit    |
| ------------------------- | -------------- | ------------------------- | ------- |
| Redis memory vs maxmemory | redis_exporter | > 80%                     | > 95%   |
| Redis evicted keys        | redis_exporter | > 0/min                   | —       |
| RabbitMQ queue depth      | rabbitmq       | > 1000 sustained          | > 10000 |
| RabbitMQ consumers = 0    | rabbitmq       | queue có msg + 0 consumer | —       |
| Container restart loop    | cadvisor       | restarts > 3/10m          | —       |

### 3.5 Backup & DR

| Metric                                  | Source             | Warn                  | Crit                      |
| --------------------------------------- | ------------------ | --------------------- | ------------------------- |
| pgBackRest last success                 | textfile collector | > 25h                 | > 49h                     |
| WAL archive lag                         | `pg_stat_archiver` | last_archived > 5 min | failed_count tăng         |
| EMC storage replication (file/platform) | **ICTP** giám sát  | —                     | — (ngoài Prometheus SHWS) |

### 3.6 Security/cert

| Metric                 | Source          | Alert                        |
| ---------------------- | --------------- | ---------------------------- |
| TLS cert expiry        | blackbox/script | 60d warn, 30d/7d/1d escalate |
| Audit log forward fail | rsyslog metric  | warn nếu queue tăng          |

---

## 4. Dashboard design (Grafana)

SHWS cung cấp **JSON dashboard** cho team monitoring bank import. Tổ chức theo audience:

| Dashboard             | Audience    | Panel chính                                                          |
| --------------------- | ----------- | -------------------------------------------------------------------- |
| **SHWS — Overview**   | Ops, oncall | Health, error rate, p95/p99, CCU, alert active                       |
| **SHWS — PostgreSQL** | DBA         | Connections, replication lag, cache hit, slow query, vacuum, DB size |
| **SHWS — System**     | SRE         | CPU/RAM/disk per node, multipath, swap, network                      |
| **SHWS — App stack**  | Ops         | Per-container CPU/RAM/restart, Redis, RabbitMQ queue                 |
| **SHWS — Backup/DR**  | DBA         | Last backup, WAL archive lag, replication health                     |

Mỗi panel link tới runbook tương ứng (alert → action). Dashboard JSON lưu trong repo deployment (versioned).

---

## 5. Log pipeline

Chi tiết audit trong [05-security-design.md](./05-security-design.md) §6. Tóm tắt:

```
[Node SHWS: PG log, nginx log, Django log, OS auditd, pgBackRest log]
   └── rsyslog (local buffer 30 ngày, format RFC 5424)
        └── TCP/TLS 6514 → [Bank SIEM]
              ├── hot 90 ngày · warm 1 năm · cold đến 5 năm (Thông tư 09)
```

- PG `log_destination = csvlog` → rsyslog tail `.csv` → SIEM.
- Metrics ≠ logs: Prometheus cho số liệu thời gian thực + alert; SIEM cho audit/forensic + retention pháp lý.

---

## 6. SLI / SLO (giai đoạn 1)

| SLO          | Mục tiêu                | Đo                             |
| ------------ | ----------------------- | ------------------------------ |
| Availability | 99.5% / tháng           | Health probe uptime            |
| API latency  | p95 < 500ms, p99 < 1.5s | nginx exporter                 |
| Error budget | error rate < 1%         | 5xx ratio                      |
| RPO          | < 15 phút (đạt ~30s)    | WAL archive interval           |
| RTO          | < 1 giờ                 | restore/failover drill thực tế |

Error budget vượt → review trong retro hàng tháng; điều chỉnh capacity (xem [09-capacity-planning.md](./09-capacity-planning.md)).

---

## 7. Alerting strategy (rationale)

- **Phân tầng severity** theo [`../03-operations/README.md`](../03-operations/README.md) severity matrix (P1–P4). Alert map severity → routing.
- **Multi-window:** alert latency/error dùng cửa sổ 5m (tránh nhiễu spike ngắn); saturation disk dùng ngưỡng tuyệt đối.
- **Daily manual check** (form, đầu giờ — xem [`routine-maintenance.md`](../03-operations/routine-maintenance.md)) là lớp xác nhận thủ công, **bổ sung** không thay thế alert tự động.
- **Routing:** P1/P2 → oncall ngay (kênh do bank quy định: email/SMS/Teams); P3/P4 → ticket. Cấu hình Alertmanager cụ thể ở [`monitoring-alerting.md`](../03-operations/monitoring-alerting.md).
- **Triển khai phân kỳ (DC-only, Phase A — xem [00](./00-overview.md) §2):** **silence** nhóm alert replication (`§3.2` replication lag/slot, `§3.5` DR, "streaming connection DOWN") cho tới khi DR online — DC-only chưa có standby nên các alert này là false positive. Bật lại khi seed DR (Phase B).

---

## 8. Câu hỏi mở

1. **Prometheus bank scrape model:** pull trực tiếp tới exporter SHWS, hay SHWS push qua Pushgateway/remote_write? (ảnh hưởng firewall hướng nào).
2. **Alertmanager:** dùng Alertmanager bank chung hay SHWS có instance riêng?
3. **Grafana org/folder:** team monitoring bank cấp folder riêng cho SHWS dashboard?
4. **Kênh thông báo alert:** email / SMS / Teams / PagerDuty nội bộ?
5. **Retention metrics:** Prometheus bank giữ bao lâu (ảnh hưởng capacity trend dài hạn)?
6. **Blackbox probe:** dùng để probe health + cert expiry — bank đã có blackbox_exporter chưa?

---

## 9. Cross-references

- Kiến trúc PROD (exporter trên node): [01-architecture-prod.md](./01-architecture-prod.md) §3.2
- DB metrics chi tiết: [06-database-design.md](./06-database-design.md) §16
- Audit log → SIEM: [05-security-design.md](./05-security-design.md) §6
- Network (port exporter, firewall): [04-network-design.md](./04-network-design.md)
- Operations runbook (alert config): [`../03-operations/monitoring-alerting.md`](../03-operations/monitoring-alerting.md)
- Incident response (alert → action): [`../03-operations/incident-response.md`](../03-operations/incident-response.md)
- Capacity planning (trend → scaling): [09-capacity-planning.md](./09-capacity-planning.md)
