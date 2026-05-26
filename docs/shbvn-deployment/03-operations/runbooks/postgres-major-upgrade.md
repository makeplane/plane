# Runbook — PostgreSQL Major Upgrade (15 → 16)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-26
**Owner:** duonglx · **Audience:** DBA + SRE
**Tần suất:** Multi-year (dự án riêng) · **Downtime mục tiêu:** < 1 giờ (pg_upgrade `--link`)

> Major upgrade là **dự án có planning riêng**, không phải thao tác window thường lệ. Đổi catalog version → bắt buộc `pg_upgrade` (hoặc logical replication). Phụ thuộc **Plane upstream support matrix** (PG 16 phải được Plane test). Thiết kế gốc: [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md) §12.4, §18 (q10).

---

## 1. Khi nào dùng

- PG 15 sắp EOL (support đến **2027-11**) → nâng 16/17 trước EOL.
- Cần tính năng major mới hoặc Plane upstream yêu cầu version cao hơn.

**Tiền đề bắt buộc:**

- Plane upstream **đã chứng nhận** chạy trên PG 16.
- Đã chạy đầy đủ trên UAT (migrate + load test + soak) với PG 16.
- Có window dài (ngoài giờ, có thể cuối tuần) + approval Management.

---

## 2. Pre-check

```bash
# 2.1 Version + dung lượng data dir (ước thời gian pg_upgrade)
sudo -u postgres psql -c "SELECT version();"
du -sh /u01/pgsql/15/data
# 2.2 Backup full mới + verify (BẮT BUỘC — đây là điểm rollback chính)
pgbackrest --stanza=shws-prod --type=full backup
pgbackrest --stanza=shws-prod check
# 2.3 RPM PG 16 offline sẵn sàng (cùng node)
ls /opt/shws-bundle/pg-stack-rhel9/postgresql16-*.rpm
# 2.4 Extension tương thích PG 16: pg_stat_statements, pgaudit, pgcrypto
#     → verify version pgaudit cho PG16 có trong bundle
# 2.5 pg_upgrade --check (dry run, không đổi gì)
sudo -u postgres /usr/pgsql-16/bin/pg_upgrade \
  --old-bindir=/usr/pgsql-15/bin --new-bindir=/usr/pgsql-16/bin \
  --old-datadir=/u01/pgsql/15/data --new-datadir=/u01/pgsql/16/data \
  --check
# Kỳ vọng: "Clusters are compatible"
```

**Checklist:**

- [ ] Plane upstream xác nhận support PG 16
- [ ] UAT chạy PG 16 pass migrate + load + soak
- [ ] Backup full mới + `check` pass + offsite copy xác nhận
- [ ] `pg_upgrade --check` → compatible
- [ ] Extension PG16 RPM trong bundle (pgaudit version khớp)
- [ ] Initdb cluster 16 mới (`/u01/pgsql/16/data`) với cùng locale/encoding
- [ ] Window dài + rollback plan + approval Management
- [ ] DR plan: rebuild standby PG16 sau khi primary lên 16

---

## 3. Action

> Phương án chính: **`pg_upgrade --link`** (hardlink, nhanh, downtime ngắn nhưng KHÔNG rollback in-place được — rollback = restore backup). Cân nhắc `--clone`/copy nếu cần giữ data dir 15 nguyên (cần dung lượng đôi, chậm hơn).

### Bước 0 — Chuẩn bị cluster 16 mới

```bash
sudo dnf install --disablerepo=* -y /opt/shws-bundle/pg-stack-rhel9/postgresql16-*.rpm
sudo -u postgres /usr/pgsql-16/bin/initdb -D /u01/pgsql/16/data \
  --locale=en_US.UTF-8 --encoding=UTF8
# Copy postgresql.conf / pg_hba.conf / pg_ident từ 15 sang 16, điều chỉnh path
```

### Bước 1 — Dừng dịch vụ (downtime bắt đầu)

```bash
# Stop app (PROD) — không nhận write
sudo systemctl stop postgresql-15           # cả primary
# Đảm bảo DR đã apply hết WAL trước khi dừng (nếu giữ DR đồng bộ)
```

### Bước 2 — Chạy pg_upgrade

```bash
sudo -u postgres /usr/pgsql-16/bin/pg_upgrade \
  --old-bindir=/usr/pgsql-15/bin --new-bindir=/usr/pgsql-16/bin \
  --old-datadir=/u01/pgsql/15/data --new-datadir=/u01/pgsql/16/data \
  --link
# Kỳ vọng: "Upgrade Complete" + sinh analyze_new_cluster.sh, delete_old_cluster.sh
```

### Bước 3 — Khởi động 16 + analyze

```bash
# Cập nhật symlink pg_wal /u02, kiểm postgresql.conf archive_command, ssl path
sudo systemctl start postgresql-16          # service unit 16
sudo -u postgres /usr/pgsql-16/bin/vacuumdb --all --analyze-in-stages   # rebuild statistics
```

### Bước 4 — Rebuild backup stanza + DR standby

```bash
# pgBackRest stanza cho PG16 (pg1-path → /u01/pgsql/16/data, pg1 version 16)
pgbackrest --stanza=shws-prod --no-online stanza-upgrade
pgbackrest --stanza=shws-prod --type=full backup     # full backup mới trên 16
# DR: rebuild standby từ primary 16 (pg_basebackup) — DR cũ PG15 không stream sang 16 được
```

### Bước 5 — Mở lại app

Trỏ app → primary 16, restart api, mở traffic.

---

## 4. Verification

```bash
sudo -u postgres psql -c "SELECT version();"                       # 16.x
sudo -u postgres psql -d plane -c "SELECT count(*) FROM projects;"  # row khớp pre-upgrade
sudo -u postgres psql -d plane -c "\dx"                            # extension load đủ
curl -k https://shwsap1p.bank.local/api/health                     # 200
# Replication DR
sudo -u postgres psql -c "SELECT * FROM pg_stat_replication;"      # standby 16 streaming
```

- [ ] Version 16, row count khớp, extension OK
- [ ] App login + CRUD + dashboard OK
- [ ] Backup full PG16 thành công
- [ ] DR standby 16 streaming, lag thấp
- [ ] Load smoke test ngắn — latency không xấu đi
- [ ] Ghi `deployment-history.md` + thông báo go-live PG16

---

## 5. Rollback

> `--link` mode: cluster 15 cũ **không dùng lại an toàn** sau khi 16 đã start (hardlink shared). Rollback = **restore từ backup full PG15**.

1. Stop PG16.
2. Restore backup PG15 (xem [`backup-restore.md`](./backup-restore.md)) vào `/u01/pgsql/15/data`.
3. Start PG15, trỏ app về 15.
4. Rebuild DR standby PG15.

→ **Quyết định rollback phải nhanh** (trong window). Nếu phát hiện lỗi nghiêm trọng sau khi mở traffic → có thể mất data từ thời điểm cutover (chấp nhận theo RPO, vì backup là điểm trước upgrade). Cân nhắc giữ data dir 15 (copy mode) cho upgrade rủi ro cao.

---

## 6. Escalation

| Tình huống                 | Báo ai                | Khi nào                  |
| -------------------------- | --------------------- | ------------------------ |
| `pg_upgrade --check` fail  | DBA Lead              | Trước window — hoãn      |
| pg_upgrade fail giữa chừng | DBA Lead + Management | Ngay — đánh giá rollback |
| Extension không load PG16  | DBA Lead              | Trong window             |
| App lỗi sau cutover        | TL + DBA + Management | Ngay — cân nhắc rollback |
| Downtime vượt 1 giờ        | Management            | Khi quá mục tiêu RTO     |

---

## 7. Liên kết

- DB design (upgrade roadmap): [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md) §12.4
- Minor upgrade: [`postgres-minor-upgrade.md`](./postgres-minor-upgrade.md)
- Backup/restore (rollback): [`backup-restore.md`](./backup-restore.md)
- DR failover: [`dr-failover.md`](./dr-failover.md)
- Deployment log: [`../../05-change-log/deployment-history.md`](../../05-change-log/deployment-history.md)
