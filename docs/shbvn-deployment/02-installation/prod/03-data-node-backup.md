# PROD 03 — DATA node: pgBackRest (backup, cron, test restore)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** DBA
**Host:** `shwsdb1p` · Stanza `shws-prod` · Repo `/u03/pgbackup`

> Thiết kế gốc: [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md) §9. SOP vận hành backup hằng ngày ở [`../../03-operations/runbooks/backup-restore.md`](../../03-operations/runbooks/backup-restore.md).

---

## 1. Prerequisites

- [`02-data-node-postgres.md`](./02-data-node-postgres.md) pass: PG chạy, role `backup` chưa có (tạo ở §3)
- `/u03` mount RAID-5 1 TB
- Cipher passphrase pgBackRest (sinh ở §4, lưu KeePass DBA + Infra Mgr)
- (Tùy chọn) NAS offsite share point (Infra) — dùng ở §7

---

## 2. Verification

```bash
df -hT /u03                      # XFS ~1 TB
which pgbackrest && pgbackrest version    # 2.51+
sudo -u postgres psql -c "SHOW archive_mode;"   # on
```

---

## 3. Action — Role backup + repo dir

```bash
sudo -iu postgres psql <<'SQL'
CREATE ROLE backup LOGIN REPLICATION;
GRANT pg_read_all_settings TO backup;
SQL

sudo mkdir -p /u03/pgbackup /var/log/pgbackrest /var/spool/pgbackrest
sudo chown -R postgres:postgres /u03/pgbackup /var/log/pgbackrest /var/spool/pgbackrest
```

---

## 4. Action — Cấu hình stanza + cipher

```bash
# Sinh cipher passphrase (LƯU NGAY vào KeePass — mất key = mất khả năng restore)
openssl rand -hex 32        # copy giá trị

sudo install -d -m 0750 -o root -g postgres /etc/pgbackrest/pgbackrest.conf.d
sudo tee /etc/pgbackrest/pgbackrest.conf >/dev/null <<'EOF'
[global]
repo1-path=/u03/pgbackup
repo1-retention-full=4
repo1-retention-full-type=count
repo1-retention-diff=7
repo1-retention-archive=7
repo1-retention-archive-type=diff
repo1-cipher-type=aes-256-cbc
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
EOF

# Cipher pass tách file 0600 (include directive)
sudo tee /etc/pgbackrest/pgbackrest.conf.d/cipher.conf >/dev/null <<EOF
[global]
repo1-cipher-pass=<PASTE_HEX_FROM_OPENSSL>
EOF
sudo chmod 600 /etc/pgbackrest/pgbackrest.conf.d/cipher.conf
sudo chown root:postgres /etc/pgbackrest/pgbackrest.conf.d/cipher.conf
```

> Cấu hình `archive_command` đã đặt trong `postgresql.conf` ở bước 02. Nếu lúc đó để tạm tắt, bật lại bây giờ và `SELECT pg_reload_conf();`.

---

## 5. Action — Tạo stanza + full backup đầu tiên

```bash
sudo -iu postgres
pgbackrest --stanza=shws-prod stanza-create
pgbackrest --stanza=shws-prod check          # "completed successfully"
pgbackrest --stanza=shws-prod --type=full backup
pgbackrest --stanza=shws-prod info           # thấy 1 full, status ok
```

---

## 6. Action — Cron schedule

```bash
sudo tee /etc/cron.d/pgbackrest-shws >/dev/null <<'EOF'
# Full — CN 03:00
0 3 * * 0  postgres  pgbackrest --stanza=shws-prod --type=full backup
# Differential — T2-T7 02:00
0 2 * * 1-6  postgres  pgbackrest --stanza=shws-prod --type=diff backup
# Incremental — mỗi giờ phút 30
30 * * * *  postgres  pgbackrest --stanza=shws-prod --type=incr backup
# Expire — hàng ngày 04:00
0 4 * * *  postgres  pgbackrest --stanza=shws-prod expire
# Rsync NAS offsite — hàng ngày 05:00
0 5 * * *  root      /usr/local/bin/shws-backup-to-nas.sh
# Verify repo — CN 06:00
0 6 * * 0  postgres  pgbackrest --stanza=shws-prod check
EOF
```

---

## 7. Action — Offsite rsync sang NAS (nếu Infra cấp)

```bash
sudo tee /usr/local/bin/shws-backup-to-nas.sh >/dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
SRC=/u03/pgbackup/
DST=/mnt/nas/shws-prod-backup/        # NAS path (Infra cấp)
LOG=/var/log/shws/backup-to-nas.log
mkdir -p "$(dirname "$LOG")" "$DST"
START=$(date +%s)
rsync -aHAX --delete-after "$SRC" "$DST" >>"$LOG" 2>&1
echo "$(date -Is) rsync done in $(( $(date +%s)-START ))s" >>"$LOG"
EOF
sudo chmod +x /usr/local/bin/shws-backup-to-nas.sh
```

> NAS path/protocol (NFS/CIFS) + mount fstab do Infra cung cấp — còn TBD. Nếu chưa có NAS, comment dòng cron rsync, ghi vào câu hỏi mở.

---

## 8. Validation

```bash
sudo -iu postgres
pgbackrest --stanza=shws-prod info             # full ok, archive ok
pgbackrest --stanza=shws-prod check            # completed successfully

# WAL archive đang chạy
sudo -u postgres psql -c "SELECT pg_switch_wal();"
ls -lt /u03/pgbackup/archive/shws-prod/*/ | head   # có WAL segment mới
```

### 8.1 Test restore (vào instance throwaway — KHÔNG đè prod)

```bash
# Ví dụ restore vào /tmp dir để verify integrity (không start chồng port)
sudo -iu postgres
pgbackrest --stanza=shws-prod --delta \
  --pg1-path=/var/tmp/restore-test restore
ls /var/tmp/restore-test/PG_VERSION    # tồn tại → backup restore được
sudo rm -rf /var/tmp/restore-test
```

Checklist:

- [ ] `info` hiển thị full + archive `ok`
- [ ] `check` pass
- [ ] WAL segment xuất hiện trong repo sau `pg_switch_wal()`
- [ ] Test restore ra `PG_VERSION` hợp lệ
- [ ] Cipher passphrase đã lưu KeePass (2 nơi)
- [ ] Cron file đúng cú pháp (`crontab -T` hoặc kiểm `/var/log/cron`)

---

## 9. Rollback

| Tình huống           | Rollback                                                            |
| -------------------- | ------------------------------------------------------------------- |
| stanza-create lỗi    | Xóa `/u03/pgbackup/*`, sửa conf, `stanza-create` lại                |
| Cipher pass sai/mất  | **Không restore được backup đã mã hoá** → tạo stanza mới + full mới |
| Cron sai giờ         | Sửa `/etc/cron.d/pgbackrest-shws`                                   |
| archive_command fail | tắt tạm `archive_mode`, sửa, bật lại + reload                       |

> ⚠️ Mất cipher passphrase = mất khả năng restore mọi backup đã có. Bảo vệ key là ưu tiên P1.

---

## 10. Troubleshooting

| Triệu chứng                                  | Xử lý                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `unable to find primary cluster`             | `pg1-path`/`pg1-port` sai; PG chưa chạy                                                                      |
| `archive-push ... WAL segment ... not found` | quyền `/u03` hoặc spool sai owner postgres                                                                   |
| repo đầy nhanh                               | retention sai; `expire` chưa chạy; xem [`backup-restore.md`](../../03-operations/runbooks/backup-restore.md) |
| rsync NAS fail                               | NAS chưa mount/credential; xem `/var/log/shws/backup-to-nas.log`                                             |

---

## 11. Next & liên kết

→ Tiếp: [`04-app-node-docker.md`](./04-app-node-docker.md)

- Runbook backup/restore (SOP): [`../../03-operations/runbooks/backup-restore.md`](../../03-operations/runbooks/backup-restore.md)
- DB design backup: [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md) §9
- Storage retention: [`../../01-system-design/07-storage-design.md`](../../01-system-design/07-storage-design.md) §8
