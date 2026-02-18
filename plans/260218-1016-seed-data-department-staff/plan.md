# Seed Data — Department & Staff (Shinhan Bank VN)

**Date**: 2026-02-18
**Status**: Completed
**Workspace**: `shinhan-bank-vn`

## Department Hierarchy Levels

Shinhan Bank VN uses a 7-level hierarchical org chart structure (L0-L6). **Levels must be sequential** (child level = parent level + 1):

| Level | Type           | Description                                     | Count |
| ----- | -------------- | ----------------------------------------------- | ----- |
| L0    | Workspace      | Shinhan Bank Vietnam — not stored as Department | 1     |
| L1    | Business Group | Top-level business groups (BOD, MOC, HO, etc.)  | 6     |
| L2    | Division       | Divisions under L1 groups                       | 9     |
| L3    | Department     | Departments within divisions                    | 24    |
| L4    | Team           | Teams within departments                        | 31    |
| L5    | Sub-Team       | Sub-teams within teams                          | 14    |
| L6    | Sub-Sub-Team   | Deepest level (1 node)                          | 1     |

**Total**: 85 department nodes (excluding L0 workspace)

## Data Model

```
Workspace: "Shinhan Bank Vietnam"
│
│  ═══ DEPARTMENT TREE (85 departments, 6 active levels: L1→L6) ═══
│
│  BOD (Board of Directors)                                          [L1]
│  MOC (Management Operating Committee)                              [L1]
│  HO (Head Office) — Head: Nguyen An                                [L1]
│    ├── HO-BPG (Business Planning Group) — Head: Pham Lan           [L2]
│    │     ├── BPG-STR (Strategy Division)                           [L3]
│    │     ├── BPG-FPD (Financial Planning Dept)                     [L3]
│    │     ├── BPG-TRD (Treasury Dept)                               [L3]
│    │     │     └── TRD-SIT (Securities Investment Team)            [L4]
│    │     ├── BPG-STD (Settlement Dept)                             [L3]
│    │     └── BPG-BSD (Business Support Division) — Head: Tran Hieu [L3]
│    │           ├── BSD-HRD (Human Resource Dept) — TL: Ho Mai      [L4]
│    │           │     ├── HRD-NHR (Northern HR)                     [L5]
│    │           │     ├── HRD-TFT (HR TFT)                         [L5]
│    │           │     ├── HRD-HRO (HR Outsourcing)                  [L5]
│    │           │     ├── HRD-HEP (HR Exempted Post)                [L5]
│    │           │     └── HRD-EXP (Expat Temporary Dept)            [L5]
│    │           ├── BSD-SAC (Shinhan Academy)                       [L4]
│    │           │     ├── SAC-NSA (Northern Shinhan Academy)        [L5]
│    │           │     └── SAC-SCT (Shinhan Culture Team)            [L5]
│    │           │           └── SCT-NSC (Northern Shinhan Culture)  [L6]
│    │           ├── BSD-GAD (GA Dept)                               [L4]
│    │           ├── BSD-CSD (Customer Service Dept)                 [L4]
│    │           └── BSD-CCT (Contact Center)                        [L4]
│    ├── HO-RTG (Retail Group) — Head: Do Minh                      [L2]
│    │     ├── RTG-RBP (Retail Business Promotion) — Head: Phan Phuc [L3]
│    │     ├── RTG-RSD (Retail Solution Division)                    [L3]
│    │     │     ├── RSD-HCM (Hanoi Cash Mgmt Center)               [L4]
│    │     │     └── RSD-SCM (HCM Cash Mgmt Center)                 [L4]
│    │     └── RTG-SCD (Smart Credit Division)                       [L3]
│    │           ├── SCD-SMC (Smart Credit Marketing Center)         [L4]
│    │           │     └── SMC-SMO (Smart Credit Mktg Outsourcing)   [L5]
│    │           ├── SCD-LOC (Lending Operations Center)             [L4]
│    │           │     ├── LOC-NLO (Northern Lending Ops Center)     [L5]
│    │           │     └── LOC-LCO (Lending Ops Center Outsourcing)  [L5]
│    │           ├── SCD-RAC (Retail Asset Mgmt Center)              [L4]
│    │           │     └── RAC-RMO (Retail Asset Mgmt Outsourcing)   [L5]
│    │           └── SCD-SCO (Smart Credit Division Outsourcing)     [L4]
│    ├── HO-CRG (Corporate Group) — Head: Hoang Tuan                [L2]
│    │     ├── CRG-CIB (CIB Division) — Head: To Quang              [L3]
│    │     │     ├── CIB-CBD (Corporate Business Dept) — TL: Le Thi  [L4]
│    │     │     ├── CIB-IMC (Institution Marketing Center)          [L4]
│    │     │     └── CIB-IBD (International Business Dept)           [L4]
│    │     ├── CRG-GTC (Global Trading Center)                       [L3]
│    │     │     └── GTC-NGT (Northern Global Trading Center)        [L4]
│    │     ├── CRG-FIB (FI Business Dept)                            [L3]
│    │     ├── CRG-SSD (Securities Services Dept)                    [L3]
│    │     │     └── SSD-FST (Fund Service Team)                     [L4]
│    │     └── CRG-BCT (Business Center)                             [L3]
│    ├── HO-CDG (Credit Group) — Head: Vu Thao                      [L2]
│    │     ├── CDG-CAD (Credit Analysis Division) — Head: Dinh Cuong [L3]
│    │     │     ├── CAD-CCA (Corporate Credit Analysis) — TL: Nguyen Kha [L4]
│    │     │     │     └── CCA-NCA (Northern Corp Credit Analysis)   [L5]
│    │     │     └── CAD-RCA (Retail Credit Analysis Dept)           [L4]
│    │     │           └── RCA-NRA (Northern Retail Credit Analysis) [L5]
│    │     ├── CDG-CPD (Credit Planning Dept)                        [L3]
│    │     │     └── CPD-NCP (Northern Credit Planning)              [L4]
│    │     └── CDG-CCD (Credit Collection Dept) — Head: Trinh Nga   [L3]
│    │           └── CCD-NCC (Northern Credit Collection)            [L4]
│    ├── HO-FBG (Future Bank Group) — Head: Le Hung                  [L2]
│    │     ├── FBG-ICT (ICT Division) — Head: Ly Ha                  [L3]
│    │     │     ├── ICT-ICP (ICT Planning Dept) — TL: Dang Son      [L4]
│    │     │     │     └── ICP-NIP (Northern ICT Planning)           [L5]
│    │     │     ├── ICT-ICD (ICT Development Dept) — TL: Mai Duc    [L4]
│    │     │     ├── ICT-DPD (Data Protection Dept) — TL: Cao Thanh  [L4]
│    │     │     ├── ICT-DDD (Digital Development) — TL: Luong Trang [L4]
│    │     │     └── ICT-ICO (ICT Outsourcing)                       [L4]
│    │     ├── FBG-DBU (Digital Business Unit)                        [L3]
│    │     │     └── DBU-DOT (Digital Operation Team)                [L4]
│    │     └── FBG-PMD (Payment Division) — Head: Duong Yen          [L3]
│    │           ├── PMD-CRD (Card Business Dept) — TL: Pham Duy     [L4]
│    │           └── PMD-PBD (Payment Business Dept)                 [L4]
│    ├── HO-RMD (Risk Management Division) — Head: Ngo Dung          [L2]
│    │     └── RMD-LRT (Loan Review Team)                            [L3]
│    │           └── LRT-NLR (Northern Loan Review)                  [L4]
│    └── HO-LCD (Legal and Compliance Division) — Head: Bui Linh     [L2]
│          ├── LCD-LCP (Legal and Compliance Dept)                   [L3]
│          │     └── LCP-NLC (Northern Legal and Compliance)         [L4]
│          └── LCD-AML (AML Dept)                                    [L3]
│  BOC (Board of Control)                                            [L1]
│    └── BOC-IAD (Internal Audit Dept)                               [L2]
│  NBG (Northern Business Group) — Head: Tran Binh                   [L1]
│    └── NBG-NBD (Northern Business Division)                        [L2]
│          ├── NBD-NRB (Northern Retail Business Dept)               [L3]
│          └── NBD-NCB (Northern Corporate Business Dept)            [L3]
│  BRN (Branches)                                                    [L1]
│
│  ═══ CROSS-TEAM PROJECTS ═══
│
│  Core Banking Migration (CBM)        — 10 members cross-division
│  Digital Transformation 2026 (DT26)  — 5 members (heads + leads)
│  IT Division Overview (ITOV)         — 6 members (head + dept heads + TLs)
```

## Seed Data Overview

| Entity      | Count | Details                                                                  |
| ----------- | ----- | ------------------------------------------------------------------------ |
| Departments | 85    | 6 L1 + 9 L2 + 24 L3 + 31 L4 + 14 L5 + 1 L6                               |
| Staff       | 58    | 2 L1 Heads + 7 L2 Heads + 6 L3 Heads + 8 TLs + 33 Staff + 1 prob + 1 res |
| Projects    | 13    | 10 team-linked (SECRET) + 3 cross-team                                   |
| Issues      | 57    | Realistic banking tasks, mixed priorities                                |

## Auto-membership Logic

### Principles

- **Staff → Team project**: Staff auto-join their department's linked project
- **Manager → Children projects**: Dept heads/Division heads auto-join ALL child team projects
- **Cross-team**: Members manually assigned, unaffected by department transfers

### Examples

**Nguyen Duong (18506320) — Sr. Developer, ICT Development:**

```
✅ [ICT Development] Internal    (auto — department link)
✅ Core Banking Migration         (cross-team — manual assignment)
❌ [Digital Development], etc.    (not visible)
```

**Ly Ha (10000015) — Head of ICT Division (L3):**

```
✅ [ICT Development] Internal    (auto — manager of parent dept)
✅ [Digital Development] Internal (auto — manager of parent dept)
✅ [ICT Planning] Internal       (auto — manager of parent dept)
✅ [Data Protection] Internal    (auto — manager of parent dept)
❌ [Card Business], etc.         (different division)
```

**Le Hung (10000003) — Head of Future Bank Group (L2):**

```
✅ [ICT Development] Internal    (auto — group head → all descendants)
✅ [Digital Development] Internal (auto)
✅ [ICT Planning] Internal       (auto)
✅ [Data Protection] Internal    (auto)
✅ [Card Business] Internal      (auto)
✅ Core Banking Migration         (cross-team)
✅ Digital Transformation         (cross-team)
✅ IT Division Overview           (cross-team)
```

## Staff by Department

### ICT-ICD — ICT Development Dept (7 people)

| Staff ID | Name         | Position         | Grade  | Status        |
| -------- | ------------ | ---------------- | ------ | ------------- |
| 10000025 | Mai Duc      | Team Leader      | Senior | Active        |
| 18506320 | Nguyen Duong | Senior Developer | Senior | Active        |
| 18506321 | Tran Phong   | Developer        | Junior | Active        |
| 18506322 | Le Hai       | Developer        | Mid    | Active        |
| 18506323 | Pham Vy      | QA Engineer      | Mid    | Active        |
| 18506324 | Vu Long      | DevOps Engineer  | Senior | Active        |
| 18506420 | Luong Khanh  | Intern Developer | Intern | **Probation** |

### ICT-DDD — Digital Development Dept (5 people)

| Staff ID | Name        | Position                  | Grade  | Status |
| -------- | ----------- | ------------------------- | ------ | ------ |
| 10000026 | Luong Trang | Team Leader               | Senior | Active |
| 18506330 | Hoang Linh  | Senior Frontend Developer | Senior | Active |
| 18506331 | Ngo Ha      | Frontend Developer        | Mid    | Active |
| 18506332 | Bui Khoa    | UI/UX Developer           | Mid    | Active |
| 18506333 | Do Tung     | Frontend Developer        | Junior | Active |

### CAD-CCA — Corporate Credit Analysis Dept (7 people)

| Staff ID | Name       | Position                       | Grade  | Status       |
| -------- | ---------- | ------------------------------ | ------ | ------------ |
| 10000031 | Nguyen Kha | Team Leader                    | Senior | Active       |
| 18506360 | Mai Thuy   | Credit Analysis Officer        | Mid    | Active       |
| 18506361 | Luong Bao  | Credit Analysis Officer        | Mid    | Active       |
| 18506362 | Dang Hien  | Credit Analyst                 | Junior | Active       |
| 18506363 | Cao Khai   | Credit Analyst                 | Junior | Active       |
| 18506364 | Ho Ngoc    | Senior Credit Analysis Officer | Senior | Active       |
| 18506421 | Dang Truc  | Credit Analyst                 | Junior | **Resigned** |

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
  - Example: `sh18506320@swing.shinhan.com` = Nguyen Duong (ICT Development)
