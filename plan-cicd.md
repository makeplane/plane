# Kế hoạch triển khai CI/CD cho dự án Plane trên GitLab nội bộ (Air-gapped)

## 1. Bối cảnh & Ràng buộc hạ tầng

### Môi trường thực tế

| Môi trường         | IP              | Branch    | Mô tả                     |
| ------------------ | --------------- | --------- | ------------------------- |
| **Test (Staging)** | `10.94.232.123` | `develop` | Kiểm thử nội bộ           |
| **Production**     | `10.94.125.86`  | `preview` | Vận hành chính thức       |
| **GitLab nội bộ**  | Mạng internal   | —         | Không có Internet         |
| **Máy Dev**        | Máy cá nhân     | —         | Có Internet, viết code    |
| **Máy Internal**   | Mạng nội bộ SHB | —         | Cầu nối giữa Dev ↔ GitLab |

### Ràng buộc

- ❌ Các server **không có Internet** (air-gapped)
- ❌ GitLab nội bộ **không có Internet** → không thể pull Docker images từ Docker Hub
- ❌ GitLab Runner **không thể pull** `node:22-alpine`, `python:3.12-slim` từ bên ngoài
- ✅ Máy Dev có Internet → build images, push code
- ✅ Máy Internal là cầu nối vào mạng nội bộ SHB

### Luồng đưa code vào hệ thống

```mermaid
flowchart LR
    DEV["💻 Máy Dev<br/><small>Có Internet</small>"]
    INT["🖥️ Máy Internal<br/><small>Mạng nội bộ SHB</small>"]
    GL["🦊 GitLab nội bộ<br/><small>Không Internet</small>"]
    TEST["🧪 Server Test<br/><small>10.94.232.123</small>"]
    PROD["🏦 Server Prod<br/><small>10.94.125.86</small>"]

    DEV -->|"USB / SCP<br/>source code"| INT
    INT -->|"git push"| GL
    GL -->|"CI/CD pipeline<br/>build + deploy"| TEST
    GL -->|"CI/CD pipeline<br/>(manual approve)"| PROD

    style DEV fill:#16213e,color:#fff
    style INT fill:#0f3460,color:#fff
    style GL fill:#e94560,color:#fff
    style TEST fill:#533483,color:#fff
    style PROD fill:#1a1a2e,color:#fff
```

---

## 2. Chiến lược: Chia làm 2 nhóm services

### Nhóm 1: Static (Deploy 1 lần thủ công, không đổi)

Các services này **ít hoặc không thay đổi** → build 1 lần trên Máy Dev, transfer tar.gz vào server, xong.

| Service | Image         | Dockerfile                    | Lý do không đổi                                |
| ------- | ------------- | ----------------------------- | ---------------------------------------------- |
| Space   | `plane-space` | `apps/space/Dockerfile.space` | Portal chia sẻ công khai, hầu như không custom |
| Live    | `plane-live`  | `apps/live/Dockerfile.live`   | WebSocket server, core không đổi               |
| Proxy   | `plane-proxy` | `apps/proxy/Dockerfile.ce`    | Caddy config cố định                           |

### Nhóm 2: Dynamic (CI/CD tự động qua GitLab)

Các services này **thay đổi thường xuyên** theo yêu cầu nghiệp vụ SHB → cần CI/CD.

| Service              | Image            | Dockerfile                    | Build Context |
| -------------------- | ---------------- | ----------------------------- | ------------- |
| **Web** (Frontend)   | `plane-frontend` | `apps/web/Dockerfile.web`     | `.` (root)    |
| **Admin** (God Mode) | `plane-admin`    | `apps/admin/Dockerfile.admin` | `.` (root)    |
| **API** (Backend)    | `plane-backend`  | `apps/api/Dockerfile.api`     | `./apps/api`  |

> **Lưu ý**: `worker`, `beat-worker`, `migrator` đều dùng chung image `plane-backend` → build API 1 lần = có cả 4 services backend.

```mermaid
graph TB
    subgraph STATIC["Nhóm 1: Static — Deploy 1 lần thủ công"]
        SPACE["📄 plane-space"]
        LIVE["🔴 plane-live"]
        PROXY["🔀 plane-proxy"]
    end

    subgraph DYNAMIC["Nhóm 2: Dynamic — CI/CD tự động"]
        WEB["🌐 plane-frontend<br/><small>Web App</small>"]
        ADMIN["⚙️ plane-admin<br/><small>God Mode</small>"]
        API["🔧 plane-backend<br/><small>API + Worker + Beat + Migrator</small>"]
    end

    subgraph INFRA["Infrastructure — Có sẵn trên server"]
        DB[("PostgreSQL 15")]
        REDIS[("Valkey 7.2")]
        MQ[("RabbitMQ 3.13")]
        MINIO[("MinIO")]
    end

    style STATIC fill:#1a1a2e,stroke:#555,color:#aaa
    style DYNAMIC fill:#0f3460,stroke:#e94560,color:#fff
    style INFRA fill:#16213e,stroke:#333,color:#888
```

---

## 3. Bước khởi tạo: Deploy lần đầu (Thủ công)

Lần đầu tiên, build **tất cả 6 images** trên Máy Dev rồi chuyển vào server.

### 3.1. Build images trên Máy Dev

Chạy script có sẵn:

```bash
# Trên Máy Dev (có Internet, có Docker)
cd /path/to/plane

# Build tất cả 6 images → xuất ra dist/*.tar.gz
./scripts/build-shb-images.sh
```

Script sẽ tạo:

```
dist/
├── .shb-version                       # Tag: shb_v1.2.0
├── plane-frontend-shb_v1.2.0.tar.gz   # ~350MB
├── plane-admin-shb_v1.2.0.tar.gz      # ~200MB
├── plane-space-shb_v1.2.0.tar.gz      # ~200MB
├── plane-live-shb_v1.2.0.tar.gz       # ~150MB
├── plane-backend-shb_v1.2.0.tar.gz    # ~500MB
└── plane-proxy-shb_v1.2.0.tar.gz      # ~50MB
```

### 3.2. Đóng gói deploy package

```bash
./scripts/prepare-deploy-package.sh
```

Tạo thư mục `deploy/` chứa mọi thứ cần copy vào server:

```
deploy/
├── docker-compose.shb.yml    # Override file (chỉ đổi image tags)
├── scripts/
│   └── deploy-shb.sh         # Script deploy trên server
└── dist/
    ├── .shb-version
    └── *.tar.gz               # 6 image files
```

### 3.3. Transfer vào server & Deploy

```mermaid
flowchart LR
    DEV["💻 Máy Dev"] -->|"SCP / USB"| INT["🖥️ Máy Internal"]
    INT -->|"SCP"| TEST["🧪 10.94.232.123"]
    INT -->|"SCP"| PROD["🏦 10.94.125.86"]

    subgraph "Trên mỗi server"
        direction TB
        S1["scp -r deploy/* → /opt/plane/"]
        S2["cd /opt/plane"]
        S3["./scripts/deploy-shb.sh"]
        S1 --> S2 --> S3
    end
```

```bash
# Trên Máy Internal → SCP vào server Test
scp -r deploy/* user@10.94.232.123:/opt/plane/

# SSH vào server Test
ssh user@10.94.232.123
cd /opt/plane
chmod +x ./scripts/deploy-shb.sh
./scripts/deploy-shb.sh

# Tương tự cho server Prod
scp -r deploy/* user@10.94.125.86:/opt/plane/
ssh user@10.94.125.86
cd /opt/plane && ./scripts/deploy-shb.sh
```

### 3.4. Luồng deploy-shb.sh trên server

```mermaid
flowchart TD
    A["1️⃣ docker load < *.tar.gz<br/><small>Load 6 images vào Docker</small>"]
    B["2️⃣ Kiểm tra port conflicts<br/><small>Dừng containers cũ nếu có</small>"]
    C["3️⃣ Chạy Django migrations<br/><small>migrator --force-recreate</small>"]
    D{"Migration OK?"}
    E["4️⃣ Deploy all services<br/><small>docker compose up -d --force-recreate</small>"]
    F["⛔ ABORT — Log lỗi, bảo vệ DB"]
    G["5️⃣ docker compose ps<br/><small>Kiểm tra health</small>"]

    A --> B --> C --> D
    D -->|"✅"| E --> G
    D -->|"❌"| F

    style D fill:#e94560,color:#fff
    style F fill:#c70039,color:#fff
    style G fill:#16c79a,color:#fff
```

> Sau bước này, cả 6 services đều chạy. Các lần sau chỉ cần CI/CD cho 3 services động.

---

## 4. CI/CD Pipeline (Chỉ 3 services: web, admin, api)

### 4.1. Tổng quan Pipeline

```mermaid
flowchart TD
    PUSH["Developer push code<br/>Máy Dev → Internal → GitLab"] --> MR["Merge Request"]

    MR --> LINT_STAGE

    subgraph LINT_STAGE["Stage 1: Lint & Check"]
        direction TB
        FMT["frontend:format<br/><small>Prettier check</small>"]
        BUILD_PKG["frontend:build<br/><small>Build packages nội bộ</small>"]
        BUILD_PKG --> LINT["frontend:lint<br/><small>ESLint</small>"]
        BUILD_PKG --> TYPES["frontend:types<br/><small>TypeScript</small>"]
        PY_LINT["backend:lint<br/><small>ruff check</small>"]
    end

    LINT_STAGE --> TEST_STAGE

    subgraph TEST_STAGE["Stage 2: Test"]
        PY_TEST["backend:test<br/><small>pytest</small>"]
    end

    TEST_STAGE --> BUILD_STAGE

    subgraph BUILD_STAGE["Stage 3: Build 3 Images"]
        direction LR
        B_WEB["build:web<br/><small>plane-frontend</small>"]
        B_ADMIN["build:admin<br/><small>plane-admin</small>"]
        B_API["build:api<br/><small>plane-backend</small>"]
    end

    BUILD_STAGE --> DEPLOY_STAGE

    subgraph DEPLOY_STAGE["Stage 4: Deploy"]
        D_TEST["deploy:test<br/><small>→ 10.94.232.123</small><br/><small>Tự động khi merge → develop</small>"]
        D_PROD["deploy:production<br/><small>→ 10.94.125.86</small><br/><small>Manual khi merge → preview</small>"]
    end

    style LINT_STAGE fill:#1a1a2e,stroke:#e94560,color:#fff
    style TEST_STAGE fill:#1a1a2e,stroke:#0f3460,color:#fff
    style BUILD_STAGE fill:#1a1a2e,stroke:#16213e,color:#fff
    style DEPLOY_STAGE fill:#1a1a2e,stroke:#533483,color:#fff
```

### 4.2. Vấn đề Runner Image trong môi trường Air-gapped

Vì GitLab Runner **không thể pull** `node:22-alpine` hay `python:3.12-slim` từ Internet, cần chuẩn bị trước:

**Cách 1: Đưa base images vào server GitLab Runner**

```bash
# Trên Máy Dev (có Internet)
docker pull node:22-alpine
docker pull python:3.12-slim
docker pull docker:24.0.5
docker pull docker:24.0.5-dind
docker pull postgres:15-alpine
docker pull valkey/valkey:7.2.11-alpine

# Save thành tar
docker save node:22-alpine | gzip > runner-images/node-22-alpine.tar.gz
docker save python:3.12-slim | gzip > runner-images/python-3.12-slim.tar.gz
docker save docker:24.0.5 | gzip > runner-images/docker-24.tar.gz
docker save docker:24.0.5-dind | gzip > runner-images/docker-24-dind.tar.gz
docker save postgres:15-alpine | gzip > runner-images/postgres-15.tar.gz
docker save valkey/valkey:7.2.11-alpine | gzip > runner-images/valkey-7.2.tar.gz

# Transfer vào máy GitLab Runner (qua Internal)
scp -r runner-images/ user@gitlab-runner:/tmp/
ssh user@gitlab-runner "for f in /tmp/runner-images/*.tar.gz; do docker load < \$f; done"
```

**Cách 2: Dùng Shell Executor thay Docker Executor**

Cài trực tiếp Node.js 22 + Python 3.12 + Docker trên máy GitLab Runner, dùng `shell` executor. Không cần pull images.

```mermaid
flowchart LR
    subgraph "Cách 1: Docker Executor"
        R1["Runner pull image<br/><small>node:22-alpine</small>"] --> R2["Chạy job trong container"]
        R1 -.->|"❌ Không có Internet"| FAIL["FAIL"]
        FIX["Pre-load images<br/><small>docker load < *.tar.gz</small>"] -->|"✅ Fix"| R1
    end

    subgraph "Cách 2: Shell Executor"
        S1["Cài Node + Python<br/><small>trực tiếp trên Runner</small>"] --> S2["Chạy job trên shell"]
    end

    style FAIL fill:#c70039,color:#fff
    style FIX fill:#16c79a,color:#fff
```

> **Khuyến nghị**: Dùng **Cách 2 (Shell Executor)** cho đơn giản vì không cần maintain danh sách pre-loaded images.

---

### 4.3. File `.gitlab-ci.yml` hoàn chỉnh

```yaml
# =============================================================================
# CI/CD Pipeline cho Plane SHB — Air-gapped GitLab
# Chỉ CI/CD 3 services: web, admin, api
# (space, live, proxy đã deploy thủ công lần đầu)
# =============================================================================

stages:
  - lint
  - test
  - build
  - deploy

variables:
  PNPM_STORE_PATH: .pnpm-store
  NODE_OPTIONS: "--max-old-space-size=4096"
  # Tag cho Docker images — lấy từ commit SHA ngắn
  IMAGE_TAG: $CI_COMMIT_SHORT_SHA
  # Server IPs
  TEST_SERVER: "10.94.232.123"
  PROD_SERVER: "10.94.125.86"

# ─── Cache Templates ─────────────────────────────────────────────────────────

.pnpm_cache: &pnpm_cache
  key:
    files:
      - pnpm-lock.yaml
  paths:
    - .pnpm-store/

.pip_cache: &pip_cache
  key: pip-cache
  paths:
    - .pip-cache/

# ─── Base Templates ──────────────────────────────────────────────────────────

.frontend_base:
  cache:
    <<: *pnpm_cache
  before_script:
    - corepack enable pnpm
    - pnpm config set store-dir $PNPM_STORE_PATH
    - pnpm install --frozen-lockfile

# =============================================================================
# STAGE 1: LINT & FORMAT
# =============================================================================

# Format check — chạy độc lập, KHÔNG cần build trước
frontend:format:
  extends: .frontend_base
  stage: lint
  interruptible: true
  script:
    - pnpm turbo run check:format --affected
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

# Build packages nội bộ — dependency cho lint + types
frontend:build:
  extends: .frontend_base
  stage: lint
  interruptible: true
  script:
    - pnpm turbo run build --affected
  artifacts:
    paths:
      - .turbo/
      - packages/*/dist/
      - packages/*/build/
      - packages/*/.react-router/
    expire_in: 1 hour
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

# ESLint — cần build xong trước
frontend:lint:
  extends: .frontend_base
  stage: lint
  interruptible: true
  needs: [frontend:build]
  script:
    - pnpm turbo run check:lint --affected
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

# TypeScript type check — cần build xong trước
frontend:types:
  extends: .frontend_base
  stage: lint
  interruptible: true
  needs: [frontend:build]
  script:
    - pnpm turbo run check:types --affected
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

# Ruff lint Python — chỉ khi backend thay đổi
backend:lint:
  stage: lint
  interruptible: true
  cache:
    <<: *pip_cache
  script:
    - pip install ruff
    - cd apps/api && pip install -r requirements.txt
    - ruff check --fix apps/api
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - apps/api/**/*

# =============================================================================
# STAGE 2: TEST
# =============================================================================

backend:test:
  stage: test
  interruptible: true
  services:
    - name: postgres:15-alpine
      alias: postgres
    - name: valkey/valkey:7.2.11-alpine
      alias: redis
  variables:
    POSTGRES_DB: plane_test
    POSTGRES_USER: plane_user
    POSTGRES_PASSWORD: plane_password
    DATABASE_URL: postgres://plane_user:plane_password@postgres:5432/plane_test
    REDIS_URL: redis://redis:6379/0
  cache:
    <<: *pip_cache
  script:
    - cd apps/api
    - pip install -r requirements/test.txt
    - python run_tests.py --unit --verbose
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - apps/api/**/*

# =============================================================================
# STAGE 3: BUILD (Chỉ 3 images: web, admin, api)
# =============================================================================

# Build + export tar.gz (vì server không pull được từ registry)

build:web:
  stage: build
  script:
    - docker build -t makeplane/plane-frontend:$IMAGE_TAG -f apps/web/Dockerfile.web .
    - mkdir -p dist
    - docker save makeplane/plane-frontend:$IMAGE_TAG | gzip > dist/plane-frontend-$IMAGE_TAG.tar.gz
  artifacts:
    paths:
      - dist/plane-frontend-*.tar.gz
    expire_in: 3 days
  rules:
    - if: $CI_COMMIT_BRANCH == "develop" || $CI_COMMIT_BRANCH == "preview"

build:admin:
  stage: build
  script:
    - docker build -t makeplane/plane-admin:$IMAGE_TAG -f apps/admin/Dockerfile.admin .
    - mkdir -p dist
    - docker save makeplane/plane-admin:$IMAGE_TAG | gzip > dist/plane-admin-$IMAGE_TAG.tar.gz
  artifacts:
    paths:
      - dist/plane-admin-*.tar.gz
    expire_in: 3 days
  rules:
    - if: $CI_COMMIT_BRANCH == "develop" || $CI_COMMIT_BRANCH == "preview"

build:api:
  stage: build
  script:
    # Context = ./apps/api (không phải root!)
    - docker build -t makeplane/plane-backend:$IMAGE_TAG -f apps/api/Dockerfile.api ./apps/api
    - mkdir -p dist
    - docker save makeplane/plane-backend:$IMAGE_TAG | gzip > dist/plane-backend-$IMAGE_TAG.tar.gz
  artifacts:
    paths:
      - dist/plane-backend-*.tar.gz
    expire_in: 3 days
  rules:
    - if: $CI_COMMIT_BRANCH == "develop" || $CI_COMMIT_BRANCH == "preview"

# =============================================================================
# STAGE 4: DEPLOY
# =============================================================================

# Deploy helper script (inline) — chạy trên target server
.deploy_script: &deploy_script |
  echo "Loading Docker images..."
  for f in /tmp/plane-deploy/*.tar.gz; do
    [ -f "$f" ] && docker load < "$f"
    echo "  ✓ Loaded $(basename $f)"
  done

  cd /opt/plane

  # Update docker-compose override với tag mới
  cat > docker-compose.ci.yml << COMPOSE_EOF
  # Auto-generated by GitLab CI — tag: $IMAGE_TAG
  services:
    web:
      image: makeplane/plane-frontend:$IMAGE_TAG
    admin:
      image: makeplane/plane-admin:$IMAGE_TAG
    api:
      image: makeplane/plane-backend:$IMAGE_TAG
    worker:
      image: makeplane/plane-backend:$IMAGE_TAG
    beat-worker:
      image: makeplane/plane-backend:$IMAGE_TAG
    migrator:
      image: makeplane/plane-backend:$IMAGE_TAG
  COMPOSE_EOF

  # Chạy migration trước
  docker compose -f docker-compose.yaml -f docker-compose.shb.yml -f docker-compose.ci.yml \
    up -d migrator --force-recreate --no-build
  echo "Waiting for migrations..."
  docker compose -f docker-compose.yaml -f docker-compose.shb.yml -f docker-compose.ci.yml \
    wait migrator || { echo "❌ Migration failed!"; exit 1; }

  # Deploy 3 services đã thay đổi (force-recreate để dùng image mới)
  docker compose -f docker-compose.yaml -f docker-compose.shb.yml -f docker-compose.ci.yml \
    up -d web admin api worker beat-worker --force-recreate --no-build

  echo "✅ Deploy complete"
  docker compose -f docker-compose.yaml -f docker-compose.shb.yml -f docker-compose.ci.yml ps

# ── Deploy Test (tự động khi merge → develop) ──────────────────────────────

deploy:test:
  stage: deploy
  interruptible: false
  before_script:
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - ssh-keyscan -H $TEST_SERVER >> ~/.ssh/known_hosts
  script:
    # Transfer 3 image tar.gz lên server Test
    - ssh $SSH_USER@$TEST_SERVER "mkdir -p /tmp/plane-deploy"
    - scp dist/*.tar.gz $SSH_USER@$TEST_SERVER:/tmp/plane-deploy/

    # Chạy deploy trên server
    - ssh $SSH_USER@$TEST_SERVER "export IMAGE_TAG=$IMAGE_TAG && $DEPLOY_SCRIPT"

    # Cleanup
    - ssh $SSH_USER@$TEST_SERVER "rm -rf /tmp/plane-deploy"
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
  environment:
    name: test
    url: http://10.94.232.123

# ── Deploy Production (manual approve khi merge → preview) ─────────────────

deploy:production:
  stage: deploy
  interruptible: false
  before_script:
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY_PROD" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - ssh-keyscan -H $PROD_SERVER >> ~/.ssh/known_hosts
  script:
    - ssh $SSH_USER_PROD@$PROD_SERVER "mkdir -p /tmp/plane-deploy"
    - scp dist/*.tar.gz $SSH_USER_PROD@$PROD_SERVER:/tmp/plane-deploy/

    - ssh $SSH_USER_PROD@$PROD_SERVER "export IMAGE_TAG=$IMAGE_TAG && $DEPLOY_SCRIPT"

    - ssh $SSH_USER_PROD@$PROD_SERVER "rm -rf /tmp/plane-deploy"
  rules:
    - if: $CI_COMMIT_BRANCH == "preview"
      when: manual
      allow_failure: false
  environment:
    name: production
    url: http://10.94.125.86
```

---

## 5. Luồng vận hành hàng ngày

### 5.1. Developer workflow

```mermaid
sequenceDiagram
    participant DEV as 💻 Máy Dev
    participant INT as 🖥️ Máy Internal
    participant GL as 🦊 GitLab nội bộ
    participant TEST as 🧪 Server Test
    participant PROD as 🏦 Server Prod

    Note over DEV: Developer code trên feature branch
    DEV->>DEV: git commit + git push origin feature/xxx

    Note over DEV,INT: Transfer code vào mạng nội bộ
    DEV->>INT: SCP / USB repo
    INT->>GL: git push origin feature/xxx

    Note over GL: Tạo Merge Request → develop
    GL->>GL: Pipeline Lint & Test (Stage 1+2)
    GL-->>GL: ✅ Pass → Approve & Merge

    Note over GL: Merge vào develop → trigger Build + Deploy
    GL->>GL: Build 3 images (web, admin, api)
    GL->>GL: Export tar.gz (artifacts)
    GL->>TEST: SCP tar.gz + Deploy tự động
    TEST-->>GL: ✅ Deploy thành công

    Note over GL: Sau khi test OK → MR develop → preview
    GL->>GL: Build 3 images
    GL->>PROD: Deploy (manual approve)
    PROD-->>GL: ✅ Production updated
```

### 5.2. Rollback

```mermaid
flowchart LR
    A["Phát hiện lỗi<br/>trên Production"] --> B{"Mức độ?"}
    B -->|"Rollback 3 services"| C["docker compose -f ... up -d<br/><small>Dùng tag cũ trong docker-compose.ci.yml</small>"]
    B -->|"Rollback toàn bộ"| D["docker compose -f docker-compose.yaml up -d<br/><small>Bỏ hết override files</small>"]
    B -->|"Chỉ rollback API"| E["Đổi image tag API<br/>trong docker-compose.ci.yml<br/>→ restart api + worker + beat"]
```

**Rollback nhanh** (quay về bản deploy trước):

```bash
ssh user@10.94.125.86
cd /opt/plane

# Xem các image tags có sẵn
docker images --filter "reference=makeplane/*" --format "{{.Repository}}:{{.Tag}}"

# Sửa tag trong docker-compose.ci.yml về commit cũ
# Ví dụ: đổi IMAGE_TAG về "abc1234"
sed -i 's/$IMAGE_TAG_MOI/abc1234/g' docker-compose.ci.yml

# Restart
docker compose -f docker-compose.yaml -f docker-compose.shb.yml -f docker-compose.ci.yml \
  up -d web admin api worker beat-worker --force-recreate --no-build
```

---

## 6. Docker Compose Layering (3 tầng override)

```mermaid
graph TD
    BASE["📄 docker-compose.yaml<br/><small>Base — từ plane-selfhost<br/>Định nghĩa tất cả services + infra</small>"]
    SHB["📄 docker-compose.shb.yml<br/><small>Layer 1 — Deploy lần đầu<br/>Override 6 images: space, live, proxy,<br/>web, admin, api → tag shb_v1.2.0</small>"]
    CI["📄 docker-compose.ci.yml<br/><small>Layer 2 — CI/CD cập nhật<br/>Override 3 images: web, admin, api<br/>→ tag commit SHA mới nhất</small>"]

    BASE --> SHB --> CI

    CMD["docker compose \\ <br/> -f docker-compose.yaml \\ <br/> -f docker-compose.shb.yml \\ <br/> -f docker-compose.ci.yml \\ <br/> up -d"]

    CI --> CMD

    style BASE fill:#16213e,color:#fff
    style SHB fill:#0f3460,color:#fff
    style CI fill:#e94560,color:#fff
```

| File                     | Nội dung                                                 | Ai tạo                          | Bao giờ thay đổi    |
| ------------------------ | -------------------------------------------------------- | ------------------------------- | ------------------- |
| `docker-compose.yaml`    | Base config: tất cả services, volumes, networks, infra   | plane-selfhost installer        | Hiếm khi            |
| `docker-compose.shb.yml` | Override **6 images** → tag `shb_v1.2.0`                 | `build-shb-images.sh` (lần đầu) | Khi upgrade toàn bộ |
| `docker-compose.ci.yml`  | Override **3 images** (web, admin, api) → tag commit SHA | GitLab CI/CD pipeline           | Mỗi lần deploy      |

> Layer 2 (`ci.yml`) override Layer 1 (`shb.yml`) cho 3 services dynamic. Space, live, proxy vẫn giữ tag từ Layer 1.

---

## 7. Cấu hình cần chuẩn bị trên GitLab

### 7.1. GitLab Runner

- Cài **Shell Executor** trên 1 máy trong mạng nội bộ (có thể là chính máy Internal)
- Cài sẵn: **Node.js 22**, **Python 3.12**, **Docker**, **pnpm** (via corepack)
- Máy Runner phải SSH được vào `10.94.232.123` và `10.94.125.86`

### 7.2. CI/CD Variables (Settings → CI/CD → Variables)

| Biến                   | Mô tả                               | Masked | Protected |
| ---------------------- | ----------------------------------- | ------ | --------- |
| `SSH_PRIVATE_KEY`      | SSH key → server Test               | ✅     | ✅        |
| `SSH_USER`             | User SSH server Test (vd: `ubuntu`) | ❌     | ✅        |
| `SSH_PRIVATE_KEY_PROD` | SSH key → server Prod               | ✅     | ✅        |
| `SSH_USER_PROD`        | User SSH server Prod                | ❌     | ✅        |

### 7.3. SSH Keys Setup

```bash
# Trên máy GitLab Runner
ssh-keygen -t ed25519 -C "gitlab-runner" -f ~/.ssh/gitlab_deploy

# Copy public key vào 2 servers
ssh-copy-id -i ~/.ssh/gitlab_deploy.pub user@10.94.232.123
ssh-copy-id -i ~/.ssh/gitlab_deploy.pub user@10.94.125.86

# Nội dung ~/.ssh/gitlab_deploy → paste vào GitLab variable SSH_PRIVATE_KEY
```

---

## 8. Timeline triển khai

```mermaid
gantt
    title Kế hoạch triển khai CI/CD — Air-gapped
    dateFormat YYYY-MM-DD

    section Giai đoạn 1: Khởi tạo
    Cài GitLab Runner (Shell Executor)       :a1, 2025-04-07, 2d
    Cài Node 22 + Python 3.12 + Docker       :a2, after a1, 1d
    Thiết lập SSH keys + CI/CD Variables      :a3, after a2, 1d

    section Giai đoạn 2: Deploy lần đầu (thủ công)
    Build 6 images trên Máy Dev              :b1, after a3, 1d
    Transfer tar.gz → Server Test            :b2, after b1, 1d
    Deploy + verify trên Test                :b3, after b2, 1d
    Deploy + verify trên Prod                :b4, after b3, 1d

    section Giai đoạn 3: CI Pipeline
    Viết .gitlab-ci.yml (lint stages)        :c1, after b4, 2d
    Test lint pipeline trên MR thử           :c2, after c1, 1d
    Thêm backend test stage                  :c3, after c2, 1d

    section Giai đoạn 4: CD Pipeline
    Thêm build stage (3 images)              :d1, after c3, 2d
    Thêm deploy:test (auto → develop)        :d2, after d1, 2d
    Thêm deploy:production (manual → preview):d3, after d2, 1d
    Test end-to-end pipeline                 :d4, after d3, 2d
```

---

## 9. Tổng kết

| Hạng mục            | Chi tiết                                                                          |
| ------------------- | --------------------------------------------------------------------------------- |
| **Deploy lần đầu**  | 6 images, thủ công, dùng scripts có sẵn (`build-shb-images.sh` + `deploy-shb.sh`) |
| **CI/CD sau đó**    | Chỉ 3 images: `plane-frontend`, `plane-admin`, `plane-backend`                    |
| **Lint**            | 4 frontend jobs (format, build, lint, types) + 1 backend job (ruff)               |
| **Test**            | pytest cho Django API (cần PostgreSQL + Redis service)                            |
| **Build**           | Export tar.gz (air-gapped, không dùng registry)                                   |
| **Deploy Test**     | Tự động khi merge vào `develop` → SCP + deploy trên `10.94.232.123`               |
| **Deploy Prod**     | Manual approve khi merge vào `preview` → SCP + deploy trên `10.94.125.86`         |
| **Rollback**        | Đổi image tag trong `docker-compose.ci.yml` → restart                             |
| **Static services** | space, live, proxy — chỉ update khi upgrade version lớn                           |

---

## Validation Log

### Session 1 — 2026-04-03

**Trigger:** `/ck:plan validate` pre-implementation interview
**Questions asked:** 5

#### Questions & Answers

1. **[Architecture]** Runner executor: Shell Executor được recommend nhưng `backend:test` dùng `services:` (postgres, valkey) chỉ chạy được với Docker Executor — sẽ dùng setup nào?
   - Options: Shell + local services | Docker Executor + preload | Two runners | Skip backend tests
   - **Answer:** Shell Executor + install PostgreSQL + Valkey trực tiếp trên Runner machine, xóa `services:` khỏi `backend:test`
   - **Rationale:** `services:` keyword không tương thích với Shell Executor — giữ nguyên `services:` sẽ làm CI fail. Cần sửa `backend:test` để kết nối PostgreSQL/Valkey local.

2. **[Risks]** `$DEPLOY_SCRIPT` trong deploy jobs là YAML anchor (inline text), không phải biến shell trên remote server — remote shell sẽ thấy biến rỗng. Cách invoke deploy script từ xa?
   - Options: SCP script → SSH execute | Pre-install trên servers | Heredoc via SSH
   - **Answer:** SCP inline script thành file `/tmp/deploy.sh` lên server, sau đó `ssh user@server bash /tmp/deploy.sh`
   - **Rationale:** `$DEPLOY_SCRIPT` không truyền được qua SSH như đang viết. SCP + execute là cách clean và dễ debug nhất.

3. **[Assumptions]** `ruff check --fix` trong CI tự sửa files nhưng không commit lại — violations bị fix silently, job vẫn pass. Có nên bỏ `--fix`?
   - Options: `ruff check` (no --fix) | `--fix` + git diff check | Giữ nguyên
   - **Answer:** Đổi thành `ruff check` (không có `--fix`) — fail CI nếu có violation, dev tự fix local
   - **Rationale:** Standard CI behavior. `--fix` trong CI không có tác dụng vì không commit back.

4. **[Architecture]** Mỗi pipeline build tạo ~1GB tar.gz artifacts với expiry 3 ngày — có thể đầy disk GitLab nếu deploy nhiều lần/ngày.
   - Options: 1-day expiry | Giữ 3 ngày, monitor | Skip GitLab artifacts
   - **Answer:** Giảm xuống 1 ngày (1 day expiry)
   - **Rationale:** Sau khi deploy xong, artifacts không cần thiết nữa. 1 ngày đủ để retry nếu cần.

5. **[Scope]** Không có quy trình documented cho việc update static services (space, live, proxy) khi upgrade version lớn.
   - Options: Re-run manual scripts | Add manual CI job | Write runbook doc
   - **Answer:** Re-run `build-shb-images.sh` + `prepare-deploy-package.sh` + `deploy-shb.sh` thủ công — chấp nhận là thao tác hiếm gặp
   - **Rationale:** Upgrade version lớn hiếm, script đã có sẵn. Thêm note vào plan là đủ.

#### Confirmed Decisions

- **Runner**: Shell Executor, cài postgres + valkey local, xóa `services:` trong `backend:test`
- **Deploy invocation**: SCP script → SSH execute (không dùng YAML anchor làm env var)
- **Ruff lint**: `ruff check` (no `--fix`)
- **Artifacts expiry**: 1 ngày thay vì 3 ngày
- **Static upgrade**: Re-run manual scripts, thêm note vào Section 3

#### Action Items

- [ ] Sửa `backend:test`: xóa `services:`, thay bằng kết nối PostgreSQL/Valkey local (`localhost`)
- [ ] Sửa `deploy:test` và `deploy:production`: SCP inline script thành file, rồi SSH execute
- [ ] Sửa `backend:lint`: đổi `ruff check --fix` → `ruff check`
- [ ] Sửa `build:web/admin/api`: đổi `expire_in: 3 days` → `expire_in: 1 day`
- [ ] Thêm note ở Section 3: cách re-run khi cần update static services

#### Impact on Phases

- **Section 4.2 (Runner setup)**: Confirm Shell Executor, document cài postgres + valkey local
- **Section 4.3 (.gitlab-ci.yml)**: 4 chỗ cần sửa (backend:test, deploy scripts, ruff, artifacts expiry)
- **Section 3 (Deploy lần đầu)**: Thêm note về quy trình upgrade static services sau này

---

### Session 2 — 2026-04-03

**Trigger:** Test trên external GitLab (gitlab.com) trước khi đưa vào GitLab nội bộ air-gapped
**Questions asked:** 6

#### Questions & Answers

1. **[Architecture]** External GitLab là gì? Runner sẽ chạy ở đâu?
   - Options: gitlab.com + shared runner | gitlab.com + self-hosted runner | Self-hosted GitLab bên ngoài
   - **Answer:** gitlab.com + self-hosted runner
   - **Rationale:** Self-hosted runner gần hơn với setup nội bộ (cùng machine config), nhưng vẫn có internet để pull Docker images. Đây là môi trường test tốt nhất để validate pipeline trước khi adapt cho air-gapped.

2. **[Scope]** Stage nào cần chạy trên external GitLab?
   - Options: Lint | Backend test (pytest) | Build (tar.gz) | Deploy (SSH)
   - **Answer:** Tất cả 4 stages
   - **Rationale:** Test full pipeline end-to-end trên external trước — nếu tất cả pass, adapt cho internal sẽ chỉ là thay đổi runner config và biến môi trường.

3. **[Assumptions]** Session 1 action items đã apply chưa?
   - Options: Chưa apply — sẽ apply khi implement | Đã apply một phần | Chưa apply — test file gốc trước
   - **Answer:** Chưa apply — sẽ apply khi bắt đầu implement
   - **Rationale:** Apply Session 1 fixes trước (baseline clean), sau đó thêm Session 2 changes (external GitLab support). Không test file gốc có bugs đã biết.

4. **[Architecture]** `backend:test` strategy: external (Docker Executor, có internet) vs internal (Shell Executor, air-gapped)?
   - Options: services: trên external, xóa services: cho internal | Một config duy nhất không dùng services: | services: cho cả hai
   - **Answer:** Dùng `services:` trên external, xóa `services:` cho internal
   - **Rationale:** Tận dụng Docker Executor của self-hosted runner trên external. Khi chuyển sang internal, chỉ cần toggle `IS_AIRGAPPED=true` để skip `services:` block.

5. **[Architecture]** Deploy target cho external test?
   - Options: Server nội bộ 10.94.232.123 (nếu có VPN) | VPS/cloud tạm thời | Skip deploy stage
   - **Answer:** VPS/cloud tạm thời
   - **Rationale:** Runner self-hosted có internet → dùng VPS làm deploy target để test SSH + SCP flow đầy đủ mà không cần access vào mạng SHB.

6. **[Architecture]** Quản lý config cho 2 môi trường?
   - Options: Một .gitlab-ci.yml với `$IS_AIRGAPPED` variable | Hai file riêng | Branch riêng cho external config
   - **Answer:** Một file `.gitlab-ci.yml` duy nhất với `$IS_AIRGAPPED` CI variable
   - **Rationale:** DRY — một file duy nhất, behavior phân nhánh qua variable. Khi push vào internal GitLab chỉ cần set `IS_AIRGAPPED=true` trong CI/CD Variables.

#### Confirmed Decisions

- **External GitLab**: gitlab.com + self-hosted runner (Docker enabled, có internet)
- **Test scope**: Full pipeline — lint + test + build + deploy
- **backend:test**: Dùng `services: [postgres, valkey]` khi `IS_AIRGAPPED=false`, localhost khi `true`
- **Deploy target external**: VPS tạm thời (SSH từ runner tới VPS)
- **Config**: Single `.gitlab-ci.yml` với `IS_AIRGAPPED` toggle variable
- **Order**: Apply Session 1 fixes trước → thêm `IS_AIRGAPPED` logic → test external

#### Action Items

- [ ] Apply tất cả Session 1 fixes trước (5 items: backend:test, deploy script, ruff, artifacts expiry, static note)
- [ ] Thêm `IS_AIRGAPPED` variable vào `variables:` block (default `"false"`)
- [ ] Sửa `backend:test`: thêm conditional — nếu `IS_AIRGAPPED=false` dùng `services:`, nếu `true` dùng localhost connection
- [ ] Setup SSH key auth trên VPS `161.118.223.149` (user: ubuntu): generate key pair trên runner, copy public key vào VPS `~/.ssh/authorized_keys`
- [ ] Thêm VPS SSH credentials vào gitlab.com CI/CD Variables: `VPS_HOST=161.118.223.149`, `VPS_USER=ubuntu`, `VPS_SSH_KEY` (private key)
- [ ] Thêm `deploy:external-test` job (SSH vào VPS) chạy khi `IS_AIRGAPPED=false`
- [ ] Cài self-hosted runner trên gitlab.com với Docker enabled (để `services:` hoạt động)
- [ ] Sau khi pipeline xanh trên external → set `IS_AIRGAPPED=true` trên internal GitLab variables

#### Impact on Phases

- **Section 4.2 (Runner setup)**: Document 2 runner configs — external (Docker Executor) vs internal (Shell Executor)
- **Section 4.3 (.gitlab-ci.yml)**: Thêm `IS_AIRGAPPED` toggle, `deploy:external-test` job, conditional services block
- **Section 7.2 (CI/CD Variables)**: Thêm `IS_AIRGAPPED`, `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` vào bảng variables
