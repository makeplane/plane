# Runbook — PostgreSQL Minor Upgrade (15.x → 15.y)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-26
**Owner:** duonglx · **Audience:** DBA
**Tần suất:** Quarterly (hoặc khẩn khi có CVE) · **Downtime mục tiêu:** < 5 phút (rolling DR-first)

> Thiết kế gốc: [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md) §12.4. Minor upgrade chỉ thay binary (cùng catalog version 15) — **KHÔNG** cần `pg_upgrade`, **KHÔNG** đổi data dir. Major upgrade (15→16) xem [`postgres-major-upgrade.md`](./postgres-major-upgrade.md).

---

## 1. Khi nào dùng

- Có bản vá minor PG 15 (vd 15.7 → 15.8): security fix (CVE), bug fix.
- Theo lịch quarterly (xem [`../routine-maintenance.md`](../routine-maintenance.md) Q3) hoặc emergency khi CVE Critical/High (patch trong 7 ngày — [05-security-design.md](../../01-system-design/05-security-design.md) §9).

**KHÔNG dùng cho:** major version (15→16), thay đổi cấu hình lớn, OS patch (xem runbook OS riêng).

---

## 2. Pre-check

```bash
# 2.1 Version hiện tại trên cả PROD + DR
sudo -u postgres psql -c "SELECT version();"           # cả shwsdb1p và shwsdb1dr
# 2.2 Replication khỏe — DR đang streaming, lag thấp
sudo -u postgres psql -c "SELECT application_name, state, pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag FROM pg_stat_replication;"
# Kỳ vọng: state=streaming, lag < 64 MB
# 2.3 Backup mới nhất OK (BẮT BUỘC trước upgrade)
pgbackrest --stanza=shws-prod info                      # full/diff gần đây, status ok
pgbackrest --stanza=shws-prod check
# 2.4 RPM offline đã có trên cả 2 node (build station → bundle)
ls -l /opt/shws-bundle/pg-stack-rhel9/postgresql15-server-15.y*.rpm
```

**Checklist trước khi action:**

- [ ] Đã test 15.y trên UAT (Docker `postgres:15.y`) — migrate/smoke OK
- [ ] Backup full/diff trong 24h, `check` pass
- [ ] Replication streaming, lag < 64 MB
- [ ] RPM 15.y verify checksum trên cả PROD + DR
- [ ] Maintenance window (CN 04:00–06:00) hoặc emergency window được approve
- [ ] Đã thông báo ops + tạm dừng deploy app trong window

---

## 3. Action — Rolling upgrade (DR-first)

> Nguyên tắc: upgrade **standby DR trước**, failover sang DR, upgrade PROD cũ, failback. Downtime chỉ ở bước switchover.

### Bước 1 — Upgrade standby DR (`shwsdb1dr`)

```bash
# Trên shwsdb1dr
sudo systemctl stop postgresql-15
sudo dnf install --disablerepo=* -y \
  /opt/shws-bundle/pg-stack-rhel9/postgresql15-*-15.y*.rpm   # offline RPM
sudo systemctl start postgresql-15
sudo -u postgres psql -c "SELECT version();"                 # → 15.y
sudo -u postgres psql -c "SELECT pg_is_in_recovery();"       # → true (vẫn standby)
# Verify replication tiếp tục catch up
sudo -u postgres psql -c "SELECT pg_last_wal_replay_lsn(), pg_last_xact_replay_timestamp();"
```

### Bước 2 — Switchover sang DR (downtime bắt đầu)

> Theo [`dr-failover.md`](./dr-failover.md) phần promote — đây là planned switchover, KHÔNG phải disaster. Dừng write PROD trước.

```bash
# Trên shwsdb1p: dừng nhận write (stop app hoặc set default_transaction_read_only)
# Đảm bảo DR đã apply hết WAL (lag = 0) rồi mới promote
sudo -u postgres pg_ctl promote -D /u01/pgsql/15/data        # trên shwsdb1dr
# Trỏ app → DR (đổi DATABASE_URL host → shwsdb1dr trong plane.env), restart api
```

### Bước 3 — Upgrade PROD cũ (`shwsdb1p`) + re-setup làm standby

```bash
# Trên shwsdb1p
sudo systemctl stop postgresql-15
sudo dnf install --disablerepo=* -y /opt/shws-bundle/pg-stack-rhel9/postgresql15-*-15.y*.rpm
# Re-sync làm standby từ DR mới (pg_basebackup hoặc pgBackRest restore + standby.signal)
# Cấu hình primary_conninfo trỏ về DR, tạo standby.signal
sudo systemctl start postgresql-15
sudo -u postgres psql -c "SELECT pg_is_in_recovery();"       # → true
```

### Bước 4 — (Tùy chọn) Switchback về PROD

Nếu muốn PROD trở lại primary: lặp switchover ngược trong cùng window (xem [`dr-failover.md`](./dr-failover.md) §6 Option A). Nếu chấp nhận DR làm primary tạm → để nguyên, switchback ở window sau.

### Phương án đơn giản hóa (nếu downtime cho phép, single-node)

Nếu bank chấp nhận downtime ~5–10 phút và không muốn switchover phức tạp:

```bash
sudo systemctl stop postgresql-15      # PROD
sudo dnf install --disablerepo=* -y <rpm 15.y>
sudo systemctl start postgresql-15
# Sau đó upgrade DR tương tự (DR catch-up qua streaming)
```

---

## 4. Verification

```bash
sudo -u postgres psql -c "SELECT version();"                       # 15.y trên primary
sudo -u postgres psql -c "SELECT pg_is_in_recovery();"             # primary=false, standby=true
sudo -u postgres psql -c "SELECT * FROM pg_stat_replication;"      # streaming trở lại
curl -k https://shwsap1p.bank.local/api/health                     # 200
sudo -u postgres psql -d plane -c "SELECT count(*) FROM projects;"  # sanity
```

- [ ] Cả primary + standby đều 15.y
- [ ] Replication streaming, lag giảm về thấp
- [ ] App health 200, login + tạo issue test OK
- [ ] Không lỗi trong PG log sau restart
- [ ] Ghi `deployment-history.md`

---

## 5. Rollback

- Minor upgrade **không đổi catalog** → có thể downgrade bằng cách cài lại RPM 15.x cũ (`dnf downgrade` từ bundle cũ) rồi restart. Data dir tương thích ngược trong cùng major 15.
- Nếu PG không khởi động sau upgrade: cài lại binary 15.x cũ → start. Nếu data dir hỏng (hiếm): restore từ pgBackRest (xem [`backup-restore.md`](./backup-restore.md)).
- Giữ RPM version cũ trong bundle cho tới khi verify §4 pass.

---

## 6. Escalation

| Tình huống                 | Báo ai                         | Khi nào                         |
| -------------------------- | ------------------------------ | ------------------------------- |
| PG không start sau upgrade | DBA Lead                       | Ngay — rollback binary          |
| Replication không re-sync  | DBA Lead + ICTP (nếu nghi WAN) | Trong window                    |
| Data dir nghi corrupt      | DBA Lead + Management          | Ngay — kích `backup-restore.md` |
| Downtime vượt window       | TL + Management                | Khi quá giờ window              |

---

## 7. Liên kết

- DB design (upgrade policy): [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md) §12.4
- DR failover (switchover): [`dr-failover.md`](./dr-failover.md)
- Backup/restore (rollback): [`backup-restore.md`](./backup-restore.md)
- Major upgrade: [`postgres-major-upgrade.md`](./postgres-major-upgrade.md)
- Checklist Q3: [`../routine-maintenance.md`](../routine-maintenance.md)
- Deployment log: [`../../05-change-log/deployment-history.md`](../../05-change-log/deployment-history.md)
