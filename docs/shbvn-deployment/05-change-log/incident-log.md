# Incident Log

**Status:** 🟡 Draft (template — append-only)
**Owner:** duonglx · **Audience:** tất cả vai trò + Compliance/Audit

> **Append-only.** Ghi mọi sự cố **P1/P2** (P3/P4 dùng ticket). RCA **blameless**. Quy trình: [`../03-operations/incident-response.md`](../03-operations/incident-response.md). Tuân thủ Thông tư 09/2020/TT-NHNN — lưu giữ cho audit.

---

## 1. Bảng tổng hợp

| #   | Ngày | Sev | Tiêu đề | Tác động | Downtime | RTO/RPO thực | Root cause (ngắn) | Status |
| --- | ---- | --- | ------- | -------- | -------- | ------------ | ----------------- | ------ |
| —   | —    | —   | —       | —        | —        | —            | —                 | —      |

> Status: 🔴 open · 🟡 mitigated (workaround) · 🟢 resolved · ✅ closed (RCA + action done).

---

## 2. Chi tiết từng sự cố

> Copy block dưới cho mỗi sự cố. Mới nhất lên đầu.

### INC-NNN — <tiêu đề>

**Severity:** P1/P2 · **Status:** 🔴/🟡/🟢/✅
**Phát hiện:** YYYY-MM-DD HH:MM ICT (qua: alert / user / daily-check)
**Incident Commander:** <tên> · **Tham gia:** DBA/SRE/ICTP/Security

#### Tác động

- Dịch vụ ảnh hưởng: …
- Số user / phạm vi: …
- Mất dữ liệu: có/không (RPO thực tế nếu có)

#### Timeline

| Thời điểm | Sự kiện / hành động      |
| --------- | ------------------------ |
| HH:MM     | Detect — …               |
| HH:MM     | Triage — sev=Px, IC=…    |
| HH:MM     | Mitigate — …             |
| HH:MM     | Resolve — …              |
| HH:MM     | Recover — verify ổn định |

**Downtime:** … phút · **RTO thực tế:** … · **RPO thực tế:** …

#### Root cause (5 whys)

1. Vì sao? …
2. Vì sao? …
   … → **Căn nguyên:** …

#### Khắc phục

- **Tạm thời (mitigate):** …
- **Căn nguyên (fix):** … (link deploy/runbook)

#### Action items (phòng tái diễn)

| Action | Owner | Hạn        | Status |
| ------ | ----- | ---------- | ------ |
| …      | …     | YYYY-MM-DD | ☐      |

#### Bài học

- … (cải tiến monitoring / runbook / quy trình)

---

## 3. Nguyên tắc

- **Append-only**, không xóa/sửa nội dung sự cố đã ghi.
- P1/P2 **bắt buộc** RCA trong 48h.
- **Blameless** — tập trung hệ thống & quy trình.
- Sự cố bảo mật → đồng thời báo Security Officer + Compliance (xem [`../03-operations/incident-response.md`](../03-operations/incident-response.md) §5).
- Action items phải có owner + hạn; theo dõi tới khi đóng.

---

## 4. Liên kết

- Incident response SOP: [`../03-operations/incident-response.md`](../03-operations/incident-response.md)
- Severity matrix: [`../03-operations/README.md`](../03-operations/README.md)
- Deployment history (deploy gây sự cố): [`deployment-history.md`](./deployment-history.md)
- Security design (breach handling): [`../01-system-design/05-security-design.md`](../01-system-design/05-security-design.md) §10
