# ADR-009 — DC-DR replication 2 layer (EMC storage + PostgreSQL streaming)

**Status:** 🟡 Proposed
**Date:** 2026-05-26
**Owner:** duonglx
**Liên quan:** ADR-006 (DR replication mode), ADR-008 (EMC SAN storage)

---

## Bối cảnh

Cần đồng bộ dữ liệu DC (PROD) → DR site để đạt RPO < 15 phút / RTO < 1 giờ. Hệ thống có 2 loại dữ liệu cần replicate:

1. **DB sống** — PostgreSQL data dir (`/u01/pgsql/15/data`), WAL (`/u02/pgsql/15/wal`) — thay đổi liên tục, yêu cầu nhất quán giao dịch.
2. **Phần nền tảng** — OS/config app node, Docker images & volumes, **file MinIO uploads** (`/u01/minio`) — thay đổi chậm hơn, không có ràng buộc transaction.

Bank đã có hạ tầng **DELL EMC Storage solution** với khả năng replicate cross-site ở mức storage array.

## Quyết định

Tách replication thành **2 layer độc lập**:

| Layer               | Đối tượng                             | Cơ chế                                                                  | RPO                         |
| ------------------- | ------------------------------------- | ----------------------------------------------------------------------- | --------------------------- |
| **① DB tier**       | PostgreSQL data + WAL                 | PG streaming replication async + pgBackRest PITR (repo riêng từng site) | ~giây (streaming)           |
| **② Platform tier** | App OS/config, Docker vol, file MinIO | DELL EMC Storage replication (do ICTP)                                  | Theo chu kỳ EMC (ICTP quản) |

**Nguyên tắc cốt lõi:** **KHÔNG** dùng block-replication của storage cho live PostgreSQL data dir.

## Lý do

- **An toàn dữ liệu DB:** Block-replication một PG data dir đang chạy chỉ cho bản sao _crash-consistent_, không đảm bảo nhất quán logic → rủi ro corruption / không mở được DB ở DR. PG streaming replication mới hiểu transaction boundary, cho standby luôn ở trạng thái khôi phục được.
- **Tận dụng hạ tầng có sẵn:** EMC storage solution đã có ở bank → dùng cho phần file/platform là tối ưu chi phí, giảm script application-level (loại bỏ `mc mirror` cron RPO 24h trước đây).
- **Phân tách mối lo:** DBA quản DB tier (quen PG native); ICTP (hạ tầng) quản platform tier. Ranh giới trách nhiệm rõ.
- **RPO file tốt hơn:** EMC array replication cho file MinIO nhanh hơn nhiều so với daily `mc mirror`.

## Hệ quả

**Tích cực:**

- Bỏ được cron `mc mirror` và nhu cầu MinIO Site Replication ở giai đoạn 1.
- DB giữ cơ chế DR đã được kiểm chứng (streaming + pgBackRest).

**Cần lưu ý:**

- **Vênh nhịp 2 layer:** DB (RPO ~giây) và file đồng bộ khác nhịp → ngay sau failover có thể có record DB trỏ tới file MinIO chưa kịp replicate. Cần đánh giá trong DR drill.
- **Failover phối hợp:** SHWS promote PG standby; **ICTP (hạ tầng)** đảm bảo file/platform sẵn sàng ở DR (EMC storage). Phía SHWS chỉ chờ ICTP xác nhận (xem `03-operations/runbooks/dr-failover.md`).

## Ranh giới trách nhiệm

- **SHWS quản:** DB tier ① (PostgreSQL streaming + pgBackRest).
- **ICTP (hạ tầng) quản:** platform tier ② — DELL EMC storage replication. Chi tiết cấu hình storage/LUN (chu kỳ, sync/async, mount khi failover) thuộc ICTP, **ngoài phạm vi tài liệu này**.

## Phương án đã cân nhắc & loại

- **Chỉ PG streaming + `mc mirror` cho file:** RPO file 24h quá kém; thêm script vận hành. → Loại.
- **EMC storage replicate TẤT CẢ (kể cả PG data dir):** Rủi ro corruption DB (crash-consistent). → Loại.
- **MinIO Site Replication real-time:** Phức tạp setup ở air-gap, EMC đã đủ. → Hoãn (cân nhắc giai đoạn 2 nếu cần).
