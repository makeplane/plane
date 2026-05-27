# 01 — Build Station Bundle (Tạo bundle offline)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** SRE/DevOps (chạy trên build station có internet)
**Host:** `shws-build` (mgmt VLAN, có internet — KHÔNG trong air-gap)

> Air-gap: server trong bank **không** `dnf install` / `docker pull` / `pip install` / `git clone` được. Mọi artefact phải gói trên build station rồi chuyển vào qua USB/SFTP.

---

## 1. Khi nào dùng

- Lần đầu chuẩn bị cài PROD/UAT/DR
- Khi cần cập nhật version (PG minor, Docker, hoặc image SHWS mới)

**Output:** `bundle-shws-YYYYMMDD.tar.gz` + `CHECKSUMS.txt`, chuyển vào bank.

---

## 2. Pre-check (trên build station)

```bash
# Build station phải khớp KIẾN TRÚC + RHEL minor với server target
cat /etc/redhat-release          # phải cùng RHEL 9.6 (đúng patch) với server bank
uname -m                         # x86_64 (khớp linux/amd64)
docker version                   # Docker CE + buildx
docker buildx version
node -v                          # cần cho build-shb-images.sh (đọc package.json)
```

> **Quan trọng:** RPM phụ thuộc RHEL minor. Build station nên là VM RHEL **cùng minor** với server bank (hoặc dùng container `registry.access.redhat.com/ubi9` đúng minor) để `dnf download` ra đúng gói.

---

## 3. Cấu trúc bundle đích

```
bundle-shws-YYYYMMDD/
├── pg-stack-rhel9/        # RPM: postgresql15-server, pgbackrest, deps
├── docker-stack/          # RPM Docker CE + image .tar (redis/valkey, rabbitmq, minio, exporters)
├── plane-dist/            # dist/ (image SHWS .tar.gz) + docker-compose.shb.yml + deploy-shb.sh
├── os-tuning/             # sysctl, multipath.conf mẫu, systemd units, scripts
├── monitoring-stack/      # (optional) Prometheus, Grafana, node_exporter, postgres_exporter
└── CHECKSUMS.txt          # sha256 mọi file
```

---

## 4. Action

### 4.1 PostgreSQL stack RPM (PGDG offline)

```bash
mkdir -p bundle-shws-$(date +%Y%m%d)/pg-stack-rhel9
cd bundle-shws-$(date +%Y%m%d)/pg-stack-rhel9

# Cài repo PGDG (chỉ trên build station)
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm
sudo dnf -qy module disable postgresql      # tắt module PG mặc định RHEL

# Tải PG 15.7 + pgBackRest + toàn bộ dependency (GĐ1 không cần pgbouncer — xem 06 §6)
dnf download --resolve --alldeps \
  postgresql15-server-15.7* postgresql15-contrib-15.7* \
  pgbackrest \
  device-mapper-multipath lvm2 xfsprogs chrony
```

> `--resolve --alldeps` kéo đủ dependency để cài offline bằng `dnf install ./*.rpm` trong bank.

### 4.2 Docker stack RPM + base images

```bash
cd ../docker-stack

# Docker CE RPM offline (repo docker-ce)
sudo dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
dnf download --resolve --alldeps \
  docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Base images dùng bởi compose (kéo + lưu .tar)
for IMG in valkey/valkey:7.2.11-alpine \
           rabbitmq:3.13.6-management-alpine \
           minio/minio:latest \
           postgres:15.7-alpine \
           prometheuscommunity/postgres-exporter:latest \
           prom/node-exporter:latest; do
  docker pull "$IMG"
  docker save "$IMG" | gzip > "$(echo "$IMG" | tr '/:' '__').tar.gz"
done
```

> `postgres:15.7-alpine` chỉ cần cho **UAT** (DB trong Docker). PROD dùng PG native nên có thể bỏ image này khỏi bundle PROD.

### 4.3 Image ứng dụng SHWS

Chạy từ repo SHWS (`plane.so/`), branch đã chốt (vd `preview`):

```bash
cd /path/to/plane.so

# Build 6 image + sinh docker-compose.shb.yml + dist/*.tar.gz
./scripts/build-shb-images.sh

# Đóng gói deploy/ (compose override + deploy-shb.sh + dist/)
./scripts/prepare-deploy-package.sh

# Copy deploy/ vào bundle
cp -r deploy/* /path/to/bundle-shws-$(date +%Y%m%d)/plane-dist/
```

`build-shb-images.sh` tạo tag `shb_v<package.json version>` (vd `shb_v1.2.0`) và:

```
dist/.shb-version
dist/plane-frontend-shb_vX.tar.gz   dist/plane-admin-shb_vX.tar.gz
dist/plane-space-shb_vX.tar.gz      dist/plane-live-shb_vX.tar.gz
dist/plane-backend-shb_vX.tar.gz    dist/plane-proxy-shb_vX.tar.gz
docker-compose.shb.yml              # override image tag cho 9 service
```

> `docker-compose.shb.yml` chỉ **override image tag**, áp lên trên base `docker-compose.yml` của plane-selfhost. Base compose phải có sẵn trên server (xem [`prod/04-app-node-docker.md`](./prod/04-app-node-docker.md)).

### 4.4 OS tuning artefacts

```bash
cd ../os-tuning
# Copy file cấu hình mẫu từ tài liệu thiết kế
cp /path/to/configs/99-postgres.conf .          # sysctl (06-database-design §5.2)
cp /path/to/configs/multipath.conf.sample .     # 07-storage-design §5.1
cp /path/to/configs/postgresql.conf.sample .    # 06-database-design §5.1
cp /path/to/configs/pg_hba.conf.sample .
cp /path/to/configs/pgbackrest.conf.sample .
```

### 4.5 Checksum + đóng gói

```bash
cd /path/to/bundle-shws-$(date +%Y%m%d)
find . -type f ! -name CHECKSUMS.txt -exec sha256sum {} \; > CHECKSUMS.txt
cd ..
tar czf bundle-shws-$(date +%Y%m%d).tar.gz bundle-shws-$(date +%Y%m%d)/
sha256sum bundle-shws-$(date +%Y%m%d).tar.gz > bundle-shws-$(date +%Y%m%d).tar.gz.sha256
```

---

## 5. Validation (trên build station, trước khi chuyển)

```bash
# Bundle giải nén thử + verify checksum nội bộ
mkdir /tmp/verify && tar xzf bundle-shws-*.tar.gz -C /tmp/verify
cd /tmp/verify/bundle-shws-* && sha256sum -c CHECKSUMS.txt   # mọi dòng OK

# Mỗi tar.gz image > 1 KB (không phải build lỗi)
find . -name "*.tar.gz" -size -1k -print   # phải KHÔNG in ra gì
```

**Khuyến nghị:** Cài thử toàn bộ bundle trên 1 VM staging RHEL 9.6 minimal (clone server target) trước khi đưa vào bank — đây là cách phát hiện thiếu dependency sớm.

---

## 6. Transfer vào bank

- USB đã được security quét, hoặc SFTP qua jump host được phê duyệt
- Đặt tại `shws-build` → server target: `/opt/shws-bundle/`
- Verify lại checksum **trên server target** (xem [`00-prerequisites.md`](./00-prerequisites.md) §7)

---

## 7. Rollback / phiên bản

- Giữ tối thiểu **2 bundle gần nhất** trên build station để rollback image SHWS.
- Rollback app: trên server chạy base compose không override (`docker compose -f docker-compose.yml up -d`) → quay về image trước (xem [`prod/04-app-node-docker.md`](./prod/04-app-node-docker.md) §Rollback).

---

## 8. Troubleshooting

| Triệu chứng                                | Nguyên nhân                         | Xử lý                                                         |
| ------------------------------------------ | ----------------------------------- | ------------------------------------------------------------- |
| `dnf install ./*.rpm` thiếu dep trong bank | `--alldeps` chưa kéo đủ / sai minor | Build lại trên VM đúng RHEL minor, dùng `--resolve --alldeps` |
| `docker load` lỗi "no such image"          | tar.gz hỏng khi copy                | Verify sha256, copy lại                                       |
| build-shb-images.sh: buildx not found      | Docker Desktop chưa bật buildx      | `docker buildx create --use`                                  |
| Image quá nhỏ (<1KB)                       | build fail giữa chừng               | Xem log build, build lại image lỗi                            |

---

## 9. Câu hỏi mở

- [ ] Chốt RHEL minor để build station khớp
- [ ] Branch/tag nguồn build image SHWS chính thức cho PROD
- [ ] Có cần monitoring-stack trong bundle GĐ1 hay colocate sau?

---

## 10. Liên kết

- Prerequisites: [`00-prerequisites.md`](./00-prerequisites.md)
- Cài OS DATA node: [`prod/01-data-node-os.md`](./prod/01-data-node-os.md)
- Cài Docker app node: [`prod/04-app-node-docker.md`](./prod/04-app-node-docker.md)
- ADR air-gap bundle (planned): `../05-change-log/decisions/` (ADR-005)
