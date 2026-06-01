# UAT 02 — Deploy all-in-one Docker (DB container)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** SRE/QA
**Host:** `shwsap1t` · base `docker-compose.yml` + image SHB prebuilt

> Thiết kế gốc: [`../../01-system-design/02-architecture-test-uat.md`](../../01-system-design/02-architecture-test-uat.md). UAT chạy **mọi service trong container** kể cả `plane-db` (KHÁC PROD dùng PG native ngoài).

> **Air-gap:** không build image trong bank. Dùng **image SHB prebuilt** (cùng `dist/` như PROD) loaded qua `docker load`, áp `docker-compose.shb.yml` (override tag) lên base compose; **GIỮ** `plane-db`/`plane-redis`/`plane-mq`/`plane-minio` bundled (không tắt như PROD).

---

## 1. Prerequisites

- [`01-vm-prepare.md`](./01-vm-prepare.md) pass (Docker + /u01 + cert)
- Bundle `plane-dist/` (dist/ + docker-compose.shb.yml + deploy-shb.sh) + base images
- Mật khẩu local (sinh khi cài): POSTGRES_PASSWORD, RABBITMQ, MinIO, SECRET_KEY

---

## 2. Verification

```bash
ls /opt/shws-bundle/plane-dist/dist/.shb-version
docker info | grep "Docker Root Dir"      # /u01/docker
ls /opt/plane-app/certs/                  # cert có
```

---

## 3. Action

### 3.1 Load image (SHB app + base bundled)

```bash
cd /opt/shws-bundle/docker-stack
for T in postgres__15.7-alpine*.tar.gz valkey__valkey*.tar.gz rabbitmq*.tar.gz minio__minio*.tar.gz; do
  [ -f "$T" ] && gunzip -c "$T" | docker load
done

cd /opt/shws-bundle/plane-dist
for T in dist/*.tar.gz; do gunzip -c "$T" | docker load; done   # image SHB app
```

### 3.2 Đặt compose + env

```bash
sudo mkdir -p /opt/plane-app && cd /opt/plane-app
# Base compose plane-selfhost (docker-compose.yml) + override image SHB
cp /opt/shws-bundle/plane-dist/docker-compose.shb.yml .
cp -r /opt/shws-bundle/plane-dist/scripts ./scripts && chmod +x scripts/deploy-shb.sh
cp -r /opt/shws-bundle/plane-dist/dist ./dist
# docker-compose.yml (base) lấy từ plane-selfhost (giống PROD base)
```

**`.env` (root — dùng cho plane-db/mq/minio + proxy):**

```bash
sudo tee /opt/plane-app/.env >/dev/null <<'EOF'
# DB container nội bộ (UAT — KHÁC PROD)
POSTGRES_USER=plane
POSTGRES_DB=plane
POSTGRES_PASSWORD=<UAT_PG_PW>
# RabbitMQ
RABBITMQ_USER=plane
RABBITMQ_PASSWORD=<UAT_MQ_PW>
RABBITMQ_VHOST=plane
# MinIO
AWS_ACCESS_KEY_ID=<UAT_MINIO_KEY>
AWS_SECRET_ACCESS_KEY=<UAT_MINIO_SECRET>
AWS_S3_BUCKET_NAME=uploads
# Proxy
LISTEN_HTTP_PORT=80
LISTEN_HTTPS_PORT=443
SITE_ADDRESS=https://shwsap1t.bank.local
FILE_SIZE_LIMIT=5242880
EOF
sudo chmod 600 /opt/plane-app/.env
```

**`apps/api/.env`** (api/worker/beat/migrator đọc): DB trỏ container `plane-db`, dual-mode auth (xem [`02-architecture-test-uat.md`](../../01-system-design/02-architecture-test-uat.md) §6.3).

```bash
sudo tee /opt/plane-app/apps/api/.env >/dev/null <<'EOF'
DATABASE_URL=postgresql://plane:<UAT_PG_PW>@plane-db:5432/plane
REDIS_URL=redis://plane-redis:6379/
AMQP_URL=amqp://plane:<UAT_MQ_PW>@plane-mq:5672/plane
USE_MINIO=1
AWS_S3_ENDPOINT_URL=http://plane-minio:9000
SECRET_KEY=<UAT_DJANGO_SECRET>
WEB_URL=https://shwsap1t.bank.local
DEBUG=0
# UAT dual-auth: SwingSSO + local user (PROD chỉ SwingSSO)
ENABLE_LOCAL_AUTH=1
# SMTP test
EMAIL_HOST=<BANK_SMTP>
EMAIL_PORT=587
EMAIL_USE_TLS=1
DEFAULT_FROM_EMAIL=noreply-shws-uat@bank.local
EOF
sudo chmod 600 /opt/plane-app/apps/api/.env
```

> Tên biến phải khớp `apps/api/.env.example` của bản SHWS — đối chiếu khi cấu hình thực tế.

### 3.3 Deploy (giữ plane-db — KHÔNG dùng override tắt như PROD)

```bash
cd /opt/plane-app
docker compose -f docker-compose.yml -f docker-compose.shb.yml up -d --no-build
# migrator chạy migration lên plane-db container, rồi service lên
```

### 3.4 (Tùy chọn) Tạo local user cho QA

```bash
docker exec -it api python manage.py createsuperuser
```

---

## 4. Validation

```bash
cd /opt/plane-app
docker compose -f docker-compose.yml -f docker-compose.shb.yml ps
# Kỳ vọng: plane-db, plane-redis, plane-mq, plane-minio, api, worker, beat-worker, web, space, admin, live, proxy Up
curl -k https://shwsap1t.bank.local/api/health      # 200
docker compose logs migrator | tail              # migration OK
```

- [ ] Mọi service Up (kể cả `plane-db` — UAT giữ DB container)
- [ ] `/api/health` 200; UI login load (TLS cert UAT)
- [ ] Login SwingSSO + local user đều được
- [ ] Tạo project/issue + upload file (MinIO) OK
- [ ] Email test gửi qua SMTP bank

---

## 5. Rollback / reset (UAT disposable)

```bash
# Full reset (xóa data UAT)
docker compose -f docker-compose.yml -f docker-compose.shb.yml down -v
docker compose -f docker-compose.yml -f docker-compose.shb.yml up -d
```

- Cách an toàn nhất: **Hyper-V checkpoint** trước test, revert sau (xem [`02-architecture-test-uat.md`](../../01-system-design/02-architecture-test-uat.md) §7.3).
- Dọn dữ liệu sau load test: [`../../03-operations/runbooks/data-cleanup-after-test.md`](../../03-operations/runbooks/data-cleanup-after-test.md).

---

## 6. Troubleshooting

| Triệu chứng                | Xử lý                                                            |
| -------------------------- | ---------------------------------------------------------------- |
| migrator fail              | sai `DATABASE_URL` (phải trỏ `plane-db:5432`); xem logs migrator |
| image "not found" khi up   | chưa `docker load` đủ dist/; kiểm `docker images`                |
| proxy 502                  | api chưa healthy; `docker compose logs api`                      |
| login local user không bật | thiếu `ENABLE_LOCAL_AUTH`; PROD KHÔNG bật biến này               |

---

## 7. Câu hỏi mở

- [ ] Thiết kế nói UAT dùng "docker-compose.yml mặc định (không shb override)" — nhưng air-gap không build được trong bank → dùng image SHB prebuilt + override tag là hợp lý. Cần chốt cách tiếp cận (build trên build-station vs prebuilt) và đồng bộ design.
- [ ] Tên biến bật local auth chính xác trong code SHWS (`ENABLE_LOCAL_AUTH`?).

---

## 8. Next & liên kết

→ Tiếp: [`03-validation.md`](./03-validation.md)

- Kiến trúc UAT: [`../../01-system-design/02-architecture-test-uat.md`](../../01-system-design/02-architecture-test-uat.md)
- Reset/cleanup: [`../../03-operations/runbooks/data-cleanup-after-test.md`](../../03-operations/runbooks/data-cleanup-after-test.md)
- Testing chạy trên UAT: [`../../04-testing/`](../../04-testing/)
