# 02 — Kiến trúc TEST/UAT — Shinhan Workspace (SHWS)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-18
**Phiên bản:** 0.1
**Owner:** duonglx

---

## 1. Tóm tắt thiết kế

Triển khai **SHWS TEST/UAT** trên **1 VM all-in-one** với Docker Compose mặc định của Plane.so. Mục tiêu:

- Môi trường kiểm thử trước UAT user và trước go-live PROD
- Sandbox cho QA, developer, power user pilot
- Test migration version mới của Plane trước khi áp dụng PROD
- Verify cấu hình cài đặt offline (bundle) trên VM tươi

**Nguyên tắc:**

| Nguyên tắc      | Áp dụng                                                   |
| --------------- | --------------------------------------------------------- |
| All-in-one      | 1 VM duy nhất, mọi service trong container                |
| Reset thoải mái | `docker compose down -v` + redeploy bundle                |
| Không HA        | Không cần replica, không cần streaming, không WAL archive |
| Auth dual mode  | SwingSSO (giống PROD) + local user (cho dev/QA test)      |
| TLS bắt buộc    | HTTPS với cert internal CA bank (giống PROD)              |
| Lifecycle       | Reset theo nhu cầu test (sau mỗi release / cuối sprint)   |

---

## 2. Sơ đồ kiến trúc

```
                            ┌─────────────────────────┐
                            │  Tester / QA / Power User │
                            │   (20-30 user pilot)      │
                            └────────────┬─────────────┘
                                         │ HTTPS 443
                                         │ (SwingSSO hoặc local user)
                                         ▼
              ┌──────────────────────────────────────────────────┐
              │  UAT VM (Hyper-V VM, all-in-one)                  │
              │  Hostname: shwsap1t · OS: RHEL 9.6                │
              │  8 vCPU / 16 GB RAM / 100 GB SSD (mount /u01)     │
              │                                                   │
              │  Docker Engine + Compose (docker-compose.yml mặc  │
              │  định của Plane)                                  │
              │                                                   │
              │  ┌──────────────────────────────────────────────┐ │
              │  │  Frontend tier:                              │ │
              │  │  proxy(Nginx TLS) · web · space · admin      │ │
              │  └──────────────┬───────────────────────────────┘ │
              │                 │                                 │
              │  ┌──────────────▼───────────────────────────────┐ │
              │  │  App tier:                                   │ │
              │  │  api(Django+gunicorn) · worker · beat        │ │
              │  └──────┬──────────┬─────────┬───────────────────┘ │
              │         │          │         │                   │
              │  ┌──────▼────┐ ┌───▼─────┐ ┌▼──────────────────┐ │
              │  │ plane-db  │ │ plane-  │ │ plane-mq          │ │
              │  │ Postgres  │ │ redis   │ │ (RabbitMQ)        │ │
              │  │ 15.7      │ │         │ │                   │ │
              │  │ (container)│ └─────────┘ └───────────────────┘ │
              │  └───────────┘                                    │
              │  ┌────────────────────────────────────────────┐  │
              │  │  plane-minio (object storage container)    │  │
              │  └────────────────────────────────────────────┘  │
              │                                                   │
              │  Volumes (Docker named volumes trên /u01):        │
              │  /u01/docker/volumes/pgdata        (PG data)      │
              │  /u01/docker/volumes/redisdata     (Redis)        │
              │  /u01/docker/volumes/rabbitmq_data (RabbitMQ)     │
              │  /u01/docker/volumes/uploads       (MinIO)        │
              └───────────────────────────────────────────────────┘
```

> **Diagram source:** [`../assets/diagrams/architecture-test-uat.mmd`](../assets/diagrams/architecture-test-uat.mmd) (Mermaid v11)

---

## 3. Thành phần chi tiết

### 3.1 VM

**Hostname:** `shwsap1t.bank.local` (FQDN — TBD theo chuẩn DNS bank)
**Hypervisor:** Hyper-V
**OS:** Red Hat Enterprise Linux 9.6 (Plow) minimal install
**Docker:** Docker CE 27.x (cài offline từ build station bundle)
**Compose file:** base `docker-compose.yml` (topology all-in-one, **giữ** `plane-db`/`plane-redis`/`plane-mq`/`plane-minio` — KHÁC PROD vốn tắt `plane-db`).

> **Air-gap deploy:** không build image trong bank → dùng **image SHB prebuilt** (cùng `dist/` như PROD) load qua `docker load`, áp `docker-compose.shb.yml` (chỉ override tag) lên base compose. Đây là điểm khác bản thiết kế gốc (vốn giả định build từ Dockerfile); chi tiết [`../02-installation/test-uat/02-docker-allinone.md`](../02-installation/test-uat/02-docker-allinone.md).

### 3.2 Containers (theo Plane upstream)

| Container      | Image                                 | Vai trò                                              | Khác PROD        |
| -------------- | ------------------------------------- | ---------------------------------------------------- | ---------------- |
| `proxy`        | Build từ `apps/proxy/Dockerfile.ce`   | Nginx + TLS termination                              | Giống PROD       |
| `web`          | Build từ `apps/web/Dockerfile`        | Frontend (React + Vite)                              | Giống PROD       |
| `space`        | Build từ `apps/space/Dockerfile`      | Public space                                         | Giống PROD       |
| `admin`        | Build từ `apps/admin/Dockerfile`      | God-mode panel                                       | Giống PROD       |
| `live`         | `makeplane/plane-live` (prebuilt)     | WebSocket realtime                                   | Giống PROD       |
| `api`          | Build từ `apps/api/Dockerfile`        | Django REST API                                      | Số worker ít hơn |
| `worker`       | Cùng image `api`, command Celery      | Background jobs                                      | 2 concurrency    |
| `beat-worker`  | Cùng image `api`, command Celery beat | Cron                                                 | Giống PROD       |
| `migrator`     | Cùng image `api`, one-shot `migrate`  | DB migration lúc deploy rồi exit                     | Giống PROD       |
| `plane-redis`  | `redis:7-alpine`                      | Cache + pub/sub                                      | Giống PROD       |
| `plane-mq`     | `rabbitmq:3.13.6-management-alpine`   | Celery broker                                        | Giống PROD       |
| **`plane-db`** | **`postgres:15.7-alpine`**            | **DATABASE — container (KHÁC PROD: PROD là native)** | ⚠️ KHÁC          |
| `plane-minio`  | `minio/minio`                         | Object storage                                       | Giống PROD       |

---

## 4. Phân bổ tài nguyên (8 vCPU / 16 GB)

UAT chạy đủ cho 30 user pilot, không cần stress test cao như PROD.

| Container              | CPU limit | RAM limit    | Ghi chú                          |
| ---------------------- | --------- | ------------ | -------------------------------- |
| proxy                  | 0.3       | 256 MB       | TLS termination                  |
| web                    | 0.3       | 384 MB       | Vite preview                     |
| space                  | 0.2       | 256 MB       |                                  |
| admin                  | 0.2       | 256 MB       |                                  |
| live                   | 0.2       | 256 MB       | WebSocket realtime               |
| api (gunicorn)         | 1.5       | 3 GB         | **4 workers** (vs 8 PROD)        |
| worker                 | 1.0       | 1.5 GB       | **2 concurrency** (vs 4 PROD)    |
| beat-worker            | 0.2       | 256 MB       | Celery beat                      |
| plane-db               | 1.5       | 4 GB         | shared_buffers=1GB (vs PROD 4GB) |
| plane-redis            | 0.3       | 512 MB       |                                  |
| plane-mq               | 0.5       | 512 MB       | RabbitMQ                         |
| plane-minio            | 0.3       | 512 MB       |                                  |
| **OS + Docker engine** | 1.5       | ~3.75 GB     | Page cache, syslog               |
| **Tổng**               | **~8**    | **~15.4 GB** | `migrator` one-shot — không tính |

**PG container config UAT (đơn giản):**

```ini
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 8MB
max_connections = 100
wal_level = minimal     # UAT không cần replica/PITR
max_wal_senders = 0
```

---

## 5. Storage layout

UAT đơn giản — không SAN, chỉ local disk theo convention `/u01`:

```
UAT VM filesystem layout
├── /                          (local VHDX 30 GB, OS)
└── /u01/                     (local VHDX 100 GB, XFS) — Docker data root
    └── /u01/docker/
        ├── /u01/docker/volumes/    (named volumes)
        │   ├── pgdata/             (Postgres data)
        │   ├── redisdata/          (Redis)
        │   ├── rabbitmq_data/      (RabbitMQ)
        │   └── uploads/            (MinIO)
        └── /u01/docker/overlay2/   (container layers)
```

**Cấu hình Docker data root:** Thay đổi `/etc/docker/daemon.json`:

```json
{
  "data-root": "/u01/docker",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
```

> UAT giữ `json-file` (không có user `mon` — khác PROD/DR dùng `journald` để `mon` đọc log read-only, xem `04` §2.3 + `05` §7.3).

**Backup UAT:**

- KHÔNG cần WAL archive
- Snapshot VM Hyper-V trước mỗi đợt test lớn (rollback nhanh)
- Hoặc `pg_dump` weekly để có copy logical

---

## 6. Network & Auth

### 6.1 Network

- VM IP: `10.94.30.10` (placeholder UAT VLAN — chờ network team xác nhận, xem `04` §2.2)
- Port expose: chỉ 443 (HTTPS) qua Nginx proxy
- DNS: `shwsap1t.bank.local` → IP UAT
- Firewall: chỉ allow inbound từ subnet user bank
- Outbound: VM cần kết nối được LDAP/SwingSSO server bank (auth flow)

### 6.2 TLS

- Cert internal CA bank cho `shwsap1t.bank.local`
- Lifetime ≥ 1 năm (renew workflow giống PROD)
- Cipher suite theo policy bank
- HSTS bật

### 6.3 Auth — dual mode

UAT bật **CẢ HAI** auth backend trong Django settings:

```python
AUTHENTICATION_BACKENDS = [
    'plane.auth.backends.SwingSSOBackend',     # SwingSSO (giống PROD)
    'django.contrib.auth.backends.ModelBackend' # Local user (cho dev/QA)
]
```

**Use case:**

- **SwingSSO**: test flow auth thật, giống PROD — bắt buộc cho UAT acceptance
- **Local user**: dev/QA tạo user thủ công để switch giữa các role (admin, member, guest) mà không cần phải vào SwingSSO admin panel mỗi lần

**Tạo local user (UAT only):**

```bash
docker exec -it shwsap1t-api python manage.py createsuperuser
docker exec -it shwsap1t-api python manage.py shell -c "
from django.contrib.auth import get_user_model
U = get_user_model()
U.objects.create_user(username='qa.test1', email='qa1@bank.local', password='...')
"
```

⚠️ **PROD KHÔNG bật local user backend** — chỉ SwingSSO.

### 6.4 External services

| Dịch vụ                     | Trạng thái      | Mục đích                                                                    |
| --------------------------- | --------------- | --------------------------------------------------------------------------- |
| **SMTP** (bank mail server) | ✅ Đã thiết lập | Notification: invitation, mention, comment, password reset (cho local user) |
| LDAP/SwingSSO               | ✅ Đã thiết lập | Auth flow                                                                   |

Cấu hình SMTP trong `.env` của UAT:

```
EMAIL_HOST=<bank-smtp-server>
EMAIL_PORT=587
EMAIL_HOST_USER=<service-account>
EMAIL_HOST_PASSWORD=<secret>
EMAIL_USE_TLS=1
DEFAULT_FROM_EMAIL=noreply-shws-uat@bank.local
```

---

## 7. Lifecycle & reset workflow

UAT là môi trường disposable. Quy trình reset chuẩn:

### 7.1 Soft reset (giữ data, reset cache/queue)

```bash
docker compose restart plane-redis plane-mq
docker exec plane-redis redis-cli FLUSHDB
```

### 7.2 Full reset (xóa toàn bộ data)

```bash
docker compose down -v          # Stop + remove volumes
docker compose up -d             # Restart fresh
# Sau đó: tạo lại fixture data hoặc restore từ snapshot UAT
```

### 7.3 Reset với snapshot Hyper-V

- Trước test lớn: tạo Hyper-V production checkpoint
- Sau test: revert về checkpoint → trạng thái pre-test 100%
- Đây là **cách an toàn nhất** cho UAT

### 7.4 Cadence

- **Sau mỗi release:** reset toàn bộ trước khi test version mới
- **Cuối sprint:** weekly reset để tránh data drift
- **Trước UAT user pilot:** seed fixture data sạch + tài khoản test

---

## 8. So sánh với PROD

Table này quan trọng — UAT giống PROD đủ để test, nhưng đơn giản hơn để vận hành.

| Khía cạnh     | PROD (`shwsap1p` + `shwsdb1p`)   | UAT (`shwsap1t`)                                                |
| ------------- | -------------------------------- | --------------------------------------------------------------- |
| Số node       | 2 node                           | 1 node all-in-one                                               |
| Postgres      | **Native trên RHEL 9.6**         | **Docker container `postgres:15.7-alpine`**                     |
| Storage       | EMC SAN 3 LUN multipath          | Local VHDX                                                      |
| Compose file  | `docker-compose.shb.yml`         | `docker-compose.yml` mặc định                                   |
| HA / DR       | Standby + WAL archive            | Không có                                                        |
| Backup        | pgBackRest + WAL continuous      | Hyper-V snapshot + pg_dump weekly                               |
| Auth backend  | Chỉ SwingSSO                     | SwingSSO + local user                                           |
| Monitoring    | Full Prometheus stack            | **Không có** (giai đoạn 1) — dùng `docker stats` ad-hoc khi cần |
| Audit log     | Forward SIEM                     | Local only                                                      |
| Resource      | 16 vCPU / 32 GB (2 VM)           | 8 vCPU / 16 GB (1 VM)                                           |
| Update cycle  | Quarterly patching, careful      | Anytime, reset thoải mái                                        |
| TLS cert      | Bank internal CA, mTLS giữa node | Bank internal CA, chỉ TLS edge                                  |
| User capacity | 1000 user / 100 CCU              | 20–30 pilot user                                                |

---

## 9. Resilience & failure modes (UAT — đơn giản hơn PROD)

| Failure                 | Tác động UAT                 | Mitigation                                         |
| ----------------------- | ---------------------------- | -------------------------------------------------- |
| Container crash         | Service đó lỗi               | `restart: unless-stopped` auto-restart             |
| VM crash                | Toàn bộ UAT xuống            | Restart VM, Docker compose tự up lại               |
| Postgres container chết | DB lost data nếu volume hỏng | Restore từ Hyper-V snapshot                        |
| Disk đầy                | Container fail               | Monitor disk, cleanup `docker system prune`        |
| Bad deployment          | UAT lỗi                      | Rollback bằng Hyper-V revert checkpoint (< 5 phút) |

UAT KHÔNG có SLA — tester chấp nhận downtime.

---

## 10. Risk

| Risk                                     | Severity | Mitigation                                                   |
| ---------------------------------------- | -------- | ------------------------------------------------------------ |
| Data UAT khác PROD → test miss vấn đề    | High     | Seed fixture data realistic (1000 issue, 50 project minimal) |
| Local user backend bị bật trên PROD nhầm | Critical | ENV var khác biệt UAT/PROD, kiểm tra checklist deploy        |
| UAT pass nhưng PROD fail                 | Medium   | UAT phải dùng cùng version image, cùng RHEL 9.6              |
| Postgres container drift với PROD native | Medium   | Cùng version 15.7, monitor sự khác biệt config               |
| Cert UAT expire                          | Low      | Reuse cert workflow PROD, monitor expiry                     |

---

## 11. Decisions liên quan (ADR)

- [`ADR-001`](../05-change-log/decisions/adr-001-postgres-native-vs-docker.md) — Docker PG cho UAT (vs Native cho PROD)
- [`ADR-002`](../05-change-log/decisions/adr-002-rhel-version.md) — RHEL 9.6 cả 3 môi trường
- [`ADR-003`](../05-change-log/decisions/adr-003-postgres-version.md) — PostgreSQL 15.7

---

## 12. Cross-references

- PROD architecture: [`01-architecture-prod.md`](./01-architecture-prod.md)
- DR site architecture: [`03-architecture-dr-site.md`](./03-architecture-dr-site.md)
- Network design: [`04-network-design.md`](./04-network-design.md)
- Security design (auth dual mode): [`05-security-design.md`](./05-security-design.md)
- Database design: [`06-database-design.md`](./06-database-design.md)
- Install UAT: [`../02-installation/test-uat/`](../02-installation/test-uat/)
- Testing plans (chạy trên UAT): [`../04-testing/`](../04-testing/)

---

## 13. Câu hỏi mở

- [ ] IP cụ thể của VM UAT (chờ network team cấp)
- [ ] FQDN cuối cùng theo chuẩn DNS bank — `shwsap1t.bank.local`?
- [ ] Bank cho phép UAT VM kết nối LDAP/SwingSSO server không, hay phải qua firewall rules riêng?
- [ ] Cadence reset chính thức: weekly/sprint/release? — đề xuất sau mỗi release
- [ ] Seed data fixture có cần coordinate với business team không (data realistic)?
