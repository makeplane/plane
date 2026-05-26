# Deployment History

**Status:** 🟡 Draft (template — append-only)
**Owner:** duonglx · **Audience:** tất cả vai trò

> **Append-only.** Mỗi lần deploy (app version, PG upgrade, config change lớn) ghi 1 dòng + chi tiết. KHÔNG sửa entry cũ. Nguồn quy trình deploy: [`../03-operations/runbooks/app-deploy-new-version.md`](../03-operations/runbooks/app-deploy-new-version.md), [`../03-operations/runbooks/postgres-minor-upgrade.md`](../03-operations/runbooks/postgres-minor-upgrade.md).

---

## 1. Bảng tổng hợp

| #   | Ngày | Môi trường | Loại | Version (từ → đến) | Người thực hiện | Kết quả | Rollback? |
| --- | ---- | ---------- | ---- | ------------------ | --------------- | ------- | --------- |
| —   | —    | —          | —    | —                  | —               | —       | —         |

> Loại: `app-deploy` · `pg-minor` · `pg-major` · `os-patch` · `config` · `cert-rotate` · `infra`.
> Môi trường: `UAT` · `PROD` · `DR`.
> Kết quả: ✅ success · ⚠️ success-with-issues · ❌ rolled-back.

---

## 2. Chi tiết từng deploy

> Copy block dưới cho mỗi lần deploy. Mới nhất lên đầu.

### DEPLOY-NNN — <tiêu đề ngắn>

- **Ngày/giờ:** YYYY-MM-DD HH:MM ICT (bắt đầu → kết thúc)
- **Môi trường:** PROD / DR / UAT
- **Loại:** app-deploy / pg-minor / …
- **Version:** `<from>` → `<to>` (commit/tag nếu app)
- **Người thực hiện:** <tên> · **Approve:** <tên/ticket>
- **Window:** maintenance window / emergency
- **Backup trước deploy:** ✅ (`pgbackrest info` timestamp / `pg_dump --schema-only`)
- **Migration DB:** có/không (số migration, thời gian)
- **Các bước:** (tóm tắt, link runbook đã theo)
- **Verification:** health 200 ✅ / smoke test ✅ / metric ổn ✅
- **Kết quả:** ✅ / ⚠️ / ❌
- **Issue phát sinh:** (nếu có) → link [`incident-log.md`](./incident-log.md) nếu thành sự cố
- **Rollback:** không / có (lý do + cách)
- **Ghi chú:** downtime thực tế, điều cần cải thiện lần sau

---

## 3. Nguyên tắc ghi

- **Append-only** — không xóa/sửa entry đã ghi (chỉ thêm ghi chú "đính chính" bên dưới nếu sai).
- Ghi **ngay sau** mỗi deploy (không để dồn).
- Mọi deploy PROD/DR phải có dòng ở §1 + block §2.
- UAT deploy: ghi nếu là milestone (release candidate UAT).
- Liên kết: deploy fail → tạo entry [`incident-log.md`](./incident-log.md).

---

## 4. Liên kết

- App deploy SOP: [`../03-operations/runbooks/app-deploy-new-version.md`](../03-operations/runbooks/app-deploy-new-version.md)
- PG minor upgrade: [`../03-operations/runbooks/postgres-minor-upgrade.md`](../03-operations/runbooks/postgres-minor-upgrade.md)
- PG major upgrade: [`../03-operations/runbooks/postgres-major-upgrade.md`](../03-operations/runbooks/postgres-major-upgrade.md)
- Incident log: [`incident-log.md`](./incident-log.md)
- ADR: [`decisions/`](./decisions/)
