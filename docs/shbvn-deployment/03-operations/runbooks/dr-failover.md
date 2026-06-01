# Runbook — DR Failover & Failback

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-26
**Owner:** duonglx · **Audience:** DBA + SRE + Storage + Management
**RTO mục tiêu:** < 1 giờ · **Authority:** DBA + SRE Lead + Management approval

> Thiết kế gốc + rationale: [`../../01-system-design/03-architecture-dr-site.md`](../../01-system-design/03-architecture-dr-site.md). Runbook này là SOP thực thi khi sự cố.
>
> **Mô hình 2 layer:** DB qua PG streaming — **SHWS** promote standby; file MinIO + platform qua **DELL EMC Storage** — **ICTP (hạ tầng)** đảm nhiệm. Failover phối hợp 2 bên.

---

## 1. Khi nào dùng

PROD site (DC) mất hoàn toàn và **không hồi phục kịp RTO**: DC outage, DB corruption không restore được tại chỗ, disaster vật lý. **KHÔNG** dùng cho lỗi cục bộ còn fix nhanh tại DC (restart, restore local).

---

## 2. Pre-check (bắt buộc trước promote — chống split-brain)

- [ ] PROD primary **CHẮC CHẮN** không hồi phục trong RTO (xác nhận với TL/Infra)
- [ ] PROD đã được **cô lập khỏi network** (tránh 2 primary cùng sống)
- [ ] Replication lag DB last-seen < 1 phút:
  ```bash
  # (nếu còn truy cập được PROD) hoặc xem giá trị monitor gần nhất
  psql -h shwsdb1p -c "SELECT application_name, replay_lsn, reply_time FROM pg_stat_replication;"
  ```
- [ ] DR replica health — đang replay gần đây:
  ```bash
  sudo -u postgres psql -h shwsdb1dr -c "SELECT pg_last_wal_replay_lsn(), pg_last_xact_replay_timestamp();"
  ```
- [ ] **ICTP xác nhận** dữ liệu platform & file MinIO đã sẵn sàng ở DR (EMC storage)
- [ ] DR APP node ready: Docker images đúng version, `.env` trỏ `shwsdb1dr`
- [ ] DNS/VIP failover plan sẵn sàng
- [ ] **Management approve chính thức** (email/ticket) — ghi lại bằng chứng

---

## 3. Action — Execute failover

### Bước 0 — (ICTP) Sẵn sàng platform & file ở DR

ICTP (hạ tầng) đảm bảo dữ liệu platform & file MinIO đã được EMC storage replicate và sẵn sàng ở DR. Phía SHWS chỉ chờ ICTP xác nhận, không thao tác storage.

- [ ] ICTP xác nhận file/platform DR sẵn sàng

### Bước 1 — (DBA) Promote PG replica → primary

```bash
sudo -u postgres pg_ctl promote -D /u01/pgsql/15/data
sudo -u postgres psql -c "SELECT pg_is_in_recovery();"   # → false
```

### Bước 2 — (Ops) Start MinIO (sau khi ICTP xác nhận file sẵn sàng)

```bash
# trên shwsdb1dr
docker compose up -d plane-minio
docker compose logs --tail=50 plane-minio
```

### Bước 3 — (Network) Chuyển traffic sang DR

Update DNS hoặc VIP → DR endpoints (theo runbook network team — TBD).

### Bước 4 — (Ops) Start app stack DR

```bash
# trên shwsap1dr
cd /opt/shws-deployment
docker compose up -d
docker compose logs -f api    # verify api kết nối DR DB
```

---

## 4. Verification

```bash
curl -k https://shwsap1dr.bank.local/api/health      # 200
```

- [ ] Login flow OK (LDAP/SwingSSO)
- [ ] Tạo issue test → lưu OK (verify DB ghi được)
- [ ] **Mở 1 file đính kèm cũ** → verify file MinIO ở DR đọc được
- [ ] Kiểm vênh DB↔file: record mới tạo ở DC sát giờ sự cố có thể trỏ file chưa replicate (do EMC khác nhịp PG) — ghi nhận, báo user nếu có

---

## 5. Post-failover

- [ ] Đổi backup target → pgBackRest backup từ `shwsdb1dr` (primary mới)
- [ ] Disable replication slot cũ trên PROD nếu PROD lên lại
- [ ] Trỏ monitoring/alert → DR endpoints
- [ ] Ghi incident → [`../../05-change-log/incident-log.md`](../../05-change-log/incident-log.md) (timeline, RTO/RPO thực tế, người approve)

---

## 6. Failback (sau khi PROD khôi phục) — planned, không panic

**Option A (khuyến nghị):** PROD trở lại primary.

1. (SHWS) PROD setup làm standby từ DR (`pg_basebackup` ngược + `standby.signal`)
2. (ICTP) Đảo chiều EMC storage replication, chờ sync xong
3. Switchover ngược trong maintenance window: stop write DR → promote PROD → re-setup DR thành standby (DB); ICTP đảo chiều EMC về DC→DR
4. (Network) Switch DNS/VIP về PROD

**Option B:** DR là primary lâu dài, PROD thành DR mới (khi PROD hỏng vật lý nặng).

> Chi tiết: DR architecture doc §6.

---

## 7. Escalation

| Tình huống                              | Báo ai                                       |
| --------------------------------------- | -------------------------------------------- |
| Nghi split-brain (2 primary)            | DBA Lead + Mgmt — STOP, cô lập ngay          |
| ICTP báo file/platform DR chưa sẵn sàng | ICTP Lead — chờ trước khi start MinIO/app    |
| DR replica lag lớn / corrupt            | DBA Lead — cân nhắc restore từ pgBackRest DR |
| RTO vượt 1 giờ                          | Management — kích hoạt comms kế hoạch BCP    |

---

## 8. Liên kết

- DR design + drill: [`../../01-system-design/03-architecture-dr-site.md`](../../01-system-design/03-architecture-dr-site.md)
- ADR-009 (2 layer replication): [`../../05-change-log/decisions/adr-009-dc-dr-replication-layering.md`](../../05-change-log/decisions/adr-009-dc-dr-replication-layering.md)
- Backup/restore: [`backup-restore.md`](./backup-restore.md)
- Checklist (DR drill quý): [`../routine-maintenance.md`](../routine-maintenance.md)
