# Phase 01 — Tài liệu Thiết kế Hệ thống (TKHT)

## Context

- **Output location:** `docs/shbvn-deployment/01-system-design/`
- **Raw draft:** `plans/reports/architecture-260513-1608-plane-2node-deployment.md`
- **Plan:** [`./plan.md`](./plan.md)

## Overview

- **Priority:** P0 — foundation cho mọi phase sau
- **Status:** 🟠 Review (10/10 drafts xong — chờ duyệt)
- **Mô tả:** Viết 10 tài liệu thiết kế cho 3 môi trường (PROD/UAT/DR) + các tier ngang (network, security, db, storage, monitoring, capacity)

## Key insights

- Stack chốt: RHEL 9.4 + Native PG 15.7 + EMC SAN + Docker app + Hyper-V VMs
- Air-gap constraint ảnh hưởng installation, không ảnh hưởng design
- ADR phải viết song song để justify lựa chọn trong TKHT

## Requirements

### Functional

- Mô tả đầy đủ kiến trúc 3 môi trường
- Mỗi file <800 dòng, có sơ đồ ASCII + Mermaid source
- Cross-link với install + ops + ADR

### Non-functional

- Stakeholder hiểu được không cần đọc code
- Auditor/security review pass
- Đủ chi tiết để engineer mới onboard trong 1 ngày

## Architecture

Files trong tier này độc lập về nội dung, có thể viết song song nhưng cần tham chiếu chéo nhất quán.

## Todo list

- [x] `00-overview.md` — Phạm vi, stakeholder, glossary
- [x] `01-architecture-prod.md` — Kiến trúc PROD 2-node
- [x] `02-architecture-test-uat.md` — Kiến trúc TEST/UAT 1 VM
- [x] `03-architecture-dr-site.md` — DR + replication
- [x] `04-network-design.md` — VLAN, firewall, port matrix
- [x] `05-security-design.md` — Auth, TLS, secrets, audit
- [x] `06-database-design.md` — PG config, backup, HA roadmap _(800 dòng — cân nhắc tách)_
- [x] `07-storage-design.md` — EMC SAN LUN layout
- [x] `08-monitoring-design.md` — Metrics, logs, alerts
- [x] `09-capacity-planning.md` — Sizing, growth, scaling triggers

> **Tồn đọng:** `assets/diagrams/architecture-prod-overview.mmd` rỗng — chưa có diagram source thật.

## Success criteria

- Tất cả 10 files có status ≥ 🟠 Review
- Mỗi file có ≥ 1 diagram (Mermaid hoặc ASCII)
- Cross-link verified, không broken
- Câu hỏi mở mỗi file được track

## Risk

| Risk                                      | Mitigation                                       |
| ----------------------------------------- | ------------------------------------------------ |
| Network/security/cert info phụ thuộc bank | Note rõ TBD, follow-up sau                       |
| Mermaid syntax v11 phức tạp               | Dùng skill `mermaidjs-v11` khi gen diagram       |
| Drift giữa các files                      | Cross-link + single source of truth cho mỗi fact |

## Next steps

Sau phase này → Phase 02 (ADR) để justify design decisions.
