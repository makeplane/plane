# Seed Data — Department & Staff (Shinhan Bank VN)

**Date**: 2026-02-18
**Status**: Completed
**Workspace**: `shinhan-bank-vn`

## Mô hình dữ liệu

```
Workspace: "Shinhan Bank Vietnam"
│
│  ═══ DEPARTMENT TREE (20 departments, 3 levels) ═══
│
│  RBG (Khối Bán lẻ) — GĐ: Nguyễn An
│    ├── RBG-CR (Phòng Tín dụng) — TP: Vũ Thảo
│    │     ├── RBG-CR-AP (Team Thẩm định)   — TL: Đinh Cường  → [Thẩm định] Nội bộ
│    │     └── RBG-CR-CO (Team Thu hồi)     — TL: Trịnh Nga   → [Thu hồi nợ] Nội bộ
│    └── RBG-TX (Phòng Giao dịch) — TP: Đỗ Minh
│          ├── RBG-TX-01 (Team GD1)         — TL: Phan Phúc   → [Giao dịch 1] Nội bộ
│          └── RBG-TX-02 (Team GD2)         — TL: Dương Yến   → [Giao dịch 2] Nội bộ
│
│  WBG (Khối DN) — GĐ: Trần Bình
│    └── WBG-LN (Phòng Cho vay DN) — TP: Hoàng Tuấn
│          └── WBG-LN-SM (Team SME)         — TL: Tô Quang    → [SME Lending] Nội bộ
│
│  ITG (Khối CNTT) — GĐ: Lê Hùng
│    ├── ITG-DEV (Phòng Phát triển) — TP: Ngô Dũng
│    │     ├── ITG-DEV-BE (Team Backend)    — TL: Mai Đức     → [Backend] Nội bộ
│    │     └── ITG-DEV-FE (Team Frontend)   — TL: Lương Trang → [Frontend] Nội bộ
│    └── ITG-OPS (Phòng Vận hành) — TP: Bùi Linh
│          ├── ITG-OPS-IF (Team Infra)      — TL: Đặng Sơn    → [Infra] Nội bộ
│          └── ITG-OPS-SC (Team Security)   — TL: Cao Thanh   → [Security] Nội bộ
│
│  HRG (Khối Nhân sự) — GĐ: Phạm Lan
│    └── HRG-RC (Phòng Tuyển dụng) — TP: Lý Hà
│          └── HRG-RC-ON (Team Onboarding)  — TL: Hồ Mai      → [Onboarding] Nội bộ
│
│  ═══ CROSS-TEAM PROJECTS ═══
│
│  🚀 Core Banking Migration (CBM)        — 10 members liên phòng
│  🚀 Digital Transformation 2026 (DT26)  — 5 members (GĐ + leads)
│  📊 Khối CNTT Overview (ITOV)           — 7 members (GĐ + TP + TL)
```

## Tổng quan seed data

| Entity      | Count | Chi tiết                                               |
| ----------- | ----- | ------------------------------------------------------ |
| Departments | 20    | 4 Khối (L1) + 6 Phòng (L2) + 10 Team (L3)              |
| Staff       | 56    | 4 GĐ + 6 TP + 10 TL + 34 NV + 1 probation + 1 resigned |
| Projects    | 13    | 10 team-linked (SECRET) + 3 cross-team                 |
| Issues      | 57    | Tasks thực tế tiếng Việt, đa dạng priority             |
| Memberships | 65    | Auto-assign theo hierarchy                             |

## Auto-membership logic

### Nguyên tắc

- **Staff → Team project**: NV tự động join project linked của department mình
- **Manager → Children projects**: Trưởng phòng/GĐ Khối auto-join TẤT CẢ project con
- **Cross-team**: Thành viên được chỉ định thủ công, không bị ảnh hưởng khi chuyển phòng

### Ví dụ cụ thể

**Nguyễn Dương (18506320) — Sr. Dev, Team Backend:**

```
✅ [Backend] Nội bộ         (auto — department link)
✅ Core Banking Migration   (cross-team — chỉ định)
❌ [Frontend], [Infra]...   (không thấy)
```

**Ngô Dũng (10000013) — TP Phòng Phát triển:**

```
✅ [Backend] Nội bộ         (auto — manager of parent dept)
✅ [Frontend] Nội bộ        (auto — manager of parent dept)
❌ [Infra], [Security]      (khác phòng)
```

**Lê Hùng (10000003) — GĐ Khối CNTT:**

```
✅ [Backend] Nội bộ         (auto — GĐ khối → all children)
✅ [Frontend] Nội bộ        (auto)
✅ [Infra] Nội bộ           (auto)
✅ [Security] Nội bộ        (auto)
✅ Core Banking Migration   (cross-team)
✅ Digital Transformation   (cross-team)
✅ Khối CNTT Overview       (cross-team)
```

## Staff theo phòng ban

### ITG-DEV-BE — Team Backend (8 người)

| Mã NV    | Họ tên       | Chức vụ          | Grade  | Status        |
| -------- | ------------ | ---------------- | ------ | ------------- |
| 10000025 | Mai Đức      | Team Leader      | Senior | Active        |
| 18506320 | Nguyễn Dương | Senior Developer | Senior | Active        |
| 18506321 | Trần Phong   | Developer        | Junior | Active        |
| 18506322 | Lê Hải       | Developer        | Mid    | Active        |
| 18506323 | Phạm Vy      | QA Engineer      | Mid    | Active        |
| 18506324 | Vũ Long      | DevOps Engineer  | Senior | Active        |
| 18506420 | Lương Khánh  | Intern Developer | Intern | **Probation** |

### ITG-DEV-FE — Team Frontend (5 người)

| Mã NV    | Họ tên      | Chức vụ             | Grade  | Status |
| -------- | ----------- | ------------------- | ------ | ------ |
| 10000026 | Lương Trang | Team Leader         | Senior | Active |
| 18506330 | Hoàng Linh  | Senior Frontend Dev | Senior | Active |
| 18506331 | Ngô Hà      | Frontend Developer  | Mid    | Active |
| 18506332 | Bùi Khoa    | UI/UX Developer     | Mid    | Active |
| 18506333 | Đỗ Tùng     | Frontend Developer  | Junior | Active |

### RBG-CR-AP — Team Thẩm định (7 người)

| Mã NV    | Họ tên     | Chức vụ     | Grade  | Status       |
| -------- | ---------- | ----------- | ------ | ------------ |
| 10000020 | Đinh Cường | Team Leader | Senior | Active       |
| 18506360 | Mai Thủy   | Chuyên viên | Mid    | Active       |
| 18506361 | Lương Bảo  | Chuyên viên | Mid    | Active       |
| 18506362 | Đặng Hiền  | Nhân viên   | Junior | Active       |
| 18506363 | Cao Khải   | Nhân viên   | Junior | Active       |
| 18506364 | Hồ Ngọc    | Chuyên viên | Senior | Active       |
| 18506421 | Đặng Trúc  | Nhân viên   | Junior | **Resigned** |

## Issues mẫu theo project

| Project                | Issues | Ví dụ                                          |
| ---------------------- | ------ | ---------------------------------------------- |
| [Backend] Nội bộ       | 8      | Fix bug timeout DB, API thanh toán, caching... |
| [Frontend] Nội bộ      | 6      | Redesign dashboard, dark mode, bundle size...  |
| [Infra] Nội bộ         | 5      | K8s upgrade, disaster recovery, SSL...         |
| [Security] Nội bộ      | 4      | Pentest mobile, firewall, SIEM...              |
| [Thẩm định] Nội bộ     | 5      | Hồ sơ vay 500tr, BĐS đảm bảo...                |
| Core Banking Migration | 5      | Data migration T24, UAT, parallel run...       |

## Cách chạy

```bash
# Seed vào workspace cụ thể
docker compose exec api python manage.py seed_department_staff \
  --workspace shinhan-bank-vn --email duong@shinhan.com

# Clean + re-seed
docker compose exec api python manage.py seed_department_staff \
  --workspace shinhan-bank-vn --email duong@shinhan.com --clean

# Auto-detect workspace + admin
docker compose exec api python manage.py seed_department_staff
```

## Files

| File                                                             | Mô tả                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------- |
| `apps/api/plane/bgtasks/seed_department_staff_data.py`           | Data definitions (departments, staff, projects, issues) |
| `apps/api/plane/db/management/commands/seed_department_staff.py` | Django management command                               |

## Login test

- **Admin**: `duong@shinhan.com` / `Shinhan@1`
- **Nhân viên**: `sh{mã NV}@swing.shinhan.com` / `Shinhan@2026`
  - Ví dụ: `sh18506320@swing.shinhan.com` = Nguyễn Dương (Backend)
