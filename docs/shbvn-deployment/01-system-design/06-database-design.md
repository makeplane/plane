# 06 — Database Design

> Thiết kế chi tiết tầng dữ liệu (PostgreSQL) cho **Shinhan Workspace (SHWS)**: cluster topology, tuning, backup, replication, audit, maintenance.

**Status:** 🟡 Draft v0.2 — chờ DBA review
**Cập nhật:** 2026-05-29
**Liên quan:** [01-architecture-prod.md](./01-architecture-prod.md), [03-architecture-dr-site.md](./03-architecture-dr-site.md), [05-security-design.md](./05-security-design.md), [07-storage-design.md](./07-storage-design.md), [08-monitoring-design.md](./08-monitoring-design.md)

---

## 1. Phạm vi

Tài liệu mô tả:

- Software stack DB (PostgreSQL + pgBackRest)
- Cluster topology (PROD primary ↔ DR standby async)
- PostgreSQL tuning theo profile OLTP-balanced cho VM 8 vCPU / 16 GB
- Backup strategy (full + diff + incr + WAL) với pgBackRest
- Streaming replication mTLS sang DR
- Extension policy (pg_stat_statements, pgaudit)
- Database/role inventory + connection model (Django CONN_MAX_AGE)
- Maintenance procedures + restore drill

**Ngoài phạm vi:** Schema design của Plane app (do Plane upstream quản lý), Redis/RabbitMQ design (xem [01-architecture-prod.md](./01-architecture-prod.md)).

---

## 2. Software stack

| Thành phần                    | Version    | Source                          | Phương án triển khai                     |
| ----------------------------- | ---------- | ------------------------------- | ---------------------------------------- |
| PostgreSQL                    | **15.7**   | PGDG RHEL9 RPM (offline mirror) | Native systemd `postgresql-15.service`   |
| pgBackRest                    | **2.51+**  | PGDG RHEL9 RPM                  | CLI tool + cron schedule                 |
| Extension: pg_stat_statements | shipped    | core                            | Enable via `shared_preload_libraries`    |
| Extension: pgaudit            | 1.7 (PG15) | PGDG RHEL9 RPM                  | Enable via `shared_preload_libraries`    |
| Extension: pgcrypto           | shipped    | core                            | Enable per database (Plane code yêu cầu) |

**Lý do chọn PG 15.7** (đã quyết Phase 1):

- Plane upstream test đầy đủ trên PG 14/15
- PG 15 ổn định, support đến **2027-11**
- pgaudit 1.7 hỗ trợ tốt PG 15
- Streaming replication built-in (không cần Patroni giai đoạn 1)

---

## 3. Cluster topology

### 3.1 Tổng quan

```
┌────────────────────────────────────────────────────────────────┐
│  PROD DC                          DR Site                       │
│                                                                  │
│  ┌─────────────────┐    mTLS     ┌─────────────────┐           │
│  │  shwsdb1p       │  WAL stream │  shwsdb1dr      │           │
│  │  PG 15.7 PRIMARY├────────────►│  PG 15.7 STANDBY│           │
│  │  10.94.10.11    │  async      │  10.94.20.11    │           │
│  │                 │  RPO ~30s   │  hot_standby=on │           │
│  └────────┬────────┘             └─────────────────┘           │
│           ▲                                                      │
│           │ direct :5432 (TLS)                                   │
│           │ CONN_MAX_AGE=300                                     │
│           │                                                      │
│  ┌────────┴────────┐                                            │
│  │  shwsap1p       │                                            │
│  │  Plane API      │                                            │
│  │  Worker, Beat   │                                            │
│  └─────────────────┘                                            │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 Vai trò node

| Hostname         | Vai trò        | Mode                    | Mở port                   |
| ---------------- | -------------- | ----------------------- | ------------------------- |
| `shwsdb1p`       | PROD primary   | read-write              | 5432 (intra, TLS)         |
| `shwsdb1dr`      | DR standby     | hot_standby (read-only) | 5432 (intra)              |
| `shwsap1t` (UAT) | UAT all-in-one | PG trong Docker         | 5432 chỉ trong docker net |

### 3.3 Replication

- **Method:** Streaming replication (built-in PG), **asynchronous**
- **Slot:** physical replication slot `shws_dr_slot`
- **WAL retention:** 7 ngày trên primary (đảm bảo DR catch up sau lag tạm thời)
- **mTLS:** replication channel dùng cert nội bộ bank CA (xem [05-security-design.md](./05-security-design.md) §4.2)
- **RPO mục tiêu:** ~30 giây (xem [03-architecture-dr-site.md](./03-architecture-dr-site.md))
- **Failover:** Manual, cần approval DBA + SRE + Mgmt

---

## 4. Storage layout (DB node PROD)

> Chi tiết LUN, multipath, filesystem xem [07-storage-design.md](./07-storage-design.md). Phần này tóm tắt từ góc nhìn PostgreSQL.

| Mount                 | Mục đích                               | Kích thước                      | PG config tham chiếu                    |
| --------------------- | -------------------------------------- | ------------------------------- | --------------------------------------- |
| `/u01/pgsql/15/data`  | `data_directory` (heap + indexes)      | 600 GB XFS (LUN-1, chung MinIO) | `data_directory = '/u01/pgsql/15/data'` |
| `/u02/pgsql/15/wal`   | WAL files (`pg_wal`)                   | 100 GB XFS (LUN-2)              | symlink từ `$PGDATA/pg_wal`             |
| `/u03/pgbackup`       | pgBackRest repo (backup + WAL archive) | 1 TB XFS (LUN-3)                | `repo1-path = /u03/pgbackup`            |
| `/var/log/postgresql` | server log local                       | local disk                      | `log_directory = '/var/log/postgresql'` |

**Lý do tách WAL ra LUN riêng:**

- WAL là **write-heavy sequential**, tách khỏi heap I/O giảm contention
- Nếu LUN heap đầy, WAL vẫn flush được → tránh DB freeze
- Khi snapshot SAN, có thể snap separately

**Backup repo `/u03` là restore source chính**: pgBackRest stanza đọc/ghi tại local LUN (low latency). Daily rsync sang NAS bank chỉ dùng làm offsite copy cho disaster scenario khi cả /u03 hỏng (xem §9.4).

---

## 5. PostgreSQL configuration

### 5.1 Profile: OLTP-balanced (16 GB RAM)

File: `/u01/pgsql/15/data/postgresql.conf`

```ini
# Resource (16 GB RAM, 8 vCPU): shared_buffers 25% RAM, effective_cache_size 75%
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 16MB
maintenance_work_mem = 512MB
max_connections = 300                     # app nối trực tiếp; CONN_MAX_AGE giữ ~17 conn bền
huge_pages = try
temp_buffers = 16MB
idle_in_transaction_session_timeout = 600000   # 10 phút (ms) — chống tx treo block autovacuum (DB-R-02)

# WAL & Checkpoint
wal_level = replica
max_wal_senders = 5
wal_keep_size = 4GB
max_slot_wal_keep_size = 4GB              # auto-drop slot nếu WAL > 4GB (chống fill /u02)
wal_buffers = 16MB
checkpoint_timeout = 15min
checkpoint_completion_target = 0.9
min_wal_size = 1GB
max_wal_size = 4GB
archive_mode = on
archive_command = 'pgbackrest --stanza=shws-prod archive-push %p'
archive_timeout = 60s                     # force WAL switch mỗi phút (RPO)

# Replication
max_replication_slots = 5
hot_standby = on
wal_receiver_timeout = 60s
wal_sender_timeout = 60s

# Query Planner (SAN SSD)
random_page_cost = 1.1
effective_io_concurrency = 200
default_statistics_target = 100
jit = off

# Logging (csvlog → rsyslog → SIEM)
log_destination = 'csvlog'
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_line_prefix = '%t [%p] %q%u@%d/%a '
log_min_duration_statement = 1000         # log query > 1s
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 10MB
log_autovacuum_min_duration = 1000
log_error_verbosity = default
log_timezone = 'Asia/Ho_Chi_Minh'

# Autovacuum
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 30s
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05
autovacuum_vacuum_cost_limit = 2000

# Extensions preload
shared_preload_libraries = 'pg_stat_statements,pgaudit'
pg_stat_statements.max = 10000
pg_stat_statements.track = top

# pgaudit (xem 05-security-design.md §5)
pgaudit.log = 'ddl, role, write'
pgaudit.log_catalog = off
pgaudit.log_parameter = on
pgaudit.log_relation = on

# SSL/TLS
ssl = on
ssl_cert_file = '/u01/pgsql/15/data/server.crt'
ssl_key_file = '/u01/pgsql/15/data/server.key'
ssl_ca_file = '/u01/pgsql/15/data/bank-ca.crt'
ssl_min_protocol_version = 'TLSv1.2'

# Locale / Timezone
timezone = 'Asia/Ho_Chi_Minh'
lc_messages = 'en_US.UTF-8'
lc_monetary = 'en_US.UTF-8'
lc_numeric = 'en_US.UTF-8'
lc_time = 'en_US.UTF-8'
```

### 5.2 Kernel tuning (RHEL 9.6 sysctl)

File: `/etc/sysctl.d/99-postgres.conf`

```ini
# Shared memory (đủ cho shared_buffers + slack)
kernel.shmmax = 8589934592                # 8 GB
kernel.shmall = 2097152                   # 8 GB / 4 KB

# Virtual memory
vm.swappiness = 1                         # tránh swap khi còn RAM
vm.overcommit_memory = 2
vm.overcommit_ratio = 90
vm.dirty_background_ratio = 5
vm.dirty_ratio = 10
vm.dirty_expire_centisecs = 500
vm.dirty_writeback_centisecs = 100

# Huge pages cho shared_buffers=4GB + overhead ~10%
# 2200 × 2MB = 4.4 GB (đủ cho shared_buffers + wal_buffers + slack)
vm.nr_hugepages = 2200

# Network
net.core.somaxconn = 1024
net.ipv4.tcp_keepalive_time = 600
```

### 5.3 Host-based authentication

File: `/u01/pgsql/15/data/pg_hba.conf`

```text
# TYPE  DATABASE        USER            ADDRESS                 METHOD          OPTIONS
local   all             postgres                                peer
# pgBackRest: cron chạy bởi OS postgres → map sang DB role backup (xem pg_ident bên dưới)
local   all             backup                                  peer            map=pgbackrest
# Plane app từ shwsap1p (kết nối trực tiếp, chỉ IP cụ thể)
host    plane           plane_app       10.94.10.10/32          scram-sha-256
# Local maintenance từ chính shwsdb1p
host    plane           plane_app       127.0.0.1/32            scram-sha-256
# Monitoring exporter (co-located DATA node) — `all` để đọc cả `plane` lẫn `postgres`
host    all             monitoring      10.94.10.0/24           scram-sha-256
# Replication cert-based mTLS từ DR (standby pull — LUỒNG CHÍNH)
hostssl replication     replicator      10.94.20.11/32          cert            clientcert=verify-full
# Mặc định deny mọi truy cập khác (không catch-all /16)
host    all             all             0.0.0.0/0               reject
```

**`pg_ident.conf`** (map OS user → DB role cho pgBackRest local peer):

```text
# MAPNAME      SYSTEM-USERNAME   PG-USERNAME
pgbackrest     postgres          backup
```

> Bỏ dòng `local replication replicator peer` cũ (vô dụng — không có OS user `replicator`; DR standby pull qua `hostssl` cert; initial `pg_basebackup` chạy từ DR qua TCP).

---

## 6. Connection model — Django persistent connection (không pooler GĐ1)

### 6.1 Quyết định

App (api/worker/beat) kết nối **trực tiếp** PG `shwsdb1p:5432` (TLS). **Không** dùng PgBouncer ở GĐ1 — căn cứ đo thực tế:

- Nhu cầu connection đồng thời GĐ1 chỉ **~13–17** (≈ số process: gunicorn workers + Celery + beat), KHÔNG phải số user → multiplexing của pooler gần như vô ích khi client ≈ backend.
- Plane upstream không dùng pooler (chỉ `max_connections=1000`); SHWS thay bằng `max_connections=300` hợp lý cho PG native 16 GB.
- Tránh thêm 1 daemon + 1 SPOF; DBA vận hành đơn giản, khớp kiến trúc Plane gốc.

### 6.2 Cấu hình Django

`/opt/shws-secrets/.env.app` (symlink `/opt/shws-deployment/.env`, owner `shbvn:shbvn` — xem `05` §4.2) trên APP node:

```ini
DATABASE_URL=postgresql://plane_app:<PLANE_APP_PW>@10.94.10.11:5432/plane?sslmode=verify-ca
CONN_MAX_AGE=300        # giữ connection bền 300s/process → khử churn connect mỗi request
```

- `CONN_MAX_AGE=300`: Django tái dùng connection sống trong 300s thay vì mở/đóng mỗi request (mặc định Plane = 0 → churn). "Pooling nhẹ" mức app, không cần daemon.
- Mỗi process worker giữ tối đa ~1 connection bền → tổng ~13–17 conn idle, thừa headroom trong `max_connections=300`.

### 6.3 PgBouncer — để dành GĐ2

PgBouncer (transaction pool) chỉ cần khi **client ≫ backend**: thêm APP node thứ 2, bật read replica, hoặc CCU > 200 (xem §14 + [09](./09-capacity-planning.md) §5). Khi đó: cài native `pgbouncer.service` trên DATA node, app đổi `:5432` → `:6432`, thêm role `pgbouncer_auth`, pool mode `transaction` (lưu ý: `SET LOCAL` / `pg_advisory_xact_lock` OK; tránh session-state — Plane tương thích).

---

## 7. Database & role inventory

### 7.1 Database

| Database   | Owner       | Mục đích                  |
| ---------- | ----------- | ------------------------- |
| `plane`    | `plane_app` | Application data chính    |
| `postgres` | `postgres`  | Maintenance DB (mặc định) |

### 7.2 Role

| Role         | Loại               | Quyền                                                  | Storage password                    |
| ------------ | ------------------ | ------------------------------------------------------ | ----------------------------------- |
| `postgres`   | superuser          | full                                                   | systemd service env, peer auth      |
| `replicator` | login, replication | streaming repl only                                    | mTLS cert, no password              |
| `plane_app`  | login              | DML + DDL trên DB `plane` (Plane migration cần CREATE) | `/opt/shws-secrets/postgres.env`    |
| `monitoring` | login              | `pg_monitor` role + read pg*stat*\*                    | `/opt/shws-secrets/monitoring.env`  |
| `backup`     | login, replication | pgBackRest stanza                                      | local peer + pg_ident (no password) |

> Inventory chi tiết + rotation policy đã ghi tại [05-security-design.md](./05-security-design.md) §3.

### 7.3 Privilege model trong `plane` DB

```sql
-- Plane migration cần đầy đủ schema operations
GRANT CONNECT ON DATABASE plane TO plane_app;
GRANT USAGE, CREATE ON SCHEMA public TO plane_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO plane_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO plane_app;

-- monitoring read-only
GRANT pg_monitor TO monitoring;
GRANT CONNECT ON DATABASE plane TO monitoring;
```

---

## 8. Extensions

| Extension            | Phạm vi | Mục đích                                  | Cấu hình                              |
| -------------------- | ------- | ----------------------------------------- | ------------------------------------- |
| `pg_stat_statements` | cluster | Track top query, slow query analysis      | preload + `CREATE EXTENSION IN plane` |
| `pgaudit`            | cluster | Audit DDL/DML, role changes               | preload + cấu hình `pgaudit.log`      |
| `pgcrypto`           | per-DB  | Plane code dùng cho encrypt secret tokens | `CREATE EXTENSION IN plane`           |

```sql
-- Trên DB plane
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- pgaudit dùng level cluster, không cần CREATE EXTENSION
```

**Không dùng giai đoạn 1:** `pg_repack`, `pglogical`, `timescaledb`, `postgis`. Có thể bổ sung sau theo nhu cầu.

---

## 9. Backup strategy (pgBackRest)

### 9.1 Chiến lược schedule

| Loại             | Tần suất  | Thời gian                         | Retention                                                | I/O impact             |
| ---------------- | --------- | --------------------------------- | -------------------------------------------------------- | ---------------------- |
| **Full**         | Hàng tuần | Chủ nhật 03:00                    | 4 fulls (count)                                          | Cao (1-2h)             |
| **Differential** | Hàng ngày | Thứ 2-7, 02:00                    | 7 diffs                                                  | Trung bình (30-60 min) |
| **Incremental**  | Mỗi giờ   | xx:30 (24×/ngày)                  | Theo diff cha (pgBackRest không có retention-incr riêng) | Thấp (5-15 min)        |
| **WAL archive**  | Liên tục  | `archive_command` mỗi WAL segment | 7 ngày (`retention-archive=7` diff-based)                | Liên tục, thấp         |

**RPO đạt được:** ~30 giây (WAL stream + `archive_timeout = 60s` force switch).

**RTO đạt được:** mục tiêu < 1 giờ:

- Restore full + apply diff + apply incr + apply WAL = ~30-45 phút trên SAN
- Promote standby ở DR = vài phút (xem [03-architecture-dr-site.md](./03-architecture-dr-site.md))

### 9.2 pgBackRest stanza configuration

File: `/etc/pgbackrest/pgbackrest.conf`

```ini
[global]
repo1-path=/u03/pgbackup
repo1-retention-full=4
repo1-retention-full-type=count
repo1-retention-diff=7
repo1-retention-archive=7
repo1-retention-archive-type=diff
repo1-cipher-type=aes-256-cbc
# repo1-cipher-pass: passphrase string nạp vào conf qua include directive.
# Quản lý: file /etc/pgbackrest/pgbackrest.conf.d/cipher.conf (mode 0600, postgres:postgres — no root)
# chứa duy nhất dòng `repo1-cipher-pass=<32-byte hex generated by openssl rand -hex 32>`.
# Backup cipher passphrase vào KeePass DBA + Infra Manager.
process-max=4
compress-type=lz4
compress-level=3
log-level-console=info
log-level-file=detail
log-path=/var/log/pgbackrest
start-fast=y
delta=y
archive-async=y
spool-path=/var/spool/pgbackrest

[shws-prod]
pg1-path=/u01/pgsql/15/data
pg1-port=5432
pg1-user=backup
```

### 9.3 Cron schedule

File: `/etc/cron.d/pgbackrest-shws`

```cron
# Full backup — Chủ nhật 03:00
0 3 * * 0  postgres  pgbackrest --stanza=shws-prod --type=full backup

# Differential — Thứ 2-7 lúc 02:00
0 2 * * 1-6  postgres  pgbackrest --stanza=shws-prod --type=diff backup

# Incremental — mỗi giờ phút 30
30 * * * *  postgres  pgbackrest --stanza=shws-prod --type=incr backup

# Expire (cleanup) — hàng ngày 04:00
0 4 * * *  postgres  pgbackrest --stanza=shws-prod expire

# Rsync repo sang NAS offsite — hàng ngày 05:00 (no root — postgres sở hữu /u03/pgbackup)
0 5 * * *  postgres  /usr/local/bin/shws-backup-to-nas.sh

# Verify (check repo integrity) — hàng tuần Chủ nhật 06:00
0 6 * * 0  postgres  pgbackrest --stanza=shws-prod check
```

Script `shws-backup-to-nas.sh` (rsync wrapper) trách nhiệm:

- NAS share pre-mount qua `/etc/fstab` (autofs) — KHÔNG mount runtime bằng root; postgres chỉ rsync (TBD path từ Infra)
- `rsync -aHAX --delete-after /u03/pgbackup/ /mnt/nas/shws-prod-backup/`
- Log → `/var/log/shws/backup-to-nas.log`
- Alert nếu rsync fail hoặc latency > 30 phút

### 9.4 Offsite backup (NAS bank)

- pgBackRest repo `/u03/pgbackup` rsync sang NAS bank **daily 05:00**
- NAS path: TBD (Infra cấp share point, mount NFS hoặc cifs)
- Retention NAS: 90 ngày (đáp ứng audit 1 quý gần nhất)
- WORM/immutable: nếu NAS hỗ trợ snapshot, enable hourly snapshot

> **Câu hỏi mở:** Bank đã cấp NAS share point chưa? Capacity và protocol?

### 9.5 Backup encryption

- `repo1-cipher-type=aes-256-cbc` enable encryption tại repo
- Cipher pass lưu **`/etc/pgbackrest/pgbackrest.conf.d/cipher.conf`** mode 0600 `postgres:postgres` (canonical — xem §9.2, `05` §4.2); backup passphrase vào KeePass DBA + Infra Mgr (DB-R-03)
- WAL files & backup files đều encrypted at rest

---

## 10. Replication setup (PROD → DR)

### 10.1 Primary (`shwsdb1p`) cấu hình

`postgresql.conf` đã set `wal_level = replica`, `max_wal_senders = 5`.

`pg_hba.conf`:

```text
hostssl replication replicator 10.94.20.11/32 cert clientcert=verify-full
```

Tạo replication slot:

```sql
SELECT pg_create_physical_replication_slot('shws_dr_slot');
```

> ⚠️ **Triển khai phân kỳ (DC trước / DR sau — xem [00](./00-overview.md) §2):** **KHÔNG** tạo slot này ở giai đoạn **DC-only**. Slot không có standby tiêu thụ → WAL tích lũy trên primary đến khi `max_slot_wal_keep_size=4GB` auto-drop (alert vô ích, lãng phí `/u02`). Chỉ tạo slot **ngay trước** khi seed DR standby bằng `pg_basebackup -S shws_dr_slot` (Phase B). Tương tự, **silence alert replication** (`08` §3.2/§7) cho tới khi DR online.

### 10.2 Standby (`shwsdb1dr`) cấu hình

DR node chạy pgBackRest stanza **riêng `shws-dr`**, repo nội bộ `/u03/pgbackup` của DR (backup lấy từ standby — "backup-of-backup", repo **độc lập từng site, KHÔNG ship qua WAN**). Đường đồng bộ real-time PROD→DR là **streaming replication** (slot `shws_dr_slot`); `restore_command` archive-get đọc repo **DR-local** làm fallback khi streaming hở.

**Seed/nuôi WAL cho repo DR-local (CHỐT — không ship qua WAN):** DR standby bật `archive_mode = always` (PG12+) → standby tự `archive-push` WAL nó đã nhận qua streaming/replay vào repo DR-local `shws-dr`. Nhờ vậy `archive-get` luôn có WAL nội site, không cần WAN cho backup. pgBackRest stanza `shws-dr` đặt **`pg1-path` = data dir của standby** (`/u01/pgsql/15/data` trên `shwsdb1dr`), chạy full/diff/incr ngay trên node DR — **KHÔNG** bật tùy chọn `backup-standby` (vốn cần kết nối primary/WAN).

`postgresql.auto.conf` (sau khi `pg_basebackup`):

```ini
primary_conninfo = 'host=10.94.10.11 port=5432 user=replicator sslmode=verify-full sslcert=/u01/pgsql/15/data/replicator.crt sslkey=/u01/pgsql/15/data/replicator.key sslrootcert=/u01/pgsql/15/data/bank-ca.crt application_name=shws_dr'
primary_slot_name = 'shws_dr_slot'
restore_command = 'pgbackrest --stanza=shws-dr archive-get %f %p'   # repo DR-local
recovery_target_timeline = 'latest'
hot_standby = on
```

Và trong `postgresql.conf` của DR (để standby archive WAL vào repo local — không qua WAN):

```ini
archive_mode = always                                              # PG12+: standby cũng archive
archive_command = 'pgbackrest --stanza=shws-dr archive-push %p'    # repo DR-local
```

File `standby.signal` tồn tại trong `$PGDATA` để PG khởi động ở recovery mode.

> **Xử lý slot-drop:** nếu DR down lâu khiến WAL trên primary vượt `max_slot_wal_keep_size=4GB` → PG auto-drop `shws_dr_slot` (chống fill `/u02` primary). Khi đó streaming không tự nối lại → **re-seed DR bằng `pg_basebackup`** (10–60 phút, xem [03](./03-architecture-dr-site.md) §4.2). GĐ1 chấp nhận thao tác manual; RTO khôi phục DR vẫn < 1h. (Đã loại `pgbackrest server-start` TLS push qua WAN — WAN chỉ cho PG streaming + monitoring, xem [03](./03-architecture-dr-site.md) §8 + [04](./04-network-design.md) §9.)

### 10.3 Monitor replication lag

Query trên primary:

```sql
SELECT client_addr, application_name, state, sync_state,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes,
       EXTRACT(EPOCH FROM (now() - reply_time)) AS lag_seconds
FROM pg_stat_replication;
```

**Alert thresholds** (xem [08-monitoring-design.md](./08-monitoring-design.md)):

- Warning: lag > 30s hoặc 256 MB
- Critical: lag > 5 phút hoặc 1 GB

---

## 11. Audit logging (pgaudit → SIEM)

### 11.1 Phạm vi log

Theo `pgaudit.log = 'ddl, role, write'`:

| Class     | Sự kiện                          | Ví dụ                      |
| --------- | -------------------------------- | -------------------------- |
| **DDL**   | CREATE/ALTER/DROP                | TABLE, INDEX, SCHEMA, USER |
| **ROLE**  | GRANT/REVOKE, role mgmt          | GRANT, REVOKE, CREATE ROLE |
| **WRITE** | INSERT, UPDATE, DELETE, TRUNCATE | Mọi thao tác sửa data      |

**Không log READ** (SELECT) — tránh log explosion. Nếu audit yêu cầu, có thể bật `'read'` cho table cụ thể bằng `pg_audit_role`.

### 11.2 Log format & forward

- Output: `csvlog` trong `/var/log/postgresql/postgresql-YYYY-MM-DD.log`
- rsyslog tail file → forward TCP TLS → bank SIEM (xem [05-security-design.md](./05-security-design.md) §5.2)
- Retention local 30 ngày, SIEM 5 năm (Thông tư 09)

### 11.3 Sample audit event

```text
... plane_app@plane LOG: AUDIT: SESSION,1,1,WRITE,UPDATE,TABLE,public.projects,...
```

---

## 12. Maintenance procedures

### 12.1 Maintenance window

**Slot cố định:** Chủ nhật **04:00 – 06:00 ICT** (sau khi backup full 03:00 hoàn tất).

Lý do 04:00-06:00 (Option B): chạy SAU backup full CN 03:00 (1-2h, deliverable bắt buộc, không dời) để không tranh I/O; nếu backup quá 04:00 thì maint đợi (gating qua `pgbackrest info`). Downtime tối đa 2h, ngoài giờ làm việc.

> **Câu hỏi mở:** Có lịch maintenance bank chung (NPP, SAN downtime) cần align không? Nếu có, slot này có thể phải dời thêm.

Các hoạt động trong window:

- VACUUM FULL các table bloat > 20% (nếu cần)
- REINDEX các index bloat > 30%
- PostgreSQL minor version upgrade (15.7 → 15.8, vv)
- Certificate rotation
- Schema migration cần lock dài (rare — Plane upstream khuyến cáo non-blocking migration)

### 12.2 Vacuum strategy

- **Autovacuum** chạy nền với threshold 10% (scale_factor 0.1)
- **Manual VACUUM ANALYZE** trên các table lớn sau bulk import (nếu có)
- **VACUUM FULL** chỉ chạy trong maint window — table-by-table, monitor bloat qua `pg_stat_user_tables`
- Cân nhắc `pg_repack` ở giai đoạn 2 nếu có table bloat thường xuyên

### 12.3 Reindex strategy

- Index bloat đo qua extension `pgstattuple` (cài on-demand)
- Sử dụng `REINDEX CONCURRENTLY` (PG 12+) để tránh exclusive lock
- Schedule sample query cảnh báo index bloat tự động (xem monitoring)

### 12.4 PostgreSQL minor version upgrade

Quy trình minor upgrade (vd. 15.7 → 15.8):

1. Test trên UAT trước (Docker `postgres:15.8`)
2. Maint window: download RPM offline → mirror → install
3. Standby DR upgrade trước
4. Failover sang DR (manual) — verify
5. Failback về PROD đã upgrade
6. Rolling, không downtime > 5 phút

Major upgrade (15 → 16) là dự án riêng, dùng `pg_upgrade` hoặc logical replication, ngoài phạm vi giai đoạn 1.

---

## 13. Restore drill

### 13.1 Mục tiêu

Validate backup integrity + verify RTO < 1 giờ định kỳ.

### 13.2 Tần suất

**TBD theo policy IT Audit nội bộ.** Đề xuất tối thiểu **hàng quý** nếu không có policy cụ thể.

> **Câu hỏi mở:** IT Audit có quy định cụ thể về restore drill cho hệ thống PM tier (non-core banking)? Nếu có, theo policy đó.

### 13.3 Quy trình drill

1. **Setup target:** UAT VM hoặc DR node tạm rảnh (không can thiệp prod)
2. **Restore:**
   ```bash
   pgbackrest --stanza=shws-prod --type=time \
     --target='2026-05-15 12:00:00+07' restore
   ```
3. **Verify:** PG khởi động không lỗi; sanity `SELECT count(*) FROM users, projects, workspaces`; so row count với prod snapshot cùng mốc (±5%).
4. **Document:** report `plans/reports/restore-drill-YYYYMMDD.md` — thời điểm bắt đầu/kết thúc, RTO thực tế, issue.
5. **Cleanup:** Drop target instance.

### 13.4 Drill outcome cần escalate

- RTO thực tế > 1 giờ
- Backup file corrupt
- WAL gap (không apply liên tục được)
- Encryption key issue

---

## 14. HA roadmap

### 14.1 Giai đoạn 1 (hiện tại — go-live)

- Primary + DR standby async
- Manual failover (DBA + SRE + Mgmt approval)
- RTO < 1h, RPO ~30s
- **Không có** automatic failover

### 14.2 Giai đoạn 2 (12-18 tháng sau go-live)

Đánh giá **Patroni + etcd** cho auto-failover trong PROD DC (1 primary + 1 standby cùng DC; +1 VM etcd quorum = 3 node; training DBA); DR vẫn async streaming. **Trigger:** CCU > 200, downtime DB > 30 phút/tháng, hoặc bank yêu cầu RTO < 15 phút.

Thêm **PgBouncer** (transaction pool, native trên DATA node) khi mở rộng nhiều APP node / bật read replica / CCU > 200 — lúc đó client ≫ backend nên multiplexing mới có lợi (xem §6.3). GĐ1 dùng `CONN_MAX_AGE` là đủ.

### 14.3 Không phù hợp với giai đoạn 1

Sync replication PROD↔DR (WAN 1 Gbps latency không đảm bảo); multi-master (PG không native, pglogical phức tạp); logical replication thay streaming (chậm cho full DB).

---

## 15. Migration workflow (Plane DB schema)

### 15.1 Quy trình migration thường lệ

Plane upstream cung cấp Django migration. SHWS: (1) release branch `preview` → build image; (2) UAT `migrate --check` rồi `migrate` + smoke test; (3) PROD deploy lúc maint window — `pg_dump --schema-only` snapshot trước (rollback ref), `migrate` trong container ephemeral, verify `SELECT * FROM django_migrations ORDER BY id DESC LIMIT 5`.

### 15.2 Lock hazard

`ALTER TABLE ... ADD COLUMN NOT NULL DEFAULT` trên table lớn → blocking. Upstream PR review nên đã filter nhưng SHWS vẫn review patch trước khi merge `preview`; maint window là backstop nếu lock > 30s.

### 15.3 Rollback

Migration fail → restore `pg_dump --schema-only` + revert image. Data migration fail giữa chừng → PITR về trước migrate.

---

## 16. Monitoring metrics (tóm tắt)

Chi tiết xem [08-monitoring-design.md](./08-monitoring-design.md). Metrics cần thiết:

| Metric                            | Source                       | Alert threshold        |
| --------------------------------- | ---------------------------- | ---------------------- |
| Connection count                  | `pg_stat_activity`           | > 250                  |
| Replication lag (seconds)         | `pg_stat_replication`        | > 30s warn, > 5m crit  |
| Replication slot size             | `pg_replication_slots`       | > 1 GB                 |
| Database size                     | `pg_database_size('plane')`  | growth > 5 GB/week     |
| Cache hit ratio                   | `pg_stat_database`           | < 95%                  |
| Long-running queries              | `pg_stat_activity`           | duration > 5 min       |
| Deadlocks                         | `pg_stat_database.deadlocks` | > 0/hour               |
| Vacuum age                        | `pg_stat_user_tables`        | n_dead_tup > 50%       |
| Disk usage `/u01`, `/u02`, `/u03` | node_exporter                | > 80% warn, > 90% crit |
| pgBackRest last successful        | log parse                    | > 25h kể từ lần cuối   |

---

## 17. Risk register

| ID      | Rủi ro                                                                        | Likelihood | Impact   | Mitigation                                                                                                  |
| ------- | ----------------------------------------------------------------------------- | ---------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| DB-R-01 | Replication slot không drain (DR down lâu) → WAL accumulate → fill `/u02`     | Medium     | High     | Alert lag > 1GB; `max_slot_wal_keep_size=4GB` để PG auto-drop slot khi nguy hiểm                            |
| DB-R-02 | Autovacuum bị block bởi long transaction → bloat tăng                         | Medium     | Medium   | Alert long tx > 5 min; `idle_in_transaction_session_timeout=600s`                                           |
| DB-R-03 | Backup encryption key mất → unable to restore                                 | Low        | Critical | Cipher pass backup vào KeePass DBA + Infra Mgr                                                              |
| DB-R-04 | pgBackRest disk `/u03` đầy → backup fail                                      | Medium     | High     | Alert disk > 80%; rsync sang NAS daily; expire job daily                                                    |
| DB-R-05 | Persistent conn (CONN_MAX_AGE) tích lũy gần max_connections khi nhiều process | Low        | Medium   | `max_connections=300` headroom; monitor `pg_stat_activity`; chỉnh `CONN_MAX_AGE`/Celery concurrency nếu cần |
| DB-R-06 | Plane migration lock dài → API timeout                                        | Medium     | Medium   | Review migration trên UAT; chạy maint window; circuit breaker app side                                      |
| DB-R-07 | WAL archive command fail (NAS down)                                           | Low        | High     | `archive_command` retry built-in; alert nếu archive lag > 5 min                                             |
| DB-R-08 | Streaming replication TLS cert hết hạn                                        | Low        | High     | Cert renewal calendar (xem 05-security §4.3); alert 30 ngày trước expire                                    |
| DB-R-09 | Connection storm (worker burst) → vượt `max_connections`                      | Medium     | Medium   | `max_connections=300` headroom; Celery concurrency + rate limit hợp lý ở app                                |
| DB-R-10 | Schema drift PROD vs UAT do hotfix trực tiếp                                  | Low        | High     | Cấm trực tiếp DDL trên PROD ngoài migration; pgaudit log + alert                                            |

---

## 18. Câu hỏi mở

1. **NAS share point cho offsite backup:** Path, protocol, capacity, retention chính sách?
2. **IT Audit policy:** Tần suất restore drill bắt buộc cho non-core banking system?
3. **Maintenance window:** Có lịch maintenance bank chung (NPP, SAN downtime) cần align không?
4. **DBA team:** Ai owner DB ops giai đoạn 1? On-call rotation?
5. **Schema review process:** Plane upstream migration nào cần SHBVN review trước khi apply (vd. data migration)?
6. **TDE / encryption-at-rest:** theo phát biểu canonical [05](./05-security-design.md) §10.1 — GĐ1 chỉ encrypt backup repo (AES-256) + VLAN/physical; disk-level TDE chờ bank confirm.
7. **Resource scaling triggers:** Khi nào tăng RAM/CPU DB node? (Xem capacity-planning file 09)
8. **Patroni Phase 2 timeline:** Mục tiêu năm 2027 có khả thi? Cần budget thêm 1 VM cho etcd quorum.
9. **Cross-DB analytics:** Sau này có nhu cầu data warehouse / BI tool đọc Plane DB? → ảnh hưởng read-only replica strategy.
10. **Postgres major upgrade roadmap:** 15 → 16 → 17 schedule? Phụ thuộc Plane upstream support matrix.

---

## 19. Tham chiếu

- PostgreSQL 15 documentation: <https://www.postgresql.org/docs/15/>
- pgBackRest user guide: <https://pgbackrest.org/user-guide.html>
- PgBouncer config: <https://www.pgbouncer.org/config.html>
- pgaudit documentation: <https://github.com/pgaudit/pgaudit>
- Thông tư 09/2020/TT-NHNN — audit/log requirement
- PGTune (reference tuning baseline): <https://pgtune.leopard.in.ua/>

---

**Status:** 🟡 Draft v0.1 chờ review — Reviewer: DBA (tuning + backup), Infra (NAS), Security (pg_hba + TLS), IT Audit (restore drill), Stakeholder (HA roadmap).
