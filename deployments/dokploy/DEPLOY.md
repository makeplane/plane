# Deploy Plane trên Dokploy

Hướng dẫn deploy [Plane](https://github.com/makeplane/plane) - công cụ quản lý dự án mã nguồn mở - lên [Dokploy](https://dokploy.com) mà không cần chỉnh sửa bất kỳ file nào trong project.

## Tổng quan kiến trúc

Plane bao gồm các service sau:

| Service | Mô tả | Port nội bộ |
|---------|--------|-------------|
| **web** | Giao diện chính (React) | 3000 |
| **admin** | Giao diện quản trị | 3000 |
| **space** | Public project spaces | 3000 |
| **api** | Backend API (Django) | 8000 |
| **worker** | Background tasks (Celery) | - |
| **beat-worker** | Scheduled tasks (Celery beat) | - |
| **migrator** | Database migrations | - |
| **live** | Real-time collaboration | 3000 |
| **plane-db** | PostgreSQL 15.7 | 5432 |
| **plane-redis** | Valkey/Redis 7.2 | 6379 |
| **plane-mq** | RabbitMQ 3.13 | 5672 |
| **plane-minio** | MinIO (S3-compatible) | 9000 |
| **proxy** | Caddy reverse proxy | 80/443 |

---

## Phương án 1: Docker Compose (Khuyến nghị)

Đây là cách đơn giản nhất - sử dụng trực tiếp file `docker-compose.yml` có sẵn trong project.

### Bước 1: Tạo Project trên Dokploy

1. Đăng nhập vào Dokploy Dashboard
2. Nhấn **Create Project** → đặt tên (ví dụ: `plane`)

### Bước 2: Tạo Compose Service

1. Trong project vừa tạo, nhấn **+ Add Service** → chọn **Compose**
2. Chọn source: **Git Repository**
3. Điền thông tin:
   - **Repository URL**: `https://github.com/makeplane/plane.git`
   - **Branch**: `master` (hoặc tag release ổn định, ví dụ: `v1.2.0`)
   - **Compose Path**: `docker-compose.yml`

### Bước 3: Cấu hình Environment Variables

Trong tab **Environment** của Compose service, thêm các biến sau:

```env
# ===== Database =====
POSTGRES_USER=plane
POSTGRES_PASSWORD=<mật-khẩu-mạnh>
POSTGRES_DB=plane

# ===== RabbitMQ =====
RABBITMQ_HOST=plane-mq
RABBITMQ_PORT=5672
RABBITMQ_USER=plane
RABBITMQ_PASSWORD=<mật-khẩu-mạnh>
RABBITMQ_VHOST=plane

# ===== Redis =====
REDIS_HOST=plane-redis
REDIS_PORT=6379

# ===== S3 / MinIO =====
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<access-key-mạnh>
AWS_SECRET_ACCESS_KEY=<secret-key-mạnh>
AWS_S3_ENDPOINT_URL=http://plane-minio:9000
AWS_S3_BUCKET_NAME=uploads
FILE_SIZE_LIMIT=5242880

# ===== Network =====
LISTEN_HTTP_PORT=80
LISTEN_HTTPS_PORT=443

# ===== SSL (tùy chọn) =====
CERT_EMAIL=
CERT_ACME_CA=https://acme-v02.api.letsencrypt.org/directory
CERT_ACME_DNS=
TRUSTED_PROXIES=0.0.0.0/0
SITE_ADDRESS=:80
MINIO_ENDPOINT_SSL=0

# ===== MinIO/S3 =====
USE_MINIO=1

# ===== API Rate Limit =====
API_KEY_RATE_LIMIT=60/minute
```

> **Quan trọng:** Bạn cũng cần tạo file `apps/api/.env` vì API service đọc env từ file đó. Xem phần **Xử lý API env file** bên dưới.

### Bước 4: Xử lý API env file

Docker Compose của Plane sử dụng `env_file: ./apps/api/.env` cho các service backend. Có 2 cách xử lý:

#### Cách A: Dùng Compose Override (khuyến nghị)

Trong Dokploy, tại phần **Compose File** (Raw editor), bạn có thể chỉnh Compose content trực tiếp trên Dokploy (không sửa file trong repo). Thay thế tất cả `env_file` bằng `environment` block:

```yaml
# Thay thế phần env_file trong các service api, worker, beat-worker, migrator
# bằng environment trực tiếp:
  api:
    # ... giữ nguyên build, restart, command, depends_on ...
    environment:
      - DEBUG=0
      - POSTGRES_USER=plane
      - POSTGRES_PASSWORD=<mật-khẩu-mạnh>
      - POSTGRES_HOST=plane-db
      - POSTGRES_DB=plane
      - POSTGRES_PORT=5432
      - DATABASE_URL=postgresql://plane:<mật-khẩu-mạnh>@plane-db:5432/plane
      - REDIS_HOST=plane-redis
      - REDIS_PORT=6379
      - REDIS_URL=redis://plane-redis:6379/
      - RABBITMQ_HOST=plane-mq
      - RABBITMQ_PORT=5672
      - RABBITMQ_USER=plane
      - RABBITMQ_PASSWORD=<mật-khẩu-mạnh>
      - RABBITMQ_VHOST=plane
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=<access-key-mạnh>
      - AWS_SECRET_ACCESS_KEY=<secret-key-mạnh>
      - AWS_S3_ENDPOINT_URL=http://plane-minio:9000
      - AWS_S3_BUCKET_NAME=uploads
      - FILE_SIZE_LIMIT=5242880
      - USE_MINIO=1
      - MINIO_ENDPOINT_SSL=0
      - SECRET_KEY=<django-secret-key-ngẫu-nhiên-50-ký-tự>
      - LIVE_SERVER_SECRET_KEY=<random-key>
      - WEB_URL=https://your-domain.com
      - CORS_ALLOWED_ORIGINS=https://your-domain.com
      - GUNICORN_WORKERS=2
      - API_KEY_RATE_LIMIT=60/minute
```

> Áp dụng tương tự cho `worker`, `beat-worker`, `migrator` (copy cùng block environment).

#### Cách B: Fork repo và tạo file .env

1. Fork repo Plane
2. Copy `apps/api/.env.example` thành `apps/api/.env`
3. Điền các giá trị thực
4. Commit và trỏ Dokploy về fork của bạn

> **Lưu ý bảo mật:** Không commit secrets vào public repo. Chỉ dùng cách này với private repo.

### Bước 5: Cấu hình Domain & SSL

1. Trong Dokploy, vào tab **Domains** của Compose service
2. Thêm domain trỏ tới service `proxy`, port `80`
3. Bật **HTTPS** nếu muốn (Dokploy sẽ tự quản lý SSL qua Traefik)

> **Lưu ý:** Nếu để Dokploy/Traefik xử lý SSL, bạn có thể bỏ qua cấu hình `CERT_EMAIL` và `CERT_ACME_*`. Caddy proxy bên trong sẽ chỉ chạy HTTP (port 80).

### Bước 6: Deploy

1. Nhấn **Deploy** trong Dokploy
2. Đợi build hoàn tất (lần đầu sẽ lâu vì phải build tất cả images)
3. Kiểm tra logs để đảm bảo các service khởi động thành công

---

## Phương án 2: AIO (All-In-One) Image

Nếu server có tài nguyên hạn chế hoặc bạn muốn đơn giản hơn, dùng image AIO có sẵn từ Plane. **Không cần build gì cả.**

### Bước 1: Tạo các service phụ trợ trên Dokploy

Tạo 4 service riêng biệt (hoặc dùng database/service có sẵn):

**PostgreSQL:**
- Type: Database → PostgreSQL
- Version: 15.7
- Database name: `plane`
- Username: `plane`
- Ghi lại connection string: `postgresql://plane:<pass>@<host>:5432/plane`

**Redis:**
- Type: Database → Redis (hoặc dùng Docker image `valkey/valkey:7.2.11-alpine`)
- Ghi lại connection string: `redis://<host>:6379`

**RabbitMQ:**
- Type: Docker → Image: `rabbitmq:3.13.6-management-alpine`
- Environment:
  ```
  RABBITMQ_DEFAULT_USER=plane
  RABBITMQ_DEFAULT_PASS=<mật-khẩu-mạnh>
  RABBITMQ_DEFAULT_VHOST=plane
  ```
- Ghi lại connection string: `amqp://plane:<pass>@<host>:5672/plane`

**MinIO:**
- Type: Docker → Image: `minio/minio`
- Command: `server /export --console-address ":9090"`
- Environment:
  ```
  MINIO_ROOT_USER=<access-key>
  MINIO_ROOT_PASSWORD=<secret-key>
  ```
- Mount volume: `/export`
- Ghi lại endpoint: `http://<host>:9000`

### Bước 2: Tạo Plane AIO Service

1. Trong project, nhấn **+ Add Service** → **Docker**
2. Chọn source: **Docker Image**
3. Image: `artifacts.plane.so/makeplane/plane-aio-community:latest`
4. Expose port: `80`

### Bước 3: Cấu hình Environment

```env
DOMAIN_NAME=your-domain.com
DATABASE_URL=postgresql://plane:<pass>@<postgres-host>:5432/plane
REDIS_URL=redis://<redis-host>:6379
AMQP_URL=amqp://plane:<pass>@<rabbitmq-host>:5672/plane
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
AWS_S3_BUCKET_NAME=uploads
AWS_S3_ENDPOINT_URL=http://<minio-host>:9000
FILE_SIZE_LIMIT=10485760
SITE_ADDRESS=:80
```

> **Lưu ý:** Thay `<...-host>` bằng tên service nội bộ trong Dokploy network. Nếu các service cùng project, Dokploy sẽ tự tạo internal network.

### Bước 4: Volumes

Thêm persistent volumes:
- `/app/logs` → cho logs
- `/app/data` → cho data

### Bước 5: Domain & Deploy

1. Gán domain vào service AIO, port `80`
2. Bật HTTPS qua Dokploy
3. Deploy

---

## Phương án 3: Compose với pre-built images (Không cần build)

Nếu không muốn build từ source, tạo một file `docker-compose.yml` tùy chỉnh trên Dokploy sử dụng các image có sẵn từ Plane registry. Paste nội dung sau vào phần **Raw Compose** editor:

```yaml
services:
  web:
    image: artifacts.plane.so/makeplane/plane-frontend:latest
    restart: always
    depends_on:
      - api

  admin:
    image: artifacts.plane.so/makeplane/plane-admin:latest
    restart: always
    depends_on:
      - api

  space:
    image: artifacts.plane.so/makeplane/plane-space:latest
    restart: always
    depends_on:
      - api

  api:
    image: artifacts.plane.so/makeplane/plane-backend:latest
    restart: always
    command: ./bin/docker-entrypoint-api.sh
    environment:
      - DEBUG=0
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_HOST=plane-db
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_PORT=5432
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@plane-db:5432/${POSTGRES_DB}
      - REDIS_HOST=plane-redis
      - REDIS_PORT=6379
      - REDIS_URL=redis://plane-redis:6379/
      - RABBITMQ_HOST=plane-mq
      - RABBITMQ_PORT=5672
      - RABBITMQ_USER=${RABBITMQ_USER}
      - RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD}
      - RABBITMQ_VHOST=${RABBITMQ_VHOST}
      - SECRET_KEY=${SECRET_KEY}
      - LIVE_SERVER_SECRET_KEY=${LIVE_SERVER_SECRET_KEY}
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_S3_ENDPOINT_URL=http://plane-minio:9000
      - AWS_S3_BUCKET_NAME=${AWS_S3_BUCKET_NAME}
      - FILE_SIZE_LIMIT=${FILE_SIZE_LIMIT}
      - USE_MINIO=1
      - MINIO_ENDPOINT_SSL=0
      - WEB_URL=${WEB_URL}
      - CORS_ALLOWED_ORIGINS=${WEB_URL}
      - GUNICORN_WORKERS=2
      - API_KEY_RATE_LIMIT=${API_KEY_RATE_LIMIT}
    depends_on:
      - plane-db
      - plane-redis

  worker:
    image: artifacts.plane.so/makeplane/plane-backend:latest
    restart: always
    command: ./bin/docker-entrypoint-worker.sh
    environment:
      - DEBUG=0
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_HOST=plane-db
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_PORT=5432
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@plane-db:5432/${POSTGRES_DB}
      - REDIS_HOST=plane-redis
      - REDIS_PORT=6379
      - REDIS_URL=redis://plane-redis:6379/
      - RABBITMQ_HOST=plane-mq
      - RABBITMQ_PORT=5672
      - RABBITMQ_USER=${RABBITMQ_USER}
      - RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD}
      - RABBITMQ_VHOST=${RABBITMQ_VHOST}
      - SECRET_KEY=${SECRET_KEY}
      - LIVE_SERVER_SECRET_KEY=${LIVE_SERVER_SECRET_KEY}
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_S3_ENDPOINT_URL=http://plane-minio:9000
      - AWS_S3_BUCKET_NAME=${AWS_S3_BUCKET_NAME}
      - FILE_SIZE_LIMIT=${FILE_SIZE_LIMIT}
      - USE_MINIO=1
      - MINIO_ENDPOINT_SSL=0
      - WEB_URL=${WEB_URL}
      - GUNICORN_WORKERS=2
      - API_KEY_RATE_LIMIT=${API_KEY_RATE_LIMIT}
    depends_on:
      - api
      - plane-db
      - plane-redis

  beat-worker:
    image: artifacts.plane.so/makeplane/plane-backend:latest
    restart: always
    command: ./bin/docker-entrypoint-beat.sh
    environment:
      - DEBUG=0
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_HOST=plane-db
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_PORT=5432
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@plane-db:5432/${POSTGRES_DB}
      - REDIS_HOST=plane-redis
      - REDIS_PORT=6379
      - REDIS_URL=redis://plane-redis:6379/
      - RABBITMQ_HOST=plane-mq
      - RABBITMQ_PORT=5672
      - RABBITMQ_USER=${RABBITMQ_USER}
      - RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD}
      - RABBITMQ_VHOST=${RABBITMQ_VHOST}
      - SECRET_KEY=${SECRET_KEY}
      - LIVE_SERVER_SECRET_KEY=${LIVE_SERVER_SECRET_KEY}
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_S3_ENDPOINT_URL=http://plane-minio:9000
      - AWS_S3_BUCKET_NAME=${AWS_S3_BUCKET_NAME}
      - FILE_SIZE_LIMIT=${FILE_SIZE_LIMIT}
      - USE_MINIO=1
      - MINIO_ENDPOINT_SSL=0
      - WEB_URL=${WEB_URL}
      - GUNICORN_WORKERS=2
      - API_KEY_RATE_LIMIT=${API_KEY_RATE_LIMIT}
    depends_on:
      - api
      - plane-db
      - plane-redis

  migrator:
    image: artifacts.plane.so/makeplane/plane-backend:latest
    restart: "no"
    command: ./bin/docker-entrypoint-migrator.sh
    environment:
      - DEBUG=0
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_HOST=plane-db
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_PORT=5432
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@plane-db:5432/${POSTGRES_DB}
      - REDIS_HOST=plane-redis
      - REDIS_PORT=6379
      - REDIS_URL=redis://plane-redis:6379/
      - RABBITMQ_HOST=plane-mq
      - RABBITMQ_PORT=5672
      - RABBITMQ_USER=${RABBITMQ_USER}
      - RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD}
      - RABBITMQ_VHOST=${RABBITMQ_VHOST}
      - SECRET_KEY=${SECRET_KEY}
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_S3_ENDPOINT_URL=http://plane-minio:9000
      - AWS_S3_BUCKET_NAME=${AWS_S3_BUCKET_NAME}
      - USE_MINIO=1
    depends_on:
      - plane-db
      - plane-redis

  live:
    image: artifacts.plane.so/makeplane/plane-live:latest
    restart: always

  plane-db:
    image: postgres:15.7-alpine
    restart: always
    command: postgres -c 'max_connections=1000'
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      PGDATA: /var/lib/postgresql/data

  plane-redis:
    image: valkey/valkey:7.2.11-alpine
    restart: always
    volumes:
      - redisdata:/data

  plane-mq:
    image: rabbitmq:3.13.6-management-alpine
    restart: always
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
      RABBITMQ_DEFAULT_VHOST: ${RABBITMQ_VHOST}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  plane-minio:
    image: minio/minio
    restart: always
    command: server /export --console-address ":9090"
    volumes:
      - uploads:/export
    environment:
      MINIO_ROOT_USER: ${AWS_ACCESS_KEY_ID}
      MINIO_ROOT_PASSWORD: ${AWS_SECRET_ACCESS_KEY}

  proxy:
    image: artifacts.plane.so/makeplane/plane-proxy:latest
    restart: always
    ports:
      - ${LISTEN_HTTP_PORT:-80}:80
    environment:
      FILE_SIZE_LIMIT: ${FILE_SIZE_LIMIT:-5242880}
      BUCKET_NAME: ${AWS_S3_BUCKET_NAME:-uploads}
    depends_on:
      - web
      - api
      - space
      - admin

volumes:
  pgdata:
  redisdata:
  uploads:
  rabbitmq_data:
```

**Environment Variables cho phương án này:**

```env
POSTGRES_USER=plane
POSTGRES_PASSWORD=<mật-khẩu-mạnh>
POSTGRES_DB=plane
RABBITMQ_USER=plane
RABBITMQ_PASSWORD=<mật-khẩu-mạnh>
RABBITMQ_VHOST=plane
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
AWS_S3_BUCKET_NAME=uploads
FILE_SIZE_LIMIT=5242880
LISTEN_HTTP_PORT=80
SECRET_KEY=<random-50-char-string>
LIVE_SERVER_SECRET_KEY=<random-string>
WEB_URL=https://your-domain.com
API_KEY_RATE_LIMIT=60/minute
```

---

## Cấu hình Domain trên Dokploy

### Với Traefik (mặc định của Dokploy)

Dokploy sử dụng Traefik làm reverse proxy. Bạn cần trỏ domain vào service `proxy` (Caddy) của Plane:

1. Vào **Domains** tab của Compose service
2. **Service Name**: `proxy`
3. **Host**: `plane.your-domain.com`
4. **Container Port**: `80`
5. **HTTPS**: Enable (Dokploy tự cấp cert Let's Encrypt)

Khi đó luồng request sẽ là:
```
User → Traefik (443/SSL) → Caddy Proxy (80) → Plane services
```

### Bỏ Caddy proxy, dùng trực tiếp Traefik

Nếu muốn bỏ service `proxy` và để Traefik trỏ thẳng tới các service, bạn cần tạo nhiều domain rules phức tạp hơn. **Không khuyến nghị** vì Caddyfile đã được cấu hình sẵn routing logic.

---

## Yêu cầu tài nguyên

| Cấu hình | RAM tối thiểu | CPU | Storage |
|-----------|---------------|-----|---------|
| Docker Compose (đầy đủ) | 4 GB | 2 vCPU | 30 GB |
| AIO + external services | 2 GB | 2 vCPU | 20 GB |

---

## Kiểm tra sau khi deploy

1. **Web interface**: Truy cập `https://your-domain.com` → thấy trang đăng ký/đăng nhập
2. **Admin panel**: Truy cập `https://your-domain.com/god-mode/` → cấu hình instance
3. **API health**: `curl https://your-domain.com/api/v1/` → nhận response JSON
4. **Logs**: Kiểm tra logs trong Dokploy Dashboard cho từng service

---

## Xử lý sự cố

### Service không khởi động
- Kiểm tra logs: Dokploy Dashboard → Service → Logs
- Đảm bảo PostgreSQL, Redis, RabbitMQ đã sẵn sàng trước khi API khởi động

### Lỗi kết nối database
- Kiểm tra `DATABASE_URL` hoặc các biến `POSTGRES_*`
- Đảm bảo service name trong Compose đúng (`plane-db`, `plane-redis`, `plane-mq`)

### File upload không hoạt động
- Kiểm tra MinIO đã chạy và credentials đúng
- Đảm bảo `AWS_S3_ENDPOINT_URL` trỏ đúng tới MinIO service
- Kiểm tra `FILE_SIZE_LIMIT` đủ lớn

### Migration lỗi
- Kiểm tra logs của service `migrator`
- Đảm bảo database đã sẵn sàng trước khi migrator chạy

---

## Cập nhật phiên bản

1. Trong Dokploy, vào Compose service
2. Cập nhật image tag hoặc branch/tag trong Git source
3. Nhấn **Redeploy**
4. Migration sẽ tự chạy qua service `migrator`

---

## Tham khảo

- [Plane Documentation](https://docs.plane.so)
- [Plane GitHub](https://github.com/makeplane/plane)
- [Dokploy Documentation](https://docs.dokploy.com)
- [Plane AIO Guide](../aio/community/README.md)
- [Plane CLI Deployment](../cli/community/README.md)
