# Runbook — Disk full recovery (/u02 WAL, /u03 backup)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** DBA, SRE
**Host:** `shwsdb1p` (DATA node)

> Thiết kế gốc: [`07-storage-design.md`](../../01-system-design/07-storage-design.md) §6,§9; [`06-database-design.md`](../../01-system-design/06-database-design.md) §9 (DB-R-01/04). Disk đầy là sự cố P1/P2 (DB có thể freeze).

---

## 1. Khi nào dùng

- Alert disk `/u02` (WAL) hoặc `/u03` (backup) > 80% (warn) / > 90% (crit)
- DB báo lỗi không ghi được WAL / backup fail
- `/u01` (data) đầy

**Mức nguy hiểm:** `/u02` đầy → **DB freeze** (không commit). `/u03` đầy → backup fail (không freeze ngay nhưng mất RPO). `/u01` đầy → DB dừng ghi.

---

## 2. Pre-check

```bash
ssh shwsdb1p
df -h /u01 /u02 /u03                         # xác định LUN nào đầy
sudo du -sh /u02/pgsql/15/wal /u03/pgbackup  # nơi chiếm chỗ
sudo -u postgres psql -c "SELECT slot_name, active, \
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained \
  FROM pg_replication_slots;"                # slot giữ WAL?
```

---

## 3. Action — theo LUN đầy

### 3.1 `/u02` (WAL) đầy — KHẨN

Nguyên nhân thường gặp: replication slot không drain (DR down) → WAL tích tụ (DB-R-01).

```bash
# 3.1.1 Kiểm slot kẹt
sudo -u postgres psql -c "SELECT slot_name, active, restart_lsn FROM pg_replication_slots;"

# 3.1.2 Nếu DR chết lâu và slot giữ WAL nguy hiểm → drop slot (DR sẽ phải re-seed)
sudo -u postgres psql -c "SELECT pg_drop_replication_slot('shws_dr_slot');"
# (max_slot_wal_keep_size=4GB đáng lẽ tự invalidate; drop thủ công nếu cần gấp)

# 3.1.3 Đẩy WAL đã archive + checkpoint để PG dọn WAL cũ
sudo -u postgres psql -c "CHECKPOINT;"
sudo -iu postgres pgbackrest --stanza=shws-prod check    # archive thông?

# 3.1.4 Nếu vẫn nghẹt → mở rộng LUN online (ICTP mở rộng array trước)
echo 1 | sudo tee /sys/block/<dev>/device/rescan
sudo multipathd resize map shws-wal
sudo pvresize /dev/mapper/shws-wal
sudo lvextend -l +100%FREE /dev/vg_wal/lv_pgwal
sudo xfs_growfs /u02
```

### 3.2 `/u03` (backup) đầy

```bash
sudo -iu postgres
pgbackrest --stanza=shws-prod expire          # áp retention, xóa backup cũ
pgbackrest --stanza=shws-prod info            # dung lượng sau expire
# Rsync offsite + (nếu cần) mở rộng LUN-3 như §3.1.4 (vg_bkp/lv_pgbackup, /u03)
```

### 3.3 `/u01` (data) đầy

```bash
df -h /u01
# KHÔNG xóa file trong PGDATA. Mở rộng LUN-1 online (vg_data/lv_pgdata, /u01) như §3.1.4.
# Kiểm MinIO upload chiếm chỗ: du -sh /u01/minio
```

---

## 4. Verification

```bash
df -h /u01 /u02 /u03                          # free > 20%
sudo systemctl status postgresql-15           # active, không lỗi WAL
sudo -u postgres psql -c "SELECT now();"      # ghi được (commit OK)
sudo -u postgres psql -c "INSERT INTO ... ; ROLLBACK;"  # hoặc test ghi nhẹ
sudo -iu postgres pgbackrest --stanza=shws-prod check
```

- [ ] Disk free > 20% (cả 3 LUN)
- [ ] DB commit được (không freeze)
- [ ] Backup/archive hoạt động lại
- [ ] Nếu drop slot → lên kế hoạch re-seed DR ([`dr-failover.md`](./dr-failover.md) / DR install)

---

## 5. Rollback

- Mở rộng LUN online không rollback được (XFS không shrink) — sizing thận trọng.
- Drop slot: không undo; phải re-seed DR standby (pg_basebackup lại).
- Không xóa WAL thủ công bằng `rm` trong `pg_wal` — gây corruption. Chỉ để PG/pgBackRest dọn.

---

## 6. Escalation

| Tình huống                        | Báo ai                   | Khi nào        |
| --------------------------------- | ------------------------ | -------------- |
| `/u02` đầy, DB freeze             | DBA Lead + SRE + Mgmt    | NGAY (P1)      |
| Cần mở rộng LUN (ICTP)            | Infra/ICTP               | NGAY           |
| Phải drop replication slot        | DBA Lead (+ ghi nhận DR) | Trước khi drop |
| Đầy tái diễn (retention/slot sai) | DBA Lead                 | Trong ngày     |

---

## 7. Liên kết

- Storage design (mở rộng online): [`../../01-system-design/07-storage-design.md`](../../01-system-design/07-storage-design.md) §6.3
- DB design (slot, retention): [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md) §9
- Backup/restore: [`backup-restore.md`](./backup-restore.md)
- Routine checklist (disk): [`../routine-maintenance.md`](../routine-maintenance.md)
