# Runbook — Backup & Restore (pgBackRest)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-26
**Owner:** duonglx · **Audience:** DBA
**Stanza:** `shws-prod` · **Repo:** `/u03/pgbackup` · **Host:** `shwsdb1p`

> Thiết kế gốc: [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md) §9. Runbook này là SOP thao tác.

---

## 1. Khi nào dùng

- **Backup:** chạy tự động (cron/timer). Runbook dùng khi cần backup thủ công (trước maintenance, trước deploy lớn) hoặc khi backup tự động fail.
- **Restore:** khi mất/hỏng dữ liệu, cần PITR về thời điểm trước sự cố, hoặc trong restore drill định kỳ.

**Lịch backup tự động (tham chiếu):**

| Loại         | Tần suất  | Thời gian                           | Retention     |
| ------------ | --------- | ----------------------------------- | ------------- |
| Full         | Hàng tuần | CN 03:00                            | 4 fulls       |
| Differential | Hàng ngày | T2–T7 02:00                         | 7 diffs       |
| Incremental  | Mỗi giờ   | xx:30                               | theo diff cha |
| WAL archive  | Liên tục  | `archive_command`, force switch 60s | 7 ngày        |

**RPO ~30 giây · RTO ~30–45 phút** (restore full + diff + incr + WAL trên SAN).

---

## 2. Pre-check

```bash
# Trên shwsdb1p, user postgres
sudo -iu postgres

# 2.1 Trạng thái repo + danh sách backup
pgbackrest --stanza=shws-prod info
# Kỳ vọng: có full + diff + incr gần đây, status = "ok"

# 2.2 Kiểm tra cấu hình & kết nối repo
pgbackrest --stanza=shws-prod check
# Kỳ vọng: "successfully archived ... check command end: completed successfully"

# 2.3 Disk free repo
df -h /u03
# Kỳ vọng: free > 20%
```

Dừng lại nếu `check` fail hoặc `/u03` sắp đầy → xử lý trước, không backup/restore tiếp.

---

## 3. Action — Backup thủ công

```bash
sudo -iu postgres

# Full backup thủ công
pgbackrest --stanza=shws-prod --type=full backup

# Differential (nhanh hơn, dựa trên full gần nhất)
pgbackrest --stanza=shws-prod --type=diff backup

# Incremental
pgbackrest --stanza=shws-prod --type=incr backup
```

Expected: kết thúc `backup command end: completed successfully`. Thời gian: full ~1–2h, diff 30–60 phút, incr 5–15 phút.

---

## 4. Action — Restore

> ⚠️ **Restore đè lên `$PGDATA` là thao tác phá hủy.** Chỉ làm khi chắc chắn, đã có approval (P1), và đã verify primary không còn dùng được. Nếu restore để drill → restore vào **path/instance khác**, KHÔNG đè prod.

### 4.1 Chuẩn bị

```bash
# Stop PostgreSQL trước khi restore đè $PGDATA
sudo systemctl stop postgresql-15
# Backup nhanh thư mục data hiện tại (nếu còn đọc được) phòng hờ
sudo mv /u01/pgsql/15/data /u01/pgsql/15/data.broken.$(date +%Y%m%d%H%M)
sudo -u postgres mkdir -p /u01/pgsql/15/data
sudo chmod 700 /u01/pgsql/15/data
```

### 4.2 Restore mới nhất (latest)

```bash
sudo -iu postgres
pgbackrest --stanza=shws-prod --delta restore
# --delta: chỉ ghi đè block khác → nhanh hơn nếu data dir còn 1 phần
```

### 4.3 Point-In-Time Recovery (PITR) — restore về thời điểm cụ thể

```bash
sudo -iu postgres
pgbackrest --stanza=shws-prod --delta \
  --type=time "--target=2026-05-26 09:30:00+07" \
  --target-action=promote restore
```

`--target`: thời điểm ngay TRƯỚC sự cố (vd trước khi lệnh DELETE nhầm chạy).

### 4.4 Khởi động lại

```bash
sudo systemctl start postgresql-15
sudo -u postgres psql -c "SELECT pg_is_in_recovery();"
# Sau PITR promote → false (đã là primary đọc-ghi)
```

---

## 5. Verification

```bash
sudo -u postgres psql -d plane -c "SELECT now();"                       # DB mở được
sudo -u postgres psql -d plane -c "SELECT count(*) FROM projects;"      # đếm bảng chính
sudo -u postgres psql -d plane -c "SELECT max(created_at) FROM issues;" # mốc dữ liệu gần nhất hợp lý
```

- [ ] DB mở, không lỗi recovery
- [ ] Số liệu bảng chính khớp kỳ vọng (so mốc thời gian PITR)
- [ ] App kết nối lại OK (`curl -k https://shwsap1p.bank.local/api/health` → 200)
- [ ] Sau khi xác nhận tốt → xóa `data.broken.*` để giải phóng dung lượng

**Restore drill (Monthly M1 / Quarterly Q2):** thực hiện 4.2 vào instance throwaway, chạy §5, ghi kết quả + thời gian vào checklist. KHÔNG đè prod.

---

## 6. Rollback

- Restore sai target → restore lại với `--target` đúng (PITR cho phép lặp).
- Lỡ đè `$PGDATA` và restore hỏng → dùng `data.broken.*` đã mv ở 4.1, hoặc restore từ DR replica (xem `dr-failover.md`), hoặc offsite copy NAS.
- **Không xóa** `data.broken.*` cho tới khi verification §5 pass hoàn toàn.

---

## 7. Escalation

| Tình huống                           | Báo ai                  | Khi nào            |
| ------------------------------------ | ----------------------- | ------------------ |
| Backup tự động fail 2 ngày liên tiếp | TL + DBA Lead           | Trong ngày         |
| Repo `/u03` đầy / corrupt            | DBA Lead + Infra        | Ngay               |
| Restore prod fail (P1)               | TL + DBA + Management   | Ngay, kích DR plan |
| Mất cả repo local + offsite          | Management + Compliance | Ngay               |

---

## 8. Liên kết

- DB design (config backup): [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md)
- DR failover: [`dr-failover.md`](./dr-failover.md)
- Checklist định kỳ: [`../routine-maintenance.md`](../routine-maintenance.md)
- Incident log: [`../../05-change-log/incident-log.md`](../../05-change-log/incident-log.md)
