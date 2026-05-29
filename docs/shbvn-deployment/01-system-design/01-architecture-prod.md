# 01 — Kiến trúc PRODUCTION — Shinhan Workspace (SHWS)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-29
**Phiên bản:** 0.4
**Owner:** duonglx
**Supersedes:** `plans/reports/architecture-260513-1608-plane-2node-deployment.md` (raw draft)

---

## 1. Tóm tắt thiết kế

Triển khai **SHWS PROD** trên **2 node Hyper-V** theo mô hình **hybrid tier separation** (SHWS được xây dựng trên Plane.so):

- **APP NODE** — Docker compose stack: API, worker, beat-worker, live, frontend, Redis, RabbitMQ, Nginx (MinIO chạy trên DATA node)
- **DATA NODE** — **Native PostgreSQL 15.7** trên RHEL 9.6 + EMC SAN multipath; **MinIO container** (tùy chọn) cho file storage

**Nguyên tắc chính:**
| Nguyên tắc | Áp dụng |
|---|---|
| Tier separation | Stateless (APP) ↔ Stateful (DATA) |
| Native DB | PostgreSQL native cho hiệu năng + tooling DBA standard |
| Docker app | Đồng nhất stack, dễ deploy version mới |
| Air-gap install | Mọi cài đặt offline qua build station |
| Reversibility | Rollback path cho mọi quyết định |

**Mục tiêu:** 1000 user / 100 CCU peak / RPO 15p / RTO 1h / Uptime 99.5%.

---

## 2. Sơ đồ kiến trúc

```
                            ┌─────────────────────────┐
                            │   End User (Bank)        │
                            │   ~100 CCU / 1000 users  │
                            └────────────┬─────────────┘
                                         │ HTTPS 443
                                         │ (LDAP / SwingSSO)
                                         ▼
              ┌──────────────────────────────────────────────────┐
              │  APP NODE  (Hyper-V VM)                           │
              │  RHEL 9.6 · 8 vCPU / 16 GB RAM / 100 GB SSD       │
              │  Hostname: shwsap1p · IP: 10.94.10.10        │
              │                                                   │
              │  Docker Engine + Compose (docker-compose.shb.yml) │
              │                                                   │
              │  ┌──────────────────────────────────────────────┐ │
              │  │  proxy(Nginx) · web · space · admin          │ │
              │  │           │                                   │ │
              │  │           ▼                                   │ │
              │  │  api(Django+gunicorn) ──► redis (cache,WS)   │ │
              │  │           │              rabbitmq (broker)    │ │
              │  │           ▼                                   │ │
              │  │  worker(Celery) · beat(Celery)               │ │
              │  └──────────────────────────────────────────────┘ │
              └───────────┬──────────────────────┬────────────────┘
                          │                      │
              Postgres 5432│                      │ MinIO 9000
              (TLS, mTLS)  │                      │ (HTTP, VLAN private)
                          ▼                      ▼
              ┌──────────────────────────────────────────────────┐
              │  DATA NODE  (Hyper-V VM)                          │
              │  RHEL 9.6 · 8 vCPU / 16 GB RAM                    │
              │  Hostname: shwsdb1p · IP: 10.94.10.11        │
              │                                                   │
              │  ┌───────────────────────────────────────────┐   │
              │  │  NATIVE (systemd):                         │   │
              │  │  • postgresql-15.7 (PGDG offline RPM)     │   │
              │  │  • pgbackrest                             │   │
              │  │  • postgres_exporter (Docker, monitor)    │   │
              │  └───────────────────────────────────────────┘   │
              │  ┌───────────────────────────────────────────┐   │
              │  │  DOCKER (compose):                         │   │
              │  │  • plane-minio (object storage)           │   │
              │  └───────────────────────────────────────────┘   │
              │                                                   │
              │  EMC SAN multipath (3 LUN, /u0X convention):      │
              │  /u01 → SAN LUN-1 (600 GB, R10) data + minio      │
              │  /u02 → SAN LUN-2 (100 GB, R10) WAL (tách riêng)  │
              │  /u03 → SAN LUN-3 (1 TB,   R5)  backup pgBackRest │
              │  /var/log → local VHDX (logs)                     │
              └───────────────────────────────────────────────────┘
                                  │
                                  │ WAL stream (async)
                                  │ pgBackRest push
                                  ▼
                          [ DR SITE — xem 03-architecture-dr-site.md ]
```

> **Diagram source:** [`../assets/diagrams/architecture-prod-overview.mmd`](../assets/diagrams/architecture-prod-overview.mmd) (Mermaid v11)

---

## 3. Thành phần chi tiết

### 3.1 APP NODE

**Mục đích:** Phục vụ HTTP request, xử lý background job, lưu state tạm.

**OS:** Red Hat Enterprise Linux 9.6 minimal install
**Docker:** Docker CE 27.x (offline RPM)
**Compose file:** `docker-compose.shb.yml` (KHÔNG có service `plane-db`)

> Tên service khớp `docker-compose.shb.yml` thực tế. PROD dùng **image SHB prebuilt** load qua `docker load` (air-gap) — cột "Build từ" mô tả nguồn build trên build station.

| Container     | Image                                   | Vai trò                                                   |
| ------------- | --------------------------------------- | --------------------------------------------------------- |
| `proxy`       | Build từ `apps/proxy/Dockerfile.ce`     | Nginx reverse proxy, TLS termination                      |
| `web`         | Build từ `apps/web/Dockerfile`          | Frontend chính (React + Vite)                             |
| `space`       | Build từ `apps/space/Dockerfile`        | Public space frontend                                     |
| `admin`       | Build từ `apps/admin/Dockerfile`        | God-mode admin panel                                      |
| `live`        | `makeplane/plane-live` (prebuilt SHB)   | WebSocket realtime (collaboration)                        |
| `api`         | Build từ `apps/api/Dockerfile`          | Django REST API + gunicorn                                |
| `worker`      | Cùng image `api`, command Celery worker | Background jobs                                           |
| `beat-worker` | Cùng image `api`, command Celery beat   | Scheduled jobs                                            |
| `migrator`    | Cùng image `api`, one-shot `migrate`    | Chạy DB migration lúc deploy rồi exit (không thường trực) |
| `plane-redis` | `redis:7-alpine`                        | Cache + pub/sub                                           |
| `plane-mq`    | `rabbitmq:3.13.6-management-alpine`     | Celery broker                                             |

### 3.2 DATA NODE

**Mục đích:** Lưu trữ persistent state (DB + files), backup, replication source.

**OS:** RHEL 9.6 minimal + dev tools, kernel tuned cho DB workload
**Postgres:** 15.7 native (PGDG repo offline RPM)
**MinIO:** Docker container (single drive mode)
**Backup tool:** pgBackRest 2.51+ native RPM

#### Native services (systemd)

```
postgresql-15.service     enabled, running
pgbackrest (cron)         /etc/cron.d/pgbackrest-shws (full/diff/incr/WAL)
multipathd.service        enabled, running (SAN failover)
```

#### Docker services

| Container           | Image                                   | Mục đích                            |
| ------------------- | --------------------------------------- | ----------------------------------- |
| `plane-minio`       | `minio/minio`                           | File storage (attachments, avatars) |
| `postgres-exporter` | `prometheuscommunity/postgres-exporter` | Metrics cho Prometheus              |
| `node-exporter`     | `prom/node-exporter`                    | System metrics                      |

---

## 4. Phân bổ tài nguyên

### 4.1 APP node (8 vCPU / 16 GB)

| Container              | CPU limit | RAM limit    | RAM reservation | Ghi chú                                                          |
| ---------------------- | --------- | ------------ | --------------- | ---------------------------------------------------------------- |
| proxy                  | 0.5       | 256 MB       | 128 MB          | TLS + reverse proxy                                              |
| web                    | 0.5       | 512 MB       | 256 MB          | Vite preview / static serve                                      |
| space                  | 0.3       | 256 MB       | 128 MB          |                                                                  |
| admin                  | 0.3       | 256 MB       | 128 MB          |                                                                  |
| live                   | 0.3       | 384 MB       | 192 MB          | WebSocket realtime (Node.js)                                     |
| api (gunicorn)         | 2.7       | 5.5 GB       | 4 GB            | **8 workers**, UvicornWorker (ASGI)                              |
| worker                 | 1.5       | 2 GB         | 1 GB            | **concurrency 4** (set `--concurrency`; Plane mặc định = số CPU) |
| beat-worker            | 0.2       | 256 MB       | 128 MB          | Scheduler (Celery beat)                                          |
| plane-redis            | 0.5       | 1 GB         | 512 MB          | maxmemory=1g, allkeys-lru                                        |
| plane-mq               | 0.7       | 1 GB         | 512 MB          | RabbitMQ, default policies                                       |
| **OS + Docker engine** | 0.5       | 4 GB         | —               | Page cache, syslog, audit                                        |
| **Tổng**               | **~8**    | **~15.4 GB** |                 | `migrator` one-shot (deploy → exit) — không tính steady-state    |

**Gunicorn config:**

```
GUNICORN_WORKERS = 8       # set trong plane.env (Plane mặc định 2); env-tunable duy nhất
WORKER_CLASS = uvicorn.workers.UvicornWorker   # ASGI — cố định trong entrypoint image
# --max-requests 1200 --max-requests-jitter 1000  (cố định trong image, tránh memory leak)
CONN_MAX_AGE = 300        # plane.env — Django persistent conn, app nối trực tiếp PG 5432
```

### 4.2 DATA node (8 vCPU / 16 GB)

| Service                 | CPU    | RAM        | Ghi chú                                                          |
| ----------------------- | ------ | ---------- | ---------------------------------------------------------------- |
| **postgresql** (native) | 6      | **4 GB**   | shared_buffers=4GB (PG private); page cache phục vụ phần còn lại |
| plane-minio             | 0.5    | 1 GB       | Container                                                        |
| postgres-exporter       | 0.1    | 128 MB     | Container                                                        |
| node-exporter           | 0.1    | 64 MB      | Container                                                        |
| **OS + page cache**     | 1.0    | **~10 GB** | Page cache rất quan trọng cho PG (effective_cache_size hint)     |
| **Tổng**                | **~8** | **~16 GB** |                                                                  |

**PostgreSQL key config** (chi tiết trong `06-database-design.md`):

```ini
shared_buffers = 4GB                  # 25% RAM
effective_cache_size = 12GB           # 75% RAM (OS cache hint)
work_mem = 16MB                       # Per-operation
maintenance_work_mem = 512MB
max_connections = 300                 # app nối trực tiếp; CONN_MAX_AGE=300 (xem 06 §6)
wal_level = replica                   # Cho streaming replication
max_wal_senders = 5
wal_keep_size = 4GB
max_slot_wal_keep_size = 4GB          # auto-drop slot khi WAL > 4GB (chống fill /u02)
random_page_cost = 1.1                # SSD
effective_io_concurrency = 200        # SSD
```

---

## 5. Storage layout (EMC SAN) — 3 LUN, convention `/u0X`

Chi tiết trong `07-storage-design.md`. Tóm tắt:

```
DATA NODE (shwsdb1p) filesystem layout
├── /                          (local VHDX 80 GB, OS + logs, XFS)
├── /u01/                     → SAN LUN-1  600 GB  RAID-10  XFS  (data + minio)
│   ├── /u01/pgsql/15/data/   (Postgres data)
│   └── /u01/minio/           (MinIO object storage)
├── /u02/                     → SAN LUN-2  100 GB  RAID-10  XFS  (WAL — tách riêng!)
│   └── /u02/pgsql/15/wal/
├── /u03/                     → SAN LUN-3  1 TB    RAID-5   XFS  (backup)
│   └── /u03/pgbackup/
└── /var/log/                  (local VHDX, Postgres + OS logs)

APP NODE (shwsap1p) filesystem layout
├── /                          (local VHDX 80 GB, OS, XFS)
└── /u01/                     → local VHDX 100 GB XFS (Docker data root)
    └── /u01/docker/           (di chuyển /var/lib/docker → /u01/docker)
```

**Lý do tách 3 LUN:**

- **WAL riêng (`/u02`)** → sequential write không nghẽn random write của data → tăng ~20% throughput. Lợi ích lớn nhất với chi phí thêm 1 LUN.
- **Backup riêng (`/u03`) RAID-5** → tiết kiệm dung lượng (vs RAID-10), hỏng không ảnh hưởng prod
- **Convention `/u0X`** theo chuẩn DBA bank (Oracle/banking standard) — DBA quen, audit dễ
- **Data + MinIO chung `/u01`** — chấp nhận compromise vì MinIO không nghẽn DB (object write thưa, không phải random write)
- **LVM trên SAN LUN** → mở rộng online khi cần (`lvextend` + `xfs_growfs`)

**Logs trên local disk** — Postgres log + OS log rotate hàng ngày, không cần SAN. Audit log forward syslog về SIEM bank.

**Multipath:** Bật `device-mapper-multipath`, failover tự động khi 1 SAN path chết (< 1 giây).

---

## 6. Network giữa 2 node

Chi tiết trong `04-network-design.md`. Tóm tắt:

- **VLAN riêng** cho prod tier — không định tuyến public
- **APP → DATA**: **5432** (PostgreSQL trực tiếp, TLS) và **9000** (MinIO)
- **DATA → APP**: block toàn bộ inbound (reverse direction)
- **TLS giữa node**: Postgres `ssl=on` + mTLS với cert bank internal CA
- **DNS nội bộ**: `shwsdb1p.bank.local` → IP DATA node
- **RTT mục tiêu**: < 1 ms trên LAN

---

## 7. Resilience & failure modes

| Failure                | Tác động                        | Mitigation                                                                         |
| ---------------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| APP node crash         | Toàn bộ user mất truy cập       | Restart container tự động (`restart: unless-stopped`), monitor → alert             |
| 1 container crash      | Tính năng đó lỗi                | Healthcheck + restart                                                              |
| DATA node crash        | Toàn bộ hệ thống xuống          | Failover sang DR replica (manual giai đoạn 1, ~45–70 phút, RTO < 1h — xem 03 §5.1) |
| Postgres process crash | DB không serve                  | systemd restart, recovery từ WAL                                                   |
| SAN LUN-1 (data) hỏng  | DB không khởi động              | Restore từ pgBackRest backup                                                       |
| SAN LUN-2 (WAL) hỏng   | DB không commit transaction mới | Recovery + có thể mất data từ last checkpoint                                      |
| 1 SAN path hỏng        | Không tác động                  | Multipath failover trong < 1 giây                                                  |
| Network partition      | App không kết nối DB            | App retry, alert → SRE check                                                       |

> ⚠️ **Giai đoạn DC-only (Phase A — xem [00](./00-overview.md) §2):** mitigation "failover sang DR replica" CHƯA khả dụng (DR là Phase B). Khi đó **DATA node crash / LUN-1 hỏng → restore từ pgBackRest `shws-prod`** (RTO ~30–45 phút) thay vì failover. Mất toàn bộ DC → chỉ còn NAS offsite.

**Giai đoạn 2:** Patroni + etcd cho auto-failover (RTO < 2 phút). Chi tiết trong `06-database-design.md`.

---

## 8. Capacity planning

Chi tiết trong `09-capacity-planning.md`. Projection:

| Thời điểm    | User        | DB size | Disk usage | Trigger nâng cấp                |
| ------------ | ----------- | ------- | ---------- | ------------------------------- |
| Go-live (M0) | 200 (pilot) | 1 GB    | ~5%        | —                               |
| M+3          | 600         | 5 GB    | ~10%       | —                               |
| M+6          | 1000        | 10 GB   | ~15%       | —                               |
| M+12         | 1000        | 20 GB   | ~25%       | Theo dõi RAM hit ratio          |
| M+24         | 1000–1200   | 50 GB   | ~40%       | Cân nhắc nâng RAM 16→24 GB      |
| M+36         | 1200–1500   | 100 GB  | ~60%       | Thêm read replica nếu CCU > 200 |

---

## 9. So sánh với phương án all-in-one (1 VM)

| Tiêu chí          | 1-VM all-in-one              | **2-node hybrid (CHỌN)**        |
| ----------------- | ---------------------------- | ------------------------------- |
| Tài nguyên tổng   | 8 vCPU / 16 GB               | 16 vCPU / 32 GB (2× 8/16)       |
| Cô lập DB         | ❌ Tranh CPU với API         | ✅ DB riêng VM                  |
| Backup            | Snapshot toàn VM (~16 GB)    | Chỉ DATA node (~12 GB)          |
| Compliance bank   | ⚠️ Trung bình                | ✅ Tier separation rõ ràng      |
| DBA tooling       | ⚠️ Phải `docker exec`        | ✅ Native, standard             |
| HA roadmap        | ❌ Khó mở rộng               | ✅ Thêm DR replica dễ           |
| Performance DB    | ⚠️ Bị giới hạn bởi container | ✅ Tối ưu kernel, SAN multipath |
| Blast radius      | App + DB chết cùng           | Tách: app chết → DB còn         |
| Cost (license HV) | 1 VM                         | 2 VM (+1 small)                 |

**Quyết định:** Chấp nhận tăng cost 1 VM để đổi lấy resilience + compliance + roadmap mở rộng. Xem [`ADR-001`](../05-change-log/decisions/adr-001-postgres-native-vs-docker.md).

---

## 10. Risk & mitigation

| Risk                                             | Severity | Probability | Mitigation                                                                                         |
| ------------------------------------------------ | -------- | ----------- | -------------------------------------------------------------------------------------------------- |
| RAM 16 GB APP node không đủ peak                 | Medium   | Medium      | Monitor, có thể nâng 24 GB dễ dàng                                                                 |
| PG connection gần max_connections (worker burst) | Medium   | Low         | max_connections=300 headroom; CONN_MAX_AGE + Celery concurrency hợp lý; GĐ2 PgBouncer/read replica |
| SAN LUN performance kém kỳ vọng                  | High     | Low         | Test IOPS trước go-live, có thể request LUN khác                                                   |
| Native PG security patch chậm                    | Medium   | Low         | Process update quarterly, runbook sẵn                                                              |
| DBA bank không quen Plane schema                 | Medium   | Medium      | Tài liệu DB schema + training                                                                      |
| Air-gap bundle bị thiếu dep                      | High     | Medium      | Test cài trên VM staging trước, checklist verify                                                   |
| RHEL license expire                              | Low      | Low         | Theo dõi expiry, renew trước                                                                       |
| WAL disk đầy                                     | High     | Low         | Alert > 80%, retention policy chặt                                                                 |

---

## 11. Decisions liên quan (ADR)

- [`ADR-001`](../05-change-log/decisions/adr-001-postgres-native-vs-docker.md) — Native PG cho PROD
- [`ADR-002`](../05-change-log/decisions/adr-002-rhel-version.md) — RHEL 9.6
- [`ADR-003`](../05-change-log/decisions/adr-003-postgres-version.md) — PostgreSQL 15.7
- [`ADR-007`](../05-change-log/decisions/adr-007-app-stack-docker-compose.md) — Docker compose cho app tier
- [`ADR-008`](../05-change-log/decisions/adr-008-storage-emc-san.md) — EMC SAN multipath

---

## 12. Cross-references

- TEST/UAT architecture: [`02-architecture-test-uat.md`](./02-architecture-test-uat.md)
- DR site architecture: [`03-architecture-dr-site.md`](./03-architecture-dr-site.md)
- Network design: [`04-network-design.md`](./04-network-design.md)
- Security design: [`05-security-design.md`](./05-security-design.md)
- Database design: [`06-database-design.md`](./06-database-design.md)
- Storage design: [`07-storage-design.md`](./07-storage-design.md)
- Monitoring design: [`08-monitoring-design.md`](./08-monitoring-design.md)
- Capacity planning: [`09-capacity-planning.md`](./09-capacity-planning.md)
- Install PROD: [`../02-installation/prod/`](../02-installation/prod/)

---

## 13. Câu hỏi mở

- [ ] IP cụ thể của 2 node (placeholder `10.94.10.10`/`10.94.10.11` — chờ network team xác nhận dải thực tế)
- [ ] Hostname theo chuẩn DNS bank: `shwsap1p.bank.local` / `shwsdb1p.bank.local`
- [ ] LUN size cuối cùng có thể điều chỉnh theo capacity SAN
- [x] ~~Có cần dedicated VM cho monitoring stack?~~ → **CHỐT:** dùng **Prometheus/Grafana sẵn có của bank**, KHÔNG dựng stack mới; SHWS chỉ cài exporter + cấp scrape target/alert/dashboard (xem `08-monitoring-design.md` §1). Bank Prometheus scrape qua mgmt VLAN (điểm `shws-mon` 10.94.40.20).
- [ ] Disaster scenarios — bank có yêu cầu test cụ thể nào ngoài 8 failure modes ở §7?
- [ ] PostgreSQL minor version bumping cadence — quarterly hay sau mỗi CVE?
