# DR 02 — Failover test (promote drill)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** DBA, SRE Lead
**Scope:** Kiểm thử promote DR replica → primary (drill); thực thi failover thật xem runbook.

> Thiết kế gốc: [`../../01-system-design/03-architecture-dr-site.md`](../../01-system-design/03-architecture-dr-site.md) §5–§7. SOP failover thật (sự cố P1): [`../../03-operations/runbooks/dr-failover.md`](../../03-operations/runbooks/dr-failover.md). Tài liệu này là **drill setup/validation**.

---

## 1. Khi nào dùng

- Sau khi cài DR replica ([`01-data-node-replica.md`](./01-data-node-replica.md)) — verify promote được
- **DR drill định kỳ (quarterly)** — bắt buộc compliance bank
- Trước go-live — chứng minh RTO < 1h đạt được

**Loại drill** (xem [`03-architecture-dr-site.md`](../../01-system-design/03-architecture-dr-site.md) §7.1): Tabletop (tháng) · **Partial/shadow** (quý) · Full failover (bi-annual, maintenance window). Tài liệu này tập trung **Partial drill** (an toàn, không impact PROD).

---

## 2. Pre-check

```bash
# 2.1 Replication khỏe (trên primary shwsdb1p)
sudo -u postgres psql -c "SELECT application_name, state, \
  EXTRACT(EPOCH FROM (now()-reply_time)) AS lag_s FROM pg_stat_replication;"
# lag_s < 60

# 2.2 Standby replay gần đây (trên shwsdb1dr)
sudo -u postgres psql -c "SELECT pg_is_in_recovery(), pg_last_wal_replay_lsn();"

# 2.3 Hyper-V checkpoint của shwsdb1dr (để revert sau drill)
```

- [ ] Replication lag < 1 phút
- [ ] Đã tạo **Hyper-V checkpoint** DR DATA node (revert sau drill)
- [ ] Drill chạy ở **shadow mode** — KHÔNG update DNS, KHÔNG cắt PROD
- [ ] Thông báo lịch drill (window), có DBA + SRE

---

## 3. Action — Partial drill (shadow promote)

```bash
# 3.1 (Tùy chọn) Tách standby khỏi stream để mô phỏng PROD mất
#     — drill shadow: có thể giữ stream, chỉ promote bản copy checkpoint.
#     An toàn nhất: drill trên VM clone từ checkpoint, KHÔNG đụng standby thật.

# 3.2 Promote standby → primary (trên shwsdb1dr hoặc clone)
sudo -u postgres pg_ctl promote -D /u01/pgsql/15/data
sudo -u postgres psql -c "SELECT pg_is_in_recovery();"   # false = đã là primary

# 3.3 (Shadow) Start APP cold standby trỏ DR DB — qua hosts file, KHÔNG DNS thật
#     .env app trỏ shwsdb1dr; xem 03-architecture-dr-site §5.3
cd /opt/shws-deployment 2>/dev/null && docker compose up -d || true

# 3.4 Smoke test qua endpoint DR (hosts file override, không CNAME thật)
curl -k --resolve shws.bank.local:443:10.94.20.10 https://shws.bank.local/api/health
```

> **ICTP (platform tier):** trong full failover, ICTP xác nhận file MinIO + platform sẵn ở DR (EMC storage). Drill partial có thể bỏ qua hoặc mô phỏng.

---

## 4. Verification

```bash
# DR primary đọc-ghi
sudo -u postgres psql -d plane -c "SELECT now();"
sudo -u postgres psql -d plane -c "SELECT count(*) FROM projects, issues;"   # so với PROD cùng mốc
```

- [ ] `pg_is_in_recovery()` = false (promote thành công)
- [ ] Sanity query khớp PROD (±5%, theo RPO lag)
- [ ] App (shadow) login + tạo issue + mở file đính kèm OK
- [ ] **RTO thực tế đo được < 60 phút** (ghi lại)
- [ ] RPO thực tế < 15 phút (so mốc dữ liệu cuối)

Ghi kết quả → `plans/reports/dr-drill-YYYYMMDD.md` + cập nhật [`incident-log.md`](../../05-change-log/incident-log.md) (mục drill).

---

## 5. Rollback (BẮT BUỘC sau partial drill)

```bash
# 5.1 Stop app shadow
docker compose down 2>/dev/null || true

# 5.2 Revert DR DATA node về checkpoint (trở lại standby)
#     Hyper-V: revert checkpoint đã tạo ở §2

# 5.3 Re-sync replication (nếu standby đã divergent)
#     Nếu revert checkpoint sạch → stream tự nối lại.
#     Nếu cần: re-seed bằng pg_basebackup (xem 01-data-node-replica §4.3)
sudo -u postgres psql -c "SELECT status FROM pg_stat_wal_receiver;"   # streaming lại
```

- [ ] DR trở lại standby (`pg_is_in_recovery()` = true)
- [ ] Replication nối lại, lag về bình thường
- [ ] PROD KHÔNG bị ảnh hưởng suốt drill (verify `pg_stat_replication` trên PROD)

> ⚠️ **Split-brain:** KHÔNG bao giờ để cả PROD và DR cùng nhận write. Drill shadow không update DNS chính là để tránh điều này.

---

## 6. Escalation

| Tình huống                   | Báo ai                | Khi nào            |
| ---------------------------- | --------------------- | ------------------ |
| Promote drill fail           | DBA Lead              | Trong ngày         |
| Không revert được về standby | DBA Lead + Infra      | NGAY               |
| RTO drill > 60 phút          | DBA + SRE Lead + Mgmt | Sau drill (review) |
| Phát hiện split-brain risk   | DBA Lead + SRE        | NGAY               |

---

## 7. Liên kết

- DR architecture (failover §5, drill §7): [`../../01-system-design/03-architecture-dr-site.md`](../../01-system-design/03-architecture-dr-site.md)
- Runbook failover thật (P1): [`../../03-operations/runbooks/dr-failover.md`](../../03-operations/runbooks/dr-failover.md)
- Cài DR replica: [`01-data-node-replica.md`](./01-data-node-replica.md)
- Incident/drill log: [`../../05-change-log/incident-log.md`](../../05-change-log/incident-log.md)
