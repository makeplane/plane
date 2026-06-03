# Runbook — Dọn dữ liệu sau load/UAT test

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** SRE, QA
**Target:** UAT (`shwsap1t`) — all-in-one Docker

> Sau load test ([`load-test-procedure.md`](./load-test-procedure.md)) hoặc UAT cycle, UAT tích rác (issue/upload test, log). Runbook đưa UAT về trạng thái sạch.

---

## 1. Khi nào dùng

- Sau khi chạy load test (dữ liệu giả + log nặng)
- Trước UAT cycle mới cần dữ liệu sạch
- Khi UAT đầy disk do test

> **Chỉ áp dụng UAT.** TUYỆT ĐỐI không chạy trên PROD.

---

## 2. Pre-check

```bash
ssh shwsap1t
cd /opt/plane-app
docker compose ps                       # xác nhận đang ở UAT (hostname shwsap1t)
hostname                                # PHẢI là shwsap1t — dừng nếu khác
df -h /                                 # mức disk trước cleanup
```

- [ ] Xác nhận host = `shwsap1t` (không phải PROD)
- [ ] Đã backup config UAT (`.env`, compose override) nếu cần giữ
- [ ] Đã lấy report load test xong (không cần dữ liệu nữa)

---

## 3. Action

### 3.1 Reset toàn bộ (nhanh — mất hết data UAT)

```bash
cd /opt/plane-app
docker compose down -v                  # -v xóa volume (pgdata, uploads, redis, mq)
docker compose up -d                    # khởi tạo lại sạch; migrator chạy schema mới
```

### 3.2 Hoặc: chỉ dọn dữ liệu test, giữ schema/user

```bash
# Restore UAT về snapshot trước test (nếu đã snapshot)
# Với DB Docker: nạp lại dump sạch
docker exec -i plane-db psql -U plane -d plane < /opt/uat-baseline/clean-baseline.sql

# Dọn file upload test trên MinIO volume
docker exec plane-minio sh -c 'rm -rf /export/uploads/*-loadtest-*'
```

### 3.3 Dọn log/Docker rác

```bash
docker compose logs --no-color > /var/log/shws/uat-pretest-$(date +%Y%m%d).log
docker system prune -f                  # gỡ image/container/network dangling
journalctl --vacuum-time=7d
```

---

## 4. Verification

```bash
df -h /                                 # disk đã giải phóng
curl -k https://shws-uat.bank.local/api/health    # 200
docker compose ps                       # service Up; migrator Exited(0)
docker exec plane-db psql -U plane -d plane -c "SELECT count(*) FROM issues;"  # về mức baseline
```

- [ ] Disk free > 20%
- [ ] UAT login + tạo issue được (sanity)
- [ ] Số liệu bảng chính về baseline (không còn dữ liệu loadtest)

---

## 5. Rollback

- Lỡ `down -v` mà cần lại dữ liệu UAT → restore từ snapshot/dump `clean-baseline.sql` hoặc backup config đã lưu.
- UAT không phải hệ thống cần bảo toàn dữ liệu → ưu tiên trạng thái sạch.

---

## 6. Escalation

| Tình huống                         | Báo ai   | Khi nào    |
| ---------------------------------- | -------- | ---------- |
| Nhầm chạy trên host không phải UAT | SRE Lead | NGAY (P1)  |
| UAT không khởi động lại sau reset  | SRE Lead | Trong ngày |

---

## 7. Liên kết

- Load test: [`load-test-procedure.md`](./load-test-procedure.md)
- Kiến trúc UAT: [`../../01-system-design/02-architecture-test-uat.md`](../../01-system-design/02-architecture-test-uat.md)
- Cài UAT: [`../../02-installation/test-uat/`](../../02-installation/test-uat/)
