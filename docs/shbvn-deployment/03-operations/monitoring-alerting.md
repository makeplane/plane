# Monitoring & Alerting — Operations

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-26
**Owner:** duonglx · **Audience:** SRE, Ops, DBA

> Thiết kế gốc (metric catalog, exporter, dashboard, SLO): [`../01-system-design/08-monitoring-design.md`](../01-system-design/08-monitoring-design.md). Tài liệu này là **vận hành**: cấu hình cụ thể, alert rule, và **alert → hành động**. Bank **đã có sẵn Prometheus + Grafana** — SHWS tích hợp, không dựng mới.

---

## 1. Mô hình tích hợp

```
[Node SHWS: exporter :9100/:9187/:8080/:9113/:9121]
        ▲ scrape (pull)
        │ mgmt VLAN, firewall mở chỉ từ IP Prometheus bank
[Prometheus bank] ──► [Alertmanager bank] ──► kênh thông báo (TBD: email/SMS/Teams)
        │
        ▼
[Grafana bank] ──► dashboard SHWS (import JSON)
```

Trách nhiệm SHWS: cài exporter (§2), cung cấp **scrape target + alert rule + dashboard JSON** (§3–5) cho team monitoring bank. Bank quản Prometheus/Alertmanager/Grafana core.

---

## 2. Exporter — cài & verify

| Exporter                   | Node                   | Cách chạy                                     | Verify                         |
| -------------------------- | ---------------------- | --------------------------------------------- | ------------------------------ |
| node_exporter              | tất cả                 | Docker / systemd                              | `curl localhost:9100/metrics`  |
| postgres_exporter          | `shwsdb1p`,`shwsdb1dr` | Docker, role `monitoring`                     | `curl localhost:9187/metrics`  |
| cadvisor                   | `shwsap1p`             | Docker                                        | `curl localhost:8080/metrics`  |
| nginx exporter             | `shwsap1p`             | Docker (nginx stub_status)                    | `curl localhost:9113/metrics`  |
| redis_exporter             | `shwsap1p`             | Docker                                        | `curl localhost:9121/metrics`  |
| rabbitmq prometheus plugin | `shwsap1p`             | `rabbitmq-plugins enable rabbitmq_prometheus` | `curl localhost:15692/metrics` |
| pgBackRest textfile        | `shwsdb1p`             | cron script → `.prom` cho node_exporter       | xem §6                         |

`DATA_SOURCE_NAME` postgres_exporter (role read-only `monitoring`):

```
postgresql://monitoring:<pw>@127.0.0.1:5432/postgres?sslmode=verify-ca
```

---

## 3. Scrape config (cung cấp cho Prometheus bank)

```yaml
# Thêm vào prometheus.yml của bank — job SHWS
scrape_configs:
  - job_name: "shws-node"
    static_configs:
      - targets: ["shwsap1p:9100", "shwsdb1p:9100", "shwsap1dr:9100", "shwsdb1dr:9100"]
  - job_name: "shws-postgres"
    static_configs:
      - targets: ["shwsdb1p:9187", "shwsdb1dr:9187"]
  - job_name: "shws-containers"
    static_configs:
      - targets: ["shwsap1p:8080"]
  - job_name: "shws-nginx"
    static_configs:
      - targets: ["shwsap1p:9113"]
  - job_name: "shws-redis"
    static_configs:
      - targets: ["shwsap1p:9121"]
  - job_name: "shws-rabbitmq"
    static_configs:
      - targets: ["shwsap1p:15692"]
```

---

## 4. Alert rules (Prometheus)

> Ngưỡng nguồn: [08-monitoring-design.md](../01-system-design/08-monitoring-design.md) §3. File `shws-alerts.yml` cung cấp cho bank.

```yaml
groups:
  - name: shws-availability
    rules:
      - alert: SHWS_API_Down
        expr: probe_success{job="shws-health"} == 0
        for: 1m
        labels: { severity: P1 }
        annotations: { summary: "API health != 200", runbook: "incident-response.md" }
      - alert: SHWS_Error_Rate_High
        expr: sum(rate(nginx_http_requests_total{status=~"5.."}[5m])) / sum(rate(nginx_http_requests_total[5m])) > 0.01
        for: 5m
        labels: { severity: P2 }
      - alert: SHWS_Latency_P95_High
        expr: histogram_quantile(0.95, rate(nginx_http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels: { severity: P3 }

  - name: shws-database
    rules:
      - alert: SHWS_Replication_Lag_Critical
        expr: pg_replication_lag_seconds > 300
        for: 2m
        labels: { severity: P2 }
        annotations: { runbook: "runbooks/dr-failover.md" }
      - alert: SHWS_Connections_High
        expr: pg_stat_activity_count > 250
        for: 5m
        labels: { severity: P3 }
      - alert: SHWS_Cache_Hit_Low
        expr: pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read) < 0.95
        for: 15m
        labels: { severity: P3 }

  - name: shws-saturation
    rules:
      - alert: SHWS_Disk_Critical
        expr: node_filesystem_avail_bytes{mountpoint=~"/u0[123]"} / node_filesystem_size_bytes < 0.10
        for: 5m
        labels: { severity: P2 }
        annotations: { runbook: "runbooks/backup-restore.md / 07-storage-design.md §6.3" }
      - alert: SHWS_Disk_Warning
        expr: node_filesystem_avail_bytes{mountpoint=~"/u0[123]"} / node_filesystem_size_bytes < 0.20
        for: 10m
        labels: { severity: P3 }
      - alert: SHWS_CPU_High
        expr: 100 - (avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 90
        for: 5m
        labels: { severity: P3 }
      - alert: SHWS_RAM_High
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) > 0.90
        for: 5m
        labels: { severity: P3 }

  - name: shws-backup
    rules:
      - alert: SHWS_Backup_Stale
        expr: time() - shws_pgbackrest_last_success_timestamp > 90000 # 25h
        labels: { severity: P2 }
        annotations: { runbook: "runbooks/backup-restore.md" }
      - alert: SHWS_WAL_Archive_Failing
        expr: pg_stat_archiver_failed_count > 0
        for: 5m
        labels: { severity: P2 }
```

---

## 5. Dashboard

SHWS cung cấp JSON cho 5 dashboard (xem [08](../01-system-design/08-monitoring-design.md) §4): Overview, PostgreSQL, System, App stack, Backup/DR. Lưu trong repo deployment, versioned. Import vào folder Grafana riêng cho SHWS.

---

## 6. pgBackRest textfile collector

Script cron sinh metric cho node_exporter textfile collector:

```bash
# /usr/local/bin/shws-pgbackrest-metrics.sh  (cron mỗi 15 phút, user postgres)
TS=$(pgbackrest --stanza=shws-prod --output=json info \
     | jq '.[0].backup[-1].timestamp.stop')
echo "shws_pgbackrest_last_success_timestamp $TS" \
     > /var/lib/node_exporter/textfile/pgbackrest.prom.$$
mv /var/lib/node_exporter/textfile/pgbackrest.prom.$$ \
   /var/lib/node_exporter/textfile/pgbackrest.prom
```

node_exporter chạy với `--collector.textfile.directory=/var/lib/node_exporter/textfile`.

---

## 7. Alert → hành động (routing)

| Severity | Kênh                           | Phản hồi            | Tài liệu                                         |
| -------- | ------------------------------ | ------------------- | ------------------------------------------------ |
| **P1**   | oncall ngay (SMS/call) + Mgmt  | < 1h, kích incident | [`incident-response.md`](./incident-response.md) |
| **P2**   | oncall (email/Teams) + DBA/SRE | < 4h                | runbook tương ứng (annotation)                   |
| **P3**   | ticket                         | < 24h               | backlog xử lý                                    |
| **P4**   | ticket backlog                 | < 1 tuần            | —                                                |

Mỗi alert có annotation `runbook` trỏ tới file xử lý. Oncall: mở runbook → pre-check → action → verify.

**Lưu ý:** alert tự động là chính; **daily manual check (form, đầu giờ)** trong [`routine-maintenance.md`](./routine-maintenance.md) là lớp xác nhận bổ sung, không thay thế.

---

## 8. Câu hỏi mở

1. Prometheus bank scrape **pull** trực tiếp được tới node SHWS qua mgmt VLAN, hay cần `remote_write`/Pushgateway? → quyết hướng firewall.
2. Alertmanager bank chung hay instance riêng cho SHWS? Format kênh thông báo (email/SMS/Teams/PagerDuty)?
3. Grafana: folder + datasource SHWS do team monitoring cấp?
4. blackbox_exporter cho health probe + cert expiry — bank đã có chưa?
5. Tên metric thực tế (nginx exporter, postgres_exporter) cần verify khớp version exporter trong bundle (đặt tên ở §4 là điển hình, có thể khác).

---

## 9. Liên kết

- Monitoring design (catalog, SLO): [`../01-system-design/08-monitoring-design.md`](../01-system-design/08-monitoring-design.md)
- DB metrics: [`../01-system-design/06-database-design.md`](../01-system-design/06-database-design.md) §16
- Incident response: [`incident-response.md`](./incident-response.md)
- Routine maintenance (daily form): [`routine-maintenance.md`](./routine-maintenance.md)
- Network (firewall exporter): [`../01-system-design/04-network-design.md`](../01-system-design/04-network-design.md)
