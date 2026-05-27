# Runbook — Load test trước release (k6)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** SRE, QA/Performance
**Target:** UAT (`shwsap1t`) — KHÔNG chạy tải lên PROD

> Kế hoạch + kịch bản chi tiết: [`../../04-testing/`](../../04-testing/) (KHKT). Runbook này là SOP thao tác chạy test.

---

## 1. Khi nào dùng

- Trước mỗi release lớn lên PROD
- Sau thay đổi cấu hình ảnh hưởng hiệu năng (PG tuning, gunicorn workers, pool)
- Định kỳ quý (capacity regression)

**Gate trước go-live:** load 100 CCU + stress 200 CCU + soak 4h. Target (xem [`09-capacity-planning.md`](../../01-system-design/09-capacity-planning.md)): API p95 < 500ms, p99 < 1500ms @ 100 CCU, error rate < 1%, CPU < 70%, RAM < 80%, không memory leak sau soak.

---

## 2. Pre-check

```bash
# 2.1 UAT sẵn sàng + có dữ liệu giả ≥ DB target năm 1
curl -k https://shws-uat.bank.local/api/health      # 200
# 2.2 k6 cài trên máy chạy test (ngoài bank LAN hoặc mgmt VLAN được phép)
k6 version
# 2.3 Baseline tài nguyên UAT trước test (so sánh sau)
# (Grafana/node_exporter snapshot CPU/RAM/disk)
```

- [ ] UAT có dữ liệu đại diện (không phải DB rỗng)
- [ ] Có tài khoản test (LDAP test hoặc local) cho auth flow thật
- [ ] Đã thông báo: UAT sẽ bị tải nặng, không dùng cho QA khác trong khung giờ test
- [ ] Đã snapshot/backup UAT để cleanup sau (xem [`data-cleanup-after-test.md`](./data-cleanup-after-test.md))

---

## 3. Action

```bash
# 3.1 Load test — 100 CCU, ramp 5 phút, giữ 30 phút
k6 run --vus 100 --stage 5m:100,30m:100,2m:0 \
  -e BASE_URL=https://shws-uat.bank.local \
  -e TOKEN_USER=<uat_user> shws-load.js

# 3.2 Stress — tăng dần tới khi gãy (tìm breaking point)
k6 run --stage 5m:100,5m:200,5m:300,3m:0 \
  -e BASE_URL=https://shws-uat.bank.local shws-load.js

# 3.3 Soak — 4 giờ ở 80 CCU (phát hiện memory leak)
k6 run --vus 80 --duration 4h \
  -e BASE_URL=https://shws-uat.bank.local shws-load.js
```

Kịch bản trong script (`shws-load.js` — chi tiết ở KHKT): login (auth thật) → list issues → CRUD issue → load dashboard → upload nhỏ. **Không** chỉ `GET /`.

> Theo dõi song song: Grafana (CPU/RAM/p95), `pg_stat_activity` (connection, slow query), RabbitMQ queue depth.

---

## 4. Verification

```bash
# k6 summary cuối run
# checks........: 99%+ pass
# http_req_duration p(95) < 500ms, p(99) < 1500ms
# http_req_failed < 1%
```

- [ ] p95 < 500ms, p99 < 1500ms @ 100 CCU
- [ ] Error rate < 1%
- [ ] CPU < 70%, RAM < 80% sustained (cả APP + DATA node)
- [ ] Soak 4h: RAM không tăng tuyến tính (không leak); worker không OOM-restart bất thường
- [ ] Tìm được breaking point ở stress (ghi lại CCU gãy)
- [ ] Không deadlock / vượt `max_connections` (`pg_stat_activity` count + wait events)

Ghi kết quả → report `plans/reports/load-test-YYYYMMDD.md`.

---

## 5. Rollback / sau test

- Test chỉ chạy trên UAT → không ảnh hưởng PROD.
- Dọn dữ liệu rác + reset UAT: [`data-cleanup-after-test.md`](./data-cleanup-after-test.md).
- Nếu UAT treo/đầy disk khi stress → restart stack, dọn theo cleanup runbook.

---

## 6. Escalation

| Tình huống                                  | Báo ai               | Khi nào               |
| ------------------------------------------- | -------------------- | --------------------- |
| Không đạt target p95/error ở 100 CCU        | SRE Lead + Architect | Trước release         |
| Breaking point < 150 CCU (thấp hơn kỳ vọng) | SRE Lead + DBA       | Trong ngày            |
| Phát hiện memory leak rõ ràng               | SRE Lead + Dev       | Trước release (block) |

---

## 7. Liên kết

- KHKT (kế hoạch + kịch bản): [`../../04-testing/`](../../04-testing/)
- Capacity targets: [`../../01-system-design/09-capacity-planning.md`](../../01-system-design/09-capacity-planning.md)
- Cleanup sau test: [`data-cleanup-after-test.md`](./data-cleanup-after-test.md)
- Monitoring: [`../monitoring-alerting.md`](../monitoring-alerting.md)
