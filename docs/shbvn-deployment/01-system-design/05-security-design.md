# 05 — Thiết kế Bảo mật — Shinhan Workspace (SHWS)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-18
**Phiên bản:** 0.1
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

| Account      | Mục đích                           | Stored where                 |
| ------------ | ---------------------------------- | ---------------------------- |
| `replicator` | PG streaming replication PROD → DR | `.env` trên DR DATA node     |
| `pgbackrest` | Backup tool execute                | `.env` + pgBackRest config   |
| `plane_app`  | Django connect to PG               | `.env` trên APP node         |
| `minio_root` | MinIO admin                        | `.env` trên DATA node        |
| `monitoring` | postgres_exporter read-only        | `.env` trên monitoring stack |

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

| Secret                                    | Where                             | Format         |
| ----------------------------------------- | --------------------------------- | -------------- |
| `SECRET_KEY` (Django)                     | `.env` APP node                   | Random 50 char |
| `POSTGRES_PASSWORD`                       | `.env` APP node                   | Random 32 char |
| `RABBITMQ_PASSWORD`                       | `.env` APP node                   | Random 32 char |
| `REDIS_PASSWORD`                          | `.env` APP node                   | Random 32 char |
| `MINIO_ROOT_PASSWORD`                     | `.env` DATA node                  | Random 32 char |
| `AWS_ACCESS_KEY_ID` / `SECRET_ACCESS_KEY` | `.env` (MinIO compat)             | Random         |
| `JWT_SECRET`                              | `.env` APP node                   | Random 64 char |
| `SWINGSSO_CLIENT_SECRET`                  | `.env` APP node                   | Bank-issued    |
| `LDAP_BIND_PASSWORD`                      | `.env` APP node                   | Bank-issued    |
| `SMTP_PASSWORD`                           | `.env` APP node                   | Bank-issued    |
| `pgbackrest_repo_cipher_pass`             | pgBackRest config                 | Random 64 char |
| `replicator_password`                     | `.env` DR DATA                    | Random 32 char |
| TLS private keys                          | `/etc/pki/tls/private/` mode 0600 | PEM            |

### 4.2 File storage convention

```
/opt/shws-secrets/
├── .env.app           mode 0600  owner root         # APP node
├── .env.data          mode 0600  owner root         # DATA node
├── .env.replicator    mode 0600  owner postgres     # DR DATA only
└── README.md          mode 0644                     # Reference docs

/etc/pki/tls/private/
├── shwsap1p.bank.local.key      mode 0600  owner root
├── shwsdb1p.bank.local.key      mode 0600  owner postgres
└── replicator-client.key        mode 0600  owner postgres
```

**Nguyên tắc:**

- Secret file **OFF** working tree (`/opt/shws-secrets/`), KHÔNG đặt trong repo source
- Mode `0600` (rw owner only) hoặc `0640` nếu cần group read
- Owner phụ thuộc service: `root` cho Docker, `postgres` cho PG cert
- Symlink từ `/opt/shws/deployment/.env` → `/opt/shws-secrets/.env.app`

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
ssl_cert_file = '/etc/pki/tls/certs/shwsdb1p.bank.local.crt'
ssl_key_file  = '/etc/pki/tls/private/shwsdb1p.bank.local.key'
ssl_ca_file   = '/etc/pki/tls/certs/bank-ca-chain.crt'
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

---

## 6. Audit logging — 5 năm retention

Theo **Thông tư 09/2020/TT-NHNN** — hệ thống ngân hàng VN phải lưu audit log tối thiểu 5 năm.

### 6.1 Log sources

| Source                   | Loại event                                    | Where                             |
| ------------------------ | --------------------------------------------- | --------------------------------- |
| **Nginx access log**     | Mọi HTTP request                              | `/var/log/nginx/access.log`       |
| **Nginx error log**      | 4xx/5xx, exception                            | `/var/log/nginx/error.log`        |
| **Django app log**       | Auth (login/logout), CRUD critical, exception | Docker container log → json-file  |
| **PostgreSQL log**       | Connection, query slow, error, DDL            | `/var/log/pgsql/postgresql-*.log` |
| **pg_audit** (extension) | Auth attempts, DDL, role changes              | Postgres log                      |
| **OS auditd**            | sudo, login, file access                      | `/var/log/audit/audit.log`        |
| **rsyslog**              | systemd events, kernel                        | `/var/log/messages`               |
| **Docker engine log**    | Container start/stop/crash                    | `journalctl -u docker`            |
| **pgBackRest log**       | Backup execution                              | `/var/log/pgbackrest/`            |

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

## 7. SSH access via Hiware

Bank đã setup **Hiware PAM** làm SSH proxy. SHWS không cần config thêm cấp infrastructure:

```
SRE/DBA workstation
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
AllowUsers app sre dba          # Whitelist users
AllowGroups wheel               # Hoặc group
ClientAliveInterval 300
ClientAliveCountMax 2
```

**Account local trên server:**

- `app` — runtime user cho gunicorn, không sudo
- `sre` — Ops, có sudo (restricted via sudoers)
- `dba` — DBA, có sudo cho `systemctl restart postgresql-*`
- `postgres` — PG service account, không SSH login

**Sudoers (`/etc/sudoers.d/shws`):**

```
sre ALL=(ALL) NOPASSWD: /bin/systemctl restart docker, \
                         /usr/bin/docker compose *, \
                         /usr/bin/journalctl *
dba ALL=(postgres) ALL
dba ALL=(ALL) NOPASSWD: /bin/systemctl * postgresql-*, \
                         /usr/bin/pgbackrest *
```

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
- `plane-db`, `plane-redis`, `plane-mq` không reachable từ ngoài VM

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

| Yêu cầu                            | Đáp ứng                                                    |
| ---------------------------------- | ---------------------------------------------------------- |
| Authentication mạnh                | SwingSSO (2FA theo policy bank) ✓                          |
| Authorization rõ ràng              | Plane RBAC 4 levels ✓                                      |
| Audit log đầy đủ + 5 năm retention | rsyslog → SIEM, 5 năm ✓                                    |
| Encryption in transit              | TLS 1.2+, mTLS replication ✓                               |
| Encryption at rest                 | EMC SAN level (TBD confirm) hoặc VLAN/physical security ⚠️ |
| Backup + DR                        | pgBackRest + DR site streaming ✓                           |
| Incident response                  | Runbook 03-operations/incident-response.md ✓               |
| Vulnerability mgmt                 | Quarterly patch, annual pentest ✓                          |
| Access control                     | Hiware PAM + sudo restricted ✓                             |
| Change management                  | Plan + ADR + git history ✓                                 |

### 10.2 Defense-in-depth checklist

- [x] L1 Network: VLAN, firewall default-deny
- [x] L2 Transport: TLS everywhere
- [x] L3 Auth: SwingSSO + 2FA
- [x] L4 Authorization: RBAC enforced
- [x] L5 Data: secret file 0600, audit
- [x] L6 Audit: 5-year retention SIEM

---

## 11. Risk & mitigation

| Risk                                 | Severity | Probability | Mitigation                                                |
| ------------------------------------ | -------- | ----------- | --------------------------------------------------------- |
| Secret leak qua `.env` không protect | Critical | Low         | Mode 0600, owner root, KHÔNG commit                       |
| TLS cert hết hạn không alert         | High     | Medium      | Monitor 60/30/7 ngày trước                                |
| SwingSSO ngắt → user không login     | High     | Low         | Document temporary local admin reset (chỉ SRE qua Hiware) |
| Audit log forward fail → mất log     | Medium   | Medium      | Local buffer 30 ngày trong rsyslog                        |
| Container CVE Critical chưa fix      | High     | Medium      | Trivy gate, quarterly scan                                |
| Replication mTLS cert mismatch       | High     | Low         | Document cert renew workflow + DR drill verify            |
| Insider threat — admin abuse         | High     | Low         | Hiware session recording + audit                          |
| god-mode panel exposed               | Critical | Low         | IP allowlist + audit log mọi access                       |
| Container chạy as root               | Medium   | Low         | `user: "1000:1000"` in compose                            |
| Postgres password leak qua log       | Critical | Low         | Plane app KHÔNG log password, Django filter               |

---

## 12. Decisions liên quan (ADR)

- Secret management approach (`.env` mode 0600) — pending `adr-010`
- Audit retention 5 năm theo Thông tư 09 — pending `adr-011`
- Container hardening config — pending `adr-012`

(adr-009 đã dùng cho DC-DR replication 2 layer. Số ADR trên chốt khi tạo file ADR.)

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
