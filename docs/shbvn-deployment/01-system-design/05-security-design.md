# 05 — Thiết kế Bảo mật — Shinhan Workspace (SHWS)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-29
**Phiên bản:** 0.2
**Owner:** duonglx

---

## 1. Tóm tắt thiết kế

Bảo mật SHWS được thiết kế theo **defense-in-depth** với 6 lớp:

| Lớp                    | Cơ chế                                                                       |
| ---------------------- | ---------------------------------------------------------------------------- |
| **L1 — Network**       | VLAN isolation, firewall default-deny, không expose internet                 |
| **L2 — Transport**     | TLS bắt buộc inter-node, mTLS cho replication, cert bank internal CA         |
| **L3 — Auth**          | SwingSSO làm primary, local user chỉ cho UAT                                 |
| **L4 — Authorization** | Plane RBAC (workspace owner/admin/member/guest)                              |
| **L5 — Data**          | Secret file mode 0600, .env tách off-tree, pgcrypto cho field nhạy cảm (tùy) |
| **L6 — Audit**         | Forward SIEM, retention 5 năm (Thông tư 09/2020/TT-NHNN)                     |

**Quyết định chính đã chốt:**

- Secret management: **Plain `.env` file mode 0600, root-only** (không Vault — đơn giản, đủ với physical security + VLAN)
- Audit retention: **5 năm** (chuẩn Thông tư 09/2020/TT-NHNN)
- SSH access: **Hiware PAM proxy** (đã có sẵn trong bank)
- Disk encryption: **Không cần** (VLAN + datacenter security đủ)

---

## 2. Authentication

### 2.1 Auth backends per environment

| Environment           | Primary  | Secondary (fallback) | Local user             |
| --------------------- | -------- | -------------------- | ---------------------- |
| **PROD** (`shwsap1p`) | SwingSSO | ❌ Không có          | ❌ KHÔNG bật           |
| **DR** (`shwsap1dr`)  | SwingSSO | ❌ Không có          | ❌ KHÔNG bật           |
| **UAT** (`shwsap1t`)  | SwingSSO | —                    | ✅ Bật cho dev/QA test |

**Cấu hình Django (PROD/DR):**

```python
AUTHENTICATION_BACKENDS = [
    'plane.auth.backends.SwingSSOBackend',
]
```

**Cấu hình Django (UAT):**

```python
AUTHENTICATION_BACKENDS = [
    'plane.auth.backends.SwingSSOBackend',
    'django.contrib.auth.backends.ModelBackend',   # Local user
]
```

### 2.2 SwingSSO flow

```
User browser → https://shws.bank.local
   │ 401 Unauthorized → redirect SwingSSO login
   ▼
SwingSSO IdP (bank)
   │ User nhập credential + 2FA (theo policy bank)
   │ Authn success → SAML/OIDC token
   ▼
shwsap1p:443 (api) receive token
   │ Validate signature, fetch user attributes
   │ Map SSO attributes → Plane User model
   │ Create session JWT
   ▼
User logged in, redirect dashboard
```

### 2.3 Session management

- **Session cookie**: `Secure`, `HttpOnly`, `SameSite=Lax`
- **Session timeout**: 8 giờ (working day), idle timeout 30 phút
- **JWT signing key**: trong `.env`, rotate yearly
- **Logout**: clear session + invalidate JWT trên server side

### 2.4 Service accounts

| Account      | Mục đích                           | Stored where                                                                   |
| ------------ | ---------------------------------- | ------------------------------------------------------------------------------ |
| `replicator` | PG streaming replication PROD → DR | **mTLS client cert** (không password), key `/u01/pgsql/15/data/replicator.key` |
| `backup`     | pgBackRest stanza execute          | `/etc/pgbackrest/pgbackrest.conf` (+ cipher.conf §4.2)                         |
| `plane_app`  | Django connect to PG               | `/opt/shws-secrets/.env.app` (APP); `postgres.env` (DATA, DBA ref)             |
| `minio_root` | MinIO admin                        | `/opt/shws-secrets/.env.data` (DATA node)                                      |
| `monitoring` | postgres_exporter read-only        | `/opt/shws-secrets/monitoring.env` (DATA — exporter co-located)                |

**Rotation cadence:** Yearly (manual, lên runbook).

---

## 3. Authorization (Plane RBAC)

Plane built-in 4 role levels (xem `apps/api/plane/db/models/workspace.py`):

| Role                 | Quyền cơ bản                                     | Phù hợp ai            |
| -------------------- | ------------------------------------------------ | --------------------- |
| **Workspace Owner**  | Toàn quyền + xóa workspace                       | 1 người (super admin) |
| **Workspace Admin**  | Quản lý member, project, settings (không xóa WS) | Department lead       |
| **Workspace Member** | Tạo/sửa project, issue, comment                  | Nhân viên thường      |
| **Workspace Guest**  | Chỉ xem, comment giới hạn                        | External / read-only  |

**Đặc thù SHBVN:**

- Mỗi department có 1 workspace riêng → Workspace Owner = department head
- Cross-department visibility do Workspace Admin kiểm soát qua invite
- God-mode admin panel (`/god-mode`) — chỉ IT Operations team, allowlist IP

---

## 4. Secret management

### 4.1 Inventory of secrets

| Secret                                    | Where                             | Format                  |
| ----------------------------------------- | --------------------------------- | ----------------------- |
| `SECRET_KEY` (Django)                     | `.env` APP node                   | Random 50 char          |
| `POSTGRES_PASSWORD`                       | `.env` APP node                   | Random 32 char          |
| `RABBITMQ_PASSWORD`                       | `.env` APP node                   | Random 32 char          |
| `REDIS_PASSWORD`                          | `.env` APP node                   | Random 32 char          |
| `MINIO_ROOT_PASSWORD`                     | `.env` DATA node                  | Random 32 char          |
| `AWS_ACCESS_KEY_ID` / `SECRET_ACCESS_KEY` | `.env` (MinIO compat)             | Random                  |
| `JWT_SECRET`                              | `.env` APP node                   | Random 64 char          |
| `SWINGSSO_CLIENT_SECRET`                  | `.env` APP node                   | Bank-issued             |
| `LDAP_BIND_PASSWORD`                      | `.env` APP node                   | Bank-issued             |
| `SMTP_PASSWORD`                           | `.env` APP node                   | Bank-issued             |
| `pgbackrest_repo_cipher_pass`             | pgBackRest config                 | Random 64 char          |
| `replicator` client cert + key            | `/u01/pgsql/15/data/` mode 0600   | PEM (mTLS, no password) |
| TLS private keys                          | `/etc/pki/tls/private/` mode 0600 | PEM                     |

### 4.2 File storage convention

Owner theo mô hình 3-user (§7) — **không owner `root`** do người tạo:

```
/opt/shws-secrets/
├── .env.app           mode 0600  owner shbvn:shbvn        # APP node (Docker env_file)
├── .env.data          mode 0600  owner shbvn:shbvn        # DATA node (minio container)
├── .env.replicator    mode 0600  owner postgres:postgres  # DR DATA only (mTLS — thực tế dùng cert)
├── postgres.env       mode 0600  owner postgres:postgres  # plane_app pw (DBA tham chiếu)
├── monitoring.env     mode 0600  owner shbvn:shbvn         # postgres_exporter (container do shbvn chạy)
└── README.md          mode 0644                            # Reference docs

/etc/pki/tls/private/                                         # Nginx (APP/UAT) — proxy container bind-mount
├── shwsap1p.bank.local.key      mode 0600  owner shbvn:shbvn
└── shws-uat.bank.local.key      mode 0600  owner shbvn:shbvn

/u01/pgsql/15/data/                                          # PostgreSQL certs trong PGDATA (khớp 06)
├── server.key                   mode 0600  owner postgres:postgres   # PG server (shwsdb1p / shwsdb1dr)
└── replicator.key               mode 0600  owner postgres:postgres   # mTLS replication client

/etc/pgbackrest/pgbackrest.conf.d/
└── cipher.conf                  mode 0600  owner postgres:postgres   # repo cipher pass (canonical — khớp 06 §9.2)
```

**Nguyên tắc:**

- Secret file **OFF** working tree (`/opt/shws-secrets/`), KHÔNG đặt trong repo source.
- Mode `0600` (rw owner only); owner theo service: `shbvn` cho secret Docker đọc, `postgres` cho PG/backup.
- Daemon Docker chạy root nhưng đọc `.env` qua `env_file` với UID người gọi (`shbvn`) — không cần secret owner root.
- Symlink `/opt/shws-deployment/.env` → `/opt/shws-secrets/.env.app` (deployment dir nhất quán, dùng dấu gạch nối `shws-deployment`).

### 4.3 Rotation policy

| Secret type              | Cadence                | Triggered by         |
| ------------------------ | ---------------------- | -------------------- |
| Service account password | Yearly                 | Cron + runbook       |
| TLS server cert          | 1-2 năm                | Trước expiry 60 ngày |
| TLS replicator cert      | Yearly                 | Cron alert           |
| JWT signing key          | Yearly                 | Maintenance window   |
| pgBackRest cipher        | 2 năm (encrypt backup) | Maintenance window   |
| Compromise event         | Immediately            | Incident response    |

### 4.4 Anti-patterns (CẤM)

- ❌ Commit `.env` vào git (chỉ `.env.example` template)
- ❌ Secret trong code, default values, comments
- ❌ Log secret (Django filter `SECRET_KEY` khỏi logging)
- ❌ Plaintext password trong DB (Django hash bằng PBKDF2 mặc định)
- ❌ Hardcoded credentials trong Docker Dockerfile
- ❌ Share secret qua chat/email không encrypted

---

## 5. TLS & PKI

Chi tiết cert allocation trong [`04-network-design.md`](./04-network-design.md) §8.

### 5.1 Cert lifecycle

```
1. Request CSR từ bank internal CA team (form yêu cầu chuẩn)
   ├─ Subject: CN=shwsap1p.bank.local, O=SHBVN
   ├─ SAN: shwsap1p, shws.bank.local
   └─ Key: 2048-bit RSA hoặc EC P-256

2. Bank CA team issue cert
   ├─ Lifetime 1-2 năm
   ├─ Sign bằng intermediate CA bank
   └─ Trả về .crt + chain

3. Deploy cert
   ├─ Copy lên server (/etc/pki/tls/certs/)
   ├─ Private key (/etc/pki/tls/private/) mode 0600
   ├─ Reload service (Nginx, Postgres, MinIO)
   └─ Verify với openssl s_client

4. Monitor expiry
   ├─ Alert 60 ngày trước expiry
   ├─ Alert 30 ngày, 7 ngày, 1 ngày
   └─ Auto-renew TBD (bank CA có ACME không?)

5. Renewal: lặp lại bước 1
```

### 5.2 TLS config tiêu chuẩn

**Nginx (`/etc/nginx/conf.d/ssl.conf`):**

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:...';
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
```

**PostgreSQL (`postgresql.conf`):**

```ini
ssl = on
ssl_cert_file = '/u01/pgsql/15/data/server.crt'
ssl_key_file  = '/u01/pgsql/15/data/server.key'
ssl_ca_file   = '/u01/pgsql/15/data/bank-ca.crt'
ssl_prefer_server_ciphers = on
ssl_min_protocol_version = 'TLSv1.2'
```

**mTLS replication (pg_hba.conf trên primary):**

```
hostssl replication replicator 10.94.20.11/32 cert clientcert=verify-full
```

### 5.3 Cert inventory

| FQDN                 | Server                  | Expiry monitor |
| -------------------- | ----------------------- | -------------- |
| shws.bank.local      | shwsap1p (CNAME)        | Yes            |
| shwsap1p.bank.local  | shwsap1p                | Yes            |
| shwsdb1p.bank.local  | shwsdb1p                | Yes            |
| shwsap1dr.bank.local | shwsap1dr               | Yes            |
| shwsdb1dr.bank.local | shwsdb1dr               | Yes            |
| shwsap1t.bank.local  | shwsap1t                | Yes            |
| replicator-client    | shwsdb1dr (client mTLS) | Yes            |

> **MinIO (9000) = HTTP** (nội VLAN private, không expose ngoài — chấp nhận plaintext, không cần cert). Khớp `04 §8.1` + `01 §2`.

---

## 6. Audit logging — 5 năm retention

Theo **Thông tư 09/2020/TT-NHNN** — hệ thống ngân hàng VN phải lưu audit log tối thiểu 5 năm.

### 6.1 Log sources

| Source                   | Loại event                                    | Where                                  |
| ------------------------ | --------------------------------------------- | -------------------------------------- |
| **Nginx access log**     | Mọi HTTP request                              | `/var/log/nginx/access.log`            |
| **Nginx error log**      | 4xx/5xx, exception                            | `/var/log/nginx/error.log`             |
| **Django app log**       | Auth (login/logout), CRUD critical, exception | Docker container log → json-file       |
| **PostgreSQL log**       | Connection, query slow, error, DDL            | `/var/log/postgresql/postgresql-*.log` |
| **pg_audit** (extension) | Auth attempts, DDL, role changes              | Postgres log                           |
| **OS auditd**            | sudo, login, file access                      | `/var/log/audit/audit.log`             |
| **rsyslog**              | systemd events, kernel                        | `/var/log/messages`                    |
| **Docker engine log**    | Container start/stop/crash                    | `journalctl -u docker`                 |
| **pgBackRest log**       | Backup execution                              | `/var/log/pgbackrest/`                 |

### 6.2 Forward to SIEM bank

```
[Mọi server SHWS]
    │
    │ Postgres log + Nginx log + Django log + OS audit
    ▼
rsyslog (local) — buffer + format RFC 5424
    │
    ▼ TCP/TLS 6514 (hoặc TCP 514)
[Bank SIEM endpoint]
    │
    ├─► Hot storage 90 ngày (search nhanh)
    ├─► Warm storage 1 năm
    └─► Cold storage / archive — đến 5 năm minimum
```

**Local buffer:** rsyslog giữ local 30 ngày phòng SIEM ngắt kết nối. Sau đó rotate xóa.

### 6.3 Critical events cần log (Thông tư 09 yêu cầu)

| Event                            | Source             | Mức        |
| -------------------------------- | ------------------ | ---------- |
| User login success/fail          | Django app         | INFO       |
| Account locked / unlocked        | Django app         | WARN       |
| Permission change (role assign)  | Django + DB audit  | WARN       |
| Workspace/project create/delete  | Django app         | INFO       |
| Sensitive data export (CSV/PDF)  | Django app         | INFO       |
| Admin god-mode access            | Django app + Nginx | WARN       |
| Postgres DDL (CREATE/ALTER/DROP) | pg_audit           | INFO       |
| Backup success/failure           | pgBackRest         | INFO/ERROR |
| Failover event                   | Manual + system    | CRITICAL   |
| Sudo execution                   | auditd             | INFO       |
| SSH login (via Hiware)           | Hiware PAM         | INFO       |
| TLS cert change                  | systemd reload     | INFO       |

### 6.4 Log integrity

- **Append-only**: rsyslog forward immediate, không cache lâu
- **TLS to SIEM** (recommended) — chống tamper trong transit
- **SIEM-side checksum** — bank SIEM tự sign log để chống sửa
- **Backup logs riêng** trên SIEM — không xóa trước 5 năm

---

## 7. SSH access via Hiware & mô hình OS user

Bank đã setup **Hiware PAM** làm SSH proxy. SHWS không cần config thêm cấp infrastructure:

```
shbvn / postgres / mon workstation
   │
   ▼ Hiware client
[Hiware PAM proxy]    ──► Audit + session recording
   │
   ▼ SSH (Hiware quản lý credential)
[shwsap1p, shwsdb1p, shwsap1t, shwsap1dr, shwsdb1dr]
```

**Server-side SSH config (`/etc/ssh/sshd_config`):**

```
PermitRootLogin no
PasswordAuthentication no       # Chỉ key, Hiware inject key
PubkeyAuthentication yes
AllowUsers shbvn postgres mon   # Whitelist 3 user — KHÔNG root
ClientAliveInterval 300
ClientAliveCountMax 2
```

### 7.1 Mô hình 3 OS user (no-root-login)

Nguyên tắc **no-root-login thực dụng**: tắt login root + không vận hành routine bằng root. Các daemon hệ thống (`dockerd`, `multipathd`, `systemd`, `auditd`, `rsyslog`; `postgresql` do systemd start rồi drop xuống `postgres`) **vẫn chạy root** vì là dịch vụ OS quản lý — đây là ngoại lệ chấp nhận được, không phải thao tác người dùng.

| User       | Loại          | Node       | Groups                   | SSH        | Mục đích                                                          |
| ---------- | ------------- | ---------- | ------------------------ | ---------- | ----------------------------------------------------------------- |
| `shbvn`    | admin         | app + data | `docker`                 | Hiware key | Quản trị app + Docker cả 2 node (api/web/proxy + minio/exporters) |
| `postgres` | service + DBA | data       | —                        | Hiware key | PostgreSQL service account **kiêm** DBA ops qua sudo              |
| `mon`      | read-only     | tất cả     | `adm`, `systemd-journal` | Hiware key | Đọc log + `systemctl status`, không thay đổi state                |

> OS user PostgreSQL giữ tên chuẩn `postgres` (PGDG RPM hardcode). Yêu cầu "postgre" = `postgres`.

**Sudoers (`/etc/sudoers.d/shws`) — least-privilege, NOPASSWD giới hạn:**

```
# shbvn: Docker + service docker (KHÔNG full root)
shbvn ALL=(ALL) NOPASSWD: /usr/bin/docker compose *, \
                          /bin/systemctl * docker, \
                          /usr/bin/journalctl -u docker *

# postgres: PG service + backup (DBA ops)
postgres ALL=(ALL) NOPASSWD: /bin/systemctl * postgresql-15, \
                             /usr/bin/pgbackrest *, \
                             /usr/bin/pg_ctl *

# mon: KHÔNG sudo — chỉ group adm + systemd-journal để đọc log
```

### 7.2 Cảnh báo: `docker` group ≈ root-equivalent

Cho `shbvn` vào group `docker` đồng nghĩa trao quyền **tương đương root** (Docker socket mount được host filesystem). Mitigation:

- Mọi phiên SSH qua **Hiware PAM** → session recording + audit đầy đủ.
- `auditd` log mọi `sudo` + truy cập file nhạy cảm.
- Chỉ duy nhất `shbvn` trong group `docker`; `mon`/`postgres` tuyệt đối không.
- **GĐ2 cân nhắc:** rootless Docker / sudo-scoped docker để loại bỏ docker-group (cần PoC trên RHEL air-gap).

### 7.3 `mon` đọc log read-only (không docker group, không sudo)

PROD/DR daemon.json dùng `log-driver=journald` (xem `04` §2.3) → log **mọi container** (proxy/nginx, api, worker, live…) vào journald. `mon` quan sát qua:

- `journalctl -u docker`, `journalctl CONTAINER_NAME=plane-api` / `...proxy` (group `systemd-journal`) — gồm cả Nginx access/error log (nằm trong container `proxy`, không phải host)
- `/var/log/postgresql/*` (PG **native** trên host; group `adm`; nếu PG log 0600 `postgres` → `setfacl -R -m g:adm:rX /var/log/postgresql`), `/var/log/pgbackrest/*`
- `systemctl status <service>` (không cần quyền đặc biệt)

`mon` **không** có quyền ghi/restart/exec — chỉ quan sát. Phù hợp checklist "đầu giờ" (xem [`00-overview.md`](./00-overview.md) §8).

---

## 8. Container security

### 8.1 Image scanning

**Trivy** (offline mode) — scan container image trước deploy:

```bash
# Trên build station (có internet một lần để update DB)
trivy image --severity HIGH,CRITICAL plane-api:v1.x.x

# Trên bank server (offline)
trivy --offline image plane-api:v1.x.x
```

**Policy:**

- KHÔNG deploy image có **CRITICAL** CVE chưa fix
- **HIGH** CVE: document trong risk register, lên kế hoạch fix
- Scan định kỳ (quarterly) cho image đang chạy

### 8.2 Runtime hardening

**docker-compose.shb.yml** thêm security options:

```yaml
api:
  user: "1000:1000" # Non-root
  read_only: false # Plane cần write tmp, không read-only được
  security_opt:
    - no-new-privileges:true
  cap_drop:
    - ALL
  cap_add:
    - CHOWN # Tối thiểu cần thiết
    - SETGID
    - SETUID
  tmpfs:
    - /tmp:size=512M,mode=1777
```

### 8.3 Network isolation between containers

Docker bridge network có **internal isolation**:

- `proxy` container chỉ exposed external (host port 443)
- Các container backend không bind host port (chỉ Docker network)
- `plane-redis`, `plane-mq` không reachable từ ngoài VM (PROD APP **không có** `plane-db` — PG native trên DATA node; UAT all-in-one mới có `plane-db` container)

---

## 9. Vulnerability management

### 9.1 Patch cadence

| Component                                 | Patch window                      | Tool                             |
| ----------------------------------------- | --------------------------------- | -------------------------------- |
| RHEL OS                                   | Monthly (1st Sunday)              | dnf update từ offline RPM bundle |
| PostgreSQL minor                          | Quarterly                         | offline RPM, runbook             |
| Docker images                             | Per release (theo Plane upstream) | docker load bundle               |
| Container packages (apk/apt inside image) | Per image rebuild                 | Trivy scan flag                  |
| TLS certs                                 | Trước expiry 60 ngày              | Manual + monitor                 |

### 9.2 CVE monitoring

- **Bank security team** subscribe RHEL CVE feed → assess + assign priority
- **Critical/High CVE**: emergency patch trong 7 ngày
- **Medium**: next regular window
- **Low**: backlog

### 9.3 Penetration testing

- **Annually** — bank security team hoặc thuê 3rd party
- **Sau major release** — security regression test
- Scope: External (proxy + auth), Internal (DB, API)

---

## 10. Compliance mapping

### 10.1 Thông tư 09/2020/TT-NHNN

| Yêu cầu                            | Đáp ứng                                                                                                                                                                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication mạnh                | SwingSSO (2FA theo policy bank) ✓                                                                                                                                                                                                         |
| Authorization rõ ràng              | Plane RBAC 4 levels ✓                                                                                                                                                                                                                     |
| Audit log đầy đủ + 5 năm retention | rsyslog → SIEM, 5 năm ✓                                                                                                                                                                                                                   |
| Encryption in transit              | TLS 1.2+, mTLS replication ✓                                                                                                                                                                                                              |
| Encryption at rest                 | **CANONICAL (06/07 trỏ về):** GĐ1 = pgBackRest repo encrypted AES-256 + VLAN/physical security (đủ theo đánh giá hiện tại); EMC array-level encryption do **ICTP** xác nhận; disk-level TDE **chưa bật** — chờ bank confirm yêu cầu (§14) |
| Backup + DR                        | pgBackRest + DR site streaming ✓                                                                                                                                                                                                          |
| Incident response                  | Runbook 03-operations/incident-response.md ✓                                                                                                                                                                                              |
| Vulnerability mgmt                 | Quarterly patch, annual pentest ✓                                                                                                                                                                                                         |
| Access control                     | Hiware PAM + sudo restricted ✓                                                                                                                                                                                                            |
| Change management                  | Plan + ADR + git history ✓                                                                                                                                                                                                                |

### 10.2 Defense-in-depth checklist

- [x] L1 Network: VLAN, firewall default-deny
- [x] L2 Transport: TLS everywhere
- [x] L3 Auth: SwingSSO + 2FA
- [x] L4 Authorization: RBAC enforced
- [x] L5 Data: secret file 0600, audit
- [x] L6 Audit: 5-year retention SIEM

---

## 11. Risk & mitigation

| Risk                                 | Severity | Probability | Mitigation                                                        |
| ------------------------------------ | -------- | ----------- | ----------------------------------------------------------------- |
| Secret leak qua `.env` không protect | Critical | Low         | Mode 0600, owner `shbvn`/`postgres` (§4.2), KHÔNG commit          |
| TLS cert hết hạn không alert         | High     | Medium      | Monitor 60/30/7 ngày trước                                        |
| SwingSSO ngắt → user không login     | High     | Low         | Document temporary local admin reset (chỉ SRE qua Hiware)         |
| Audit log forward fail → mất log     | Medium   | Medium      | Local buffer 30 ngày trong rsyslog                                |
| Container CVE Critical chưa fix      | High     | Medium      | Trivy gate, quarterly scan                                        |
| Replication mTLS cert mismatch       | High     | Low         | Document cert renew workflow + DR drill verify                    |
| Insider threat — admin abuse         | High     | Low         | Hiware session recording + audit                                  |
| god-mode panel exposed               | Critical | Low         | IP allowlist + audit log mọi access                               |
| Container chạy as root               | Medium   | Low         | `user: "1000:1000"` (map UID `shbvn`) in compose; §7 no-root      |
| `shbvn` trong `docker` group ≈ root  | High     | Low         | Hiware session recording + auditd; chỉ shbvn; rootless GĐ2 (§7.2) |
| Postgres password leak qua log       | Critical | Low         | Plane app KHÔNG log password, Django filter                       |

---

## 12. Decisions liên quan (ADR)

- OS user/privilege model (3-user `shbvn`/`postgres`/`mon`, no-root-login) — [`adr-010`](../05-change-log/decisions/adr-010-os-user-privilege-model.md) ✅
- Secret management approach (`.env` mode 0600) — pending `adr-011`
- Audit retention 5 năm theo Thông tư 09 — pending `adr-012`
- Container hardening config — pending `adr-013`

(adr-009 đã dùng cho DC-DR replication 2 layer. ADR-010 đã tạo cho mô hình user. Các ADR pending chốt khi tạo file.)

---

## 13. Cross-references

- Network firewall + port matrix: [`04-network-design.md`](./04-network-design.md)
- Database design (mTLS replication detail): [`06-database-design.md`](./06-database-design.md)
- Monitoring + alerting (cert expiry, audit forward fail): [`08-monitoring-design.md`](./08-monitoring-design.md)
- Install security baseline: [`../02-installation/00-prerequisites.md`](../02-installation/00-prerequisites.md)
- Incident response: [`../03-operations/incident-response.md`](../03-operations/incident-response.md)
- Security testing: [`../04-testing/security-test-plan.md`](../04-testing/security-test-plan.md)

---

## 14. Câu hỏi mở

- [ ] Bank confirm có chính sách disk encryption bắt buộc không (PCI-DSS scope check) — hiện đề xuất không cần
- [ ] SwingSSO 2FA mechanism: SMS, TOTP, hardware token? (ảnh hưởng UX UAT)
- [ ] SIEM endpoint cụ thể: protocol (TCP 514 plain hay TLS 6514)?
- [ ] Bank CA có hỗ trợ ACME automation không, hay manual CSR submission?
- [ ] god-mode panel — IP allowlist range cụ thể (subnet IT Ops)?
- [ ] Container image build: build trên bank network hay build ngoài rồi import?
- [ ] Penetration test annual — bank internal team hay thuê 3rd party?
- [ ] Vendor risk assessment cho Plane.so upstream — bank có yêu cầu thủ tục riêng?
- [ ] Data classification cho Plane data: nội bộ / mật / tối mật?
