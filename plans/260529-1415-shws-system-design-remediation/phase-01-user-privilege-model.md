---
phase: 1
title: User-Privilege-Model
status: completed
priority: P1
effort: 1-1.5d
dependencies: []
---

# Phase 1: User-Privilege-Model

## Overview

Viết lại mô hình OS user/quyền cho toàn hệ SHWS theo 3 user `shbvn` / `postgres` / `mon`, **no-root-login thực dụng**. Đây là phase nền — các phase sau tham chiếu ma trận này. Trọng tâm sửa `05-security-design.md` (§4.2, §6.3, §7) + tạo bảng canonical, rồi đồng bộ các lệnh/owner ở `03 §5.3`, `06 §9.2/§9.3`.

## Key Insights (đã chốt với owner)

- `shbvn`: admin app + Docker trên **cả 2 node** (app + data: minio, exporters). Vào group `docker` (≈root — phải ghi rõ rủi ro + bù bằng Hiware session recording/audit).
- `postgres`: service account PostgreSQL **kiêm** DBA ops qua sudo giới hạn (`systemctl * postgresql-15`, `pgbackrest *`). Không SSH bằng password.
- `mon`: read-only mọi node — `journalctl` (group `systemd-journal`), `/var/log` (group `adm`), `systemctl status` (không cần quyền). **Không** docker group, **không** sudo.
- "No-root": `PermitRootLogin no` (đã có) + không vận hành routine bằng root. Daemon OS vẫn root (chấp nhận, ghi rõ lý do).
- OS user PG = **`postgres`** (PGDG hardcode); "postgre" trong yêu cầu hiểu là `postgres`.

## Requirements

- **Functional:** mọi thao tác cài đặt/vận hành/giám sát map được vào đúng 1 trong 3 user; không còn `app`/`sre`/`dba`; không còn owner `root` cho secret/cron do người tạo.
- **Non-functional:** tương thích Hiware PAM (§7); audit đầy đủ (auditd sudo, journald); tuân Thông tư 09 access control.

## Architecture — Ma trận user canonical (nội dung mới cho 05 §7)

| User       | Loại          | Node           | Groups                   | Sudo (NOPASSWD, giới hạn)                                                                 | SSH                    | Mục đích                      |
| ---------- | ------------- | -------------- | ------------------------ | ----------------------------------------------------------------------------------------- | ---------------------- | ----------------------------- |
| `shbvn`    | human/admin   | app + data     | `docker`                 | `/usr/bin/docker compose *`, `/bin/systemctl * docker`, `/usr/bin/journalctl -u docker *` | Hiware key             | App + Docker ops cả 2 node    |
| `postgres` | service + DBA | data (PROD/DR) | —                        | `/bin/systemctl * postgresql-15`, `/usr/bin/pgbackrest *`, `/usr/bin/pg_ctl *`            | Hiware key (DBA)       | PG service + backup + DBA ops |
| `mon`      | read-only     | tất cả         | `adm`, `systemd-journal` | (không)                                                                                   | Hiware key             | Đọc log + `systemctl status`  |
| `root`     | —             | —              | —                        | —                                                                                         | **PermitRootLogin no** | Chỉ daemon OS dùng nội bộ     |

**Ownership chuẩn (thay §4.2):**

| Path                                              | Owner:Group                                     | Mode                     | Ghi chú                                                                  |
| ------------------------------------------------- | ----------------------------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `/opt/shws-secrets/app.env`                       | `shbvn:shbvn`                                   | 0600                     | APP node — Docker đọc qua env_file                                       |
| `/opt/shws-secrets/data.env` (minio…)             | `shbvn:shbvn`                                   | 0600                     | DATA node — minio container                                              |
| `/opt/shws-secrets/postgres.env`                  | `postgres:postgres`                             | 0600                     | plane_app pw cho DBA tham chiếu                                          |
| `/opt/shws-secrets/monitoring.env`                | `postgres:postgres`                             | 0640 (group `postgres`)? | exporter chạy bởi shbvn → cân nhắc `shbvn:shbvn` 0600 (resolve khi viết) |
| `/etc/pgbackrest/pgbackrest.conf.d/cipher.conf`   | `postgres:postgres`                             | 0600                     | **bỏ root** (đồng bộ Phase 4 B7)                                         |
| `/u01/pgsql/15/data/server.key`, `replicator.key` | `postgres:postgres`                             | 0600                     | PG cert                                                                  |
| `/etc/pki/tls/private/*.key` (Nginx)              | `shbvn:shbvn`                                   | 0600                     | proxy container đọc qua bind mount                                       |
| container `user:` directive                       | UID/GID = `shbvn` (vd 1000:1000 nếu shbvn=1000) | —                        | nhất quán quyền file bind-mount                                          |

**Logging cho `mon` (thay cơ chế hiện tại):**

- `daemon.json` thêm `"log-driver": "journald"` (thay/ bổ sung json-file) → log container vào journald.
- `mon` đọc: `journalctl -u docker`, `journalctl CONTAINER_NAME=plane-api`, `systemctl status <svc>`, `/var/log/postgresql/*` (group `adm` hoặc ACL read).
- Nếu PG log file 0600 `postgres`: set group-read cho `adm` hoặc dùng `setfacl -R -m g:adm:rX /var/log/postgresql`.

## Related Code Files

- **Modify:** `docs/shbvn-deployment/01-system-design/05-security-design.md`
  - §4.2 file storage: thay toàn bộ owner `root` → bảng ownership trên.
  - §6.3 critical events: giữ "Sudo execution" (auditd) — bổ sung sudo của shbvn/postgres.
  - §7 SSH/account: thay `AllowUsers app sre dba` → `AllowUsers shbvn postgres mon`; viết lại block account + sudoers theo ma trận; thêm note `docker` group ≈ root + mitigation; thêm cơ chế journald cho mon.
  - §2.4 service accounts + §11 risk "Container chạy as root": đồng bộ tên owner.
- **Modify:** `06-database-design.md` §9.3 (cron `shws-backup-to-nas.sh` owner `root` → `shbvn` hoặc `postgres`; quyết định: rsync NAS cần mount → `shbvn`), §9.2 (cipher.conf owner `root:postgres` → `postgres:postgres`).
- **Modify:** `03-architecture-dr-site.md` §5.3 failover commands — gán rõ user: `postgres` chạy `pg_ctl promote`/`psql`; `shbvn` chạy `docker compose up`. Bỏ `sudo -u postgres` nếu đã login postgres, hoặc giữ nếu login shbvn (làm rõ giả định login user).
- **Modify:** `00-overview.md` §8 (daily checklist "đầu giờ" — ghi rõ `mon` xem status, `shbvn`/`postgres` thao tác).
- **Create (tùy chọn, khuyến nghị):** ADR `05-change-log/decisions/adr-010-os-user-privilege-model.md` (ghi quyết định 3-user no-root-login). → có thể gộp vào Phase 5.

## Implementation Steps

1. Soạn bảng ma trận user + ownership + sudoers canonical (dùng nội dung Architecture ở trên) — đặt làm §7 mới của `05-security-design.md`.
2. Viết lại `05 §4.2` theo bảng ownership (bỏ mọi owner `root` do người tạo).
3. Thêm tiểu mục "Docker group = root-equivalent" + mitigation (Hiware recording, audit, chỉ shbvn, cân nhắc rootless GĐ2).
4. Thêm tiểu mục "mon read-only logging via journald" + lệnh mẫu + setfacl PG log.
5. Đồng bộ `06 §9.2` (cipher owner), `06 §9.3` (cron owner), `03 §5.3` (gán user mỗi lệnh), `00 §8` (ai làm gì).
6. Cập nhật `05 §2.4`, `05 §11` cho khớp tên user/owner.
7. Self-check: grep còn `\b(app|sre|dba)\b` như account name, `owner root`, `root:postgres` trong 11 file → 0 (trừ giải thích daemon OS).

## Todo List

- [ ] §7 ma trận user + sudoers viết lại
- [ ] §4.2 ownership bỏ root
- [ ] Note docker-group risk
- [ ] mon journald + setfacl
- [ ] Đồng bộ 06 §9.2/§9.3, 03 §5.3, 00 §8
- [ ] Đồng bộ 05 §2.4/§11
- [ ] grep verify 0 occurrence app/sre/dba/owner-root

## Success Criteria

- [ ] Chỉ còn 3 user `shbvn`/`postgres`/`mon` trong toàn bộ 01-system-design; không account `app`/`sre`/`dba`.
- [ ] Không secret/cron nào owner `root` (do người tạo); daemon-OS-root được giải thích rõ là ngoại lệ chấp nhận.
- [ ] `mon` có đường đọc log container + PG read-only không cần docker group/sudo.
- [ ] Lệnh failover `03 §5.3` gán đúng user thực thi.

## Risk Assessment

- **Docker group ≈ root:** shbvn về bản chất có quyền root qua docker socket → phải ghi rõ + mitigation; nếu Security Officer không chấp nhận → mở rộng sang sudo-scoped docker hoặc rootless (đẩy GĐ2).
- **PG log read cho mon:** nếu policy cấm setfacl/group-read trên `/var/log/postgresql` → fallback: mon chỉ đọc qua SIEM/Grafana (option C đã loại nhưng giữ làm dự phòng).

## Security Considerations

- Tuân Thông tư 09: access control least-privilege, audit sudo (auditd) + session (Hiware).
- mon tuyệt đối không có quyền ghi/đổi state — chỉ read.

## Next Steps

- Phase 4 sẽ tiếp tục đồng bộ owner cipher/secret path (B7) khớp bảng ownership này.
- Cân nhắc ADR-010 (Phase 5) chốt quyết định mô hình user.
