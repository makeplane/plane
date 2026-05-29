---
phase: 4
title: Database-Replication-Backup
status: completed
priority: P1
effort: 1d
dependencies:
  - 1
---

# Phase 4: Database-Replication-Backup

## Overview

Sửa các mâu thuẫn/lỗ hổng tầng DB trong `06-database-design.md` (chính) + `03-architecture-dr-site.md`, `07`: cơ chế seed WAL repo DR (lỗ hổng resilience), pg_hba ≠ grant, role naming, vị trí cipher/secret path, hot_standby, ngưỡng lag, EMC đè .env DR.

## Key Insights

- **B4 (🔴) DR-local WAL repo seeding chưa giải quyết** (`06 §10.2` open Q): standby `restore_command = pgbackrest --stanza=shws-prod archive-get` đọc repo **DR-local**, nhưng _cách WAL vào repo DR-local mà KHÔNG ship qua WAN_ chưa định nghĩa. Cộng `max_slot_wal_keep_size=4GB` (auto-drop slot khi DR down lâu) ⇒ nếu streaming đứt + slot drop, **DR mất nguồn catch-up** (repo local rỗng WAL mới). Đây là lỗ hổng thật, phải chốt cơ chế.
- **B6 pg_hba ≠ grant:** `06 §5.3` chỉ cho `monitoring` connect DB `postgres`; `06 §7.3` GRANT CONNECT plane → exporter không vào `plane`. Role `backup` (stanza `pg1-user=backup`) **không có dòng pg_hba**; `05 §2.4` gọi `pgbackrest` (lệch tên `backup`). Dòng `local replication replicator peer` vô dụng (không có OS user `replicator`).
- **B7 cipher/secret path 3 chỗ:** `06 §9.2` `/etc/pgbackrest/.../cipher.conf`; `06 §9.5` `/opt/shws-secrets/pgbackrest-cipher.txt`; `05 §4.1` "pgBackRest config". Secret path lệch: `/opt/shws/deployment` vs `/opt/shws-deployment` vs `plane.env` vs `.env`.
- **B10 hot_standby:** `03 §4.1` set `off` trên primary; `01 §4.2`+`06 §5.1` để `on`. Vô hại lúc chạy (primary bỏ qua) nhưng mâu thuẫn tài liệu — chọn 1.
- **B11 EMC đè .env DR:** `03 §1` EMC sync "OS/config app node"; nếu gồm `/opt/shws-secrets/*.env` (trỏ `shwsdb1p`) sẽ đè .env DR (phải trỏ `shwsdb1dr`).
- **B12 lag thresholds:** `03 §4.3` byte-lag alert > 64 MB; `06 §16`+`08 §3.2` warn > 256 MB.
- **B-minor:** stanza name `shws-prod` dùng chung cho repo DR độc lập (gây nhầm); RPO "WAL archive interval" (`00 §6`) trong khi RPO ~30s đến từ streaming.

## Requirements

- DR có cơ chế catch-up rõ ràng kể cả khi slot bị drop, không ship pgBackRest qua WAN.
- pg_hba + GRANT + role naming nhất quán, exporter & backup connect được DB cần.
- Mỗi secret có **đúng 1** vị trí canonical + owner khớp Phase 1.
- Ngưỡng lag thống nhất 1 bộ số toàn docs.

## Architecture — quyết định B4 (đề xuất, owner xác nhận)

Hai phương án seed WAL cho repo DR-local (chốt 1):

- **PA-1 (khuyến nghị): DR pgBackRest backup-from-standby + archive từ standby.** DR standby bật `archive_mode = always` → archive-push WAL vào repo DR-local; pgBackRest stanza DR (`shws-dr`) full/diff định kỳ từ standby. Khi streaming hở, `archive-get` đọc WAL DR-local (đã archive từ chính standby). Không phụ thuộc WAN, không ship repo.
  - Lưu ý: `archive_mode = always` (PG12+) cho phép standby archive; cần WAL liên tục được streaming/replay đến standby trước khi archive — nếu slot drop và streaming đứt hoàn toàn thì vẫn cần re-`pg_basebackup`. → ghi rõ "slot drop = re-seed bằng basebackup là chấp nhận được cho GĐ1, RTO vẫn < 1h".
- **PA-2:** Seed repo DR từ NAS offsite nội site DR (rsync repo PROD→NAS→DR-local) — phức tạp hơn, vẫn qua WAN gián tiếp. Ít ưu tiên.

Stanza naming: DR dùng stanza **`shws-dr`** (repo DR-local) thay vì tái dùng `shws-prod` → tránh nhầm; `restore_command` trên standby trỏ `--stanza=shws-dr`.

## Related Code Files

- **Modify:** `06-database-design.md`
  - §10.2: thay open Q bằng cơ chế PA-1 (archive_mode=always trên standby + stanza `shws-dr`); làm rõ "slot drop → re-basebackup, RTO<1h OK".
  - §5.3 pg_hba: (a) sửa monitoring DATABASE `postgres`→`all` (hoặc thêm dòng cho `plane`) để exporter scrape plane; (b) thêm dòng cho role `backup` (local peer hoặc host 127.0.0.1); (c) bỏ dòng `local replication replicator peer` thừa.
  - §7.2: thống nhất tên role backup (chọn `backup` hoặc `pgbackrest`, dùng nhất quán với `05 §2.4` + stanza `pg1-user`).
  - §9.2 + §9.5: chốt **1** vị trí cipher = `/etc/pgbackrest/pgbackrest.conf.d/cipher.conf` (owner `postgres:postgres` 0600 — khớp Phase 1); bỏ/đổi `/opt/shws-secrets/pgbackrest-cipher.txt` thành cùng path; cập nhật DB-R-03 KeePass note.
  - §6.2: thống nhất tên file env (`app.env`/`plane.env` — chọn khớp Phase 1 `/opt/shws-secrets/app.env`) + path symlink.
  - §16: ngưỡng lag đồng bộ (256 MB warn / 1 GB crit); cân nhắc verify-full cho app (B-improve, optional).
- **Modify:** `03-architecture-dr-site.md`
  - §4.1: bỏ `hot_standby = off` trên primary → để `on` (đồng bộ 01/06, đơn giản mirror config) HOẶC ghi rõ "primary bỏ qua, set on để dùng chung file".
  - §4.3: byte-lag alert 64 MB → 256 MB (đồng bộ 06/08); hoặc thống nhất tất cả về 64 MB (chọn 1 bộ — đề xuất 256 MB theo 06/08 vì là nguồn chi tiết).
  - §1 + §5.2: thêm lưu ý EMC replication **loại trừ** `/opt/shws-secrets/*.env` DR-specific (hoặc post-failover script ghi đè .env trỏ shwsdb1dr).
  - §3.2: thêm cron backup DR cụ thể (hiện chỉ "khuyến nghị") khớp stanza `shws-dr`.
- **Modify:** `07-storage-design.md` §8 + `06 §9.2`: nếu DR stanza đổi tên, đồng bộ ghi chú repo.
- **Modify:** `05-security-design.md` §2.4 + §4.1: tên role backup + vị trí cipher khớp 06.
- **Modify:** `00-overview.md` §6: RPO measurement "WAL archive interval" → "streaming replay lag (chính) + WAL archive (fallback)".

## Implementation Steps

1. Chốt PA-1 cho B4; viết lại `06 §10.2` + `03 §3.2`/§4 (archive_mode=always, stanza `shws-dr`, re-basebackup khi slot drop).
2. Sửa pg_hba `06 §5.3` (monitoring→all/plane; thêm backup; bỏ replicator peer thừa).
3. Thống nhất tên role backup toàn bộ (06/05/stanza).
4. Hợp nhất vị trí cipher + secret path về canonical Phase 1; sửa 06 §9.2/§9.5/§6.2, 05 §2.4/§4.1.
5. Sửa hot_standby (03 §4.1) + lag thresholds (03 §4.3) đồng bộ.
6. Thêm note EMC loại trừ .env DR (03 §1/§5).
7. Sửa RPO measurement note (00 §6).
8. Verify: grep `pgbackrest-cipher.txt`, `/opt/shws/deployment`, `hot_standby = off`, `64 MB`/`64MB` → resolve; pg_hba có dòng cho backup + monitoring tới plane.

## Todo List

- [ ] B4 cơ chế DR WAL (archive_mode=always + stanza shws-dr)
- [ ] pg_hba monitoring/backup/replicator
- [ ] Tên role backup nhất quán
- [ ] Cipher + secret path canonical
- [ ] hot_standby + lag thresholds
- [ ] EMC loại trừ .env DR
- [ ] RPO measurement note

## Success Criteria

- [ ] DR có đường catch-up xác định, không ship repo qua WAN; xử lý slot-drop rõ ràng.
- [ ] pg_hba cho phép đúng các role (monitoring→plane, backup) và bỏ dòng thừa.
- [ ] Mỗi secret (cipher, env) có đúng 1 path + owner khớp Phase 1.
- [ ] hot_standby + ngưỡng lag thống nhất toàn docs.

## Risk Assessment

- `archive_mode = always` trên standby tăng I/O archive nhẹ trên DR — chấp nhận (DR ít tải). Nếu DBA phản đối → fallback PA-2 hoặc chấp nhận "slot drop = re-basebackup" thuần (đơn giản nhất, RTO vẫn đạt).
- Đổi stanza DR `shws-dr` cần đồng bộ runbook `03-operations` (chỉ pointer, ghi nhận cho team ops).

## Security Considerations

- Cipher owner `postgres` (không root); KeePass backup giữ nguyên (DB-R-03).
- pg_hba giữ default-deny cuối (`reject`), chỉ thêm dòng tối thiểu.

## Next Steps

- Phase 5 sweep toàn bộ + chốt ADR (gồm DR replication seeding nếu cần ADR riêng).
