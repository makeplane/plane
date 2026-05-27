# DR 01 — DATA node replica (PG standby + streaming)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** DBA/SRE
**Host:** `shwsdb1dr` (10.94.20.11) · standby của `shwsdb1p` (10.94.10.11)

> Thiết kế gốc: [`../../01-system-design/03-architecture-dr-site.md`](../../01-system-design/03-architecture-dr-site.md), [`06-database-design.md`](../../01-system-design/06-database-design.md) §10. DB tier: PG streaming async + pgBackRest repo riêng. Platform/file (EMC storage) do **ICTP** — ngoài phạm vi.

---

## 1. Prerequisites

- PROD DATA node (`shwsdb1p`) đã cài + chạy (xem [`../prod/02-data-node-postgres.md`](../prod/02-data-node-postgres.md), [`03-data-node-backup.md`](../prod/03-data-node-backup.md))
- DR DATA node OS + storage sẵn sàng — **giống PROD** (xem [`../prod/01-data-node-os.md`](../prod/01-data-node-os.md): RHEL 9.6, 3 LUN `/u01//u02//u03`, multipath, sysctl)
- PG 15.7 native đã cài trên DR (theo [`../prod/02-data-node-postgres.md`](../prod/02-data-node-postgres.md) §3 — **chỉ cài binary, KHÔNG initdb**; data sẽ đến từ `pg_basebackup`)
- WAN PROD↔DR thông; firewall: DR → `shwsdb1p:5432` (xem [`04-network-design.md`](../../01-system-design/04-network-design.md) §4.2)
- Cert mTLS: `replicator` client cert (bank CA) cho DR

---

## 2. Verification (trước khi sync)

```bash
# Trên shwsdb1dr
cat /etc/redhat-release                  # RHEL 9.6
ls -d /u01 /u02 /u03                      # mount sẵn (giống PROD)
/usr/pgsql-15/bin/postgres --version      # 15.7
nc -vz 10.94.10.11 5432                   # tới PROD primary
# Trên shwsdb1p: replicator role + slot chưa tồn tại
```

---

## 3. Action — Primary (`shwsdb1p`) chuẩn bị

```bash
# 3.1 Role replicator đã tạo ở PROD install (CREATE ROLE replicator LOGIN REPLICATION).
#     pg_hba.conf đã có (mTLS cert từ DR IP):
#     hostssl replication replicator 10.94.20.11/32 cert clientcert=verify-full

# 3.2 Tạo physical replication slot (canonical theo 06-database-design §10.1)
sudo -u postgres psql -c "SELECT pg_create_physical_replication_slot('shws_dr_slot');"
sudo -u postgres psql -c "SELECT slot_name, slot_type, active FROM pg_replication_slots;"
```

> **Canonical:** slot `shws_dr_slot` + **mTLS cert** (theo `06-database-design.md` §10). `03-architecture-dr-site.md` đã đồng bộ (2026-05-27).

---

## 4. Action — Standby (`shwsdb1dr`) initial sync

```bash
# 4.1 Stop PG (nếu đang chạy) + dọn data dir trống cho basebackup
sudo systemctl stop postgresql-15
sudo -u postgres bash -c 'rm -rf /u01/pgsql/15/data/* /u02/pgsql/15/wal/*'

# 4.2 Đặt cert replicator (mTLS) cho standby
sudo -u postgres cp /opt/shws-secrets/replicator.crt /u01/pgsql/15/data/replicator.crt 2>/dev/null || true
# (cert đặt sau basebackup cũng được; dưới đây tham chiếu trong primary_conninfo)

# 4.3 pg_basebackup từ primary qua slot + stream WAL
sudo -iu postgres pg_basebackup \
  -h 10.94.10.11 -p 5432 -U replicator \
  -D /u01/pgsql/15/data \
  -S shws_dr_slot -X stream -P \
  --wal-method=stream
# Thời gian: ~10 phút / 50 GB trên WAN 1 Gbps
```

### 4.1 Cấu hình standby

```bash
# standby.signal → PG khởi động ở recovery mode
sudo -u postgres touch /u01/pgsql/15/data/standby.signal

# Đặt cert mTLS replicator vào data dir
sudo -u postgres cp /opt/shws-secrets/replicator.{crt,key} /u01/pgsql/15/data/
sudo -u postgres cp /opt/shws-secrets/bank-ca.crt /u01/pgsql/15/data/
sudo chmod 600 /u01/pgsql/15/data/replicator.key

# postgresql.auto.conf (theo 06-database-design §10.2)
sudo -u postgres tee -a /u01/pgsql/15/data/postgresql.auto.conf >/dev/null <<'EOF'
primary_conninfo = 'host=10.94.10.11 port=5432 user=replicator sslmode=verify-full sslcert=/u01/pgsql/15/data/replicator.crt sslkey=/u01/pgsql/15/data/replicator.key sslrootcert=/u01/pgsql/15/data/bank-ca.crt application_name=shws_dr'
primary_slot_name = 'shws_dr_slot'
restore_command = 'pgbackrest --stanza=shws-prod archive-get %f %p'
recovery_target_timeline = 'latest'
hot_standby = on
EOF

sudo systemctl start postgresql-15
```

---

## 5. Action — DR pgBackRest repo riêng (backup-of-backup)

```bash
# DR có stanza/repo độc lập trên /u03 của DR (xem 06-database-design §10.2, 07-storage §7)
# Cài pgBackRest giống PROD (xem ../prod/03-data-node-backup.md), repo1-path=/u03/pgbackup
# archive-get của standby đọc từ repo DR (nuôi qua NAS offsite / pgbackrest server push — Infra confirm)
sudo -iu postgres pgbackrest --stanza=shws-prod check
```

> **Câu hỏi mở (từ 06 §10.2):** cơ chế share repo PROD↔DR (NFS mount NAS read-only vs `pgbackrest server-start` TLS push) — Infra confirm WAN bandwidth.

---

## 6. Validation

```bash
# 6.1 Standby ở recovery mode
sudo -u postgres psql -c "SELECT pg_is_in_recovery();"      # true

# 6.2 Trên PRIMARY (shwsdb1p) — thấy standby kết nối + lag
sudo -u postgres psql -c "SELECT client_addr, application_name, state, sync_state, \
  pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes, \
  EXTRACT(EPOCH FROM (now()-reply_time)) AS lag_seconds \
  FROM pg_stat_replication WHERE application_name='shws_dr';"

# 6.3 Trên STANDBY — đang replay WAL
sudo -u postgres psql -c "SELECT status, sender_host, slot_name FROM pg_stat_wal_receiver;"
```

- [ ] `pg_is_in_recovery()` = true (standby)
- [ ] `pg_stat_replication` trên primary thấy `shws_dr` state=`streaming`
- [ ] lag < 30s / < 64 MB (target [`03-architecture-dr-site.md`](../../01-system-design/03-architecture-dr-site.md) §4.3)
- [ ] `pg_stat_wal_receiver` status=`streaming`
- [ ] Test đọc trên standby (hot_standby): `SELECT count(*) FROM ...` (read-only)
- [ ] DR pgBackRest `check` OK

---

## 7. Rollback

| Tình huống                 | Rollback                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| basebackup fail giữa chừng | dọn `/u01/pgsql/15/data`, kiểm WAN/slot, chạy lại §4.3                                                              |
| Standby không stream       | kiểm `primary_conninfo`, cert mTLS, pg_hba primary, firewall 5432                                                   |
| Slot kẹt trên primary      | xem [`../../03-operations/runbooks/disk-full-recovery.md`](../../03-operations/runbooks/disk-full-recovery.md) §3.1 |
| Cần re-seed                | drop data dir, `pg_basebackup` lại (slot giữ WAL trong lúc đó)                                                      |

---

## 8. Troubleshooting

| Triệu chứng                                | Xử lý                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `could not connect to server` (basebackup) | firewall WAN / pg_hba primary chưa cho DR IP / cert sai                                                      |
| `replication slot ... does not exist`      | chưa tạo slot trên primary (§3.2)                                                                            |
| TLS handshake fail                         | cert replicator/CA sai; `sslmode=verify-full` cần CN khớp                                                    |
| lag tăng dần không giảm                    | WAN nghẽn / write rate cao; xem QoS [`04-network-design.md`](../../01-system-design/04-network-design.md) §9 |

---

## 9. Next & liên kết

→ Tiếp: [`02-failover-test.md`](./02-failover-test.md)

- DR architecture: [`../../01-system-design/03-architecture-dr-site.md`](../../01-system-design/03-architecture-dr-site.md)
- DB replication §10: [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md)
- Runbook failover: [`../../03-operations/runbooks/dr-failover.md`](../../03-operations/runbooks/dr-failover.md)
- ADR-006 / ADR-009: [`../../05-change-log/decisions/`](../../05-change-log/decisions/)
