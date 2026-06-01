# 00 — Tổng quan dự án

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-29
**Phiên bản:** 0.3
**Owner:** duonglx

## 1. Mục đích

Triển khai **Shinhan Workspace (SHWS)** — hệ thống quản lý dự án nội bộ của Shinhan Bank Vietnam (SHBVN), thay thế quy trình thủ công hiện tại. SHWS được xây dựng trên nền tảng mã nguồn mở **Plane.so** (fork dưới org `shbvn` trên GitHub).

## 2. Phạm vi

### Trong phạm vi

- Triển khai 3 môi trường: TEST/UAT, PRODUCTION, DR site
- Tích hợp LDAP + SwingSSO (đã có trong fork SHBVN)
- Backup nghiêm chỉnh đạt RPO 15 phút / RTO 1 giờ
- Cài đặt offline (air-gap network)
- Tài liệu vận hành đầy đủ

### Ngoài phạm vi

- Custom development feature mới (sẽ xử lý sau)
- Migration dữ liệu từ hệ thống cũ (chưa xác định)
- Mobile app riêng (dùng web responsive)
- HA tự động (giai đoạn 2)

### Lộ trình triển khai phân kỳ (CHỐT 2026-05-29 — timeline gấp)

Triển khai chia 2 phase do timeline gấp:

| Phase                   | Phạm vi                                                                        | Cơ chế khôi phục                                                                                              | Tài liệu                |
| ----------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **A — DC (PROD) trước** | APP + DATA native PG tại DC + UAT                                              | **Backup-only**: pgBackRest `shws-prod` (full/diff/incr + WAL) + offsite NAS daily. **CHƯA có** streaming DR. | `01`, `06` (trừ §10 DR) |
| **B — DR sau**          | `shwsap1dr`/`shwsdb1dr`, streaming, stanza `shws-dr`, EMC platform replication | Streaming async + failover manual                                                                             | `03` (toàn bộ)          |

**Posture giai đoạn DC-only (Phase A):**

- RTO ~30–45 phút (restore từ pgBackRest), RPO ~60s (`archive_timeout`) — vẫn < 1h/15p cho sự cố **trong** DC.
- ⚠️ **KHÔNG có bảo vệ thảm họa cấp site.** Mất toàn bộ DC/SAN → chỉ còn bản NAS offsite; RTO/RPO **vượt** mục tiêu Thông tư 09. **Rủi ro tạm chấp nhận** — cần Security/Compliance ký nhận + chốt ngày hoàn thành Phase B.
- Caveat kỹ thuật bắt buộc khi DC-only: (1) **hoãn tạo slot `shws_dr_slot`** (`06` §10.1) đến khi seed DR; (2) **silence alert replication** (`08` §3.2/§7); (3) bật đầy đủ `archive_mode=on` + pgBackRest + NAS offsite ngay từ go-live DC (đường khôi phục duy nhất).

## 3. Stakeholder

| Vai trò            | Trách nhiệm                  | Liên hệ |
| ------------------ | ---------------------------- | ------- |
| Project Owner      | Quyết định phạm vi, ưu tiên  | TBD     |
| Technical Lead     | Kiến trúc, kỹ thuật          | duonglx |
| Security Officer   | Duyệt thiết kế bảo mật       | TBD     |
| DBA                | Vận hành Postgres, backup    | TBD     |
| SRE / Infra        | Vận hành VM, network, Docker | TBD     |
| QA Lead            | Kiểm thử chức năng + tải     | TBD     |
| Compliance / Audit | Duyệt tài liệu cuối          | TBD     |

## 4. Glossary

| Thuật ngữ         | Định nghĩa                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------- |
| **SHWS**          | **Shinhan Workspace** — tên thương mại nội bộ của hệ thống quản lý dự án triển khai cho SHBVN |
| **SHBVN**         | **Shinhan Bank Vietnam** — tổ chức ngân hàng triển khai SHWS                                  |
| **Plane.so**      | Phần mềm mã nguồn mở nền tảng cho SHWS (fork tại `github.com/shbvn/plane`)                    |
| **CCU**           | Concurrent Users — số user thao tác đồng thời                                                 |
| **RPO**           | Recovery Point Objective — mất tối đa bao nhiêu data khi sự cố (mục tiêu: 15 phút)            |
| **RTO**           | Recovery Time Objective — khôi phục trong bao lâu (mục tiêu: 1 giờ)                           |
| **DR**            | Disaster Recovery — site dự phòng                                                             |
| **WAL**           | Write-Ahead Log — log giao dịch Postgres, dùng cho replication & PITR                         |
| **PITR**          | Point-In-Time Recovery — khôi phục về thời điểm bất kỳ                                        |
| **LUN**           | Logical Unit Number — phân vùng trên SAN                                                      |
| **SAN**           | Storage Area Network — EMC Dell trong setup này                                               |
| **Multipath**     | Nhiều đường dẫn vật lý tới cùng 1 LUN, failover khi 1 path chết                               |
| **Air-gap**       | Mạng cô lập hoàn toàn khỏi internet                                                           |
| **Build station** | Máy ngoài bank có internet để chuẩn bị bundle cài đặt                                         |
| **Bundle**        | Gói cài đặt offline (RPM + Docker images + source)                                            |
| **ADR**           | Architecture Decision Record — log quyết định kiến trúc                                       |
| **CE**            | Community Edition (Plane open source)                                                         |
| **TKHT**          | Tài liệu Thiết Kế Hệ Thống                                                                    |
| **HDCĐ**          | Hướng Dẫn Cài Đặt                                                                             |
| **HDVH**          | Hướng Dẫn Vận Hành                                                                            |
| **KHKT**          | Kế Hoạch Kiểm Thử                                                                             |

## 5. Ràng buộc

### Ràng buộc kỹ thuật

- **Air-gap network**: Mạng nội bộ bank không có internet → mọi software phải bundle offline
- **OS chuẩn bank**: RHEL 9.6 (Red Hat Enterprise Linux)
- **Hypervisor**: Hyper-V (Windows Server)
- **Storage**: EMC SAN có sẵn, dùng LUN cho prod DATA node
- **Network**: VLAN nội bộ giữa các tier, firewall theo policy bank
- **Cert/PKI**: Internal CA của bank, không dùng public CA (Let's Encrypt)
- **NTP**: NTP server nội bộ bank

### Ràng buộc business

- Số user: 1000 (toàn bộ nhân viên IT/PM)
- CCU peak: ~100 (10% concurrent)
- Go-live target: TBD
- Budget: TBD (cần xác nhận để chọn cấu hình VM, license RHEL)
- Compliance: Tuân thủ chính sách bảo mật ngân hàng VN (Thông tư NHNN, ISO 27001)

### Ràng buộc vận hành

- DBA bank: Chuyên Postgres native, không quen Docker ops
- Backup tier: SAN LUN + offsite NAS hoặc DR site
- Maintenance window: Cuối tuần ngoài giờ giao dịch
- Vendor lock-in: Tránh phụ thuộc cloud provider (self-host hoàn toàn)

## 6. Thông số mục tiêu

| Chỉ số          | Mục tiêu                                    | Đo lường                                            |
| --------------- | ------------------------------------------- | --------------------------------------------------- |
| Uptime SLA      | 99.5% (giai đoạn 1), 99.9% (giai đoạn 2 HA) | Monthly availability                                |
| API p95 latency | < 500ms                                     | Prometheus histogram                                |
| API p99 latency | < 1500ms                                    | Prometheus histogram                                |
| Error rate      | < 1%                                        | 4xx/5xx ratio                                       |
| RPO (data loss) | < 15 phút (thực đạt ~30s)                   | Streaming replay lag (chính) + WAL archive fallback |
| RTO (recovery)  | < 1 giờ                                     | pgBackRest restore test                             |
| CPU sustained   | < 70%                                       | node_exporter                                       |
| RAM sustained   | < 80%                                       | node_exporter                                       |
| Disk free       | > 20%                                       | Alert when below                                    |

## 7. Quyết định kiến trúc chính

Tóm tắt (chi tiết trong ADR):

| Quyết định                  | Lựa chọn                                                              | ADR       |
| --------------------------- | --------------------------------------------------------------------- | --------- |
| DB engine deployment        | Native PG cho PROD/DR · Docker cho TEST/UAT                           | `adr-001` |
| RHEL version                | 9.6 (RHEL 9 lifecycle đến 2032)                                       | `adr-002` |
| Postgres version            | 15.7 (LTS đến 2027)                                                   | `adr-003` |
| Backup tool                 | pgBackRest (full + incremental + WAL)                                 | `adr-004` |
| Air-gap pattern             | Build station + offline bundles                                       | `adr-005` |
| DR replication (DB)         | PostgreSQL streaming (async giai đoạn 1)                              | `adr-006` |
| App stack                   | Docker compose trên App node                                          | `adr-007` |
| Storage                     | EMC SAN multipath + XFS + LVM                                         | `adr-008` |
| DC-DR replication (toàn hệ) | 2 layer: DELL EMC Storage (platform + file MinIO) · PG streaming (DB) | `adr-009` |

## 8. Câu hỏi mở

- [ ] Project Owner và Security Officer cần chỉ định cụ thể
- [x] ~~Budget / cấu hình VM~~ → **CHỐT (2026-05-26): DB node = 8 vCPU / 16 GB RAM** (PROD và DR mirror nhau). App node 8 vCPU / 16 GB. Budget tổng vẫn chờ xác nhận.
- [ ] DR site WAN bandwidth — đã có kênh 1 Gbps dedicated cho DB streaming. EMC storage replication cho file/platform do **ICTP (hạ tầng)** đảm nhiệm mặc định.
- [x] ~~Bank đã có Prometheus/Grafana?~~ → **CÓ SẴN (2026-05-26).** Tích hợp vào hạ tầng monitoring hiện hữu của bank, không dựng mới (xem `08-monitoring-design.md` khi viết)
- [ ] Bank có Harbor/Nexus private registry không, hay dùng USB bundle?
- [ ] Cert management: bank internal CA workflow như thế nào?
- [x] ~~Maintenance window~~ → **CHỐT (2026-05-26):** Daily — checklist status các service **đầu giờ làm việc** (`03-operations/routine-maintenance.md`). Phân vai: `mon` xem status + log (read-only); thao tác rủi ro (patch/restart) do `shbvn`/`postgres` thực hiện cuối tuần ngoài giờ giao dịch (no root — xem `05-security-design.md` §7).
- [ ] **Phase B (DR) target date** — chốt ngày hoàn thành DR sau go-live DC (timeline gấp, triển khai DC trước — xem §2). Cửa sổ DC-only không có bảo vệ thảm họa cấp site.
- [ ] **Security/Compliance ký nhận rủi ro tạm thời** giai đoạn DC-only (RTO/RPO sự cố cấp site vượt Thông tư 09 cho tới khi DR online).

## 9. Tài liệu tham chiếu

- [Plane.so upstream docs](https://docs.plane.so/)
- [PostgreSQL 15 documentation](https://www.postgresql.org/docs/15/)
- [pgBackRest user guide](https://pgbackrest.org/user-guide.html)
- [Red Hat Enterprise Linux 9 docs](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9)
- [Thông tư 09/2020/TT-NHNN — An toàn bảo mật hệ thống ngân hàng]
- Repo: `github.com/shbvn/plane`
