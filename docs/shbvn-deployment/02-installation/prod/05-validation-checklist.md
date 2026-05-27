# PROD 05 — Validation checklist & sign-off

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** SRE, DBA, QA, Project Owner
**Phạm vi:** Smoke test + sanity sau khi cài PROD 2-node, trước khi mở traffic / sign-off.

> Đây là gate cuối của HDCĐ PROD. KHÔNG mở user traffic khi còn mục ❌. Test tải/UAT đầy đủ thuộc [`../../04-testing/`](../../04-testing/).

---

## 1. Khi nào dùng

- Ngay sau [`04-app-node-docker.md`](./04-app-node-docker.md)
- Sau mỗi lần re-deploy lớn / khôi phục sự cố muốn xác nhận lại nền tảng

---

## 2. Pre-check

```bash
# DATA node
sudo systemctl is-active postgresql-15 multipathd chronyd
# APP node
cd /opt/plane-app && docker compose --env-file plane.env \
  -f docker-compose.yml -f docker-compose.shb.yml ps
```

---

## 3. Layer 1 — Infrastructure

| #   | Kiểm tra                            | Lệnh / cách                         | Pass |
| --- | ----------------------------------- | ----------------------------------- | ---- |
| 1   | Multipath 3 LUN active              | `multipath -ll`                     | ☐    |
| 2   | Mount `/u01 /u02 /u03` XFS noatime  | `df -hT /u01 /u02 /u03`             | ☐    |
| 3   | NTP sync 2 node                     | `chronyc tracking` (offset < 100ms) | ☐    |
| 4   | Firewall đúng port matrix           | `firewall-cmd --list-all-zones`     | ☐    |
| 5   | DNS/CNAME `shws.bank.local` resolve | `dig shws.bank.local`               | ☐    |
| 6   | Reboot test 2 node → service tự lên | reboot + re-check #1–4              | ☐    |

---

## 4. Layer 2 — Database

```bash
# 4.1 PG cấu hình đúng
sudo -u postgres psql -c "SHOW shared_buffers; SHOW wal_level; SHOW ssl; SHOW archive_mode;"
# 4.2 DB plane + extension
sudo -u postgres psql -d plane -c "\dx"          # pg_stat_statements, pgcrypto
# 4.3 App nối trực tiếp PG qua TLS (đường chính GĐ1)
psql "host=10.94.10.11 port=5432 dbname=plane user=plane_app sslmode=verify-ca sslrootcert=bank-ca.crt" -c "SELECT 1;"
# 4.4 Backup
sudo -iu postgres pgbackrest --stanza=shws-prod info && pgbackrest --stanza=shws-prod check
# 4.5 TLS bắt buộc từ ngoài (non-TLS phải bị từ chối)
psql "host=10.94.10.11 port=5432 dbname=plane user=plane_app sslmode=disable" -c "SELECT 1;" || echo "OK: non-TLS rejected"
```

| #   | Kiểm tra                                                               | Pass |
| --- | ---------------------------------------------------------------------- | ---- |
| 1   | `shared_buffers=4GB`, `wal_level=replica`, `ssl=on`, `archive_mode=on` | ☐    |
| 2   | Extension `pg_stat_statements`, `pgcrypto` có                          | ☐    |
| 3   | App nối trực tiếp `:5432` TLS (verify-ca) OK                           | ☐    |
| 4   | pgBackRest `info` + `check` OK, có full backup                         | ☐    |
| 5   | Kết nối non-TLS bị từ chối; `pg_hba` mặc định deny                     | ☐    |
| 6   | Audit (pgaudit) ghi log WRITE/DDL vào `/var/log/postgresql`            | ☐    |

---

## 5. Layer 3 — Application

```bash
cd /opt/plane-app
DC="docker compose --env-file plane.env -f docker-compose.yml -f docker-compose.shb.yml"
$DC ps                                   # tất cả Up; migrator Exited(0); plane-db KHÔNG chạy
$DC logs --tail=30 api                   # không traceback
docker exec api sh -lc 'env | grep PGHOST'   # 10.94.10.11
curl -k https://shws.bank.local/api/health   # 200
```

| #   | Kiểm tra                                                             | Pass |
| --- | -------------------------------------------------------------------- | ---- |
| 1   | Service Up: proxy, web, space, admin, live, api, worker, beat-worker | ☐    |
| 2   | `migrator` Exited(0); migration áp lên PG native                     | ☐    |
| 3   | `plane-db` KHÔNG chạy (DB ngoài)                                     | ☐    |
| 4   | API trỏ `10.94.10.11:5432` (CONN_MAX_AGE set)                        | ☐    |
| 5   | `/api/health` = 200                                                  | ☐    |
| 6   | proxy `:443` dùng cert `shws.bank.local`, redirect HTTP→HTTPS        | ☐    |

---

## 6. Layer 4 — Smoke test chức năng (qua UI)

| #   | Kịch bản                           | Kỳ vọng                                      | Pass |
| --- | ---------------------------------- | -------------------------------------------- | ---- |
| 1   | Mở `https://shws.bank.local`       | Trang login load, TLS hợp lệ                 | ☐    |
| 2   | Đăng nhập (LDAP/SwingSSO)          | Vào được dashboard                           | ☐    |
| 3   | Tạo workspace + project            | Lưu thành công                               | ☐    |
| 4   | Tạo issue + comment                | Hiển thị ngay                                | ☐    |
| 5   | Upload attachment                  | Lên MinIO (`10.94.10.11:9000`), tải lại được | ☐    |
| 6   | Realtime (live) — 2 tab cùng issue | Cập nhật đẩy qua WebSocket                   | ☐    |
| 7   | Background job (email notify)      | Worker xử lý, mail gửi qua SMTP              | ☐    |
| 8   | Admin panel (god-mode)             | Truy cập theo IP allowlist                   | ☐    |

---

## 7. Layer 5 — Backup/restore confidence

```bash
# Restore vào instance throwaway (KHÔNG đè prod) — verify RTO sơ bộ
sudo -iu postgres pgbackrest --stanza=shws-prod --delta --pg1-path=/var/tmp/rtest restore
ls /var/tmp/rtest/PG_VERSION && sudo rm -rf /var/tmp/rtest
```

| #   | Kiểm tra                                        | Pass |
| --- | ----------------------------------------------- | ---- |
| 1   | Test restore ra cluster hợp lệ                  | ☐    |
| 2   | Cipher passphrase lưu KeePass (2 nơi)           | ☐    |
| 3   | Cron backup nạp (`/etc/cron.d/pgbackrest-shws`) | ☐    |

---

## 8. Monitoring (nếu stack đã bật)

| #   | Kiểm tra                                           | Pass |
| --- | -------------------------------------------------- | ---- |
| 1   | `node_exporter` 2 node scrape được                 | ☐    |
| 2   | `postgres_exporter` (role `monitoring`) trả metric | ☐    |
| 3   | Alert rule disk >80%, replication lag nạp          | ☐    |

> Chi tiết: [`../../03-operations/monitoring-alerting.md`](../../03-operations/monitoring-alerting.md).

---

## 9. Rollback / điều kiện hoãn go-live

Hoãn mở traffic nếu bất kỳ điều sau:

- Layer 1–3 còn mục ❌
- Backup chưa có full đầu tiên hoặc `check` fail
- TLS user-facing không hợp lệ (cert sai/expire)
- Migration không áp được lên DB native
- Smoke test login/CRUD/upload fail

→ Quay lại bước cài tương ứng, fix, chạy lại checklist từ layer đó.

---

## 10. Sign-off

| Vai trò       | Tên | Kết luận (Pass/Hold) | Ngày | Ký  |
| ------------- | --- | -------------------- | ---- | --- |
| SRE Lead      |     |                      |      |     |
| DBA           |     |                      |      |     |
| Security      |     |                      |      |     |
| QA            |     |                      |      |     |
| Project Owner |     |                      |      |     |

**Kết luận PROD readiness:** ☐ Sẵn sàng go-live · ☐ Hold (lý do: \***\*\_\_\*\***)

---

## 11. Liên kết

- Cài app node: [`04-app-node-docker.md`](./04-app-node-docker.md)
- Test tải/UAT đầy đủ: [`../../04-testing/`](../../04-testing/)
- Runbook incident: [`../../03-operations/incident-response.md`](../../03-operations/incident-response.md)
- Routine maintenance: [`../../03-operations/routine-maintenance.md`](../../03-operations/routine-maintenance.md)
- Deployment history log: [`../../05-change-log/deployment-history.md`](../../05-change-log/deployment-history.md)
