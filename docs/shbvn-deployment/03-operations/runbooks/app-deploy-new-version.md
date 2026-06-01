# Runbook — Deploy phiên bản mới (Plane app stack)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-26
**Owner:** duonglx · **Audience:** SRE + DBA
**Host:** `shwsap1p` (APP) · **Compose:** `docker-compose.shb.yml` · **Path:** `/opt/shws-deployment`

> Air-gap: image mới đến từ **offline bundle** do build station tạo (xem `../../02-installation/01-build-station-bundle.md`). KHÔNG pull từ internet.

---

## 1. Khi nào dùng

Deploy version mới của SHWS (Plane fork `shbvn/plane`) lên PROD: feature release, security patch app, hotfix. Chỉ thực hiện trong **maintenance window** sau khi đã pass UAT trên môi trường TEST/UAT.

---

## 2. Pre-check

- [ ] Bundle version mới đã verify checksum, đã import vào registry/USB tại DC
- [ ] Đã pass UAT (QA ký) — xem `../../04-testing/uat-acceptance-criteria.md`
- [ ] **Backup tươi trước deploy** (đề phòng rollback DB do migration):
  ```bash
  sudo -iu postgres
  pgbackrest --stanza=shws-prod --type=diff backup     # nhanh; hoặc full nếu thay đổi lớn
  ```
- [ ] Ghi version hiện tại (để rollback):
  ```bash
  cd /opt/shws-deployment
  docker compose images          # lưu image tag/digest đang chạy
  git -C . rev-parse HEAD        # nếu deploy theo git checkout
  ```
- [ ] Thông báo user về maintenance window
- [ ] Kiểm tra có migration DB trong release không (đọc release notes)

---

## 3. Action — Deploy

```bash
cd /opt/shws-deployment

# 3.1 Nạp image mới từ bundle offline (ví dụ load từ tar)
#     (theo cơ chế registry bank / USB bundle thực tế)
docker load -i /opt/bundles/shws-<version>/images.tar

# 3.2 Cập nhật compose / tag version mới
#     Sửa image tag trong docker-compose.shb.yml hoặc .env → <version>

# 3.3 Pull-up theo thứ tự an toàn
#     Dừng web-facing trước để tránh request giữa chừng migration
docker compose up -d --no-deps redis rabbitmq

# 3.4 Chạy DB migration (nếu có) TRƯỚC khi start api mới
docker compose run --rm api python manage.py migrate
#     Kỳ vọng: "Applying ... OK", không lỗi

# 3.5 Recreate các service app
docker compose up -d
docker compose ps          # tất cả Up/healthy
```

> **Thứ tự quan trọng:** migrate xong mới start `api`/`worker` mới, tránh code mới chạy trên schema cũ (hoặc ngược lại).

---

## 4. Verification

```bash
curl -k https://shwsap1p.bank.local/api/health      # 200
docker compose logs --tail=100 api worker | grep -iE 'error|traceback'   # sạch
```

- [ ] Health 200, không error log khi khởi động
- [ ] Login OK (LDAP/SwingSSO)
- [ ] Smoke: tạo issue, upload file, mở project — OK
- [ ] Version hiển thị đúng (admin/about hoặc API version endpoint)
- [ ] Replication DC→DR vẫn `streaming`, lag bình thường (migration không làm nghẽn WAL):
  ```bash
  sudo -u postgres psql -c "SELECT state, pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) FROM pg_stat_replication;"
  ```

---

## 5. Rollback

**App-only (không có migration phá vỡ):**

```bash
cd /opt/shws-deployment
# Trỏ lại image tag/digest cũ đã lưu ở §2, rồi:
docker compose up -d
```

**Có migration không reversible:**

1. Stop app stack: `docker compose down`
2. Restore DB về backup tươi trước deploy (xem `backup-restore.md` §4 — PITR tới mốc trước migrate)
3. Deploy lại image cũ
4. Verify §4

> Vì vậy §2 **bắt buộc** backup trước deploy. Migration không reversible + chưa backup = không được deploy.

---

## 6. Escalation

| Tình huống                              | Báo ai                                       |
| --------------------------------------- | -------------------------------------------- |
| Migration fail giữa chừng               | DBA Lead — không start api, đánh giá restore |
| App không lên sau rollback              | TL + SRE Lead                                |
| Phát hiện data inconsistency sau deploy | DBA + TL, cân nhắc PITR                      |

---

## 7. Liên kết

- Build bundle offline: [`../../02-installation/01-build-station-bundle.md`](../../02-installation/01-build-station-bundle.md) (TODO)
- Backup/restore (rollback DB): [`backup-restore.md`](./backup-restore.md)
- UAT criteria: [`../../04-testing/uat-acceptance-criteria.md`](../../04-testing/uat-acceptance-criteria.md) (TODO)
- Deployment history: [`../../05-change-log/deployment-history.md`](../../05-change-log/deployment-history.md) (TODO)
