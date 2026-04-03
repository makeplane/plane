# CI/CD Setup Runbook — Plane SHB

**Môi trường:** GitLab nội bộ (air-gapped) + External GitLab (gitlab.com) để test  
**Stack:** Docker Compose | Caddy reverse proxy | PostgreSQL | Redis | RabbitMQ | MinIO

---

## Tổng quan kiến trúc

```
Máy Dev (Internet) → Máy Internal → GitLab nội bộ → Server Test (10.94.232.123)
                                                    → Server Prod  (10.94.125.86)

External test: gitlab.com → VPS (35.197.145.194 / jms.thanhngoc.top)
```

**3 services CI/CD** (thay đổi thường xuyên): `web`, `admin`, `api`  
**3 services Static** (deploy thủ công 1 lần): `space`, `live`, `proxy`

---

## Bước 1: Chuẩn bị máy GitLab Runner

### Internal GitLab (air-gapped) — Shell Executor

Cài trực tiếp trên máy Runner (không cần Docker executor):

```bash
# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs

# Python 3.12
sudo apt install -y python3.12 python3.12-pip

# pnpm
npm install -g corepack && corepack enable pnpm

# Docker
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER

# PostgreSQL client (cho backend:test:shell)
sudo apt install -y postgresql postgresql-client

# GitLab Runner
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt install gitlab-runner
sudo gitlab-runner register  # chọn Shell executor
```

Tạo user và database cho test:

```bash
sudo -u postgres psql -c "CREATE USER plane_user WITH PASSWORD 'plane_password';"
sudo -u postgres psql -c "CREATE DATABASE plane_test OWNER plane_user;"
```

### External GitLab (gitlab.com) — Docker Executor

Runner cài trên VPS hoặc máy có internet, chọn **Docker executor** khi register.

---

## Bước 2: Setup GitLab CI/CD Variables

Vào **GitLab → Settings → CI/CD → Variables**, thêm:

### Internal GitLab (IS_AIRGAPPED=true)

| Variable               | Value                         | Masked | Protected |
| ---------------------- | ----------------------------- | ------ | --------- |
| `IS_AIRGAPPED`         | `true`                        | No     | Yes       |
| `SSH_PRIVATE_KEY`      | Private key SSH → server Test | Yes    | Yes       |
| `SSH_USER`             | Username SSH server Test      | No     | Yes       |
| `SSH_PRIVATE_KEY_PROD` | Private key SSH → server Prod | Yes    | Yes       |
| `SSH_USER_PROD`        | Username SSH server Prod      | No     | Yes       |

### External GitLab (IS_AIRGAPPED=false)

| Variable       | Value                 | Masked | Protected |
| -------------- | --------------------- | ------ | --------- |
| `IS_AIRGAPPED` | `false`               | No     | No        |
| `VPS_HOST`     | `35.197.145.194`      | No     | No        |
| `VPS_USER`     | `ngocyt004`           | No     | No        |
| `VPS_SSH_KEY`  | Private key SSH → VPS | Yes    | No        |

---

## Bước 3: Setup SSH key cho Runner

```bash
# Trên máy GitLab Runner
ssh-keygen -t ed25519 -C "gitlab-runner" -f ~/.ssh/gitlab_deploy -N ""

# Copy public key vào các servers
ssh-copy-id -i ~/.ssh/gitlab_deploy.pub user@10.94.232.123   # Test
ssh-copy-id -i ~/.ssh/gitlab_deploy.pub user@10.94.125.86    # Prod

# Nội dung private key → paste vào GitLab variable SSH_PRIVATE_KEY
cat ~/.ssh/gitlab_deploy
```

---

## Bước 4: Khởi tạo cấu trúc thư mục trên server (1 lần)

Chạy trên **mỗi** server (test, prod, VPS external):

```bash
# SCP script từ máy Dev
scp scripts/setup-server.sh user@SERVER:/tmp/

# SSH vào server và chạy
ssh user@SERVER
```

**Trên server internal** (có TLS cert):

```bash
bash /tmp/setup-server.sh --domain uat-jms.shinhan.com.vn
# Sau đó copy TLS certs:
sudo mkdir -p /opt/certs
sudo cp STAR.shinhan.com.vn.chain.crt /opt/certs/
sudo cp STAR.shinhan.com.vn.key /opt/certs/
```

**Trên VPS external** (HTTP-only):

```bash
bash /tmp/setup-server.sh --vps --domain jms.thanhngoc.top
```

Cấu trúc tạo ra:

```
/root/Documents/plane-offline-pack/plane-app/
├── docker-compose.yaml      ← cần copy vào (bước 5)
├── docker-compose.shb.yml   ← cần copy vào (bước 6)
├── plane.env                ← điền giá trị thực
├── dist/
├── scripts/
└── archive/

/opt/shb-deploy/plane-app/proxy/Caddyfile   ← reverse proxy config
/opt/certs/                                  ← TLS certs (chỉ server internal)
```

---

## Bước 5: Điền plane.env

```bash
nano /root/Documents/plane-offline-pack/plane-app/plane.env
```

Các biến bắt buộc:

```env
SECRET_KEY=<random-64-chars>
DATABASE_URL=postgresql://plane:plane@plane-db/plane
REDIS_URL=redis://plane-redis:6379/

AWS_ACCESS_KEY_ID=<minio-access-key>
AWS_SECRET_ACCESS_KEY=<minio-secret-key>
AWS_S3_BUCKET_NAME=uploads
AWS_S3_ENDPOINT_URL=http://plane-minio:9000

AMQP_URL=amqp://plane:plane@plane-mq:5672/plane

WEB_URL=https://uat-jms.shinhan.com.vn
CORS_ALLOWED_ORIGINS=https://uat-jms.shinhan.com.vn
```

---

## Bước 6: Deploy lần đầu (thủ công — tất cả 6 images)

### 6.1. Build images trên Máy Dev

```bash
# Trên Máy Dev (có Internet, có Docker)
cd /path/to/plane
./scripts/build-shb-images.sh

# Kết quả:
# dist/.shb-version
# dist/plane-frontend-shb_v1.2.0.tar.gz   (~35MB)
# dist/plane-admin-shb_v1.2.0.tar.gz      (~28MB)
# dist/plane-backend-shb_v1.2.0.tar.gz    (~104MB)
# dist/plane-space-shb_v1.2.0.tar.gz      (~253MB)
# dist/plane-live-shb_v1.2.0.tar.gz       (~301MB)
# dist/plane-proxy-shb_v1.2.0.tar.gz      (~38MB)
# docker-compose.shb.yml                  (auto-generated)
```

### 6.2. Đóng gói deploy package

```bash
./scripts/prepare-deploy-package.sh
# Tạo deploy/ folder với đầy đủ files
```

### 6.3. Transfer vào server (qua Máy Internal)

```bash
# Từ Máy Dev → Máy Internal
scp -r deploy/* user@INTERNAL_MACHINE:/tmp/plane-deploy/

# Từ Máy Internal → Server Test
scp -r /tmp/plane-deploy/* user@10.94.232.123:/root/Documents/plane-offline-pack/plane-app/

# Từ Máy Internal → Server Prod
scp -r /tmp/plane-deploy/* user@10.94.125.86:/root/Documents/plane-offline-pack/plane-app/
```

### 6.4. Chạy deploy trên server

```bash
ssh user@10.94.232.123
cd /root/Documents/plane-offline-pack/plane-app
chmod +x ./scripts/deploy-shb.sh
./scripts/deploy-shb.sh
```

Script tự động:

1. Load 6 images vào Docker
2. Kiểm tra port conflicts
3. Chạy Django migrations (abort nếu fail)
4. Start tất cả services
5. Hiển thị status

### 6.5. Khởi động Caddy proxy

```bash
# Cài Caddy trên server (nếu chưa có)
sudo apt install caddy

# Hoặc chạy Caddy qua Docker (VPS external):
docker run -d --name plane-caddy \
  --network plane-app_default \
  -p 80:80 \
  -v ~/plane-app/proxy/Caddyfile:/etc/caddy/Caddyfile:ro \
  caddy:alpine caddy run --config /etc/caddy/Caddyfile

# Caddy sẽ tự đọc config từ /opt/shb-deploy/plane-app/proxy/Caddyfile
```

---

## Bước 7: Thiết lập CI/CD Pipeline

File `.gitlab-ci.yml` đã có sẵn trong repo. Pipeline gồm 4 stages:

| Stage  | Jobs                                                                                 | Trigger                    |
| ------ | ------------------------------------------------------------------------------------ | -------------------------- |
| lint   | frontend:format, frontend:build, frontend:lint, frontend:types, backend:lint         | MR                         |
| test   | backend:test:docker (IS_AIRGAPPED=false) hoặc backend:test:shell (IS_AIRGAPPED=true) | MR, thay đổi apps/api/\*\* |
| build  | build:web, build:admin, build:api                                                    | push develop hoặc preview  |
| deploy | deploy:test (auto) / deploy:production (manual) / deploy:external-test               | push develop/preview       |

### Luồng CI/CD hàng ngày

```
Developer push feature branch
→ Tạo MR → develop
→ Pipeline: lint + test
→ Approve & Merge
→ Auto: build 3 images + deploy:test (10.94.232.123)
→ Test OK → MR: develop → preview
→ Pipeline: build 3 images + deploy:production (manual approve)
```

---

## Bước 8: Kiểm tra sau deploy

```bash
# SSH vào server
ssh user@SERVER
cd /root/Documents/plane-offline-pack/plane-app

# Xem status containers
docker compose --env-file plane.env \
  -f docker-compose.yaml -f docker-compose.shb.yml -f docker-compose.ci.yml ps

# Xem logs
docker compose --env-file plane.env \
  -f docker-compose.yaml -f docker-compose.shb.yml -f docker-compose.ci.yml \
  logs -f api

# Test health
curl http://localhost/api/health/
```

---

## Rollback

```bash
ssh user@SERVER
cd /root/Documents/plane-offline-pack/plane-app

# Xem tags có sẵn
docker images --filter "reference=makeplane/*" --format "{{.Repository}}:{{.Tag}}"

# Sửa tag về commit cũ
sed -i 's/TAG_MOI/TAG_CU/g' docker-compose.ci.yml

# Restart
docker compose --env-file plane.env \
  -f docker-compose.yaml -f docker-compose.shb.yml -f docker-compose.ci.yml \
  up -d web admin api worker beat-worker --force-recreate --no-build
```

---

## Update Static Services (space, live, proxy) — Khi upgrade version lớn

```bash
# Trên Máy Dev
./scripts/build-shb-images.sh          # build lại tất cả 6
./scripts/prepare-deploy-package.sh    # đóng gói

# Transfer vào server
scp -r deploy/* user@SERVER:/root/Documents/plane-offline-pack/plane-app/

# Trên server
./scripts/deploy-shb.sh               # deploy toàn bộ
```

---

## Files quan trọng

| File                                           | Mục đích                                      |
| ---------------------------------------------- | --------------------------------------------- |
| `.gitlab-ci.yml`                               | CI/CD pipeline definition                     |
| `scripts/ci-deploy.sh`                         | Deploy script chạy trên server (SCP'd bởi CI) |
| `scripts/deploy-shb.sh`                        | Initial deploy script (chạy thủ công lần đầu) |
| `scripts/build-shb-images.sh`                  | Build 6 Docker images trên Máy Dev            |
| `scripts/prepare-deploy-package.sh`            | Đóng gói deploy package                       |
| `scripts/setup-server.sh`                      | Khởi tạo cấu trúc thư mục server mới          |
| `docker-compose.shb.yml`                       | Override images → SHB tags (auto-generated)   |
| `deployments/cli/community/docker-compose.yml` | Base compose (plane-selfhost)                 |

---

## Troubleshooting

| Vấn đề                      | Nguyên nhân                 | Fix                                      |
| --------------------------- | --------------------------- | ---------------------------------------- |
| Migration failed            | DB chưa sẵn sàng            | Check postgres logs, retry               |
| Port 80 timeout             | GCP/server firewall         | Mở port 80/443 trong firewall rules      |
| SSH permission denied       | Password auth disabled      | Set password hoặc add SSH key            |
| `services:` không hoạt động | Shell executor không hỗ trợ | Dùng `IS_AIRGAPPED=true`, postgres local |
| Image not found             | tar.gz chưa load            | Check `/tmp/plane-deploy/` trên server   |
| CERT\_ warnings             | Biến env không set          | Bình thường, không ảnh hưởng hoạt động   |
