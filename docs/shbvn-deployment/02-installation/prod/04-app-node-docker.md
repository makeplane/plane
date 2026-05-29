# PROD 04 — APP node: Docker + deploy Plane stack (offline)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** SRE/DevOps
**Host:** `shwsap1p` (10.94.10.10) · Docker CE · compose base + `docker-compose.shb.yml`

> Thiết kế gốc: [`../../01-system-design/01-architecture-prod.md`](../../01-system-design/01-architecture-prod.md) §3.1. App tier stateless; **DB + MinIO ở DATA node** (`shwsdb1p`), KHÔNG chạy `plane-db` trên APP node.

---

## 1. Prerequisites

- [`02-data-node-postgres.md`](./02-data-node-postgres.md) + [`03-data-node-backup.md`](./03-data-node-backup.md) pass (DB + backup sẵn sàng)
- Bundle `docker-stack/` + `plane-dist/` (gồm `dist/`, `docker-compose.shb.yml`, `deploy-shb.sh`)
- Base compose `docker-compose.yml` của plane-selfhost có trên server
- Server cert `shws.bank.local` + key cho proxy TLS
- Kết nối được `shwsdb1p:5432` (PostgreSQL) và `:9000` (MinIO)

---

## 2. Verification

```bash
cat /etc/redhat-release
ls /opt/shws-bundle/docker-stack/docker-ce*.rpm
ls /opt/shws-bundle/plane-dist/dist/.shb-version
# Kết nối DB từ APP node (chưa có psql thì test bằng nc)
nc -vz 10.94.10.11 5432 && nc -vz 10.94.10.11 9000
```

---

## 3. Action — Cài Docker CE offline + data-root `/u01/docker`

```bash
cd /opt/shws-bundle/docker-stack
sudo dnf install -y ./docker-ce*.rpm ./docker-ce-cli*.rpm ./containerd.io*.rpm \
                    ./docker-buildx-plugin*.rpm ./docker-compose-plugin*.rpm

# Di chuyển data-root sang /u01/docker (LUN local 100GB) + bridge tránh VLAN bank
sudo mkdir -p /u01/docker
sudo tee /etc/docker/daemon.json >/dev/null <<'EOF'
{
  "data-root": "/u01/docker",
  "default-address-pools": [{ "base": "172.30.10.0/24", "size": 28 }],
  "bip": "172.30.10.1/24",
  "log-driver": "journald",
  "log-opts": { "tag": "{{.Name}}" }
}
EOF
# journald log-driver: cho user `mon` đọc log container read-only qua `journalctl`
# (group systemd-journal, không cần docker group) — xem 01-system-design/05 §7.3.
# journald retention cấu hình ở /etc/systemd/journald.conf (SystemMaxUse).
sudo systemctl enable --now docker
docker info | grep -E "Docker Root Dir|Server Version"   # /u01/docker
```

> Bridge `172.30.10.0/24` tránh đụng VLAN bank `10.94.0.0/16` ([`04-network-design.md`](../../01-system-design/04-network-design.md) §2.3).

---

## 4. Action — Load base images + đặt compose

```bash
# 4.1 Base images (redis/valkey, rabbitmq) từ bundle
cd /opt/shws-bundle/docker-stack
for T in valkey__valkey*.tar.gz rabbitmq*.tar.gz minio__minio*.tar.gz; do
  [ -f "$T" ] && gunzip -c "$T" | docker load
done

# 4.2 Thư mục triển khai trên server
sudo mkdir -p /opt/plane-app && cd /opt/plane-app
# Base compose plane-selfhost (đã có sẵn từ cài selfhost, hoặc copy từ repo)
#   docker-compose.yml  (base)
# Override SHWS + script + dist:
cp -r /opt/shws-bundle/plane-dist/docker-compose.shb.yml .
cp -r /opt/shws-bundle/plane-dist/scripts ./scripts
cp -r /opt/shws-bundle/plane-dist/dist ./dist
chmod +x scripts/deploy-shb.sh
```

---

## 5. Action — Cấu hình `plane.env` cho 2-node (DB/MinIO ngoài)

> **Điểm khác biệt PROD 2-node:** base compose mặc định bundle `plane-db`, `plane-redis`, `plane-mq`, `plane-minio`. PROD dùng **PG native ở DATA node** + MinIO ở DATA node → phải:
>
> 1. Trỏ env DB/MinIO ra `shwsdb1p`.
> 2. **Không** start service `plane-db` (và tùy chọn `plane-minio`) trên APP node.

```bash
# plane.env (env-file cho deploy-shb.sh). Giá trị bí mật lấy từ KeePass.
sudo tee /opt/plane-app/plane.env >/dev/null <<'EOF'
# ── Web ──
WEB_URL=https://shws.bank.local
DEBUG=0
CORS_ALLOWED_ORIGINS=https://shws.bank.local

# ── Database (PG native ở DATA node, kết nối trực tiếp 5432) ──
PGHOST=10.94.10.11
PGPORT=5432
POSTGRES_DB=plane
POSTGRES_USER=plane_app
POSTGRES_PASSWORD=<PLANE_APP_PW>
DATABASE_URL=postgresql://plane_app:<PLANE_APP_PW>@10.94.10.11:5432/plane?sslmode=verify-ca
CONN_MAX_AGE=300   # Django persistent connection (pooling nhẹ, không cần PgBouncer GĐ1)

# ── Redis / RabbitMQ (chạy trên APP node) ──
REDIS_HOST=plane-redis
REDIS_PORT=6379
REDIS_URL=redis://plane-redis:6379/
RABBITMQ_HOST=plane-mq
RABBITMQ_USER=<MQ_USER>
RABBITMQ_PASSWORD=<MQ_PW>
RABBITMQ_VHOST=plane
AMQP_URL=amqp://<MQ_USER>:<MQ_PW>@plane-mq:5672/plane

# ── Object storage (MinIO ở DATA node) ──
USE_MINIO=1
AWS_REGION=
AWS_ACCESS_KEY_ID=<MINIO_KEY>
AWS_SECRET_ACCESS_KEY=<MINIO_SECRET>
AWS_S3_ENDPOINT_URL=http://10.94.10.11:9000
AWS_S3_BUCKET_NAME=uploads

# ── Proxy / ports ──
LISTEN_HTTP_PORT=80
LISTEN_HTTPS_PORT=443
FILE_SIZE_LIMIT=5242880
SITE_ADDRESS=https://shws.bank.local

# ── Secrets ──
SECRET_KEY=<DJANGO_SECRET>
EOF
sudo chmod 600 /opt/plane-app/plane.env
```

> Tên biến phải khớp `apps/api/.env.example` của bản SHWS — đối chiếu file đó khi cấu hình thực tế (có thể khác giữa version). Xem [`05-security-design.md`](../../01-system-design/05-security-design.md) §3 cho secret handling.

### 5.1 Vô hiệu `plane-db` (và MinIO nếu chạy ở DATA node)

Cách an toàn nhất giữ nguyên base compose: override scale 0 trong `docker-compose.shb.yml` **không** đủ (override chỉ đổi image). Dùng compose override bổ sung:

```bash
sudo tee /opt/plane-app/docker-compose.shb-prod.yml >/dev/null <<'EOF'
# PROD 2-node: tắt service stateful bundled (DB + MinIO chạy ở DATA node)
services:
  plane-db:
    profiles: ["disabled"]      # không khởi động cùng `up`
  plane-minio:
    profiles: ["disabled"]
EOF
```

> Service gán `profiles` sẽ không start trừ khi gọi profile đó. API/worker/migrator vẫn kết nối DB/MinIO ngoài qua env ở §5. **Lưu ý:** cần xác nhận `apps/api/.env` được nạp đúng — base compose dùng `env_file: ./apps/api/.env`; với deploy-shb.sh ta truyền `--env-file plane.env`. Đảm bảo biến DB nằm ở nơi container đọc (kiểm bằng §7).

---

## 6. Action — Deploy bằng `deploy-shb.sh`

```bash
cd /opt/plane-app
# deploy-shb.sh [dist-dir] [env-file] [base-compose]
sudo ./scripts/deploy-shb.sh dist plane.env docker-compose.yml
```

Script sẽ: load image SHWS từ `dist/*.tar.gz` → dừng deployment Plane xung đột → chạy `migrator` (đợi exit 0) → `up -d --force-recreate` toàn bộ service → in `ps`.

> Để áp override tắt `plane-db`, nếu script không nhận thêm override file, deploy thủ công:
>
> ```bash
> docker compose --env-file plane.env \
>   -f docker-compose.yml -f docker-compose.shb.yml -f docker-compose.shb-prod.yml \
>   up -d --no-build --force-recreate
> ```

---

## 7. Validation

```bash
cd /opt/plane-app
docker compose --env-file plane.env -f docker-compose.yml -f docker-compose.shb.yml ps
# Kỳ vọng: web, space, admin, live, api, worker, beat-worker, proxy "Up"; migrator "Exited (0)"
# plane-db KHÔNG chạy (đã disable)

# Migrator chạy thành công (DB ngoài nhận migration)
docker compose ... logs migrator | tail -20      # "Migrations complete"

# API health
curl -k https://shws.bank.local/api/health        # 200
# Hoặc local: curl -k https://10.94.10.10/

# API thực sự kết nối DATA node (không phải plane-db nội bộ)
docker exec api sh -lc 'env | grep -E "PGHOST|DATABASE_URL|CONN_MAX_AGE"'   # trỏ 10.94.10.11:5432
```

Checklist:

- [ ] Docker data-root `/u01/docker`, bridge `172.30.10.x`
- [ ] Image SHWS load đúng tag `shb_vX`
- [ ] `migrator` exit 0 (migration chạy trên PG native DATA node)
- [ ] `plane-db` KHÔNG chạy; API trỏ `10.94.10.11:5432` (CONN_MAX_AGE set)
- [ ] proxy `:443` TLS bằng cert `shws.bank.local`
- [ ] `/api/health` 200; login UI load

---

## 8. Rollback

| Tình huống          | Rollback                                                                           |
| ------------------- | ---------------------------------------------------------------------------------- |
| Image SHWS lỗi      | `docker compose -f docker-compose.yml up -d` (base, image gốc) — xem header script |
| Migration fail      | deploy-shb.sh tự abort trước khi đổi service; fix DB rồi chạy lại                  |
| Env sai → API crash | sửa `plane.env`, `up -d --force-recreate api worker beat-worker migrator`          |
| Cần version trước   | đổi `dist/.shb-version` + tar.gz về bản cũ (giữ 2 bundle), deploy lại              |

> Rollback không xoá dữ liệu — DB ở DATA node độc lập với app container.

---

## 9. Troubleshooting

| Triệu chứng                     | Xử lý                                                                   |
| ------------------------------- | ----------------------------------------------------------------------- |
| migrator treo / fail kết nối DB | sai `DATABASE_URL`; `nc -vz 10.94.10.11 5432`; `pg_hba` cho 10.94.10.10 |
| `plane-db` vẫn chạy             | thiếu override `docker-compose.shb-prod.yml`; profiles chưa áp          |
| proxy 502                       | api chưa healthy; xem `logs api`                                        |
| upload file lỗi                 | MinIO endpoint/bucket sai; `AWS_S3_ENDPOINT_URL` trỏ `10.94.10.11:9000` |
| `live` WebSocket lỗi            | proxy chưa route `/live`; kiểm cấu hình proxy SHWS                      |

---

## 10. Next & liên kết

→ Tiếp: [`05-validation-checklist.md`](./05-validation-checklist.md)

- Kiến trúc PROD: [`../../01-system-design/01-architecture-prod.md`](../../01-system-design/01-architecture-prod.md)
- Network/firewall: [`../../01-system-design/04-network-design.md`](../../01-system-design/04-network-design.md)
- Runbook deploy version mới: [`../../03-operations/runbooks/app-deploy-new-version.md`](../../03-operations/runbooks/app-deploy-new-version.md)
- Build bundle: [`../01-build-station-bundle.md`](../01-build-station-bundle.md)

---

## 11. Câu hỏi mở

- [ ] Cách chuẩn để tắt `plane-db`/`plane-minio` trên APP node (profiles override vs base compose riêng cho PROD) — chốt 1 phương án, cập nhật `deploy-shb.sh` nếu cần truyền thêm `-f`.
- [ ] Vị trí canonical của biến env: `plane.env` (root) vs `apps/api/.env` — đồng bộ để container đọc đúng.
- [ ] MinIO chạy ở DATA node là container hay APP node giữ `plane-minio` trỏ volume SAN? (thiết kế: DATA node).
