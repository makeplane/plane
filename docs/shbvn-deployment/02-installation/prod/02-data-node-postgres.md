# PROD 02 — DATA node: PostgreSQL 15.7 native (offline RPM)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** DBA/SRE
**Host:** `shwsdb1p` · PG 15.7 native systemd · PGDATA `/u01/pgsql/15/data` · WAL `/u02/pgsql/15/wal`

> Thiết kế gốc: [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md) §5–§8. Cài + cấu hình PostgreSQL, role, extension (GĐ1 **không** PgBouncer — app nối trực tiếp + `CONN_MAX_AGE`, xem §7). **Chưa** cấu hình backup (xem [`03-data-node-backup.md`](./03-data-node-backup.md)) và replication DR (phase DR).

---

## 1. Prerequisites

- [`01-data-node-os.md`](./01-data-node-os.md) pass: `/u01 /u02 /u03` mount, sysctl/hugepages áp dụng
- Bundle `pg-stack-rhel9/` verify
- Server cert `shwsdb1p` + `bank-ca.crt` (từ [`00-prerequisites.md`](../00-prerequisites.md) §6)
- Mật khẩu role chuẩn bị (KeePass): `plane_app`, `monitoring`

---

## 2. Verification (trước khi cài)

```bash
ls -d /u01 /u02 /u03
sysctl vm.nr_hugepages          # 2200
ls /opt/shws-bundle/pg-stack-rhel9/postgresql15-server-15.7*.rpm
```

---

## 3. Action — Cài PG 15.7 (offline)

```bash
cd /opt/shws-bundle/pg-stack-rhel9
sudo dnf install -y ./postgresql15-server-15.7*.rpm ./postgresql15-contrib-15.7*.rpm \
                    ./postgresql15-15.7*.rpm ./pgaudit*15*.rpm

which postgres pg_ctl psql       # /usr/pgsql-15/bin/...
/usr/pgsql-15/bin/postgres --version   # postgres (PostgreSQL) 15.7
```

---

## 4. Action — Khởi tạo cluster trên SAN

```bash
# Tạo cây thư mục trên LUN, owner postgres
sudo mkdir -p /u01/pgsql/15/data /u02/pgsql/15/wal /var/log/postgresql
sudo chown -R postgres:postgres /u01/pgsql /u02/pgsql /var/log/postgresql
sudo chmod 700 /u01/pgsql/15/data /u02/pgsql/15/wal

# initdb với WAL trên LUN riêng (/u02) + checksum + UTF-8
sudo -iu postgres /usr/pgsql-15/bin/initdb \
  --pgdata=/u01/pgsql/15/data \
  --waldir=/u02/pgsql/15/wal \
  --data-checksums \
  --encoding=UTF8 --locale=en_US.UTF-8
```

> `--data-checksums` phát hiện corruption sớm (quan trọng cho ngân hàng). `--waldir` đặt `pg_wal` lên `/u02` (symlink tự tạo).

### 4.1 systemd unit trỏ đúng PGDATA

```bash
sudo mkdir -p /etc/systemd/system/postgresql-15.service.d
sudo tee /etc/systemd/system/postgresql-15.service.d/override.conf >/dev/null <<'EOF'
[Service]
Environment=PGDATA=/u01/pgsql/15/data
EOF
sudo systemctl daemon-reload
```

---

## 5. Action — Cấu hình PostgreSQL

### 5.1 postgresql.conf

```bash
# Nạp config từ bundle (đã rút từ thiết kế §5.1), rồi sửa giá trị môi trường
sudo -u postgres cp /opt/shws-bundle/os-tuning/postgresql.conf.sample \
     /u01/pgsql/15/data/postgresql.conf
```

Giá trị **bắt buộc kiểm** (đối chiếu [`06-database-design.md`](../../01-system-design/06-database-design.md) §5.1):

```ini
listen_addresses = 'localhost,10.94.10.11'
shared_buffers = 4GB
effective_cache_size = 12GB
max_connections = 300
wal_level = replica
max_wal_senders = 5
max_replication_slots = 5
max_slot_wal_keep_size = 4GB
archive_mode = on
archive_command = 'pgbackrest --stanza=shws-prod archive-push %p'
archive_timeout = 60s
shared_preload_libraries = 'pg_stat_statements,pgaudit'
huge_pages = try
ssl = on
ssl_cert_file = '/u01/pgsql/15/data/server.crt'
ssl_key_file = '/u01/pgsql/15/data/server.key'
ssl_ca_file = '/u01/pgsql/15/data/bank-ca.crt'
ssl_min_protocol_version = 'TLSv1.2'
log_destination = 'csvlog'
logging_collector = on
log_directory = '/var/log/postgresql'
timezone = 'Asia/Ho_Chi_Minh'
```

> `archive_command` trỏ pgBackRest — sẽ fail cho tới khi stanza tạo ở [`03-data-node-backup.md`](./03-data-node-backup.md). Có thể tạm để `archive_mode=on` + đặt stanza trước khi mở traffic, hoặc bật archive sau khi backup cấu hình xong. Khuyến nghị: hoàn tất bước 03 ngay sau bước này.

### 5.2 Cài TLS cert

```bash
sudo -u postgres cp /opt/shws-secrets/shwsdb1p.crt /u01/pgsql/15/data/server.crt
sudo -u postgres cp /opt/shws-secrets/shwsdb1p.key /u01/pgsql/15/data/server.key
sudo -u postgres cp /opt/shws-secrets/bank-ca.crt  /u01/pgsql/15/data/bank-ca.crt
sudo chmod 600 /u01/pgsql/15/data/server.key
```

### 5.3 pg_hba.conf

```bash
sudo -u postgres cp /opt/shws-bundle/os-tuning/pg_hba.conf.sample \
     /u01/pgsql/15/data/pg_hba.conf
```

Nội dung chuẩn (đối chiếu [`06-database-design.md`](../../01-system-design/06-database-design.md) §5.3 — `<APP_IP>` = 10.94.10.10):

```text
local   all             postgres                                peer
local   replication     replicator                              peer
host    plane           plane_app       10.94.10.10/32          scram-sha-256
host    plane           plane_app       127.0.0.1/32            scram-sha-256
host    postgres        monitoring      10.94.10.0/24           scram-sha-256
hostssl replication     replicator      10.94.20.11/32          cert            clientcert=verify-full
host    all             all             0.0.0.0/0               reject
```

> Dòng `replication` cho DR (`10.94.20.11`) chuẩn bị sẵn cho phase DR; chưa có replica thì chưa dùng tới.

---

## 6. Action — Start + tạo DB/role/extension

```bash
sudo systemctl enable --now postgresql-15
sudo systemctl status postgresql-15 --no-pager     # active (running)

sudo -iu postgres psql <<'SQL'
-- Roles (đặt mật khẩu từ KeePass thay <...>)
CREATE ROLE plane_app       LOGIN PASSWORD '<PLANE_APP_PW>';
CREATE ROLE monitoring      LOGIN PASSWORD '<MON_PW>';
CREATE ROLE replicator      LOGIN REPLICATION;          -- mTLS cert, không password

-- Database
CREATE DATABASE plane OWNER plane_app;

-- Privilege model
\c plane
GRANT CONNECT ON DATABASE plane TO plane_app;
GRANT USAGE, CREATE ON SCHEMA public TO plane_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO plane_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO plane_app;
GRANT pg_monitor TO monitoring;
GRANT CONNECT ON DATABASE plane TO monitoring;

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SQL
```

---

## 7. Connection model — app nối trực tiếp (GĐ1, không PgBouncer)

GĐ1 **không** cài PgBouncer. App kết nối thẳng PG `:5432` (TLS); "pooling nhẹ" làm ở Django bằng `CONN_MAX_AGE=300` — cấu hình trong `plane.env` trên **APP node** (xem [`04-app-node-docker.md`](./04-app-node-docker.md) §plane.env), thiết kế [`06-database-design.md`](../../01-system-design/06-database-design.md) §6. Không có thao tác PgBouncer trên DATA node ở bước này.

> PgBouncer chỉ thêm ở **GĐ2** (nhiều APP node / read replica / CCU > 200): cài `pgbouncer` native, thêm role `pgbouncer_auth`, app đổi `:5432` → `:6432`.

---

## 8. Validation

```bash
# 8.1 Local
sudo -u postgres psql -c "SELECT version();"
sudo -u postgres psql -c "SHOW shared_buffers; SHOW wal_level; SHOW ssl;"   # 4GB / replica / on
sudo -u postgres psql -c "SELECT name,setting FROM pg_settings WHERE name='huge_pages';"

# 8.2 Extension preload
sudo -u postgres psql -d plane -c "SELECT * FROM pg_stat_statements LIMIT 1;"

# 8.3 TLS từ APP node — đường kết nối chính (chạy trên shwsap1p sau khi có psql client)
# psql "host=10.94.10.11 port=5432 dbname=plane user=plane_app sslmode=verify-ca sslrootcert=bank-ca.crt"
```

Checklist:

- [ ] `postgresql-15` active, log `/var/log/postgresql` không error
- [ ] `shared_buffers=4GB`, `wal_level=replica`, `ssl=on`
- [ ] DB `plane` + role + extension tạo xong
- [ ] App nối trực tiếp `:5432` TLS OK (test từ shwsap1p — xem 8.3)
- [ ] `pg_hba.conf` mặc định deny (dòng cuối `reject`)

---

## 9. Rollback

| Tình huống                 | Rollback                                                                     |
| -------------------------- | ---------------------------------------------------------------------------- |
| Cấu hình sai → không start | Xem `/var/log/postgresql`, sửa `postgresql.conf`/`pg_hba.conf`, restart      |
| initdb sai path            | `systemctl stop`, xóa `/u01/pgsql/15/data` + `/u02/pgsql/15/wal`, initdb lại |
| Role/DB tạo nhầm           | `DROP DATABASE`/`DROP ROLE`, tạo lại                                         |
| Cần làm lại sạch           | Stop PG, xóa data+wal dir, từ §4                                             |

> Chưa có dữ liệu thật → rollback bằng re-init an toàn. Sau khi có dữ liệu, dùng pgBackRest restore (xem [`03-data-node-backup.md`](./03-data-node-backup.md)).

---

## 10. Troubleshooting

| Triệu chứng                                    | Xử lý                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `FATAL: could not map anonymous shared memory` | hugepages thiếu → giảm `huge_pages=off` hoặc tăng `vm.nr_hugepages`, reboot                      |
| `archive_command failed`                       | bình thường tới khi stanza pgBackRest tạo ([`03-data-node-backup.md`](./03-data-node-backup.md)) |
| App không kết nối TLS                          | sai `sslmode`/CA; kiểm `ssl_ca_file`, cert chain bank CA                                         |
| `peer authentication failed`                   | chạy psql bằng user `postgres` (peer) cho local maintenance                                      |

---

## 11. Next & liên kết

→ Tiếp: [`03-data-node-backup.md`](./03-data-node-backup.md) (pgBackRest, bật `archive_command`)

- DB design: [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md)
- Security (TLS/role/secret): [`../../01-system-design/05-security-design.md`](../../01-system-design/05-security-design.md)
- Runbook minor upgrade: [`../../03-operations/runbooks/postgres-minor-upgrade.md`](../../03-operations/runbooks/postgres-minor-upgrade.md)
