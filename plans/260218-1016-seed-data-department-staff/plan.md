# Seed Data — Department & Staff (Shinhan Bank VN)

**Date**: 2026-02-18
**Status**: Completed
**Workspace**: `shinhan-bank-vn`

## Department Hierarchy Levels

Shinhan Bank VN uses a 6-level hierarchical org chart structure. **Levels must be sequential** (child level = parent level + 1, no skipping):

| Level | Type          | Description                                        | Example                        |
| ----- | ------------- | -------------------------------------------------- | ------------------------------ |
| L0    | Workspace     | Shinhan Bank Vietnam — not stored as Department    | Shinhan Bank Vietnam           |
| L1    | Group Biz     | Top-level business groups                          | RBG (Retail Banking Group)     |
| L2    | Division/Unit | Divisions or units within a group                  | RBG-CR (Credit Division)       |
| L3    | Department    | Departments within a division — primary work units | ITG-DEV-BE (Backend Dept)      |
| L4    | Team          | Teams within a department                          | Available for future expansion |
| L5    | Sub-Team      | Sub-teams within a team                            | Available for future expansion |

**Current seed data**: Uses L1, L2, L3 (sequential). L4 Team and L5 Sub-Team available for future expansion.

## Data Model

```
Workspace: "Shinhan Bank Vietnam"
│
│  ═══ DEPARTMENT TREE (20 departments, 3 active levels: L1→L2→L3 sequential) ═══
│
│  RBG (Retail Banking Group) — Head: Nguyen An                    [L1 - Group Biz]
│    ├── RBG-CR (Credit Division) — Head: Vu Thao                  [L2 - Division]
│    │     ├── RBG-CR-AP (Credit Appraisal Dept) — TL: Dinh Cuong  [L3 - Department] → [Credit Appraisal] Internal
│    │     └── RBG-CR-CO (Debt Collection Dept)  — TL: Trinh Nga   [L3 - Department] → [Debt Collection] Internal
│    └── RBG-TX (Transaction Division) — Head: Do Minh             [L2 - Division]
│          ├── RBG-TX-01 (Transaction Dept 1)    — TL: Phan Phuc   [L3 - Department] → [Transaction 1] Internal
│          └── RBG-TX-02 (Transaction Dept 2)    — TL: Duong Yen   [L3 - Department] → [Transaction 2] Internal
│
│  WBG (Wholesale Banking Group) — Head: Tran Binh                 [L1 - Group Biz]
│    └── WBG-LN (Corporate Lending Division) — Head: Hoang Tuan    [L2 - Division]
│          └── WBG-LN-SM (SME Lending Dept)      — TL: To Quang    [L3 - Department] → [SME Lending] Internal
│
│  ITG (IT Group) — Head: Le Hung                                  [L1 - Group Biz]
│    ├── ITG-DEV (Software Development Division) — Head: Ngo Dung   [L2 - Division]
│    │     ├── ITG-DEV-BE (Backend Dept)         — TL: Mai Duc      [L3 - Department] → [Backend] Internal
│    │     └── ITG-DEV-FE (Frontend Dept)        — TL: Luong Trang  [L3 - Department] → [Frontend] Internal
│    └── ITG-OPS (IT Operations Division) — Head: Bui Linh          [L2 - Division]
│          ├── ITG-OPS-IF (Infrastructure Dept)  — TL: Dang Son     [L3 - Department] → [Infrastructure] Internal
│          └── ITG-OPS-SC (Security Dept)        — TL: Cao Thanh    [L3 - Department] → [Security] Internal
│
│  HRG (HR & Training Group) — Head: Pham Lan                      [L1 - Group Biz]
│    └── HRG-RC (Recruitment Division) — Head: Ly Ha                [L2 - Division]
│          └── HRG-RC-ON (Onboarding Dept)       — TL: Ho Mai       [L3 - Department] → [Onboarding] Internal
│
│  ═══ CROSS-TEAM PROJECTS ═══
│
│  Core Banking Migration (CBM)        — 10 members cross-division
│  Digital Transformation 2026 (DT26)  — 5 members (heads + leads)
│  IT Division Overview (ITOV)         — 7 members (head + dept heads + TLs)
```

## Seed Data Overview

| Entity      | Count | Details                                                          |
| ----------- | ----- | ---------------------------------------------------------------- |
| Departments | 20    | 4 Groups (L1) + 6 Divisions (L2) + 10 Departments (L3)           |
| Staff       | 56    | 4 Heads + 6 Dept Heads + 10 TLs + 34 Staff + 1 prob + 1 resigned |
| Projects    | 13    | 10 team-linked (SECRET) + 3 cross-team                           |
| Issues      | 57    | Realistic banking tasks, mixed priorities                        |
| Memberships | 65    | Auto-assigned via hierarchy                                      |

## Auto-membership Logic

### Principles

- **Staff → Team project**: Staff auto-join their department's linked project
- **Manager → Children projects**: Dept heads/Division heads auto-join ALL child team projects
- **Cross-team**: Members manually assigned, unaffected by department transfers

### Examples

**Nguyen Duong (18506320) — Sr. Developer, Backend Team:**

```
✅ [Backend] Internal         (auto — department link)
✅ Core Banking Migration     (cross-team — manual assignment)
❌ [Frontend], [Infra]...     (not visible)
```

**Ngo Dung (10000013) — Head of Software Development Division (L2 - Division):**

```
✅ [Backend] Internal         (auto — manager of parent dept)
✅ [Frontend] Internal        (auto — manager of parent dept)
❌ [Infra], [Security]        (different division)
```

**Le Hung (10000003) — Head of IT Group (L1 - Group Biz):**

```
✅ [Backend] Internal         (auto — group head → all descendants)
✅ [Frontend] Internal        (auto)
✅ [Infrastructure] Internal  (auto)
✅ [Security] Internal        (auto)
✅ Core Banking Migration     (cross-team)
✅ Digital Transformation     (cross-team)
✅ IT Division Overview       (cross-team)
```

## Staff by Department

### ITG-DEV-BE — Backend Team (7 people)

| Staff ID | Name         | Position         | Grade  | Status        |
| -------- | ------------ | ---------------- | ------ | ------------- |
| 10000025 | Mai Duc      | Team Leader      | Senior | Active        |
| 18506320 | Nguyen Duong | Senior Developer | Senior | Active        |
| 18506321 | Tran Phong   | Developer        | Junior | Active        |
| 18506322 | Le Hai       | Developer        | Mid    | Active        |
| 18506323 | Pham Vy      | QA Engineer      | Mid    | Active        |
| 18506324 | Vu Long      | DevOps Engineer  | Senior | Active        |
| 18506420 | Luong Khanh  | Intern Developer | Intern | **Probation** |

### ITG-DEV-FE — Frontend Team (5 people)

| Staff ID | Name        | Position                  | Grade  | Status |
| -------- | ----------- | ------------------------- | ------ | ------ |
| 10000026 | Luong Trang | Team Leader               | Senior | Active |
| 18506330 | Hoang Linh  | Senior Frontend Developer | Senior | Active |
| 18506331 | Ngo Ha      | Frontend Developer        | Mid    | Active |
| 18506332 | Bui Khoa    | UI/UX Developer           | Mid    | Active |
| 18506333 | Do Tung     | Frontend Developer        | Junior | Active |

### RBG-CR-AP — Credit Appraisal Team (7 people)

| Staff ID | Name       | Position                        | Grade  | Status       |
| -------- | ---------- | ------------------------------- | ------ | ------------ |
| 10000020 | Dinh Cuong | Team Leader                     | Senior | Active       |
| 18506360 | Mai Thuy   | Credit Appraisal Officer        | Mid    | Active       |
| 18506361 | Luong Bao  | Credit Appraisal Officer        | Mid    | Active       |
| 18506362 | Dang Hien  | Credit Appraisal Analyst        | Junior | Active       |
| 18506363 | Cao Khai   | Credit Appraisal Analyst        | Junior | Active       |
| 18506364 | Ho Ngoc    | Senior Credit Appraisal Officer | Senior | Active       |
| 18506421 | Dang Truc  | Credit Appraisal Analyst        | Junior | **Resigned** |

## Sample Issues by Project

| Project                     | Issues | Examples                                              |
| --------------------------- | ------ | ----------------------------------------------------- |
| [Backend] Internal          | 8      | DB timeout fix, payment API, caching layer...         |
| [Frontend] Internal         | 6      | Dashboard redesign, dark mode, bundle optimization... |
| [Infrastructure] Internal   | 5      | K8s upgrade, disaster recovery, SSL automation...     |
| [Security] Internal         | 4      | Pentest mobile app, firewall, SIEM alerting...        |
| [Credit Appraisal] Internal | 5      | Loan appraisal 500M, collateral review...             |
| Core Banking Migration      | 5      | T24 data migration, UAT, parallel run...              |

## How to Run

```bash
# Seed into specific workspace
docker compose exec api python manage.py seed_department_staff \
  --workspace shinhan-bank-vn --email duong@shinhan.com

# Clean and re-seed
docker compose exec api python manage.py seed_department_staff \
  --workspace shinhan-bank-vn --email duong@shinhan.com --clean

# Auto-detect workspace + admin
docker compose exec api python manage.py seed_department_staff
```

## Files

| File                                                             | Description                                       |
| ---------------------------------------------------------------- | ------------------------------------------------- |
| `apps/api/plane/bgtasks/seed_department_staff_data.py`           | Data definitions (depts, staff, projects, issues) |
| `apps/api/plane/db/management/commands/seed_department_staff.py` | Django management command                         |

## Test Login

- **Admin**: `duong@shinhan.com` / `Shinhan@1`
- **Staff**: `sh{staff_id}@swing.shinhan.com` / `Shinhan@2026`
  - Example: `sh18506320@swing.shinhan.com` = Nguyen Duong (Backend)
