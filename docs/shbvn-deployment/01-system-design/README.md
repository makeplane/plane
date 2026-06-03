# 01 — Thiết kế Hệ thống (TKHT)

Tài liệu thiết kế kiến trúc hệ thống **Shinhan Workspace (SHWS)**. Đối tượng đọc: Architect, Security, Auditor, Stakeholder.

## Danh sách tài liệu

| #   | File                                                           | Nội dung                                           | Status   |
| --- | -------------------------------------------------------------- | -------------------------------------------------- | -------- |
| 00  | [`00-overview.md`](./00-overview.md)                           | Phạm vi, stakeholder, glossary, ràng buộc          | 🟡 Draft |
| 01  | [`01-architecture-prod.md`](./01-architecture-prod.md)         | Kiến trúc PROD (2-node hybrid)                     | 🟡 Draft |
| 02  | [`02-architecture-test-uat.md`](./02-architecture-test-uat.md) | Kiến trúc TEST/UAT (1 VM Docker)                   | 🟡 Draft |
| 03  | [`03-architecture-dr-site.md`](./03-architecture-dr-site.md)   | Kiến trúc DR site + replication                    | 🟡 Draft |
| 04  | [`04-network-design.md`](./04-network-design.md)               | VLAN, firewall, port matrix, DNS                   | 🟡 Draft |
| 05  | [`05-security-design.md`](./05-security-design.md)             | Auth (LDAP/SSO), TLS, secrets, audit log           | 🟡 Draft |
| 06  | [`06-database-design.md`](./06-database-design.md)             | PostgreSQL config, backup, replication, HA roadmap | 🟡 Draft |
| 07  | [`07-storage-design.md`](./07-storage-design.md)               | EMC SAN LUN layout, multipath, filesystem          | 🟡 Draft |
| 08  | [`08-monitoring-design.md`](./08-monitoring-design.md)         | Metrics, logs, alerts, dashboard                   | 🟡 Draft |
| 09  | [`09-capacity-planning.md`](./09-capacity-planning.md)         | Sizing, growth projection, scaling triggers        | 🟡 Draft |

## Nguyên tắc thiết kế

- **Tier separation**: App tier (Docker) ↔ Data tier (Native PG)
- **Defense in depth**: VLAN isolation, mTLS, internal CA
- **Compliance**: Phù hợp tiêu chuẩn ngân hàng VN (RPO/RTO, audit trail, encryption)
- **Reversibility**: Mỗi quyết định kiến trúc đều có rollback path
- **Observability first**: Monitor trước khi go-live

## Liên kết

- ADR (quyết định kiến trúc): [`../05-change-log/decisions/`](../05-change-log/decisions/)
- Cài đặt theo thiết kế: [`../02-installation/`](../02-installation/)
- Diagram source: [`../assets/diagrams/`](../assets/diagrams/)
