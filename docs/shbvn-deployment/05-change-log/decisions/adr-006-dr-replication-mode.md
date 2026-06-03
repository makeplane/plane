# ADR-006: DR replication mode (streaming async)

**Date:** 2026-05-27
**Status:** 🟡 Proposed
**Deciders:** DBA Lead, Architect, SRE Lead

## Context

SHWS cần đồng bộ DB từ PROD DC sang DR site đạt **RPO < 15 phút / RTO < 1 giờ**. Ràng buộc:

- Kênh WAN PROD↔DR ~1 Gbps (MPLS/dark fiber), latency cao hơn LAN.
- GĐ1: failover **manual** (approval DBA + SRE + Mgmt), chưa auto.
- Phạm vi ADR này là **DB tier**; đồng bộ file MinIO/platform do EMC storage (xem [ADR-009](./adr-009-dc-dr-replication-layering.md)).

## Decision

**PostgreSQL streaming replication asynchronous** + physical replication slot `shws_dr_slot` + pgBackRest PITR (repo riêng từng site). Standby `hot_standby=on` (read-only). Failover manual GĐ1; Patroni auto là GĐ2.

## Alternatives considered

- **Option A — Synchronous replication:** Loại. Latency WAN 1 Gbps không đảm bảo; commit PROD bị chậm/treo khi DR/WAN trục trặc → ảnh hưởng trực tiếp người dùng.
- **Option B — Logical replication (pglogical/built-in):** Loại. Chậm hơn cho full DB; phức tạp DDL; không phù hợp DR toàn cluster.
- **Option C — Storage block replication cho PG data dir:** Loại. Chỉ crash-consistent, không transaction-aware → rủi ro corruption standby (xem [ADR-009](./adr-009-dc-dr-replication-layering.md)).
- **Option D — Streaming async:** **CHỌN.** RPO ~giây–30s, cơ chế built-in đã kiểm chứng, standby luôn ở trạng thái khôi phục được.

## Consequences

- **Positive:** RPO ~30s; cơ chế chuẩn PG; standby read-only dùng được; kết hợp pgBackRest PITR.
- **Negative:** Async → có thể mất vài transaction chưa kịp ship khi PROD chết đột ngột; failover manual tốn ~30 phút.
- **Risks:** Replication slot không drain (DR down lâu) → WAL tích tụ fill `/u02` — mitigation: `max_slot_wal_keep_size=4GB` auto-drop + alert lag.

## Liên kết

- DR architecture: [`../../01-system-design/03-architecture-dr-site.md`](../../01-system-design/03-architecture-dr-site.md)
- Database design §10: [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md)
- Runbook DR failover: [`../../03-operations/runbooks/dr-failover.md`](../../03-operations/runbooks/dr-failover.md)
- Liên quan: [ADR-004](./adr-004-backup-tool-pgbackrest.md), [ADR-009](./adr-009-dc-dr-replication-layering.md)
