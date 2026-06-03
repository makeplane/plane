# 04 — Thiết kế Network — Shinhan Workspace (SHWS)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-29
**Phiên bản:** 0.3
**Owner:** duonglx

---

## 1. Tóm tắt thiết kế

Network cho SHWS tách thành **3 VLAN/subnet riêng** theo môi trường (PROD/DR/UAT), trên **VLAN bank 10.94.0.0/16**. Mọi server đặt theo scheme `10.94.{env}.{role}` để dễ vận hành.

**Nguyên tắc:**

| Nguyên tắc               | Áp dụng                                                      |
| ------------------------ | ------------------------------------------------------------ |
| Subnet per environment   | PROD ↔ DR ↔ UAT không định tuyến trực tiếp (trừ replication) |
| Least privilege firewall | Chỉ mở port cần thiết, default deny                          |
| Internal traffic only    | Toàn bộ stack KHÔNG expose internet, chỉ LAN bank            |
| Docker network isolated  | Bridge network riêng, không trùng host VLAN                  |
| Monitoring path tách     | Metrics qua management subnet riêng                          |
| TLS everywhere           | Inter-node + replication đều mTLS với cert bank internal CA  |

> **Lưu ý:** Phần dải IP `xxx.xx` cuối là **tạm thời**. Bank network team sẽ cấp số chính thức trước cài đặt. Tài liệu dùng placeholder để mô tả pattern.

---

## 2. IP allocation scheme

### 2.1 Quy ước phân lớp

```
10.94.{env}.{role}/24
        ↑      ↑
        │      └── 10 = APP node, 11 = DATA node, 20-29 = future expansion
        └─────── 10 = PROD, 20 = DR, 30 = UAT, 40 = Management
```

### 2.2 Bảng IP đề xuất

| Server        | Hostname     | Subnet        | IP đề xuất    | Gateway    | Note                                                                      |
| ------------- | ------------ | ------------- | ------------- | ---------- | ------------------------------------------------------------------------- |
| **PROD APP**  | `shwsap1p`   | 10.94.10.0/24 | `10.94.10.10` | 10.94.10.1 | LAN PROD                                                                  |
| **PROD DATA** | `shwsdb1p`   | 10.94.10.0/24 | `10.94.10.11` | 10.94.10.1 | LAN PROD                                                                  |
| **DR APP**    | `shwsap1dr`  | 10.94.20.0/24 | `10.94.20.10` | 10.94.20.1 | LAN DR                                                                    |
| **DR DATA**   | `shwsdb1dr`  | 10.94.20.0/24 | `10.94.20.11` | 10.94.20.1 | LAN DR                                                                    |
| **UAT VM**    | `shwsap1t`   | 10.94.30.0/24 | `10.94.30.10` | 10.94.30.1 | LAN UAT                                                                   |
| Build station | `shws-build` | 10.94.40.0/24 | `10.94.40.10` | 10.94.40.1 | Management                                                                |
| Monitoring    | `shws-mon`   | 10.94.40.0/24 | `10.94.40.20` | 10.94.40.1 | Mgmt — điểm scrape của **Prometheus bank** (không dựng stack mới, xem 08) |

### 2.3 Docker internal networks (KHÔNG trùng host VLAN)

Để tránh đụng dải `10.94.0.0/16` của bank, Docker dùng **172.30.0.0/16**:

| Stack                  | Bridge network  | CIDR             | Containers                                                                                |
| ---------------------- | --------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| PROD APP (`shwsap1p`)  | `shws_prod_net` | `172.30.10.0/24` | proxy, web, space, admin, live, api, worker, beat-worker, migrator, plane-redis, plane-mq |
| UAT (`shwsap1t`)       | `shws_uat_net`  | `172.30.30.0/24` | All 11 containers (kể cả plane-db)                                                        |
| DR APP (`shwsap1dr`)   | `shws_dr_net`   | `172.30.20.0/24` | All containers (down trừ khi failover)                                                    |
| PROD DATA (`shwsdb1p`) | `shws_data_net` | `172.30.11.0/24` | plane-minio, postgres_exporter, node_exporter                                             |
| DR DATA (`shwsdb1dr`)  | `shws_data_net` | `172.30.21.0/24` | Same as PROD DATA                                                                         |

**Cấu hình `daemon.json`** (ví dụ PROD APP):

```json
{
  "default-address-pools": [{ "base": "172.30.10.0/24", "size": 28 }],
  "bip": "172.30.10.1/24",
  "log-driver": "journald"
}
```

> **`log-driver: journald` (PROD/DR):** bắt buộc để `mon` đọc log container read-only qua `journalctl` (group `systemd-journal`, không cần docker group — xem `05` §7.3). UAT giữ `json-file` (không có user `mon`). **02-installation/prod runbook phải đồng bộ giá trị này.**

---

## 3. Sơ đồ network tổng thể

```
                            INTERNET (KHÔNG access)
                                     │
                                     ▼ block toàn bộ
   ┌────────────────────────────────────────────────────────────────────┐
   │                      BANK INTERNAL NETWORK                          │
   │                       (10.94.0.0/16)                                │
   │                                                                      │
   │   PROD VLAN 10.94.10.0/24            DR VLAN 10.94.20.0/24          │
   │  ┌──────────────────────────┐       ┌──────────────────────────┐    │
   │  │ shwsap1p .10:443 HTTPS◄──┼─USER──┤                          │    │
   │  │   │ proxy → app          │       │ shwsap1dr .10 cold       │    │
   │  │   │ 172.30.10.0/24       │       │ 172.30.20.0/24           │    │
   │  │   ▼                      │       │                          │    │
   │  │ shwsdb1p .11:5432,9000   ├──WAN──┤ shwsdb1dr .11            │    │
   │  │  /u01,/u02,/u03 SAN      │ 1Gbps │  /u01,/u02,/u03 SAN      │    │
   │  └──────────────────────────┘       └──────────────────────────┘    │
   │                ▲                                                     │
   │                │ ① PG streaming async (WAL) — repo riêng/site        │
   │                                                                      │
   │   UAT VLAN 10.94.30.0/24            MGMT VLAN 10.94.40.0/24          │
   │  ┌──────────────────────────┐       ┌──────────────────────────┐    │
   │  │ shwsap1t .10:443 ◄──QA───┤       │ shws-build .10            │    │
   │  │ all-in-one Docker        │       │ (offline bundle station)  │    │
   │  │ 172.30.30.0/24           │       │ shws-mon .20 (optional)   │    │
   │  └──────────────────────────┘       └──────────────────────────┘    │
   │                                                                      │
   │   BANK SHARED SERVICES                                               │
   │  ┌──────────────────────────────────────────────────────────────┐    │
   │  │ LDAP/SwingSSO (389/636) · SMTP (587) · NTP (123) · DNS (53)  │    │
   │  │ SIEM Syslog (514) · NAS Backup (445/2049)                    │    │
   │  └──────────────────────────────────────────────────────────────┘    │
   └────────────────────────────────────────────────────────────────────┘
```

---

## 4. Port matrix — Inbound rules cho mỗi server

### 4.1 `shwsap1p` (PROD APP) — Inbound

| From source            | To dest    | Port  | Protocol | Service           | Mục đích          |
| ---------------------- | ---------- | ----- | -------- | ----------------- | ----------------- |
| Bank user subnet       | `shwsap1p` | 443   | TCP/TLS  | Nginx proxy       | HTTPS user access |
| Build station          | `shwsap1p` | 22    | TCP      | SSH               | Deploy + ops      |
| Prometheus bank (mgmt) | `shwsap1p` | 9100  | TCP      | node_exporter     | System metrics    |
| Prometheus bank (mgmt) | `shwsap1p` | 8080  | TCP      | cadvisor          | Container metrics |
| Prometheus bank (mgmt) | `shwsap1p` | 9113  | TCP      | nginx-exporter    | HTTP req/4xx/5xx  |
| Prometheus bank (mgmt) | `shwsap1p` | 9121  | TCP      | redis_exporter    | Redis metrics     |
| Prometheus bank (mgmt) | `shwsap1p` | 15692 | TCP      | rabbitmq (plugin) | Queue metrics     |
| Bank network admin     | `shwsap1p` | ICMP  | ICMP     | Ping              | Health check      |
| **All other**          | `shwsap1p` | \*    | \*       | —                 | **DENY**          |

### 4.2 `shwsdb1p` (PROD DATA) — Inbound

| From source               | To dest    | Port | Protocol | Service           | Mục đích                                           |
| ------------------------- | ---------- | ---- | -------- | ----------------- | -------------------------------------------------- |
| `shwsap1p` (10.94.10.10)  | `shwsdb1p` | 5432 | TCP/TLS  | PostgreSQL        | API → DB (kết nối trực tiếp)                       |
| `shwsap1p`                | `shwsdb1p` | 9000 | TCP      | MinIO API         | API → object storage (HTTP, private VLAN)          |
| `shwsdb1dr` (10.94.20.11) | `shwsdb1p` | 5432 | TCP/TLS  | PostgreSQL        | **PG streaming — standby (DR) pull (LUỒNG CHÍNH)** |
| Build station             | `shwsdb1p` | 22   | TCP      | SSH               | DBA ops                                            |
| Prometheus bank (mgmt)    | `shwsdb1p` | 9100 | TCP      | node_exporter     | System metrics                                     |
| Prometheus bank (mgmt)    | `shwsdb1p` | 9187 | TCP      | postgres_exporter | DB metrics                                         |
| **All other**             | `shwsdb1p` | \*   | \*       | —                 | **DENY**                                           |

### 4.3 `shwsap1dr` (DR APP) — Inbound

| From source              | To dest     | Port | Protocol | Service       | Mục đích                                |
| ------------------------ | ----------- | ---- | -------- | ------------- | --------------------------------------- |
| Bank user subnet         | `shwsap1dr` | 443  | TCP/TLS  | Nginx         | **Chỉ sau failover**                    |
| Build station            | `shwsap1dr` | 22   | TCP      | SSH           | Ops                                     |
| Prometheus bank (mgmt)   | `shwsap1dr` | 9100 | TCP      | node_exporter | System metrics                          |
| **Normal (no failover)** | \*          | \*   | \*       | —             | **DENY user traffic** (containers down) |

### 4.4 `shwsdb1dr` (DR DATA) — Inbound

| From source              | To dest     | Port       | Protocol            | Service    | Mục đích                                            |
| ------------------------ | ----------- | ---------- | ------------------- | ---------- | --------------------------------------------------- |
| `shwsdb1p` (10.94.10.11) | `shwsdb1dr` | 5432       | TCP/TLS             | PostgreSQL | **FAILBACK ONLY** (khi PROD làm standby pull từ DR) |
| `shwsap1dr`              | `shwsdb1dr` | 5432, 9000 | 5432 TLS · 9000 TCP | —          | Sau failover (MinIO HTTP private VLAN)              |
| Build station            | `shwsdb1dr` | 22         | TCP                 | SSH        | DBA ops                                             |
| Prometheus bank (mgmt)   | `shwsdb1dr` | 9100, 9187 | TCP                 | exporters  | Metrics                                             |

> **File MinIO DC→DR không dùng port 9000 app-level** (đã bỏ `mc mirror`). Đồng bộ qua **DELL EMC storage replication** (platform tier ②), do **ICTP (hạ tầng)** đảm nhiệm mặc định — ngoài phạm vi firewall server của SHWS (xem ADR-009).

### 4.5 `shwsap1t` (UAT) — Inbound

| From source               | To dest    | Port | Protocol | Service       | Mục đích                                |
| ------------------------- | ---------- | ---- | -------- | ------------- | --------------------------------------- |
| Bank user (QA/dev) subnet | `shwsap1t` | 443  | TCP/TLS  | Nginx         | UAT access                              |
| Build station             | `shwsap1t` | 22   | TCP      | SSH           | Ops                                     |
| Optional Prometheus bank  | `shwsap1t` | 9100 | TCP      | node_exporter | Metrics (UAT GĐ1 không bật — xem 02 §8) |

---

## 5. Outbound rules — Mỗi server cần gọi ra đâu

### 5.1 `shwsap1p` (PROD APP) — Outbound

| To dest                  | Port       | Protocol     | Service    | Mục đích                                  |
| ------------------------ | ---------- | ------------ | ---------- | ----------------------------------------- |
| `shwsdb1p` (10.94.10.11) | 5432       | TCP/TLS      | PostgreSQL | API queries DB                            |
| `shwsdb1p` (10.94.10.11) | 9000       | TCP          | MinIO      | File upload/download (HTTP, private VLAN) |
| Bank LDAP server         | 636        | TCP/TLS      | LDAPS      | Auth                                      |
| Bank SwingSSO endpoint   | 443        | TCP/TLS      | HTTPS      | SSO auth                                  |
| Bank SMTP server         | 587        | TCP/STARTTLS | SMTP       | Email notification                        |
| Bank NTP server          | 123        | UDP          | NTP        | Time sync                                 |
| Bank DNS server          | 53         | UDP/TCP      | DNS        | Name resolution                           |
| Bank SIEM                | 514 / 6514 | TCP/TLS      | Syslog     | Audit log forward                         |
| **All other**            | \*         | \*           | —          | **DENY** (no internet)                    |

### 5.2 `shwsdb1p` (PROD DATA) — Outbound

| To dest                     | Port       | Protocol | Service    | Mục đích                                              |
| --------------------------- | ---------- | -------- | ---------- | ----------------------------------------------------- |
| `shwsdb1dr` (10.94.20.11)   | 5432       | TCP/TLS  | PostgreSQL | **FAILBACK ONLY** (luồng chính là DR pull — xem §5.3) |
| Bank NAS (optional offsite) | 445 / 2049 | TCP      | SMB / NFS  | pgBackRest offsite copy                               |
| Bank NTP server             | 123        | UDP      | NTP        | Time sync (rất quan trọng cho DB)                     |
| Bank DNS server             | 53         | UDP      | DNS        |                                                       |
| Bank SIEM                   | 514 / 6514 | TCP/TLS  | Syslog     | Audit log                                             |
| **All other**               | \*         | \*       | —          | **DENY**                                              |

### 5.3 `shwsdb1dr` (DR DATA) — Outbound

| To dest             | Port       | Protocol | Service    | Mục đích                                                 |
| ------------------- | ---------- | -------- | ---------- | -------------------------------------------------------- |
| `shwsdb1p`          | 5432       | TCP/TLS  | PostgreSQL | **LUỒNG CHÍNH** — standby (DR) pull streaming từ primary |
| Bank NAS            | 445 / 2049 | TCP      | —          | DR backup offsite                                        |
| Bank NTP, DNS, SIEM | (như trên) | —        | —          | —                                                        |

### 5.4 `shwsap1t` (UAT) — Outbound

Giống `shwsap1p` nhưng:

- `shwsdb1p` → KHÔNG (UAT có DB container nội bộ, không cần DATA node)
- LDAP/SwingSSO/SMTP/NTP/DNS → Có (test auth thật)

---

## 6. Flow diagrams chi tiết per service

### 6.1 Flow: User login

```
Bank user (10.94.X.X)
   │ HTTPS 443
   ▼
shwsap1p:443  (Nginx proxy)
   │ HTTP 80 internal (Docker bridge 172.30.10.0/24)
   ▼
proxy container ──► api container (172.30.10.X:8000)
                       │ LDAP 636 outbound
                       ▼
                   Bank LDAP server
                       │ (response)
                       ▼
                   api container ──► JWT/session
                       │
                       ▼
                   User logged in
```

### 6.2 Flow: User tạo issue → save to DB

```
User browser
   │ HTTPS POST /api/issues/
   ▼
shwsap1p:443 (proxy) ──► api container
                            │ TCP 5432 → shwsdb1p
                            ▼
                        shwsdb1p:5432 (PostgreSQL)
                            │ Write to /u01/pgsql/15/data/
                            │ WAL to /u02/pgsql/15/wal/
                            ▼
                        Streaming async to shwsdb1dr (WAN 1Gbps)
                            │
                            ▼
                        shwsdb1dr:5432 replica replays WAL
                            │
                            ▼
                        pg_stat_replication lag ~30s
```

### 6.3 Flow: User upload attachment → MinIO

```
User browser
   │ HTTPS POST file (multipart)
   ▼
shwsap1p:443 (proxy → api container)
   │ api validates, generates presigned URL
   ▼
User PUT file → shwsap1p:443/<minio-prefix>
   │ proxy reverse → shwsdb1p:9000 (MinIO)
   ▼
shwsdb1p:9000 (MinIO container)
   │ Write to /u01/minio/uploads/...
   │
   ▼ DELL EMC storage replication (ICTP — platform tier ②, xem ADR-009)
shwsdb1dr — /u01/minio/uploads/ (đồng bộ mức storage, KHÔNG mc mirror app-level)
```

### 6.4 Flow: Background job (Celery)

```
api container produces task
   │ AMQP 5672 internal (172.30.10.0/24)
   ▼
rabbitmq container (broker)
   │ AMQP consume
   ▼
worker container (Celery)
   │ Job execution: send email, generate report, etc.
   ├─► SMTP 587 outbound to bank SMTP
   ├─► TCP 5432 → shwsdb1p (read/write DB)
   └─► TCP 9000 → shwsdb1p (MinIO if needed)
```

### 6.5 Flow: pgBackRest backup → NAS offsite

```
Cron 02:00 daily trên shwsdb1p
   │
   ▼
pgbackrest backup --type=incr
   │ Read from /u01/pgsql/15/data + /u02/pgsql/15/wal
   │ Write to /u03/pgbackup/
   │
   ▼ async copy
rsync/SMB to bank NAS (445)
   │
   ▼
NAS offsite — encrypted AES-256
```

### 6.6 Flow: Audit log → SIEM

```
Mọi server (shwsap1p, shwsdb1p, ...)
   │
   ├─► Postgres log (auth attempts, slow query, error)
   ├─► OS syslog (login, sudo, systemd)
   ├─► Docker container logs (json-file driver)
   └─► Nginx access log
        │
        ▼
   rsyslog → forward TCP 514 (hoặc TLS 6514)
        │
        ▼
   Bank SIEM endpoint
```

---

## 7. DNS

### 7.1 Bank internal DNS records cần tạo

| FQDN                   | Type  | Target                | Note                                   |
| ---------------------- | ----- | --------------------- | -------------------------------------- |
| `shwsap1p.bank.local`  | A     | 10.94.10.10           | PROD APP                               |
| `shwsdb1p.bank.local`  | A     | 10.94.10.11           | PROD DATA                              |
| `shwsap1dr.bank.local` | A     | 10.94.20.10           | DR APP                                 |
| `shwsdb1dr.bank.local` | A     | 10.94.20.11           | DR DATA                                |
| `shwsap1t.bank.local`  | A     | 10.94.30.10           | UAT                                    |
| **`shws.bank.local`**  | CNAME | `shwsap1p.bank.local` | User-facing, switch CNAME khi failover |
| `shws-uat.bank.local`  | CNAME | `shwsap1t.bank.local` | UAT user-facing                        |

**Failover DNS:** Đổi CNAME `shws.bank.local` từ trỏ `shwsap1p` sang `shwsap1dr`. TTL nên đặt **60s** để propagate nhanh.

### 7.2 Hosts file (build station) cho deploy

Trong giai đoạn ban đầu, build station có thể dùng `/etc/hosts` để override DNS cho test:

```
10.94.10.10  shwsap1p.bank.local
10.94.10.11  shwsdb1p.bank.local
```

---

## 8. TLS & Certificate

### 8.1 Cert allocation

| FQDN                           | Cert type              | Issuer           | Lifetime |
| ------------------------------ | ---------------------- | ---------------- | -------- |
| `shws.bank.local`              | Server                 | Bank internal CA | 1-2 năm  |
| `shws-uat.bank.local`          | Server                 | Bank internal CA | 1 năm    |
| `shwsdb1p.bank.local`          | Server + Client (mTLS) | Bank internal CA | 1-2 năm  |
| `shwsdb1dr.bank.local`         | Server + Client (mTLS) | Bank internal CA | 1-2 năm  |
| `shwsap1p` (replicator client) | Client (mTLS)          | Bank internal CA | 1 năm    |

> **MinIO (port 9000) = HTTP, KHÔNG TLS:** MinIO chỉ phục vụ hop nội bộ APP↔DATA trong **VLAN private** (không expose ra ngoài), chấp nhận plaintext để đơn giản vận hành — không cấp cert MinIO. App nối `http://10.94.10.11:9000` (`AWS_S3_ENDPOINT_URL`). Đồng bộ `01 §2` + `05 §5.3` + install runbook `02-installation/prod`.

### 8.2 TLS endpoints

- **External (user → proxy):** TLS 1.2/1.3, cipher theo policy bank
- **Internal (api → PG):** PG `ssl=on`, `sslmode=verify-ca` từ phía client
- **Replication (primary → standby):** mTLS bắt buộc
- **MinIO:** HTTP nội VLAN private (APP↔DATA cùng tier, không expose ngoài) — chấp nhận plaintext, không TLS (xem §8.1)
- **Syslog → SIEM:** RELP/TLS port 6514 (nếu bank hỗ trợ)

---

## 9. WAN PROD ↔ DR

**Topology:** Kênh dành riêng 1 Gbps (MPLS hoặc dark fiber tùy hạ tầng bank).

**Subnet routing:**

- PROD VLAN 10.94.10.0/24 ↔ DR VLAN 10.94.20.0/24 chỉ định tuyến qua **WAN dedicated**, KHÔNG qua internet
- IPSec/MACSec encryption nếu kênh không physically secure
- BGP hoặc static route theo policy bank

**QoS / Bandwidth allocation:**

| Traffic class            | Priority | Bandwidth           | Window |
| ------------------------ | -------- | ------------------- | ------ |
| PG streaming replication | High     | Guaranteed 100 Mbps | 24/7   |
| Monitoring federation    | Low      | 1 Mbps              | 24/7   |

> **WAN app-level SHWS chỉ gồm PG streaming + monitoring.** pgBackRest **KHÔNG** ship qua WAN (repo độc lập từng site — xem 03 §8). File MinIO + platform đồng bộ qua **DELL EMC storage replication (ICTP)**, nằm ngoài WAN app-level (ADR-009).

**Failure handling:**

- WAN ngắt > 5 phút → alert SRE
- WAN ngắt > 1 giờ → escalate, monitor `wal_keep_size` không cạn

---

## 10. Firewall summary

### 10.1 Default deny

Mọi VLAN: **default DENY inbound** + DENY outbound, chỉ allow theo whitelist trong section 4-5.

### 10.2 Cross-VLAN rules

| From      | To        | Allow              | Note                                                                                |
| --------- | --------- | ------------------ | ----------------------------------------------------------------------------------- |
| User VLAN | PROD VLAN | 443/TCP            | User access only                                                                    |
| DR VLAN   | PROD VLAN | 5432               | **PG streaming LUỒNG CHÍNH** — standby pull (file/platform qua EMC, ngoài firewall) |
| PROD VLAN | DR VLAN   | 5432               | **FAILBACK ONLY** (PROD tạm làm standby pull từ DR)                                 |
| UAT VLAN  | PROD VLAN | **DENY**           | Strict isolation                                                                    |
| UAT VLAN  | DR VLAN   | **DENY**           | Strict isolation                                                                    |
| Mgmt VLAN | All       | 22, exporter ports | Build + monitor                                                                     |

### 10.3 Internet access

| Direction                   | Status                         |
| --------------------------- | ------------------------------ |
| Internet → All SHWS servers | **DENY (air-gap)**             |
| All SHWS servers → Internet | **DENY (air-gap)**             |
| Build station → Internet    | Allow (bundle prep ngoài bank) |

---

## 11. Decisions liên quan (ADR)

- IP allocation scheme `10.94.{env}.{role}` — pending ADR
- Docker bridge 172.30.0.0/16 — pending ADR (tránh conflict)
- WAN dedicated 1 Gbps — chốt qua bank network team
- TLS internal CA — pending ADR cert workflow

---

## 12. Cross-references

- PROD architecture: [`01-architecture-prod.md`](./01-architecture-prod.md)
- TEST/UAT architecture: [`02-architecture-test-uat.md`](./02-architecture-test-uat.md)
- DR architecture: [`03-architecture-dr-site.md`](./03-architecture-dr-site.md)
- Security design (cert workflow): [`05-security-design.md`](./05-security-design.md)
- Database design (replication setup): [`06-database-design.md`](./06-database-design.md)
- Monitoring design (network metrics): [`08-monitoring-design.md`](./08-monitoring-design.md)
- Install network prerequisites: [`../02-installation/00-prerequisites.md`](../02-installation/00-prerequisites.md)

---

## 13. Câu hỏi mở

- [ ] Bank confirm chính thức IP allocation thực tế (thay placeholder `10.94.X.X`)
- [ ] DNS server bank — IP cụ thể để add vào `/etc/resolv.conf`
- [ ] LDAP/SwingSSO server endpoint cụ thể (FQDN + port)
- [ ] SMTP relay server bank — FQDN + cần authentication không?
- [ ] SIEM endpoint cho syslog forward — protocol (TCP 514, TLS 6514, RELP)?
- [ ] NAS endpoint cho offsite backup — share name + credentials
- [ ] Bank có VIP/F5/Citrix cho user-facing endpoint không, hay chỉ DNS CNAME?
- [ ] WAN PROD ↔ DR — confirm MPLS/dark fiber + RTT thực tế?
- [ ] User VLAN range — IP range của bank user (cần biết để firewall allow source)
- [ ] Build station — đặt trong bank LAN hay ngoài? IP cuối cùng?
- [ ] Cert workflow bank internal CA — manual request hay automated ACME?
