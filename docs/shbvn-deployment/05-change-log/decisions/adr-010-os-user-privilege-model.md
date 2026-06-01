# ADR-010 — Mô hình OS user/privilege (3-user, no-root-login)

**Status:** 🟡 Proposed
**Date:** 2026-05-29
**Owner:** duonglx
**Liên quan:** [05-security-design.md](../../01-system-design/05-security-design.md) §7, ADR-007 (app stack Docker)

---

## Bối cảnh

Triển khai SHWS trên RHEL 9.6 (PROD 2-node + DR + UAT). Yêu cầu vận hành ngân hàng: least-privilege, audit đầy đủ, **không vận hành routine bằng root**. Bản thiết kế gốc dùng mô hình `app`/`sre`/`dba` + secret/cron owner `root` — không khớp yêu cầu và thiếu vai trò giám sát read-only.

Ràng buộc thực tế: nhiều daemon **bắt buộc** chạy root (`dockerd`, `multipathd`, `systemd`, `auditd`, `rsyslog`; `postgresql` do systemd start rồi drop xuống `postgres`).

## Quyết định

Áp dụng **no-root-login thực dụng** với **3 OS user**:

| User       | Vai trò              | Node       | Groups                   | Sudo (NOPASSWD giới hạn)                                           |
| ---------- | -------------------- | ---------- | ------------------------ | ------------------------------------------------------------------ |
| `shbvn`    | Admin app + Docker   | app + data | `docker`                 | `docker compose *`, `systemctl * docker`, `journalctl -u docker *` |
| `postgres` | PG service + DBA ops | data       | —                        | `systemctl * postgresql-15`, `pgbackrest *`, `pg_ctl *`            |
| `mon`      | Giám sát read-only   | tất cả     | `adm`, `systemd-journal` | (không)                                                            |

- `PermitRootLogin no`, `AllowUsers shbvn postgres mon`, key-only qua Hiware PAM.
- Secret/cron owner = `shbvn` (Docker đọc) hoặc `postgres` (PG/backup) — **không owner root** do người tạo.
- `mon` đọc log qua `journalctl` (Docker `log-driver=journald`) + `/var/log` (group `adm`) + `systemctl status`; **không** docker group, **không** sudo.
- OS user PostgreSQL giữ tên chuẩn `postgres` (PGDG RPM hardcode); yêu cầu "postgre" = `postgres`.

## Lý do

- **Least-privilege + audit:** mỗi vai trò có quyền tối thiểu; mọi sudo + session audit qua auditd + Hiware recording (Thông tư 09 access control).
- **Khớp thực tế vận hành:** 1 admin app/docker, 1 DBA/PG, 1 giám sát — đúng nhân sự dự kiến, không over-engineer.
- **Daemon-root là ngoại lệ OS-managed:** không thể loại bỏ ở GĐ1 air-gap RHEL; được ghi rõ là chấp nhận được, không phải thao tác người dùng.

## Hệ quả

**Tích cực:**

- Không còn login root; bề mặt tấn công + rủi ro thao tác nhầm giảm.
- Phân vai rõ → audit + truy vết trách nhiệm dễ.

**Cần lưu ý:**

- **`docker` group ≈ root-equivalent:** `shbvn` qua Docker socket có quyền tương đương root. Mitigation: Hiware session recording + auditd; chỉ duy nhất `shbvn` trong group; **GĐ2 cân nhắc rootless Docker / sudo-scoped docker** (cần PoC RHEL air-gap).
- Propagate xuống `02-installation`: script cài đặt phải chạy bằng `shbvn`/`postgres` qua sudo, không root.

## Phương án đã cân nhắc & loại

- **Giữ mô hình `app`/`sre`/`dba` + secret owner root:** trái yêu cầu no-root, thiếu vai trò giám sát. → Loại.
- **Rootless Docker toàn diện ngay GĐ1:** phức tạp lớn (port <1024, storage driver, SAN multipath, hiệu năng) trên RHEL air-gap. → Hoãn GĐ2 (cần PoC).
- **`mon` vào `docker` group để `docker logs`:** trao quyền ≈ root cho user read-only — mâu thuẫn mục tiêu. → Loại (dùng journald thay thế).
