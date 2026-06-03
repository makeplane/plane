# Load Test Plan (KHKT — Kế hoạch test tải)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** QA/Performance, SRE, Project Owner

> Kế hoạch + tiêu chí. Quy trình **thực thi** (lệnh k6): [`../03-operations/runbooks/load-test-procedure.md`](../03-operations/runbooks/load-test-procedure.md). Kịch bản chi tiết: [`load-test-scenarios.md`](./load-test-scenarios.md).

---

## 1. Mục tiêu

Chứng minh SHWS chịu được tải mục tiêu (**1000 user / 100 CCU peak**) đạt SLA trước go-live, và tìm điểm gãy (breaking point) để biết headroom.

## 2. Phạm vi

- **In scope:** API REST (login, project, issue CRUD, dashboard, search), WebSocket realtime (`live`), upload MinIO, background job (Celery).
- **Out of scope:** Test chức năng (thuộc [`uat-acceptance-criteria.md`](./uat-acceptance-criteria.md)), test bảo mật ([`security-test-plan.md`](./security-test-plan.md)).

## 3. Môi trường test

- **Target:** UAT (`shwsap1t`) — KHÔNG chạy tải lên PROD.
- **Lưu ý đại diện:** UAT 1-VM all-in-one cấu hình nhỏ hơn PROD 2-node. Kết quả UAT là **chỉ báo**, không thay 1:1 PROD. Nếu cần số PROD-chuẩn → chạy trên VM staging mirror PROD spec (đề xuất, TBD).
- **Dữ liệu:** seed ≥ DB target năm 1 (vd 1000 issue, 50 project) để query thực tế.
- **Vị trí chạy k6:** máy ngoài bank LAN hoặc mgmt VLAN được phép, qua HTTPS endpoint.

## 4. Tool & metrics

| Tool                              | Dùng cho                        |
| --------------------------------- | ------------------------------- |
| **k6** (Grafana)                  | HTTP + WebSocket load           |
| Prometheus + Grafana              | metrics hệ thống trong lúc test |
| `pg_stat_statements`              | top slow query                  |
| postgres_exporter / node_exporter | connection, CPU, RAM, disk      |

Metrics thu thập: `http_req_duration` (p50/p95/p99), `http_req_failed`, `vus`, throughput (req/s); CPU/RAM/disk 2 node; PG connection, replication lag (nếu test trên mirror có DR).

## 5. Loại test + target (gate go-live)

| Test           | Cấu hình                  | Pass criteria                                                                                       |
| -------------- | ------------------------- | --------------------------------------------------------------------------------------------------- |
| **Load**       | 100 CCU, ramp 5m, giữ 30m | p95 < 500ms, p99 < 1500ms, error < 1%, CPU < 70%, RAM < 80%                                         |
| **Stress**     | ramp 100→300 CCU          | Tìm breaking point; không OOM; phục hồi sau khi giảm tải                                            |
| **Soak**       | 80–100 CCU × 4h           | RAM không tăng tuyến tính (no leak); connection pool không cạn; không worker OOM-restart bất thường |
| **Throughput** | —                         | > 200 req/s                                                                                         |

Chi tiết targets: [`README.md`](./README.md) §Performance targets, [`../01-system-design/09-capacity-planning.md`](../01-system-design/09-capacity-planning.md).

## 6. Lịch & cadence

- **Trước UAT user:** load 50 CCU (gate nhẹ).
- **Trước go-live PROD:** load 100 + stress 200 + soak 4h (gate đầy đủ).
- **Định kỳ:** mỗi major release + quý (capacity regression).

## 7. Vai trò

| Vai trò        | Trách nhiệm                                |
| -------------- | ------------------------------------------ |
| QA/Performance | viết/chạy k6, thu metrics, report          |
| SRE            | chuẩn bị môi trường, theo dõi hệ thống     |
| DBA            | theo dõi PG (slow query, connection, lock) |
| Project Owner  | duyệt kết quả gate go-live                 |

## 8. Deliverables

- Report mỗi lần chạy: `plans/reports/load-test-YYYYMMDD.md` (cấu hình, kết quả vs target, breaking point, đồ thị, issue).
- Quyết định gate: Pass / Hold (kèm lý do).

## 9. Success criteria (plan này pass)

- [ ] Đạt toàn bộ target load 100 CCU
- [ ] Xác định breaking point ở stress
- [ ] Soak 4h không leak
- [ ] Report đầy đủ + Project Owner duyệt

## 10. Risk

| Risk                                  | Mitigation                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| UAT nhỏ hơn PROD → kết quả lệch       | Ghi rõ là chỉ báo; chạy mirror-PROD staging nếu cần số chuẩn                          |
| k6 script khác hành vi user thật      | Auth flow thật + kịch bản thật ([`load-test-scenarios.md`](./load-test-scenarios.md)) |
| Dữ liệu UAT nhỏ → query nhanh giả tạo | Seed ≥ DB năm 1                                                                       |

## 11. Câu hỏi mở

- [ ] Có VM staging mirror PROD spec để lấy số PROD-chuẩn không?
- [ ] Vị trí máy chạy k6 (firewall cho phép tới UAT endpoint)?
- [ ] Nguồn seed data realistic (coordinate business)?

## 12. Liên kết

- Runbook thực thi: [`../03-operations/runbooks/load-test-procedure.md`](../03-operations/runbooks/load-test-procedure.md)
- Kịch bản: [`load-test-scenarios.md`](./load-test-scenarios.md)
- Capacity: [`../01-system-design/09-capacity-planning.md`](../01-system-design/09-capacity-planning.md)
