# Seed data definitions for Shinhan Bank VN department & staff structure.
# Used by seed_department_staff management command.

# ── Department tree (Shinhan Bank VN org structure) ───────────────────
# Hierarchy (sequential, child = parent + 1):
# L0=Workspace (not stored), L1=Group Biz, L2=Division/Unit, L3=Department, L4=Team, L5=Sub-Team
# Format: code, short_name, dept_code, name, level, parent_code
DEPARTMENTS = [
    # Level 1: Group Biz
    {"code": "RBG", "short_name": "RBG", "dept_code": "0100", "name": "Retail Banking Group", "level": 1, "parent_code": None},
    {"code": "WBG", "short_name": "WBG", "dept_code": "0200", "name": "Wholesale Banking Group", "level": 1, "parent_code": None},
    {"code": "ITG", "short_name": "ITG", "dept_code": "0900", "name": "Information Technology Group", "level": 1, "parent_code": None},
    {"code": "HRG", "short_name": "HRG", "dept_code": "0800", "name": "Human Resources & Training Group", "level": 1, "parent_code": None},
    # Level 2: Division/Unit (RBG)
    {"code": "RBG-CR", "short_name": "CR", "dept_code": "0110", "name": "Credit Division", "level": 2, "parent_code": "RBG"},
    {"code": "RBG-TX", "short_name": "TX", "dept_code": "0120", "name": "Transaction Division", "level": 2, "parent_code": "RBG"},
    # Level 2: Division/Unit (WBG)
    {"code": "WBG-LN", "short_name": "LN", "dept_code": "0210", "name": "Corporate Lending Division", "level": 2, "parent_code": "WBG"},
    # Level 2: Division/Unit (ITG)
    {"code": "ITG-DEV", "short_name": "DEV", "dept_code": "0910", "name": "Software Development Division", "level": 2, "parent_code": "ITG"},
    {"code": "ITG-OPS", "short_name": "OPS", "dept_code": "0920", "name": "IT Operations Division", "level": 2, "parent_code": "ITG"},
    # Level 2: Division/Unit (HRG)
    {"code": "HRG-RC", "short_name": "RC", "dept_code": "0810", "name": "Recruitment Division", "level": 2, "parent_code": "HRG"},
    # Level 3: Department (RBG-CR)
    {"code": "RBG-CR-AP", "short_name": "AP", "dept_code": "0111", "name": "Credit Appraisal Dept", "level": 3, "parent_code": "RBG-CR"},
    {"code": "RBG-CR-CO", "short_name": "CO", "dept_code": "0112", "name": "Debt Collection Dept", "level": 3, "parent_code": "RBG-CR"},
    # Level 3: Department (RBG-TX)
    {"code": "RBG-TX-01", "short_name": "GD1", "dept_code": "0121", "name": "Transaction Dept 1", "level": 3, "parent_code": "RBG-TX"},
    {"code": "RBG-TX-02", "short_name": "GD2", "dept_code": "0122", "name": "Transaction Dept 2", "level": 3, "parent_code": "RBG-TX"},
    # Level 3: Department (WBG-LN)
    {"code": "WBG-LN-SM", "short_name": "SM", "dept_code": "0211", "name": "SME Lending Dept", "level": 3, "parent_code": "WBG-LN"},
    # Level 3: Department (ITG-DEV)
    {"code": "ITG-DEV-BE", "short_name": "BE", "dept_code": "0911", "name": "Backend Dept", "level": 3, "parent_code": "ITG-DEV"},
    {"code": "ITG-DEV-FE", "short_name": "FE", "dept_code": "0912", "name": "Frontend Dept", "level": 3, "parent_code": "ITG-DEV"},
    # Level 3: Department (ITG-OPS)
    {"code": "ITG-OPS-IF", "short_name": "IF", "dept_code": "0921", "name": "Infrastructure Dept", "level": 3, "parent_code": "ITG-OPS"},
    {"code": "ITG-OPS-SC", "short_name": "SC", "dept_code": "0922", "name": "Security Dept", "level": 3, "parent_code": "ITG-OPS"},
    # Level 3: Department (HRG-RC)
    {"code": "HRG-RC-ON", "short_name": "ON", "dept_code": "0811", "name": "Onboarding Dept", "level": 3, "parent_code": "HRG-RC"},
]


# ── Staff data ────────────────────────────────────────────────────────
# (staff_id, last_name, first_name, dept_code, position, job_grade, is_manager, phone, joining_date)
STAFF_DATA = [
    # ── Level 1 managers (Group Head) ──
    ("10000001", "Nguyen", "An", "RBG", "Head of Retail Banking", "Director", True, "0901000001", "2015-03-01"),
    ("10000002", "Tran", "Binh", "WBG", "Head of Wholesale Banking", "Director", True, "0901000002", "2014-06-15"),
    ("10000003", "Le", "Hung", "ITG", "Head of IT Division", "Director", True, "0901000003", "2016-01-10"),
    ("10000004", "Pham", "Lan", "HRG", "Head of HR Division", "Director", True, "0901000004", "2017-02-20"),
    # ── Level 2 managers (Division Head) ──
    ("10000010", "Vu", "Thao", "RBG-CR", "Head of Credit Dept", "Manager", True, "0901000010", "2016-05-01"),
    ("10000011", "Do", "Minh", "RBG-TX", "Head of Transaction Dept", "Manager", True, "0901000011", "2016-08-15"),
    ("10000012", "Hoang", "Tuan", "WBG-LN", "Head of Corporate Lending", "Manager", True, "0901000012", "2017-01-10"),
    ("10000013", "Ngo", "Dung", "ITG-DEV", "Head of Software Development", "Manager", True, "0901000013", "2018-03-01"),
    ("10000014", "Bui", "Linh", "ITG-OPS", "Head of IT Operations", "Manager", True, "0901000014", "2018-06-15"),
    ("10000015", "Ly", "Ha", "HRG-RC", "Head of Recruitment", "Manager", True, "0901000015", "2019-01-10"),
    # ── Level 3 managers (Department Head) ──
    ("10000020", "Dinh", "Cuong", "RBG-CR-AP", "Team Leader - Credit Appraisal", "Senior", True, "0901000020", "2017-04-01"),
    ("10000021", "Trinh", "Nga", "RBG-CR-CO", "Team Leader - Debt Collection", "Senior", True, "0901000021", "2017-09-15"),
    ("10000022", "Phan", "Phuc", "RBG-TX-01", "Team Leader - Transaction 1", "Senior", True, "0901000022", "2018-01-10"),
    ("10000023", "Duong", "Yen", "RBG-TX-02", "Team Leader - Transaction 2", "Senior", True, "0901000023", "2018-04-01"),
    ("10000024", "To", "Quang", "WBG-LN-SM", "Team Leader - SME Lending", "Senior", True, "0901000024", "2019-02-15"),
    ("10000025", "Mai", "Duc", "ITG-DEV-BE", "Team Leader - Backend", "Senior", True, "0901000025", "2019-07-01"),
    ("10000026", "Luong", "Trang", "ITG-DEV-FE", "Team Leader - Frontend", "Senior", True, "0901000026", "2019-10-15"),
    ("10000027", "Dang", "Son", "ITG-OPS-IF", "Team Leader - Infrastructure", "Senior", True, "0901000027", "2020-01-10"),
    ("10000028", "Cao", "Thanh", "ITG-OPS-SC", "Team Leader - Security", "Senior", True, "0901000028", "2020-04-01"),
    ("10000029", "Ho", "Mai", "HRG-RC-ON", "Team Leader - Onboarding", "Senior", True, "0901000029", "2020-07-15"),
    # ── Backend Team (ITG-DEV-BE) ──
    ("18506320", "Nguyen", "Duong", "ITG-DEV-BE", "Senior Developer", "Senior", False, "0912345001", "2020-01-15"),
    ("18506321", "Tran", "Phong", "ITG-DEV-BE", "Developer", "Junior", False, "0912345002", "2022-06-01"),
    ("18506322", "Le", "Hai", "ITG-DEV-BE", "Developer", "Mid", False, "0912345003", "2021-03-10"),
    ("18506323", "Pham", "Vy", "ITG-DEV-BE", "QA Engineer", "Mid", False, "0912345004", "2021-09-01"),
    ("18506324", "Vu", "Long", "ITG-DEV-BE", "DevOps Engineer", "Senior", False, "0912345005", "2020-06-15"),
    # ── Frontend Team (ITG-DEV-FE) ──
    ("18506330", "Hoang", "Linh", "ITG-DEV-FE", "Senior Frontend Developer", "Senior", False, "0912345010", "2020-02-01"),
    ("18506331", "Ngo", "Ha", "ITG-DEV-FE", "Frontend Developer", "Mid", False, "0912345011", "2021-05-15"),
    ("18506332", "Bui", "Khoa", "ITG-DEV-FE", "UI/UX Developer", "Mid", False, "0912345012", "2022-01-10"),
    ("18506333", "Do", "Tung", "ITG-DEV-FE", "Frontend Developer", "Junior", False, "0912345013", "2023-03-01"),
    # ── Infrastructure Team (ITG-OPS-IF) ──
    ("18506340", "Dinh", "Hoang", "ITG-OPS-IF", "System Administrator", "Senior", False, "0912345020", "2019-08-01"),
    ("18506341", "Trinh", "Nam", "ITG-OPS-IF", "Network Engineer", "Mid", False, "0912345021", "2021-02-15"),
    ("18506342", "Phan", "Anh", "ITG-OPS-IF", "Cloud Engineer", "Mid", False, "0912345022", "2022-07-01"),
    # ── Security Team (ITG-OPS-SC) ──
    ("18506350", "Duong", "Viet", "ITG-OPS-SC", "Security Analyst", "Senior", False, "0912345030", "2020-04-01"),
    ("18506351", "To", "Huong", "ITG-OPS-SC", "Penetration Tester", "Mid", False, "0912345031", "2021-11-15"),
    # ── Credit Appraisal Team (RBG-CR-AP) ──
    ("18506360", "Mai", "Thuy", "RBG-CR-AP", "Credit Appraisal Officer", "Mid", False, "0912345040", "2019-05-01"),
    ("18506361", "Luong", "Bao", "RBG-CR-AP", "Credit Appraisal Officer", "Mid", False, "0912345041", "2020-08-15"),
    ("18506362", "Dang", "Hien", "RBG-CR-AP", "Credit Appraisal Analyst", "Junior", False, "0912345042", "2023-01-10"),
    ("18506363", "Cao", "Khai", "RBG-CR-AP", "Credit Appraisal Analyst", "Junior", False, "0912345043", "2023-06-01"),
    ("18506364", "Ho", "Ngoc", "RBG-CR-AP", "Senior Credit Appraisal Officer", "Senior", False, "0912345044", "2018-03-15"),
    # ── Debt Collection Team (RBG-CR-CO) ──
    ("18506370", "Nguyen", "Tam", "RBG-CR-CO", "Debt Collection Officer", "Mid", False, "0912345050", "2020-01-01"),
    ("18506371", "Tran", "Quan", "RBG-CR-CO", "Debt Collection Specialist", "Junior", False, "0912345051", "2022-04-15"),
    ("18506372", "Le", "Phuong", "RBG-CR-CO", "Debt Collection Specialist", "Junior", False, "0912345052", "2023-02-01"),
    # ── Transaction Team 1 (RBG-TX-01) ──
    ("18506380", "Pham", "Hoa", "RBG-TX-01", "Transaction Officer", "Mid", False, "0912345060", "2019-07-01"),
    ("18506381", "Vu", "Trung", "RBG-TX-01", "Transaction Officer", "Junior", False, "0912345061", "2022-10-15"),
    ("18506382", "Hoang", "Uyen", "RBG-TX-01", "Transaction Officer", "Junior", False, "0912345062", "2023-04-01"),
    ("18506383", "Ngo", "Lam", "RBG-TX-01", "Transaction Officer", "Mid", False, "0912345063", "2020-11-15"),
    # ── Transaction Team 2 (RBG-TX-02) ──
    ("18506390", "Bui", "Thy", "RBG-TX-02", "Transaction Officer", "Mid", False, "0912345070", "2019-09-01"),
    ("18506391", "Do", "Kien", "RBG-TX-02", "Transaction Officer", "Junior", False, "0912345071", "2022-12-15"),
    ("18506392", "Dinh", "Hang", "RBG-TX-02", "Transaction Officer", "Junior", False, "0912345072", "2023-05-01"),
    # ── SME Lending Team (WBG-LN-SM) ──
    ("18506400", "Trinh", "Dat", "WBG-LN-SM", "Senior Corporate Credit Officer", "Senior", False, "0912345080", "2018-06-01"),
    ("18506401", "Phan", "Nhung", "WBG-LN-SM", "Corporate Credit Officer", "Mid", False, "0912345081", "2020-09-15"),
    ("18506402", "Duong", "Huy", "WBG-LN-SM", "Corporate Credit Analyst", "Junior", False, "0912345082", "2023-01-01"),
    # ── Onboarding Team (HRG-RC-ON) ──
    ("18506410", "To", "Van", "HRG-RC-ON", "Recruitment Specialist", "Mid", False, "0912345090", "2020-05-01"),
    ("18506411", "Mai", "Quynh", "HRG-RC-ON", "Onboarding Coordinator", "Junior", False, "0912345091", "2022-08-15"),
    # ── Special status staff ──
    ("18506420", "Luong", "Khanh", "ITG-DEV-BE", "Intern Developer", "Intern", False, "0912345100", "2025-12-01"),
    ("18506421", "Dang", "Truc", "RBG-CR-AP", "Credit Appraisal Analyst", "Junior", False, "0912345101", "2022-01-01"),
]


# ── Projects linked to level-3 departments ───────────────────────────
# (dept_code, project_name, identifier)
LINKED_PROJECTS = [
    ("RBG-CR-AP", "[Credit Appraisal] Internal", "AP"),
    ("RBG-CR-CO", "[Debt Collection] Internal", "CO"),
    ("RBG-TX-01", "[Transaction 1] Internal", "GD1"),
    ("RBG-TX-02", "[Transaction 2] Internal", "GD2"),
    ("WBG-LN-SM", "[SME Lending] Internal", "SME"),
    ("ITG-DEV-BE", "[Backend] Internal", "BE"),
    ("ITG-DEV-FE", "[Frontend] Internal", "FE"),
    ("ITG-OPS-IF", "[Infrastructure] Internal", "INFRA"),
    ("ITG-OPS-SC", "[Security] Internal", "SEC"),
    ("HRG-RC-ON", "[Onboarding] Internal", "ONBRD"),
]

# Cross-team projects (not linked to any department)
CROSS_PROJECTS = [
    ("Core Banking Migration", "CBM"),
    ("Digital Transformation 2026", "DT26"),
    ("IT Division Overview", "ITOV"),
]

# Cross-team membership assignments: {project_identifier: [staff_ids]}
CROSS_TEAM_MEMBERS = {
    "CBM": ["10000025", "18506320", "18506324", "10000026", "18506330",
            "10000027", "18506340", "10000028", "18506350", "10000003"],
    "DT26": ["10000001", "10000003", "10000013", "10000025", "10000026"],
    "ITOV": ["10000003", "10000013", "10000014", "10000025", "10000026",
             "10000027", "10000028"],
}


# ── Dummy issues per project (name, priority) ────────────────────────
ISSUE_TEMPLATES = {
    "BE": [
        ("Design API endpoint for payment module", "high"),
        ("Fix database connection pool timeout bug", "urgent"),
        ("Implement caching layer for transaction history", "medium"),
        ("Write unit tests for authentication middleware", "medium"),
        ("Optimize monthly report SQL queries", "high"),
        ("Integrate insurance partner API", "low"),
        ("Refactor service layer for loan module", "medium"),
        ("Setup monitoring alerts for API response time", "high"),
    ],
    "FE": [
        ("Redesign customer overview dashboard", "high"),
        ("Fix responsive layout on mobile transaction page", "urgent"),
        ("Implement dark mode for admin panel", "low"),
        ("Optimize bundle size with lazy loading", "medium"),
        ("Build component library for design system", "medium"),
        ("Fix form validation bug on account opening page", "high"),
    ],
    "INFRA": [
        ("Upgrade Kubernetes cluster to v1.29", "high"),
        ("Setup disaster recovery for primary database", "urgent"),
        ("Migrate log storage to Elasticsearch 8.x", "medium"),
        ("Automate SSL certificate renewal", "medium"),
        ("Setup load balancer for API gateway", "high"),
    ],
    "SEC": [
        ("Q1 penetration test for mobile banking app", "urgent"),
        ("Review and update firewall rules", "high"),
        ("Implement SIEM alerting for suspicious logins", "high"),
        ("Audit access control for production servers", "medium"),
    ],
    "AP": [
        ("Appraise loan application - Customer NVX - 500M VND", "high"),
        ("Review collateral assets - District 7 real estate", "medium"),
        ("Complete monthly appraisal report for February", "medium"),
        ("Update appraisal process per new regulation", "high"),
        ("Appraise consumer loan applications - batch 15", "low"),
    ],
    "CO": [
        ("Recover overdue debt from customer TVY", "urgent"),
        ("Prepare Q1/2026 debt collection plan", "high"),
        ("Contact group 3 NPL customers - February list", "medium"),
    ],
    "GD1": [
        ("Process international wire transfer batch 12", "high"),
        ("Assist customer with new corporate account opening", "medium"),
        ("End-of-day transaction reconciliation 17/02", "urgent"),
        ("Train new staff on KYC procedures", "low"),
    ],
    "GD2": [
        ("Process savings deposit transactions", "medium"),
        ("Assist customer with credit card issuance", "medium"),
        ("Report suspicious transactions - week 8", "high"),
    ],
    "SME": [
        ("Financial analysis for Company ABC - 5B VND credit limit", "high"),
        ("Disburse loan for Company XYZ", "urgent"),
        ("Review debt extension application for Company DEF", "medium"),
        ("Monthly SME credit portfolio report - February", "medium"),
    ],
    "ONBRD": [
        ("Onboard 5 new employees for March", "medium"),
        ("Update orientation training materials", "low"),
        ("Organize orientation session for Q1 intern batch", "medium"),
    ],
    "CBM": [
        ("Migrate customer data from T24 to new core system", "urgent"),
        ("Design data mapping for deposit module", "high"),
        ("UAT testing for internal fund transfer module", "high"),
        ("Setup parallel run environment", "medium"),
        ("Write migration scripts for master data", "medium"),
    ],
    "DT26": [
        ("Survey retail customer digital banking needs", "medium"),
        ("POC AI chatbot for customer support", "high"),
        ("Evaluate eKYC solution vendors", "medium"),
    ],
    "ITOV": [
        ("Review Q1/2026 project progress", "high"),
        ("IT budget planning for Q2/2026", "medium"),
        ("February team performance evaluation", "medium"),
        ("Prepare IT report for Executive Board", "urgent"),
    ],
}
