# UAT 03 — Validation (smoke test UAT)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** QA, SRE
**Host:** `shwsap1t`

> Smoke test sau khi cài UAT, trước khi mở cho 20–30 pilot user. UAT acceptance criteria đầy đủ: [`../../04-testing/`](../../04-testing/) (KHKT).

---

## 1. Khi nào dùng

- Sau [`02-docker-allinone.md`](./02-docker-allinone.md)
- Sau mỗi reset/redeploy UAT (version mới)

**Mục tiêu UAT cài < 2 giờ, smoke test pass.**

---

## 2. Pre-check

```bash
cd /opt/plane-app
DC="docker compose -f docker-compose.yml -f docker-compose.shb.yml"
$DC ps                                # tất cả Up; migrator Exited(0)
```

---

## 3. Validation — theo tầng

### 3.1 Infrastructure

```bash
df -h /u01                            # disk free
docker info | grep "Docker Root Dir"  # /u01/docker
chronyc tracking                      # NTP sync
dig shwsap1t.bank.local               # DNS resolve
```

| #   | Kiểm tra                                    | Pass |
| --- | ------------------------------------------- | ---- |
| 1   | Service Up đầy đủ (12 container)            | ☐    |
| 2   | `/u01` free > 20%                           | ☐    |
| 3   | DNS + cert TLS `shwsap1t.bank.local` hợp lệ | ☐    |

### 3.2 Application

```bash
curl -k https://shwsap1t.bank.local/api/health     # 200
docker compose ... logs --tail=30 api              # không traceback
docker exec plane-db psql -U plane -d plane -c "\dt" | head   # bảng tạo
```

| #   | Kiểm tra                                      | Pass |
| --- | --------------------------------------------- | ---- |
| 1   | `/api/health` = 200                           | ☐    |
| 2   | migrator Exited(0); schema áp lên `plane-db`  | ☐    |
| 3   | proxy `:443` redirect HTTP→HTTPS, cert hợp lệ | ☐    |

### 3.3 Smoke test chức năng (UI)

| #   | Kịch bản                                        | Kỳ vọng                         | Pass |
| --- | ----------------------------------------------- | ------------------------------- | ---- |
| 1   | Mở `https://shwsap1t.bank.local`                | Login load                      | ☐    |
| 2   | Đăng nhập **SwingSSO**                          | Vào dashboard (flow giống PROD) | ☐    |
| 3   | Đăng nhập **local user** (QA)                   | Vào được (UAT dual-auth)        | ☐    |
| 4   | Tạo workspace + project + issue                 | Lưu OK                          | ☐    |
| 5   | Upload attachment                               | Lên MinIO container, tải lại OK | ☐    |
| 6   | Realtime (live) 2 tab                           | Cập nhật qua WebSocket          | ☐    |
| 7   | Email notify (invite/mention)                   | Gửi qua SMTP bank               | ☐    |
| 8   | Switch role (admin/member/guest) qua local user | Phân quyền đúng                 | ☐    |

### 3.4 Reset workflow verify

```bash
# Xác nhận reset hoạt động (trên môi trường test, không phải lúc pilot đang dùng)
docker compose ... down -v && docker compose ... up -d
curl -k https://shwsap1t.bank.local/api/health     # 200 sau reset
```

- [ ] `down -v` + `up -d` cho UAT sạch, health 200
- [ ] Hyper-V checkpoint tạo được (rollback nhanh)

---

## 4. Rollback

- UAT lỗi → Hyper-V revert checkpoint (< 5 phút) hoặc `down -v && up -d`.
- Không có SLA UAT — tester chấp nhận downtime.

---

## 5. Sign-off UAT readiness

| Vai trò       | Tên | Pass/Hold | Ngày |
| ------------- | --- | --------- | ---- |
| SRE/QA Lead   |     |           |      |
| Project Owner |     |           |      |

**Kết luận:** ☐ Sẵn sàng mở pilot 20–30 user · ☐ Hold (lý do: \_\_\_\_)

---

## 6. Liên kết

- Cài UAT: [`02-docker-allinone.md`](./02-docker-allinone.md)
- KHKT (UAT acceptance đầy đủ): [`../../04-testing/`](../../04-testing/)
- Load test: [`../../03-operations/runbooks/load-test-procedure.md`](../../03-operations/runbooks/load-test-procedure.md)
- Cleanup sau test: [`../../03-operations/runbooks/data-cleanup-after-test.md`](../../03-operations/runbooks/data-cleanup-after-test.md)
