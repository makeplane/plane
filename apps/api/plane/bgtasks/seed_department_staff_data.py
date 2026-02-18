# Seed data definitions for Shinhan Bank VN department & staff structure.
# Used by seed_department_staff management command.
# Source: SHBVN Org Chart (86 nodes, L0=Bank/Workspace excluded → 85 departments)

# ── Department tree (Shinhan Bank VN org structure) ───────────────────
# Hierarchy: L0=Workspace (not stored), L1=Business Group, L2=Division,
#            L3=Department, L4=Team, L5=Sub-Team, L6=Sub-Sub-Team
# Fields: code, short_name, dept_code (4-digit unique), name, level, parent_code
DEPARTMENTS = [
    # ══════ Level 1: Business Groups ══════
    {"code": "BOD", "short_name": "BOD", "dept_code": "0002", "name": "BOD", "level": 1, "parent_code": None},
    {"code": "MOC", "short_name": "MOC", "dept_code": "0003", "name": "MOC", "level": 1, "parent_code": None},
    {"code": "HO", "short_name": "HO", "dept_code": "0004", "name": "Head Office", "level": 1, "parent_code": None},
    {"code": "BOC", "short_name": "BOC", "dept_code": "0005", "name": "BOC", "level": 1, "parent_code": None},
    {"code": "NBG", "short_name": "NBG", "dept_code": "0006", "name": "Northern Business Group", "level": 1, "parent_code": None},
    {"code": "BRN", "short_name": "BRN", "dept_code": "0007", "name": "Branches", "level": 1, "parent_code": None},

    # ══════ Level 2: Divisions under Head Office ══════
    {"code": "HO-BPG", "short_name": "BPG", "dept_code": "0008", "name": "Business Planning Group", "level": 2, "parent_code": "HO"},
    {"code": "HO-RTG", "short_name": "RTG", "dept_code": "0009", "name": "Retail Group", "level": 2, "parent_code": "HO"},
    {"code": "HO-CRG", "short_name": "CRG", "dept_code": "0010", "name": "Corporate Group", "level": 2, "parent_code": "HO"},
    {"code": "HO-CDG", "short_name": "CDG", "dept_code": "0011", "name": "Credit Group", "level": 2, "parent_code": "HO"},
    {"code": "HO-FBG", "short_name": "FBG", "dept_code": "0012", "name": "Future Bank Group", "level": 2, "parent_code": "HO"},
    {"code": "HO-RMD", "short_name": "RMD", "dept_code": "0013", "name": "Risk Management Division", "level": 2, "parent_code": "HO"},
    {"code": "HO-LCD", "short_name": "LCD", "dept_code": "0014", "name": "Legal and Compliance Division", "level": 2, "parent_code": "HO"},
    # Level 2: under BOC
    {"code": "BOC-IAD", "short_name": "IAD", "dept_code": "0015", "name": "Internal Audit Dept", "level": 2, "parent_code": "BOC"},
    # Level 2: under Northern Business Group
    {"code": "NBG-NBD", "short_name": "NBD", "dept_code": "0016", "name": "Northern Business Division", "level": 2, "parent_code": "NBG"},

    # ══════ Level 3: Departments under Business Planning Group ══════
    {"code": "BPG-STR", "short_name": "STR", "dept_code": "0017", "name": "Strategy Division", "level": 3, "parent_code": "HO-BPG"},
    {"code": "BPG-FPD", "short_name": "FPD", "dept_code": "0018", "name": "Financial Planning Dept", "level": 3, "parent_code": "HO-BPG"},
    {"code": "BPG-TRD", "short_name": "TRD", "dept_code": "0019", "name": "Treasury Dept", "level": 3, "parent_code": "HO-BPG"},
    {"code": "BPG-STD", "short_name": "STD", "dept_code": "0020", "name": "Settlement Dept", "level": 3, "parent_code": "HO-BPG"},
    {"code": "BPG-BSD", "short_name": "BSD", "dept_code": "0021", "name": "Business Support Division", "level": 3, "parent_code": "HO-BPG"},
    # Level 3: under Retail Group
    {"code": "RTG-RBP", "short_name": "RBP", "dept_code": "0022", "name": "Retail Business Promotion Dept", "level": 3, "parent_code": "HO-RTG"},
    {"code": "RTG-RSD", "short_name": "RSD", "dept_code": "0023", "name": "Retail Solution Division", "level": 3, "parent_code": "HO-RTG"},
    {"code": "RTG-SCD", "short_name": "SCD", "dept_code": "0024", "name": "Smart Credit Division", "level": 3, "parent_code": "HO-RTG"},
    # Level 3: under Corporate Group
    {"code": "CRG-CIB", "short_name": "CIB", "dept_code": "0025", "name": "CIB Division", "level": 3, "parent_code": "HO-CRG"},
    {"code": "CRG-GTC", "short_name": "GTC", "dept_code": "0026", "name": "Global Trading Center", "level": 3, "parent_code": "HO-CRG"},
    {"code": "CRG-FIB", "short_name": "FIB", "dept_code": "0027", "name": "FI Business Dept", "level": 3, "parent_code": "HO-CRG"},
    {"code": "CRG-SSD", "short_name": "SSD", "dept_code": "0028", "name": "Securities Services Dept", "level": 3, "parent_code": "HO-CRG"},
    {"code": "CRG-BCT", "short_name": "BCT", "dept_code": "0029", "name": "Business Center", "level": 3, "parent_code": "HO-CRG"},
    # Level 3: under Credit Group
    {"code": "CDG-CAD", "short_name": "CAD", "dept_code": "0030", "name": "Credit Analysis Division", "level": 3, "parent_code": "HO-CDG"},
    {"code": "CDG-CPD", "short_name": "CPD", "dept_code": "0031", "name": "Credit Planning Dept", "level": 3, "parent_code": "HO-CDG"},
    {"code": "CDG-CCD", "short_name": "CCD", "dept_code": "0032", "name": "Credit Collection Dept", "level": 3, "parent_code": "HO-CDG"},
    # Level 3: under Future Bank Group
    {"code": "FBG-ICT", "short_name": "ICT", "dept_code": "0033", "name": "ICT Division", "level": 3, "parent_code": "HO-FBG"},
    {"code": "FBG-DBU", "short_name": "DBU", "dept_code": "0034", "name": "Digital Business Unit", "level": 3, "parent_code": "HO-FBG"},
    {"code": "FBG-PMD", "short_name": "PMD", "dept_code": "0035", "name": "Payment Division", "level": 3, "parent_code": "HO-FBG"},
    # Level 3: under Risk Management Division
    {"code": "RMD-LRT", "short_name": "LRT", "dept_code": "0036", "name": "Loan Review Team", "level": 3, "parent_code": "HO-RMD"},
    # Level 3: under Legal and Compliance Division
    {"code": "LCD-LCP", "short_name": "LCP", "dept_code": "0037", "name": "Legal and Compliance Dept", "level": 3, "parent_code": "HO-LCD"},
    {"code": "LCD-AML", "short_name": "AML", "dept_code": "0038", "name": "AML Dept", "level": 3, "parent_code": "HO-LCD"},
    # Level 3: under Northern Business Division
    {"code": "NBD-NRB", "short_name": "NRB", "dept_code": "0039", "name": "Northern Retail Business Dept", "level": 3, "parent_code": "NBG-NBD"},
    {"code": "NBD-NCB", "short_name": "NCB", "dept_code": "0040", "name": "Northern Corporate Business Dept", "level": 3, "parent_code": "NBG-NBD"},

    # ══════ Level 4: Teams ══════
    # under Treasury Dept
    {"code": "TRD-SIT", "short_name": "SIT", "dept_code": "0041", "name": "Securities Investment Team", "level": 4, "parent_code": "BPG-TRD"},
    # under Business Support Division
    {"code": "BSD-HRD", "short_name": "HRD", "dept_code": "0042", "name": "Human Resource Dept", "level": 4, "parent_code": "BPG-BSD"},
    {"code": "BSD-SAC", "short_name": "SAC", "dept_code": "0043", "name": "Shinhan Academy", "level": 4, "parent_code": "BPG-BSD"},
    {"code": "BSD-GAD", "short_name": "GAD", "dept_code": "0044", "name": "GA Dept", "level": 4, "parent_code": "BPG-BSD"},
    {"code": "BSD-CSD", "short_name": "CSD", "dept_code": "0045", "name": "Customer Service Dept", "level": 4, "parent_code": "BPG-BSD"},
    {"code": "BSD-CCT", "short_name": "CCT", "dept_code": "0046", "name": "Contact Center", "level": 4, "parent_code": "BPG-BSD"},
    # under Retail Solution Division
    {"code": "RSD-HCM", "short_name": "HCM", "dept_code": "0047", "name": "Hanoi Cash Management Center", "level": 4, "parent_code": "RTG-RSD"},
    {"code": "RSD-SCM", "short_name": "SCM", "dept_code": "0048", "name": "HCM Cash Management Center", "level": 4, "parent_code": "RTG-RSD"},
    # under Smart Credit Division
    {"code": "SCD-SMC", "short_name": "SMC", "dept_code": "0049", "name": "Smart Credit Marketing Center", "level": 4, "parent_code": "RTG-SCD"},
    {"code": "SCD-LOC", "short_name": "LOC", "dept_code": "0050", "name": "Lending Operations Center", "level": 4, "parent_code": "RTG-SCD"},
    {"code": "SCD-RAC", "short_name": "RAC", "dept_code": "0051", "name": "Retail Asset Management Center", "level": 4, "parent_code": "RTG-SCD"},
    {"code": "SCD-SCO", "short_name": "SCO", "dept_code": "0052", "name": "Smart Credit Division Outsourcing", "level": 4, "parent_code": "RTG-SCD"},
    # under CIB Division
    {"code": "CIB-CBD", "short_name": "CBD", "dept_code": "0053", "name": "Corporate Business Dept", "level": 4, "parent_code": "CRG-CIB"},
    {"code": "CIB-IMC", "short_name": "IMC", "dept_code": "0054", "name": "Institution Marketing Center", "level": 4, "parent_code": "CRG-CIB"},
    {"code": "CIB-IBD", "short_name": "IBD", "dept_code": "0055", "name": "International Business Dept", "level": 4, "parent_code": "CRG-CIB"},
    # under Global Trading Center
    {"code": "GTC-NGT", "short_name": "NGT", "dept_code": "0056", "name": "Northern Global Trading Center", "level": 4, "parent_code": "CRG-GTC"},
    # under Securities Services Dept
    {"code": "SSD-FST", "short_name": "FST", "dept_code": "0057", "name": "Fund Service Team", "level": 4, "parent_code": "CRG-SSD"},
    # under Credit Analysis Division
    {"code": "CAD-CCA", "short_name": "CCA", "dept_code": "0058", "name": "Corporate Credit Analysis Dept", "level": 4, "parent_code": "CDG-CAD"},
    {"code": "CAD-RCA", "short_name": "RCA", "dept_code": "0059", "name": "Retail Credit Analysis Dept", "level": 4, "parent_code": "CDG-CAD"},
    # under Credit Planning Dept
    {"code": "CPD-NCP", "short_name": "NCP", "dept_code": "0060", "name": "Northern Credit Planning", "level": 4, "parent_code": "CDG-CPD"},
    # under Credit Collection Dept
    {"code": "CCD-NCC", "short_name": "NCC", "dept_code": "0061", "name": "Northern Credit Collection", "level": 4, "parent_code": "CDG-CCD"},
    # under ICT Division
    {"code": "ICT-ICP", "short_name": "ICP", "dept_code": "0062", "name": "ICT Planning Dept", "level": 4, "parent_code": "FBG-ICT"},
    {"code": "ICT-ICD", "short_name": "ICD", "dept_code": "0063", "name": "ICT Development Dept", "level": 4, "parent_code": "FBG-ICT"},
    {"code": "ICT-DPD", "short_name": "DPD", "dept_code": "0064", "name": "Data Protection Dept", "level": 4, "parent_code": "FBG-ICT"},
    {"code": "ICT-DDD", "short_name": "DDD", "dept_code": "0065", "name": "Digital Development Dept", "level": 4, "parent_code": "FBG-ICT"},
    {"code": "ICT-ICO", "short_name": "ICO", "dept_code": "0066", "name": "ICT Outsourcing", "level": 4, "parent_code": "FBG-ICT"},
    # under Digital Business Unit
    {"code": "DBU-DOT", "short_name": "DOT", "dept_code": "0067", "name": "Digital Operation Team", "level": 4, "parent_code": "FBG-DBU"},
    # under Payment Division
    {"code": "PMD-CRD", "short_name": "CRD", "dept_code": "0068", "name": "Card Business Dept", "level": 4, "parent_code": "FBG-PMD"},
    {"code": "PMD-PBD", "short_name": "PBD", "dept_code": "0069", "name": "Payment Business Dept", "level": 4, "parent_code": "FBG-PMD"},
    # under Loan Review Team
    {"code": "LRT-NLR", "short_name": "NLR", "dept_code": "0070", "name": "Northern Loan Review", "level": 4, "parent_code": "RMD-LRT"},
    # under Legal and Compliance Dept
    {"code": "LCP-NLC", "short_name": "NLC", "dept_code": "0071", "name": "Northern Legal and Compliance Dept", "level": 4, "parent_code": "LCD-LCP"},

    # ══════ Level 5: Sub-Teams ══════
    # under Human Resource Dept
    {"code": "HRD-NHR", "short_name": "NHR", "dept_code": "0072", "name": "Northern HR", "level": 5, "parent_code": "BSD-HRD"},
    {"code": "HRD-TFT", "short_name": "TFT", "dept_code": "0073", "name": "HR TFT", "level": 5, "parent_code": "BSD-HRD"},
    {"code": "HRD-HRO", "short_name": "HRO", "dept_code": "0074", "name": "HR Outsourcing", "level": 5, "parent_code": "BSD-HRD"},
    {"code": "HRD-HEP", "short_name": "HEP", "dept_code": "0075", "name": "HR Exempted Post", "level": 5, "parent_code": "BSD-HRD"},
    {"code": "HRD-EXP", "short_name": "EXP", "dept_code": "0076", "name": "Expat Temporary Dept", "level": 5, "parent_code": "BSD-HRD"},
    # under Shinhan Academy
    {"code": "SAC-NSA", "short_name": "NSA", "dept_code": "0077", "name": "Northern Shinhan Academy", "level": 5, "parent_code": "BSD-SAC"},
    {"code": "SAC-SCT", "short_name": "SCT", "dept_code": "0078", "name": "Shinhan Culture Team", "level": 5, "parent_code": "BSD-SAC"},
    # under Smart Credit Marketing Center
    {"code": "SMC-SMO", "short_name": "SMO", "dept_code": "0079", "name": "Smart Credit Marketing Outsourcing", "level": 5, "parent_code": "SCD-SMC"},
    # under Lending Operations Center
    {"code": "LOC-NLO", "short_name": "NLO", "dept_code": "0080", "name": "Northern Lending Operations Center", "level": 5, "parent_code": "SCD-LOC"},
    {"code": "LOC-LCO", "short_name": "LCO", "dept_code": "0081", "name": "Lending Operations Center Outsourcing", "level": 5, "parent_code": "SCD-LOC"},
    # under Retail Asset Management Center
    {"code": "RAC-RMO", "short_name": "RMO", "dept_code": "0082", "name": "Retail Asset Management Center Outsourcing", "level": 5, "parent_code": "SCD-RAC"},
    # under Corporate Credit Analysis Dept
    {"code": "CCA-NCA", "short_name": "NCA", "dept_code": "0083", "name": "Northern Corporate Credit Analysis", "level": 5, "parent_code": "CAD-CCA"},
    # under Retail Credit Analysis Dept
    {"code": "RCA-NRA", "short_name": "NRA", "dept_code": "0084", "name": "Northern Retail Credit Analysis Dept", "level": 5, "parent_code": "CAD-RCA"},
    # under ICT Planning Dept
    {"code": "ICP-NIP", "short_name": "NIP", "dept_code": "0085", "name": "Northern ICT Planning", "level": 5, "parent_code": "ICT-ICP"},

    # ══════ Level 6: Sub-Sub-Team ══════
    {"code": "SCT-NSC", "short_name": "NSC", "dept_code": "0086", "name": "Northern Shinhan Culture", "level": 6, "parent_code": "SAC-SCT"},
]


# ── Staff data ────────────────────────────────────────────────────────
# (staff_id, last_name, first_name, dept_code, position, job_grade, is_manager, phone, joining_date)
STAFF_DATA = [
    # ── L1 heads ──
    ("10000001", "Nguyen", "An", "HO", "General Director", "Director", True, "0901000001", "2015-03-01"),
    ("10000002", "Tran", "Binh", "NBG", "Head of Northern Business Group", "Director", True, "0901000002", "2014-06-15"),
    # ── L2 heads (Divisions under Head Office) ──
    ("10000003", "Le", "Hung", "HO-FBG", "Head of Future Bank Group", "Director", True, "0901000003", "2016-01-10"),
    ("10000004", "Pham", "Lan", "HO-BPG", "Head of Business Planning Group", "Director", True, "0901000004", "2017-02-20"),
    ("10000010", "Vu", "Thao", "HO-CDG", "Head of Credit Group", "Manager", True, "0901000010", "2016-05-01"),
    ("10000011", "Do", "Minh", "HO-RTG", "Head of Retail Group", "Manager", True, "0901000011", "2016-08-15"),
    ("10000012", "Hoang", "Tuan", "HO-CRG", "Head of Corporate Group", "Manager", True, "0901000012", "2017-01-10"),
    ("10000013", "Ngo", "Dung", "HO-RMD", "Head of Risk Management", "Manager", True, "0901000013", "2018-03-01"),
    ("10000014", "Bui", "Linh", "HO-LCD", "Head of Legal and Compliance", "Manager", True, "0901000014", "2018-06-15"),
    # ── L3 heads ──
    ("10000015", "Ly", "Ha", "FBG-ICT", "Head of ICT Division", "Manager", True, "0901000015", "2019-01-10"),
    ("10000020", "Dinh", "Cuong", "CDG-CAD", "Head of Credit Analysis", "Senior", True, "0901000020", "2017-04-01"),
    ("10000021", "Trinh", "Nga", "CDG-CCD", "Head of Credit Collection", "Senior", True, "0901000021", "2017-09-15"),
    ("10000022", "Phan", "Phuc", "RTG-RBP", "Head of Retail Business Promotion", "Senior", True, "0901000022", "2018-01-10"),
    ("10000023", "Duong", "Yen", "FBG-PMD", "Head of Payment Division", "Senior", True, "0901000023", "2018-04-01"),
    ("10000024", "To", "Quang", "CRG-CIB", "Head of CIB Division", "Senior", True, "0901000024", "2019-02-15"),
    ("10000030", "Tran", "Hieu", "BPG-BSD", "Head of Business Support", "Senior", True, "0901000030", "2018-07-01"),
    # ── L4 team leaders ──
    ("10000025", "Mai", "Duc", "ICT-ICD", "Team Leader - ICT Development", "Senior", True, "0901000025", "2019-07-01"),
    ("10000026", "Luong", "Trang", "ICT-DDD", "Team Leader - Digital Development", "Senior", True, "0901000026", "2019-10-15"),
    ("10000027", "Dang", "Son", "ICT-ICP", "Team Leader - ICT Planning", "Senior", True, "0901000027", "2020-01-10"),
    ("10000028", "Cao", "Thanh", "ICT-DPD", "Team Leader - Data Protection", "Senior", True, "0901000028", "2020-04-01"),
    ("10000029", "Ho", "Mai", "BSD-HRD", "Team Leader - Human Resources", "Senior", True, "0901000029", "2020-07-15"),
    ("10000031", "Nguyen", "Kha", "CAD-CCA", "Team Leader - Corporate Credit Analysis", "Senior", True, "0901000031", "2019-03-01"),
    ("10000032", "Le", "Thi", "CIB-CBD", "Team Leader - Corporate Business", "Senior", True, "0901000032", "2019-06-01"),
    ("10000033", "Pham", "Duy", "PMD-CRD", "Team Leader - Card Business", "Senior", True, "0901000033", "2020-02-01"),
    # ── ICT Development Dept (ICT-ICD) ──
    ("18506320", "Nguyen", "Duong", "ICT-ICD", "Senior Developer", "Senior", False, "0912345001", "2020-01-15"),
    ("18506321", "Tran", "Phong", "ICT-ICD", "Developer", "Junior", False, "0912345002", "2022-06-01"),
    ("18506322", "Le", "Hai", "ICT-ICD", "Developer", "Mid", False, "0912345003", "2021-03-10"),
    ("18506323", "Pham", "Vy", "ICT-ICD", "QA Engineer", "Mid", False, "0912345004", "2021-09-01"),
    ("18506324", "Vu", "Long", "ICT-ICD", "DevOps Engineer", "Senior", False, "0912345005", "2020-06-15"),
    # ── Digital Development Dept (ICT-DDD) ──
    ("18506330", "Hoang", "Linh", "ICT-DDD", "Senior Frontend Developer", "Senior", False, "0912345010", "2020-02-01"),
    ("18506331", "Ngo", "Ha", "ICT-DDD", "Frontend Developer", "Mid", False, "0912345011", "2021-05-15"),
    ("18506332", "Bui", "Khoa", "ICT-DDD", "UI/UX Developer", "Mid", False, "0912345012", "2022-01-10"),
    ("18506333", "Do", "Tung", "ICT-DDD", "Frontend Developer", "Junior", False, "0912345013", "2023-03-01"),
    # ── ICT Planning Dept (ICT-ICP) ──
    ("18506340", "Dinh", "Hoang", "ICT-ICP", "System Administrator", "Senior", False, "0912345020", "2019-08-01"),
    ("18506341", "Trinh", "Nam", "ICT-ICP", "Network Engineer", "Mid", False, "0912345021", "2021-02-15"),
    ("18506342", "Phan", "Anh", "ICT-ICP", "Cloud Engineer", "Mid", False, "0912345022", "2022-07-01"),
    # ── Data Protection Dept (ICT-DPD) ──
    ("18506350", "Duong", "Viet", "ICT-DPD", "Security Analyst", "Senior", False, "0912345030", "2020-04-01"),
    ("18506351", "To", "Huong", "ICT-DPD", "Penetration Tester", "Mid", False, "0912345031", "2021-11-15"),
    # ── Corporate Credit Analysis Dept (CAD-CCA) ──
    ("18506360", "Mai", "Thuy", "CAD-CCA", "Credit Analysis Officer", "Mid", False, "0912345040", "2019-05-01"),
    ("18506361", "Luong", "Bao", "CAD-CCA", "Credit Analysis Officer", "Mid", False, "0912345041", "2020-08-15"),
    ("18506362", "Dang", "Hien", "CAD-CCA", "Credit Analyst", "Junior", False, "0912345042", "2023-01-10"),
    ("18506363", "Cao", "Khai", "CAD-CCA", "Credit Analyst", "Junior", False, "0912345043", "2023-06-01"),
    ("18506364", "Ho", "Ngoc", "CAD-CCA", "Senior Credit Analysis Officer", "Senior", False, "0912345044", "2018-03-15"),
    # ── Credit Collection Dept (CDG-CCD) ──
    ("18506370", "Nguyen", "Tam", "CDG-CCD", "Debt Collection Officer", "Mid", False, "0912345050", "2020-01-01"),
    ("18506371", "Tran", "Quan", "CDG-CCD", "Debt Collection Specialist", "Junior", False, "0912345051", "2022-04-15"),
    ("18506372", "Le", "Phuong", "CDG-CCD", "Debt Collection Specialist", "Junior", False, "0912345052", "2023-02-01"),
    # ── Retail Business Promotion Dept (RTG-RBP) ──
    ("18506380", "Pham", "Hoa", "RTG-RBP", "Retail Promotion Officer", "Mid", False, "0912345060", "2019-07-01"),
    ("18506381", "Vu", "Trung", "RTG-RBP", "Retail Promotion Officer", "Junior", False, "0912345061", "2022-10-15"),
    ("18506382", "Hoang", "Uyen", "RTG-RBP", "Retail Promotion Officer", "Junior", False, "0912345062", "2023-04-01"),
    ("18506383", "Ngo", "Lam", "RTG-RBP", "Retail Promotion Officer", "Mid", False, "0912345063", "2020-11-15"),
    # ── Card Business Dept (PMD-CRD) ──
    ("18506390", "Bui", "Thy", "PMD-CRD", "Card Business Officer", "Mid", False, "0912345070", "2019-09-01"),
    ("18506391", "Do", "Kien", "PMD-CRD", "Card Business Officer", "Junior", False, "0912345071", "2022-12-15"),
    ("18506392", "Dinh", "Hang", "PMD-CRD", "Card Business Officer", "Junior", False, "0912345072", "2023-05-01"),
    # ── Corporate Business Dept (CIB-CBD) ──
    ("18506400", "Trinh", "Dat", "CIB-CBD", "Senior Corporate Business Officer", "Senior", False, "0912345080", "2018-06-01"),
    ("18506401", "Phan", "Nhung", "CIB-CBD", "Corporate Business Officer", "Mid", False, "0912345081", "2020-09-15"),
    ("18506402", "Duong", "Huy", "CIB-CBD", "Corporate Business Analyst", "Junior", False, "0912345082", "2023-01-01"),
    # ── Human Resource Dept (BSD-HRD) ──
    ("18506410", "To", "Van", "BSD-HRD", "HR Specialist", "Mid", False, "0912345090", "2020-05-01"),
    ("18506411", "Mai", "Quynh", "BSD-HRD", "HR Coordinator", "Junior", False, "0912345091", "2022-08-15"),
    # ── Special status staff ──
    ("18506420", "Luong", "Khanh", "ICT-ICD", "Intern Developer", "Intern", False, "0912345100", "2025-12-01"),
    ("18506421", "Dang", "Truc", "CAD-CCA", "Credit Analyst", "Junior", False, "0912345101", "2022-01-01"),
]


# ── Projects linked to departments (where staff work) ─────────────────
# (dept_code, project_name, identifier)
LINKED_PROJECTS = [
    ("ICT-ICD", "[ICT Development] Internal", "ICTD"),
    ("ICT-DDD", "[Digital Development] Internal", "DDEV"),
    ("ICT-ICP", "[ICT Planning] Internal", "ICTP"),
    ("ICT-DPD", "[Data Protection] Internal", "DPRT"),
    ("CAD-CCA", "[Credit Analysis] Internal", "CRDA"),
    ("CDG-CCD", "[Credit Collection] Internal", "CCOL"),
    ("RTG-RBP", "[Retail Promotion] Internal", "RPRO"),
    ("PMD-CRD", "[Card Business] Internal", "CARD"),
    ("CIB-CBD", "[Corporate Business] Internal", "CBIZ"),
    ("BSD-HRD", "[Human Resources] Internal", "HRES"),
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
    "DT26": ["10000001", "10000003", "10000015", "10000025", "10000026"],
    "ITOV": ["10000003", "10000015", "10000025", "10000026",
             "10000027", "10000028"],
}


# ── Dummy issues per project (name, priority) ────────────────────────
ISSUE_TEMPLATES = {
    "ICTD": [
        ("Design API endpoint for payment module", "high"),
        ("Fix database connection pool timeout bug", "urgent"),
        ("Implement caching layer for transaction history", "medium"),
        ("Write unit tests for authentication middleware", "medium"),
        ("Optimize monthly report SQL queries", "high"),
        ("Integrate insurance partner API", "low"),
        ("Refactor service layer for loan module", "medium"),
        ("Setup monitoring alerts for API response time", "high"),
    ],
    "DDEV": [
        ("Redesign customer overview dashboard", "high"),
        ("Fix responsive layout on mobile transaction page", "urgent"),
        ("Implement dark mode for admin panel", "low"),
        ("Optimize bundle size with lazy loading", "medium"),
        ("Build component library for design system", "medium"),
        ("Fix form validation bug on account opening page", "high"),
    ],
    "ICTP": [
        ("Upgrade Kubernetes cluster to v1.29", "high"),
        ("Setup disaster recovery for primary database", "urgent"),
        ("Migrate log storage to Elasticsearch 8.x", "medium"),
        ("Automate SSL certificate renewal", "medium"),
        ("Setup load balancer for API gateway", "high"),
    ],
    "DPRT": [
        ("Q1 penetration test for mobile banking app", "urgent"),
        ("Review and update firewall rules", "high"),
        ("Implement SIEM alerting for suspicious logins", "high"),
        ("Audit access control for production servers", "medium"),
    ],
    "CRDA": [
        ("Analyze loan application - Customer NVX - 500M VND", "high"),
        ("Review collateral assets - District 7 real estate", "medium"),
        ("Complete monthly credit analysis report for February", "medium"),
        ("Update analysis process per new regulation", "high"),
        ("Analyze consumer loan applications - batch 15", "low"),
    ],
    "CCOL": [
        ("Recover overdue debt from customer TVY", "urgent"),
        ("Prepare Q1/2026 debt collection plan", "high"),
        ("Contact group 3 NPL customers - February list", "medium"),
    ],
    "RPRO": [
        ("Launch retail savings promotion campaign Q1", "high"),
        ("Coordinate branch event for new product launch", "medium"),
        ("Prepare monthly retail performance report", "urgent"),
        ("Train staff on new insurance cross-selling program", "low"),
    ],
    "CARD": [
        ("Process credit card applications batch - February", "medium"),
        ("Launch cashback promotion for Visa Platinum", "medium"),
        ("Report suspicious card transactions - week 8", "high"),
    ],
    "CBIZ": [
        ("Financial analysis for Company ABC - 5B VND credit limit", "high"),
        ("Disburse loan for Company XYZ", "urgent"),
        ("Review debt extension application for Company DEF", "medium"),
        ("Monthly corporate credit portfolio report - February", "medium"),
    ],
    "HRES": [
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
