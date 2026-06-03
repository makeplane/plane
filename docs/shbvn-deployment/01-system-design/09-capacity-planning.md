# 09 — Capacity Planning

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-26
**Phiên bản:** 0.1
**Owner:** duonglx
**Liên quan:** [01-architecture-prod.md](./01-architecture-prod.md) §8, [06-database-design.md](./06-database-design.md), [07-storage-design.md](./07-storage-design.md), [08-monitoring-design.md](./08-monitoring-design.md)

---

## 1. Phạm vi

Sizing cơ sở, dự báo tăng trưởng, và **scaling trigger** cho **Shinhan Workspace (SHWS)** PROD. Mục tiêu: vận hành ổn định ở 1000 user / 100 CCU peak, có đường nâng cấp rõ ràng khi vượt.

---

## 2. Baseline workload (đã chốt)

| Tham số         | Giá trị                | Nguồn                                 |
| --------------- | ---------------------- | ------------------------------------- |
| Tổng user       | 1000 (nhân viên IT/PM) | [00-overview.md](./00-overview.md) §5 |
| CCU peak        | ~100 (10% concurrent)  | overview                              |
| Mục tiêu uptime | 99.5% (GĐ1)            | overview                              |
| RPO / RTO       | < 15 phút / < 1 giờ    | overview                              |
| Profile DB      | OLTP-balanced          | [06](./06-database-design.md) §5.1    |

---

## 3. Sizing hiện tại (đã chốt 2026-05-26)

| Node                      | vCPU | RAM   | Disk                     | Ghi chú                      |
| ------------------------- | ---- | ----- | ------------------------ | ---------------------------- |
| **APP** (`shwsap1p`)      | 8    | 16 GB | 80 GB OS + 100 GB Docker | gunicorn 8 workers, Celery 4 |
| **DATA** (`shwsdb1p`)     | 8    | 16 GB | 600/100/1000 GB (3 LUN)  | PG `shared_buffers=4GB`      |
| **DR DATA** (`shwsdb1dr`) | 8    | 16 GB | mirror PROD              | standby async                |
| **DR APP** (`shwsap1dr`)  | 8    | 16 GB | mirror PROD              | cold/warm                    |

### 3.1 Cơ sở sizing DATA node 8/16

- `shared_buffers = 4GB` (25% RAM) + `effective_cache_size = 12GB` (page cache) → bộ working set ~10–20 GB DB nằm gần hết trong RAM ở M+12 → cache hit > 95%.
- 8 vCPU đủ cho ~100 CCU OLTP (read-heavy, query nhẹ) + autovacuum 4 workers + backup process-max 4.
- Connection: app nối trực tiếp 5432 + `CONN_MAX_AGE=300` → ~13–17 conn bền, `max_connections=300` thừa headroom (xem [06](./06-database-design.md) §6).

### 3.2 Cơ sở sizing APP node 8/16

- api gunicorn 8 workers × ~500 MB = ~4–5.5 GB; worker Celery 4 × ~512 MB = ~2 GB; live ~384 MB; plane-redis 1 GB; plane-mq 1 GB; OS + Docker ~4 GB → ~15.4 GB (xem [01](./01-architecture-prod.md) §4.1). `migrator` one-shot không tính. RAM là ràng buộc chính, không phải CPU.

---

## 4. Growth projection

DB growth ước tính từ workload PM (issue, comment, attachment metadata; file binary nằm MinIO không tính vào PG).

| Mốc        | User active | DB size | `/u01` data | `/u03` backup | CPU peak ước | RAM hit  |
| ---------- | ----------- | ------- | ----------- | ------------- | ------------ | -------- |
| Go-live M0 | 200 (pilot) | ~1 GB   | ~1%         | ~5%           | < 20%        | > 99%    |
| M+3        | 600         | ~5 GB   | ~2%         | ~8%           | ~30%         | > 99%    |
| M+6        | 1000        | ~10 GB  | ~3%         | ~10%          | ~45%         | > 98%    |
| M+12       | 1000        | ~20 GB  | ~5%         | ~15%          | ~55%         | > 97%    |
| M+24       | 1000–1200   | ~50 GB  | ~10%        | ~25%          | ~65%         | > 95%    |
| M+36       | 1200–1500   | ~100 GB | ~18%        | ~40%          | ~70%+        | theo dõi |

**Giả định:** ~50 issue/user/năm, ~5 comment/issue, attachment metadata ~2 KB/file. File binary (ảnh, doc) ở MinIO `/u01/minio` — theo dõi riêng, có thể là thành phần tăng nhanh nhất nếu user upload nhiều.

> Đây là **projection có giả định** — verify bằng số liệu thực sau go-live, cập nhật lại bảng này hàng quý (xem [`../03-operations/routine-maintenance.md`](../03-operations/routine-maintenance.md) Q5).

---

## 5. Scaling triggers

Khi metric chạm ngưỡng (đo qua Prometheus — xem [08](./08-monitoring-design.md)), kích hoạt hành động:

| Trigger            | Ngưỡng (sustained)      | Hành động                                                                           | Loại       |
| ------------------ | ----------------------- | ----------------------------------------------------------------------------------- | ---------- |
| CPU DATA           | > 70% × 2 tuần          | Nâng vCPU 8→12 (Hyper-V resize, reboot window)                                      | Vertical   |
| CPU APP            | > 70% × 2 tuần          | Tăng gunicorn workers; nếu vẫn cao → nâng vCPU                                      | Vertical   |
| RAM DATA           | hit ratio < 95% kéo dài | Nâng RAM 16→24 GB + `shared_buffers`/`effective_cache_size`                         | Vertical   |
| RAM APP            | > 85% sustained         | Nâng RAM 16→24 GB                                                                   | Vertical   |
| Disk `/u01`        | > 80%                   | Mở rộng LUN online (`lvextend`+`xfs_growfs`, xem [07](./07-storage-design.md) §6.3) | Storage    |
| Disk `/u03`        | > 80%                   | Mở rộng LUN; rà retention; verify offsite                                           | Storage    |
| Connections        | > 250 PG                | Review connection leak / Celery concurrency; cân nhắc PgBouncer (GĐ2)               | Tuning     |
| CCU thực           | > 200                   | Cân nhắc read replica (offload read) + Patroni GĐ2                                  | Horizontal |
| Replication lag    | > 5 phút thường xuyên   | Kiểm WAN bandwidth ICTP; tăng `max_wal_size`                                        | Tuning     |
| MinIO `/u01/minio` | tăng > data DB          | Tách MinIO sang LUN/node riêng                                                      | Storage    |

**Vertical-first:** GĐ1 ưu tiên scale dọc (resize VM) vì đơn giản, downtime ngắn trong window. Scale ngang (read replica, Patroni) là GĐ2 khi CCU > 200 hoặc cần HA tự động (xem [06](./06-database-design.md) §14).

---

## 6. Headroom & buffer

- **Disk:** sizing LUN dư lớn từ đầu (data 600 GB cho DB ~100 GB ở M+36) → ít phải mở rộng. XFS không shrink nên dư là an toàn.
- **CPU/RAM:** VM 8/16 chạy ~55% ở M+12 → headroom ~45% cho spike. Resize Hyper-V nhanh khi cần.
- **Connection:** ~13–17 conn bền (`CONN_MAX_AGE`), `max_connections=300` → headroom lớn cho burst worker; PgBouncer khi GĐ2 (nhiều APP node / read replica / CCU > 200).

---

## 7. Capacity review cadence

| Chu kỳ        | Hành động                                                       | Tài liệu                                                               |
| ------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Hàng tuần     | Ghi DB size + disk trend (W2)                                   | [`routine-maintenance.md`](../03-operations/routine-maintenance.md) W2 |
| Hàng tháng    | Dự báo khi nào chạm 80% disk (M5)                               | routine M5                                                             |
| Hàng quý      | Review capacity vs sizing, đề xuất scale (Q5); cập nhật bảng §4 | routine Q5                                                             |
| Trước go-live | Load test 100 CCU verify sizing                                 | [`../04-testing/`](../04-testing/)                                     |

---

## 8. Câu hỏi mở

1. **File upload growth:** user bank dùng attachment nhiều không? → ảnh hưởng MinIO `/u01/minio` (thành phần khó dự báo nhất).
2. **Budget scale:** khi cần nâng RAM/vCPU/LUN, quy trình duyệt budget + lead time Hyper-V/SAN của bank?
3. **Read replica GĐ2:** ngưỡng CCU/latency nào bank chấp nhận trước khi đầu tư read replica?
4. **Retention dữ liệu:** Plane có archive/purge issue cũ không? → ảnh hưởng DB growth dài hạn.
5. **Số liệu thực:** sau M+3 cần đối chiếu projection §4 với thực tế, hiệu chỉnh giả định.

---

## 9. Cross-references

- Kiến trúc PROD (sizing + projection tóm tắt): [01-architecture-prod.md](./01-architecture-prod.md) §4, §8
- Database design (tuning, HA roadmap): [06-database-design.md](./06-database-design.md) §5, §14
- Storage design (mở rộng LUN): [07-storage-design.md](./07-storage-design.md) §6
- Monitoring (trend, scaling metric): [08-monitoring-design.md](./08-monitoring-design.md)
- Routine maintenance (review cadence): [`../03-operations/routine-maintenance.md`](../03-operations/routine-maintenance.md)
- Load test (verify sizing): [`../04-testing/`](../04-testing/)
