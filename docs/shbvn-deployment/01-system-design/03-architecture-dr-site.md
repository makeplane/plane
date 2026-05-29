# 03 — Kiến trúc DR SITE — Shinhan Workspace (SHWS)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-29
**Phiên bản:** 0.3
**Owner:** duonglx

---

> ⚠️ **PHASE B — TRIỂN KHAI SAU DC.** Theo lộ trình phân kỳ (timeline gấp, xem [`00-overview.md`](./00-overview.md) §2), DC/PROD go-live trước với **backup-only** (pgBackRest `shws-prod` + NAS offsite); **toàn bộ cơ chế trong tài liệu này (streaming, slot `shws_dr_slot`, stanza `shws-dr`, EMC platform replication) CHƯA áp dụng** cho đến Phase B. Trong giai đoạn DC-only KHÔNG có bảo vệ thảm họa cấp site — rủi ro tạm chấp nhận cần Security/Compliance ký nhận + chốt ngày hoàn thành DR.

---

## 1. Tóm tắt thiết kế

DR site cho **SHWS** triển khai **2 node** giống PROD topology, hoạt động ở **chế độ cold standby**, đồng bộ với PROD bằng **mô hình 2 lớp (two-layer replication)**:

1. **Lớp nền tảng (platform tier) — DELL EMC Storage replication:** Đồng bộ DC↔DR cho mọi thành phần _không phải DB sống_: OS/config app node, Docker images & volumes, **file MinIO uploads**. Do **ICTP (hạ tầng)** đảm nhiệm mặc định ở mức storage — phía SHWS chỉ mention, không cấu hình chi tiết. **⚠️ Loại trừ khỏi replication:** secret/`.env` DR-specific (`/opt/shws-secrets/.env.app` trên DR phải trỏ `shwsdb1dr`, không bị đè bởi bản PROD trỏ `shwsdb1p`). Nếu EMC replicate cả config dir → bước failover phải ghi đè lại `.env` DR (xem §5.3 bước 4).
2. **Lớp database (data tier) — PostgreSQL native, đi đường riêng:** DB **KHÔNG** dựa vào block-replication của storage (tránh replicate live PG data dir → chỉ crash-consistent, rủi ro corruption). DB dùng chiến lược đồng bộ + backup riêng: **streaming replication async** (real-time) + **pgBackRest PITR chạy độc lập từng site** (mỗi site có repo riêng — DR backup từ standby, "backup-of-backup"), trên kênh WAN dành riêng giữa 2 site.

**Mục tiêu DR:**

- **RPO mục tiêu:** < 15 phút (DB thực tế ~30 giây với async streaming; file MinIO theo chu kỳ EMC storage replication)
- **RTO mục tiêu:** < 1 giờ (manual failover + approval chain)
- **Failover authority:** DBA + SRE Lead + Management approval (giai đoạn 1)
- **DR drill cadence:** Quarterly (theo yêu cầu compliance bank)

**Nguyên tắc:**

| Nguyên tắc           | Áp dụng                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| Mirror PROD topology | DR nodes giống hệt PROD về OS, version, sizing, storage layout            |
| Tách lớp replication | Platform → EMC storage; DB → PG streaming (không block-replicate DB sống) |
| Async replication    | Không impact latency PROD, chấp nhận RPO vài chục giây cho DB             |
| Manual failover      | An toàn cao, đủ thời gian verify trước khi promote                        |
| Own backup tier      | DR chạy pgBackRest độc lập (backup-of-backup)                             |
| WAN security         | Streaming qua TLS, kênh riêng                                             |

---

## 2. Sơ đồ DR architecture

```
              PROD SITE (DC)                             DR SITE
              ==============                             =======

   ┌──────────────────────────┐               ┌──────────────────────────┐
   │  shwsap1p (APP node)     │               │  shwsap1dr (APP cold     │
   │  8 vCPU / 16 GB          │               │  standby) 8 vCPU / 16 GB │
   │  Docker compose ACTIVE   │               │  containers DOWN,        │
   │  Serving traffic         │               │  image preloaded         │
   └────────────┬─────────────┘               └────────────▲─────────────┘
                │                                          │
                │ Postgres 5432                            │ (Sau failover)
                │ MinIO 9000                               │
                ▼                                          │
   ┌──────────────────────────┐    WAN 1Gbps   ┌──────────┴───────────────┐
   │  shwsdb1p (DATA node)    │    dedicated   │  shwsdb1dr (DATA replica)│
   │  8 vCPU / 16 GB          │                │  8 vCPU / 16 GB (mirror) │
   │  Native PG 15.7 (primary)│ ══════════════►│  Native PG 15.7 (standby)│
   │  RHEL 9.6                │  ① PG async    │  RHEL 9.6                │
   │  /u01 data               │   stream + WAL │  standby.signal          │
   │  /u02 wal                │ ══════════════►│  /u01 data · /u02 wal    │
   │  /u03 backup (repo riêng)│                │  /u03 backup (repo riêng)│
   │  /u01 minio (files)      │                │  /u01 minio (files)      │
   └───────────┬──────────────┘                └────────────▲─────────────┘
               │                                             │
               │  ② DELL EMC Storage replication (ICTP)      │
               │     platform tier:                          │
               └─────  app OS/config · Docker vol · ──────────┘
                       file MinIO
                       (KHÔNG replicate live PG data dir)

   ① DB tier  → PostgreSQL native (streaming + pgBackRest) — SHWS quản
   ② Platform → DELL EMC Storage replication — ICTP (hạ tầng) đảm nhiệm
```

> **Diagram source:** [`../assets/diagrams/architecture-dr-replication.mmd`](../assets/diagrams/architecture-dr-replication.mmd) (Mermaid v11)

---

## 3. Thành phần DR site

### 3.1 `shwsap1dr` (APP cold standby)

| Spec          | Giá trị                                        |
| ------------- | ---------------------------------------------- |
| Role          | APP cold standby (containers DOWN bình thường) |
| OS            | RHEL 9.6 (giống PROD)                          |
| Sizing        | 8 vCPU / 16 GB / 100 GB SSD (giống PROD APP)   |
| Docker images | Pre-loaded (cùng version với PROD), không chạy |
| `.env` config | Trỏ tới `shwsdb1dr` thay vì `shwsdb1p`         |
| Activation    | Khi failover: `docker compose up -d`           |

**Lý do cold standby (không warm):**

- Tiết kiệm tài nguyên (license OS, RAM, CPU không idle)
- Đơn giản hơn — không cần duy trì state sync ở app tier
- DR drill verify được toàn bộ flow start-up

**Tài nguyên dự trữ giai đoạn 1:** VM có thể ở trạng thái powered-off để tiết kiệm, hoặc powered-on nhưng container down (tùy budget Hyper-V license).

### 3.2 `shwsdb1dr` (DATA replica)

| Spec        | Giá trị                                                                     |
| ----------- | --------------------------------------------------------------------------- |
| Role        | PostgreSQL standby (streaming replication)                                  |
| OS          | RHEL 9.6                                                                    |
| Sizing      | 8 vCPU / 16 GB / SAN (mirror PROD DATA — giữ nguyên hiệu năng sau failover) |
| PG version  | 15.7 native (giống PROD, KHÔNG khác minor version)                          |
| Mode        | Hot standby (read-only, có thể serve query đọc nếu cần)                     |
| Storage     | 3 LUN /u01, /u02, /u03 (giống PROD)                                         |
| Replication | Async streaming + WAL archive backup                                        |

**Postgres standby config:**

```ini
# postgresql.auto.conf trên shwsdb1dr (mTLS cert — xem 06-database-design §10.2)
primary_conninfo = 'host=10.94.10.11 port=5432 user=replicator sslmode=verify-full sslcert=/u01/pgsql/15/data/replicator.crt sslkey=/u01/pgsql/15/data/replicator.key sslrootcert=/u01/pgsql/15/data/bank-ca.crt application_name=shws_dr'
primary_slot_name = 'shws_dr_slot'
hot_standby = on              # Cho phép query đọc trên replica
max_standby_streaming_delay = 30s
hot_standby_feedback = on     # Tránh vacuum xóa rows replica đang đọc
```

Trên `shwsdb1dr` có file `standby.signal` (Postgres 12+) để PG biết là standby mode.

**Backup tier DR (stanza `shws-dr`, repo DR-local — xem [06](./06-database-design.md) §10.2):**

- pgBackRest cài trên `shwsdb1dr`, stanza **`shws-dr`** với **standby là `pg1-path`** (KHÔNG dùng tùy chọn pgBackRest `backup-standby` — không kết nối primary/WAN); backup chạy ngay trên node DR vào repo `/u03/pgbackup` DR-local.
- DR standby bật `archive_mode = always` → tự archive-push WAL vào repo DR-local (nuôi `archive-get` không qua WAN).
- Lý do: khi PROD mất hoàn toàn, có backup + WAL từ DR side dùng được luôn.
- Schedule (gợi ý, khớp PROD §9.3): full CN 03:00, diff hằng ngày 02:00, incr mỗi giờ — backup từ replica nhẹ tải.

---

## 4. Replication architecture

### 4.1 PostgreSQL Streaming Replication

**Mode:** Async (chấp nhận RPO vài chục giây, không impact PROD latency)

**Setup trên PROD primary (`shwsdb1p`):**

```ini
# postgresql.conf
wal_level = replica
max_wal_senders = 5           # 1 DR streaming + 1 basebackup + buffer ad-hoc
wal_keep_size = 4GB           # WAL giữ trên primary phòng standby lag
hot_standby = on              # Để on (mirror config 01/06) — primary bỏ qua, có hiệu lực khi node làm standby (failback)
synchronous_commit = on       # Local commit (KHÔNG đợi DR ack — async, vì không set synchronous_standby_names)
```

```ini
# pg_hba.conf — cho replicator account từ DR
hostssl replication replicator 10.94.20.11/32 cert clientcert=verify-full
```

**Tạo replication slot:**

```sql
SELECT pg_create_physical_replication_slot('shws_dr_slot');
```

### 4.2 Initial sync (lần đầu setup DR)

```bash
# Trên shwsdb1dr, từ tài khoản postgres:
pg_basebackup -h 10.94.10.11 -D /u01/pgsql/15/data \
              -U replicator -P -X stream -S shws_dr_slot \
              --wal-method=stream
touch /u01/pgsql/15/data/standby.signal
systemctl start postgresql-15
```

**Thời gian initial sync:** 10–60 phút tùy DB size (50 GB ≈ 10 phút trên 1 Gbps WAN).

### 4.3 Monitoring replication lag

| Metric                    | Mục tiêu | Cảnh báo                                              |
| ------------------------- | -------- | ----------------------------------------------------- |
| Replication lag (bytes)   | < 16 MB  | Warn > 256 MB · Crit > 1 GB (đồng bộ 06 §16, 08 §3.2) |
| Replication lag (seconds) | < 30s    | Warn > 30s · Crit > 5 phút                            |
| Streaming connection      | UP       | Alert nếu DOWN > 1 phút                               |

**Query monitor trên PROD primary:**

```sql
SELECT
  client_addr,
  application_name,
  state,
  pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes,
  EXTRACT(EPOCH FROM (now() - reply_time)) AS lag_seconds
FROM pg_stat_replication
WHERE application_name = 'shws_dr';
```

### 4.4 MinIO file replication — qua DELL EMC Storage

PostgreSQL streaming KHÔNG đồng bộ file uploads (chúng nằm trong MinIO, không phải DB). File MinIO thuộc **lớp nền tảng (②)** → đồng bộ DC-DR bằng **DELL EMC Storage replication**, do **ICTP (hạ tầng)** đảm nhiệm mặc định.

- **KHÔNG** chạy `mc mirror` cron (đã loại bỏ) và **KHÔNG** dùng MinIO Site Replication ở giai đoạn 1 — EMC storage đã lo.
- Phía SHWS không cấu hình chi tiết storage; chỉ phối hợp ICTP khi failover.

**Lưu ý nhất quán khi failover:** DB (PG streaming, RPO ~giây) và file (EMC storage) đồng bộ ở 2 nhịp khác nhau → có thể có **vênh nhẹ** giữa record DB và file vật lý ngay sau failover (record trỏ tới file chưa kịp replicate). Đánh giá ảnh hưởng trong DR drill.

---

## 5. Failover procedure (manual, có approval chain)

**Đối tượng:** DBA + SRE Lead + Management
**RTO mục tiêu:** < 1 giờ
**Sử dụng khi:** PROD site mất hoàn toàn (DC outage, DB corruption không khôi phục, disaster vật lý)

### 5.1 Approval chain

```
[Sự cố P1] ──► SRE Lead xác nhận ──► DBA chuẩn bị ──► Management approve ──► Execute failover
   (5-10p)       (5p)                  (10p)            (10-15p)              (15-30p)
                                                       Tổng: 45-70 phút
```

### 5.2 Pre-flight checklist

Trước khi promote, DBA verify:

- [ ] PROD primary CHẮC CHẮN không hồi phục (tránh split-brain)
- [ ] Replication lag last seen < 1 phút (data loss tối thiểu)
- [ ] DR replica health: `pg_stat_recovery` shows recent replay
- [ ] DR APP node ready: Docker images đúng version, .env config trỏ DR DB
- [ ] **ICTP xác nhận dữ liệu platform & file MinIO đã sẵn sàng ở DR** (EMC storage replication)
- [ ] DNS update plan ready (hoặc VIP failover plan)
- [ ] Management chính thức approve bằng email/ticket

### 5.3 Execute failover (DBA + ICTP)

```bash
# Quy ước actor: [postgres]=DBA login postgres · [shbvn]=admin app/docker · [ICTP]=hạ tầng · KHÔNG root

# 0. [ICTP] Đảm bảo dữ liệu platform & file MinIO đã sẵn sàng ở DR
#    qua EMC storage replication. Phía SHWS chỉ chờ ICTP xác nhận.

# 1. [postgres @ shwsdb1dr] promote PG replica thành primary (login postgres, không cần sudo)
pg_ctl promote -D /u01/pgsql/15/data
psql -c "SELECT pg_is_in_recovery();"  # Phải trả về false

# 2. [shbvn @ shwsdb1dr] start MinIO (sau khi ICTP xác nhận file sẵn sàng)
docker compose up -d plane-minio
docker compose logs --tail=50 plane-minio  # Verify bucket/uploads OK

# 3. [network team] Update DNS hoặc VIP để traffic chuyển sang DR site
# (theo runbook network team — TBD section)

# 4. [shbvn @ shwsap1dr] start app stack
cd /opt/shws-deployment
grep DATABASE_URL .env   # XÁC NHẬN trỏ shwsdb1dr (10.94.20.11), KHÔNG phải shwsdb1p — phòng EMC đè .env (xem §1)
docker compose up -d
docker compose logs -f api  # Verify api kết nối DR DB OK

# 5. Smoke test
curl -k https://shwsap1dr.bank.local/api/health
# Verify login flow + tạo issue test + mở file đính kèm (verify MinIO)

# 6. Thông báo go-live trên DR site
```

### 5.4 Post-failover

- Đổi backup target → backup từ `shwsdb1dr` (giờ là primary mới)
- Disable replication slot cũ trên PROD nếu PROD lên lại
- Update monitoring/alert → trỏ tới DR endpoints
- Document incident → `05-change-log/incident-log.md`

---

## 6. Failback procedure (sau khi PROD lên lại)

Sau khi PROD site khôi phục, có 2 lựa chọn:

### 6.1 Option A — Failback về PROD (khuyến nghị)

PROD trở lại làm primary, DR trở lại standby:

1. PROD (`shwsdb1p`) setup làm standby từ DR (`shwsdb1dr`)
   - `pg_basebackup` ngược từ DR
   - Tạo `standby.signal` trên PROD
2. Sync xong → switchover ngược (làm planned, không khẩn cấp)
   - Stop write trên DR
   - Promote PROD primary
   - Re-setup DR thành standby
3. Switch DNS/VIP về PROD

**Thời gian:** vài giờ đến 1 ngày (planned, không panic)

### 6.2 Option B — DR là primary lâu dài

DR trở thành primary, PROD trở thành DR mới. Topology đảo ngược. Dùng khi PROD bị hỏng vật lý nặng, build lại lâu.

---

## 7. DR drill (Disaster Recovery exercise)

**Cadence:** Quarterly bắt buộc (yêu cầu compliance bank)

### 7.1 Drill types

| Type                    | Frequency  | Mô tả                                               |
| ----------------------- | ---------- | --------------------------------------------------- |
| **Tabletop**            | Hàng tháng | Walkthrough procedure trên giấy, không thực thi     |
| **Partial**             | Quarterly  | Promote DR ở môi trường isolated, không impact PROD |
| **Full failover drill** | Bi-annual  | Failover thật trong maintenance window có planning  |

### 7.2 Partial drill steps (quarterly)

1. Snapshot trạng thái DR hiện tại (Hyper-V checkpoint)
2. Promote DR ở mode "shadow" (không update DNS)
3. Smoke test trên DR endpoint (truy cập qua hosts file)
4. Document findings + thời gian thực hiện
5. Revert DR về standby từ checkpoint
6. Re-sync replication

### 7.3 Success criteria DR drill

- Failover hoàn tất trong < 60 phút
- Smoke test pass trên DR
- RPO thực tế < 15 phút
- Không lỗi nghiêm trọng phát sinh
- Document chi tiết trong incident log

---

## 8. WAN considerations

**Bandwidth:** 1 Gbps dedicated kênh riêng giữa 2 site (đã confirm).

**Bandwidth usage breakdown:**

| Traffic                                   | Bandwidth est. | Note                                                                 |
| ----------------------------------------- | -------------- | -------------------------------------------------------------------- |
| PG WAL streaming (DB tier ①)              | 5–50 Mbps      | Tùy write rate, 100 CCU ≈ 10 Mbps avg — chiếm phần lớn WAN app-level |
| EMC storage replication (platform tier ②) | Do ICTP quản   | File MinIO + app config; nằm ngoài phạm vi tính WAN app của SHWS     |
| Monitoring metrics                        | < 1 Mbps       | Prometheus federation (bank đã có Prometheus/Grafana)                |
| Reserved headroom                         | 50%            | Spike handling                                                       |

> pgBackRest **không** ship qua WAN — mỗi site chạy repo độc lập (PROD backup từ primary, DR backup từ standby).

**Latency yêu cầu:**

- RTT PROD ↔ DR: monitor < 10ms
- > 50ms thì cần điều tra (có thể routing sai)
- WAN ngắt → replication pause, primary tiếp tục → lag tăng dần

**WAN security:**

- TLS cho PG streaming (`sslmode=verify-ca`)
- IPSec/MPLS tunnel theo policy bank
- KHÔNG dùng public internet routing

---

## 9. Risk & mitigation

| Risk                                                         | Severity | Probability | Mitigation                                                                     |
| ------------------------------------------------------------ | -------- | ----------- | ------------------------------------------------------------------------------ |
| WAN ngắt > 1 giờ → DR lag lớn                                | Medium   | Low         | `wal_keep_size=4GB` trên primary, monitor + alert                              |
| Split-brain khi failover sai                                 | Critical | Low         | Approval chain + pre-flight check bắt buộc verify PROD chết                    |
| Vênh DB↔file MinIO ngay sau failover (2 nhịp sync khác nhau) | Medium   | Low         | EMC storage replication (ICTP) lo file; đánh giá độ vênh trong DR drill (§4.4) |
| DR replica corruption                                        | High     | Low         | pgBackRest backup tier riêng trên DR side                                      |
| Promote nhầm khi PROD còn sống                               | Critical | Low         | Pre-flight: PROD đã isolate khỏi network + đã verify dead                      |
| DR drill làm sập PROD                                        | Critical | Very low    | Partial drill mode (shadow), không update DNS                                  |
| Cert TLS replication expire                                  | High     | Medium      | Monitor expiry, renew workflow tự động                                         |
| Replicator account compromised                               | High     | Low         | mTLS, IP allowlist (chỉ DR IP)                                                 |
| Initial sync quá lâu                                         | Low      | Low         | 1 Gbps WAN → 50GB DB ~10 phút, OK                                              |

---

## 10. Decisions liên quan (ADR)

- [`ADR-006`](../05-change-log/decisions/adr-006-dr-replication-mode.md) — DB streaming async (giai đoạn 1)
- [`ADR-009`](../05-change-log/decisions/adr-009-dc-dr-replication-layering.md) — DC-DR 2 layer: EMC storage (platform) + PG streaming (DB)
- [`ADR-001`](../05-change-log/decisions/adr-001-postgres-native-vs-docker.md) — DR cũng Native PG (giống PROD)
- [`ADR-002`](../05-change-log/decisions/adr-002-rhel-version.md) — RHEL 9.6 cả 3 môi trường
- [`ADR-008`](../05-change-log/decisions/adr-008-storage-emc-san.md) — DR cũng dùng SAN multipath

---

## 11. Cross-references

- PROD architecture: [`01-architecture-prod.md`](./01-architecture-prod.md)
- TEST/UAT architecture: [`02-architecture-test-uat.md`](./02-architecture-test-uat.md)
- Network design (WAN cụ thể): [`04-network-design.md`](./04-network-design.md)
- Security design (replication mTLS): [`05-security-design.md`](./05-security-design.md)
- Database design (replication chi tiết): [`06-database-design.md`](./06-database-design.md)
- Install DR: [`../02-installation/dr-site/`](../02-installation/dr-site/)
- Runbook failover: [`../03-operations/runbooks/dr-failover.md`](../03-operations/runbooks/dr-failover.md)

---

## 12. Câu hỏi mở

- [ ] IP cụ thể của `shwsap1dr` và `shwsdb1dr` (chờ network team cấp ở DR site)
- [ ] FQDN: `shwsap1dr.bank.local` và `shwsdb1dr.bank.local`?
- [ ] DNS failover mechanism — Bank dùng manual update, F5/Citrix VIP, hay BGP routing?
- [ ] Cold standby APP: VM powered-off hay powered-on container down? (Cost vs response time)
- [x] ~~EMC SAN cross-site replication — có dùng song song streaming không?~~ → **CHỐT (2026-05-26): 2 layer.** Platform (app config + file MinIO) qua DELL EMC Storage do **ICTP** đảm nhiệm mặc định; DB qua PG streaming + pgBackRest riêng (SHWS quản). Chi tiết storage/LUN do ICTP xử lý — ngoài phạm vi tài liệu này.
- [ ] Approval chain cụ thể: ai trong Management approve P1 failover (CIO, COO)?
- [ ] DR drill schedule chính thức: tháng nào trong quý?
- [ ] Quarterly compliance audit cho DR — có cần report mẫu chuẩn ngân hàng VN?
- [x] ~~MinIO Site Replication có nằm trong roadmap giai đoạn 2 không?~~ → **Không cần** — EMC storage đã đảm nhiệm sync file DC-DR.
