# 04 — Kế hoạch Kiểm thử (KHKT)

Tài liệu kiểm thử trước go-live và validation định kỳ. Đối tượng đọc: QA, performance team, project owner.

## Danh sách tài liệu

| File                                                         | Loại test                                          | Status   |
| ------------------------------------------------------------ | -------------------------------------------------- | -------- |
| [`load-test-plan.md`](./load-test-plan.md)                   | Kế hoạch test tải (k6) — kịch bản, metrics, target | 🟡 Draft |
| [`load-test-scenarios.md`](./load-test-scenarios.md)         | Chi tiết kịch bản: login, CRUD, dashboard, soak    | 🟡 Draft |
| [`security-test-plan.md`](./security-test-plan.md)           | Trivy/OWASP scan, auth, TLS, secret leak, audit    | 🟡 Draft |
| [`uat-acceptance-criteria.md`](./uat-acceptance-criteria.md) | Tiêu chí UAT pass/fail + sign-off form             | 🟡 Draft |

## Test gating

| Stage              | Test bắt buộc                       | Pass criteria                                             |
| ------------------ | ----------------------------------- | --------------------------------------------------------- |
| Sau cài UAT        | Smoke test                          | All endpoints respond, login OK                           |
| Trước UAT user     | Load test 50 CCU                    | p95 < 500ms, error < 1%                                   |
| Trước go-live PROD | Load test 100 CCU (đúng tải target) | p95 < 500ms, p99 < 1.5s, error < 1%, CPU < 70%, RAM < 80% |
| Trước go-live PROD | Stress test 200 CCU                 | Tìm điểm gãy, không OOM                                   |
| Trước go-live PROD | Soak test 100 CCU × 4h              | Không memory leak, không connection pool cạn              |
| Trước go-live PROD | DR failover drill                   | Promote replica < 5 phút                                  |
| Trước go-live PROD | Backup restore drill                | pg_restore success < 1h                                   |
| Trước go-live PROD | Security scan                       | Không critical vulnerability                              |

## Performance targets

| Metric               | Target          | Tool              |
| -------------------- | --------------- | ----------------- |
| API p50 latency      | < 100ms         | k6                |
| API p95 latency      | < 500ms         | k6                |
| API p99 latency      | < 1500ms        | k6                |
| Error rate           | < 1%            | k6                |
| Throughput           | > 200 req/s     | k6                |
| CPU (peak)           | < 70% sustained | node_exporter     |
| RAM (peak)           | < 80% sustained | node_exporter     |
| Postgres connections | < 80% pool      | postgres_exporter |
| Disk IOPS            | Within SAN spec | iostat            |

## Tools

- **k6** (Grafana) — HTTP + WebSocket load test
- **Prometheus + Grafana** — metrics during test
- **pg_stat_statements** — top slow queries
- **OWASP ZAP / Burp Suite** — security scan (nếu bank cho phép)
- **Trivy** — container vulnerability scan (offline mode)

## Liên kết

- Runbook chạy load test: [`../03-operations/runbooks/load-test-procedure.md`](../03-operations/runbooks/load-test-procedure.md)
- Cleanup sau test: [`../03-operations/runbooks/data-cleanup-after-test.md`](../03-operations/runbooks/data-cleanup-after-test.md)
- Capacity baseline: [`../01-system-design/09-capacity-planning.md`](../01-system-design/09-capacity-planning.md)
