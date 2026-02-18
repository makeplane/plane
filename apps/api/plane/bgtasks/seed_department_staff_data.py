# Seed data definitions for Shinhan Bank VN department & staff structure.
# Used by seed_department_staff_task.py management command.

# ── Department tree (Shinhan Bank VN org structure) ───────────────────
# Format: code, short_name, dept_code, name, level, parent_code
DEPARTMENTS = [
    # Level 1: Khối
    {"code": "RBG", "short_name": "RBG", "dept_code": "0100", "name": "Khối Ngân hàng Bán lẻ", "level": 1, "parent_code": None},
    {"code": "WBG", "short_name": "WBG", "dept_code": "0200", "name": "Khối Ngân hàng Doanh nghiệp", "level": 1, "parent_code": None},
    {"code": "ITG", "short_name": "ITG", "dept_code": "0900", "name": "Khối Công nghệ Thông tin", "level": 1, "parent_code": None},
    {"code": "HRG", "short_name": "HRG", "dept_code": "0800", "name": "Khối Nhân sự & Đào tạo", "level": 1, "parent_code": None},
    # Level 2: Phòng (RBG)
    {"code": "RBG-CR", "short_name": "CR", "dept_code": "0110", "name": "Phòng Tín dụng", "level": 2, "parent_code": "RBG"},
    {"code": "RBG-TX", "short_name": "TX", "dept_code": "0120", "name": "Phòng Giao dịch", "level": 2, "parent_code": "RBG"},
    # Level 2: Phòng (WBG)
    {"code": "WBG-LN", "short_name": "LN", "dept_code": "0210", "name": "Phòng Cho vay DN", "level": 2, "parent_code": "WBG"},
    # Level 2: Phòng (ITG)
    {"code": "ITG-DEV", "short_name": "DEV", "dept_code": "0910", "name": "Phòng Phát triển", "level": 2, "parent_code": "ITG"},
    {"code": "ITG-OPS", "short_name": "OPS", "dept_code": "0920", "name": "Phòng Vận hành", "level": 2, "parent_code": "ITG"},
    # Level 2: Phòng (HRG)
    {"code": "HRG-RC", "short_name": "RC", "dept_code": "0810", "name": "Phòng Tuyển dụng", "level": 2, "parent_code": "HRG"},
    # Level 3: Team (RBG-CR)
    {"code": "RBG-CR-AP", "short_name": "AP", "dept_code": "0111", "name": "Team Thẩm định", "level": 3, "parent_code": "RBG-CR"},
    {"code": "RBG-CR-CO", "short_name": "CO", "dept_code": "0112", "name": "Team Thu hồi nợ", "level": 3, "parent_code": "RBG-CR"},
    # Level 3: Team (RBG-TX)
    {"code": "RBG-TX-01", "short_name": "GD1", "dept_code": "0121", "name": "Team Giao dịch 1", "level": 3, "parent_code": "RBG-TX"},
    {"code": "RBG-TX-02", "short_name": "GD2", "dept_code": "0122", "name": "Team Giao dịch 2", "level": 3, "parent_code": "RBG-TX"},
    # Level 3: Team (WBG-LN)
    {"code": "WBG-LN-SM", "short_name": "SM", "dept_code": "0211", "name": "Team SME", "level": 3, "parent_code": "WBG-LN"},
    # Level 3: Team (ITG-DEV)
    {"code": "ITG-DEV-BE", "short_name": "BE", "dept_code": "0911", "name": "Team Backend", "level": 3, "parent_code": "ITG-DEV"},
    {"code": "ITG-DEV-FE", "short_name": "FE", "dept_code": "0912", "name": "Team Frontend", "level": 3, "parent_code": "ITG-DEV"},
    # Level 3: Team (ITG-OPS)
    {"code": "ITG-OPS-IF", "short_name": "IF", "dept_code": "0921", "name": "Team Infra", "level": 3, "parent_code": "ITG-OPS"},
    {"code": "ITG-OPS-SC", "short_name": "SC", "dept_code": "0922", "name": "Team Security", "level": 3, "parent_code": "ITG-OPS"},
    # Level 3: Team (HRG-RC)
    {"code": "HRG-RC-ON", "short_name": "ON", "dept_code": "0811", "name": "Team Onboarding", "level": 3, "parent_code": "HRG-RC"},
]


# ── Staff data ────────────────────────────────────────────────────────
# (staff_id, last_name, first_name, dept_code, position, job_grade, is_manager, phone, joining_date)
STAFF_DATA = [
    # ── Level 1 managers (Khối trưởng) ──
    ("10000001", "Nguyễn", "An", "RBG", "Giám đốc Khối Bán lẻ", "Director", True, "0901000001", "2015-03-01"),
    ("10000002", "Trần", "Bình", "WBG", "Giám đốc Khối DN", "Director", True, "0901000002", "2014-06-15"),
    ("10000003", "Lê", "Hùng", "ITG", "Giám đốc Khối CNTT", "Director", True, "0901000003", "2016-01-10"),
    ("10000004", "Phạm", "Lan", "HRG", "Giám đốc Khối Nhân sự", "Director", True, "0901000004", "2017-02-20"),
    # ── Level 2 managers (Trưởng phòng) ──
    ("10000010", "Vũ", "Thảo", "RBG-CR", "Trưởng phòng Tín dụng", "Manager", True, "0901000010", "2016-05-01"),
    ("10000011", "Đỗ", "Minh", "RBG-TX", "Trưởng phòng Giao dịch", "Manager", True, "0901000011", "2016-08-15"),
    ("10000012", "Hoàng", "Tuấn", "WBG-LN", "Trưởng phòng Cho vay", "Manager", True, "0901000012", "2017-01-10"),
    ("10000013", "Ngô", "Dũng", "ITG-DEV", "Trưởng phòng Phát triển", "Manager", True, "0901000013", "2018-03-01"),
    ("10000014", "Bùi", "Linh", "ITG-OPS", "Trưởng phòng Vận hành", "Manager", True, "0901000014", "2018-06-15"),
    ("10000015", "Lý", "Hà", "HRG-RC", "Trưởng phòng Tuyển dụng", "Manager", True, "0901000015", "2019-01-10"),
    # ── Level 3 managers (Team Leader) ──
    ("10000020", "Đinh", "Cường", "RBG-CR-AP", "Team Leader Thẩm định", "Senior", True, "0901000020", "2017-04-01"),
    ("10000021", "Trịnh", "Nga", "RBG-CR-CO", "Team Leader Thu hồi", "Senior", True, "0901000021", "2017-09-15"),
    ("10000022", "Phan", "Phúc", "RBG-TX-01", "Team Leader GD1", "Senior", True, "0901000022", "2018-01-10"),
    ("10000023", "Dương", "Yến", "RBG-TX-02", "Team Leader GD2", "Senior", True, "0901000023", "2018-04-01"),
    ("10000024", "Tô", "Quang", "WBG-LN-SM", "Team Leader SME", "Senior", True, "0901000024", "2019-02-15"),
    ("10000025", "Mai", "Đức", "ITG-DEV-BE", "Team Leader Backend", "Senior", True, "0901000025", "2019-07-01"),
    ("10000026", "Lương", "Trang", "ITG-DEV-FE", "Team Leader Frontend", "Senior", True, "0901000026", "2019-10-15"),
    ("10000027", "Đặng", "Sơn", "ITG-OPS-IF", "Team Leader Infra", "Senior", True, "0901000027", "2020-01-10"),
    ("10000028", "Cao", "Thanh", "ITG-OPS-SC", "Team Leader Security", "Senior", True, "0901000028", "2020-04-01"),
    ("10000029", "Hồ", "Mai", "HRG-RC-ON", "Team Leader Onboarding", "Senior", True, "0901000029", "2020-07-15"),
    # ── Team Backend (ITG-DEV-BE) ──
    ("18506320", "Nguyễn", "Dương", "ITG-DEV-BE", "Senior Developer", "Senior", False, "0912345001", "2020-01-15"),
    ("18506321", "Trần", "Phong", "ITG-DEV-BE", "Developer", "Junior", False, "0912345002", "2022-06-01"),
    ("18506322", "Lê", "Hải", "ITG-DEV-BE", "Developer", "Mid", False, "0912345003", "2021-03-10"),
    ("18506323", "Phạm", "Vy", "ITG-DEV-BE", "QA Engineer", "Mid", False, "0912345004", "2021-09-01"),
    ("18506324", "Vũ", "Long", "ITG-DEV-BE", "DevOps Engineer", "Senior", False, "0912345005", "2020-06-15"),
    # ── Team Frontend (ITG-DEV-FE) ──
    ("18506330", "Hoàng", "Linh", "ITG-DEV-FE", "Senior Frontend Dev", "Senior", False, "0912345010", "2020-02-01"),
    ("18506331", "Ngô", "Hà", "ITG-DEV-FE", "Frontend Developer", "Mid", False, "0912345011", "2021-05-15"),
    ("18506332", "Bùi", "Khoa", "ITG-DEV-FE", "UI/UX Developer", "Mid", False, "0912345012", "2022-01-10"),
    ("18506333", "Đỗ", "Tùng", "ITG-DEV-FE", "Frontend Developer", "Junior", False, "0912345013", "2023-03-01"),
    # ── Team Infra (ITG-OPS-IF) ──
    ("18506340", "Đinh", "Hoàng", "ITG-OPS-IF", "System Admin", "Senior", False, "0912345020", "2019-08-01"),
    ("18506341", "Trịnh", "Nam", "ITG-OPS-IF", "Network Engineer", "Mid", False, "0912345021", "2021-02-15"),
    ("18506342", "Phan", "Anh", "ITG-OPS-IF", "Cloud Engineer", "Mid", False, "0912345022", "2022-07-01"),
    # ── Team Security (ITG-OPS-SC) ──
    ("18506350", "Dương", "Việt", "ITG-OPS-SC", "Security Analyst", "Senior", False, "0912345030", "2020-04-01"),
    ("18506351", "Tô", "Hương", "ITG-OPS-SC", "Penetration Tester", "Mid", False, "0912345031", "2021-11-15"),
    # ── Team Thẩm định (RBG-CR-AP) ──
    ("18506360", "Mai", "Thủy", "RBG-CR-AP", "Chuyên viên Thẩm định", "Mid", False, "0912345040", "2019-05-01"),
    ("18506361", "Lương", "Bảo", "RBG-CR-AP", "Chuyên viên Thẩm định", "Mid", False, "0912345041", "2020-08-15"),
    ("18506362", "Đặng", "Hiền", "RBG-CR-AP", "Nhân viên Thẩm định", "Junior", False, "0912345042", "2023-01-10"),
    ("18506363", "Cao", "Khải", "RBG-CR-AP", "Nhân viên Thẩm định", "Junior", False, "0912345043", "2023-06-01"),
    ("18506364", "Hồ", "Ngọc", "RBG-CR-AP", "Chuyên viên Thẩm định", "Senior", False, "0912345044", "2018-03-15"),
    # ── Team Thu hồi (RBG-CR-CO) ──
    ("18506370", "Nguyễn", "Tâm", "RBG-CR-CO", "Chuyên viên Thu hồi", "Mid", False, "0912345050", "2020-01-01"),
    ("18506371", "Trần", "Quân", "RBG-CR-CO", "Nhân viên Thu hồi", "Junior", False, "0912345051", "2022-04-15"),
    ("18506372", "Lê", "Phương", "RBG-CR-CO", "Nhân viên Thu hồi", "Junior", False, "0912345052", "2023-02-01"),
    # ── Team GD1 (RBG-TX-01) ──
    ("18506380", "Phạm", "Hoa", "RBG-TX-01", "Giao dịch viên", "Mid", False, "0912345060", "2019-07-01"),
    ("18506381", "Vũ", "Trung", "RBG-TX-01", "Giao dịch viên", "Junior", False, "0912345061", "2022-10-15"),
    ("18506382", "Hoàng", "Uyên", "RBG-TX-01", "Giao dịch viên", "Junior", False, "0912345062", "2023-04-01"),
    ("18506383", "Ngô", "Lâm", "RBG-TX-01", "Giao dịch viên", "Mid", False, "0912345063", "2020-11-15"),
    # ── Team GD2 (RBG-TX-02) ──
    ("18506390", "Bùi", "Thy", "RBG-TX-02", "Giao dịch viên", "Mid", False, "0912345070", "2019-09-01"),
    ("18506391", "Đỗ", "Kiên", "RBG-TX-02", "Giao dịch viên", "Junior", False, "0912345071", "2022-12-15"),
    ("18506392", "Đinh", "Hằng", "RBG-TX-02", "Giao dịch viên", "Junior", False, "0912345072", "2023-05-01"),
    # ── Team SME (WBG-LN-SM) ──
    ("18506400", "Trịnh", "Đạt", "WBG-LN-SM", "Chuyên viên Tín dụng DN", "Senior", False, "0912345080", "2018-06-01"),
    ("18506401", "Phan", "Nhung", "WBG-LN-SM", "Chuyên viên Tín dụng DN", "Mid", False, "0912345081", "2020-09-15"),
    ("18506402", "Dương", "Huy", "WBG-LN-SM", "Nhân viên Tín dụng DN", "Junior", False, "0912345082", "2023-01-01"),
    # ── Team Onboarding (HRG-RC-ON) ──
    ("18506410", "Tô", "Vân", "HRG-RC-ON", "Chuyên viên Tuyển dụng", "Mid", False, "0912345090", "2020-05-01"),
    ("18506411", "Mai", "Quỳnh", "HRG-RC-ON", "Nhân viên Onboarding", "Junior", False, "0912345091", "2022-08-15"),
    # ── Special status staff ──
    ("18506420", "Lương", "Khánh", "ITG-DEV-BE", "Intern Developer", "Intern", False, "0912345100", "2025-12-01"),
    ("18506421", "Đặng", "Trúc", "RBG-CR-AP", "Nhân viên Thẩm định", "Junior", False, "0912345101", "2022-01-01"),
]


# ── Projects linked to level-3 teams ─────────────────────────────────
# (dept_code, project_name, identifier)
LINKED_PROJECTS = [
    ("RBG-CR-AP", "[Thẩm định] Nội bộ", "AP"),
    ("RBG-CR-CO", "[Thu hồi nợ] Nội bộ", "CO"),
    ("RBG-TX-01", "[Giao dịch 1] Nội bộ", "GD1"),
    ("RBG-TX-02", "[Giao dịch 2] Nội bộ", "GD2"),
    ("WBG-LN-SM", "[SME Lending] Nội bộ", "SME"),
    ("ITG-DEV-BE", "[Backend] Nội bộ", "BE"),
    ("ITG-DEV-FE", "[Frontend] Nội bộ", "FE"),
    ("ITG-OPS-IF", "[Infra] Nội bộ", "INFRA"),
    ("ITG-OPS-SC", "[Security] Nội bộ", "SEC"),
    ("HRG-RC-ON", "[Onboarding] Nội bộ", "ONBRD"),
]

# Cross-team projects (not linked to any department)
CROSS_PROJECTS = [
    ("Core Banking Migration", "CBM"),
    ("Digital Transformation 2026", "DT26"),
    ("Khối CNTT Overview", "ITOV"),
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
        ("Thiết kế API endpoint cho module thanh toán", "high"),
        ("Fix bug timeout kết nối database pool", "urgent"),
        ("Implement caching layer cho transaction history", "medium"),
        ("Viết unit test cho authentication middleware", "medium"),
        ("Optimize SQL query báo cáo tháng", "high"),
        ("Tích hợp API đối tác bảo hiểm", "low"),
        ("Refactor service layer cho loan module", "medium"),
        ("Setup monitoring alerts cho API response time", "high"),
    ],
    "FE": [
        ("Redesign dashboard tổng quan khách hàng", "high"),
        ("Fix responsive layout trang giao dịch mobile", "urgent"),
        ("Implement dark mode cho admin panel", "low"),
        ("Tối ưu bundle size - lazy load components", "medium"),
        ("Tạo component library cho design system", "medium"),
        ("Fix bug form validation trang mở tài khoản", "high"),
    ],
    "INFRA": [
        ("Upgrade Kubernetes cluster lên v1.29", "high"),
        ("Setup disaster recovery cho database primary", "urgent"),
        ("Migrate log storage sang Elasticsearch 8.x", "medium"),
        ("Automate SSL certificate renewal", "medium"),
        ("Setup load balancer cho API gateway", "high"),
    ],
    "SEC": [
        ("Penetration test ứng dụng mobile banking Q1", "urgent"),
        ("Review và update firewall rules", "high"),
        ("Implement SIEM alerting cho suspicious login", "high"),
        ("Audit access control cho production servers", "medium"),
    ],
    "AP": [
        ("Thẩm định hồ sơ vay KH Nguyễn Văn X - 500tr", "high"),
        ("Review tài sản đảm bảo - BĐS Quận 7", "medium"),
        ("Hoàn thiện báo cáo thẩm định tháng 2", "medium"),
        ("Cập nhật quy trình thẩm định theo QĐ mới", "high"),
        ("Thẩm định hồ sơ vay tiêu dùng - batch 15", "low"),
    ],
    "CO": [
        ("Thu hồi khoản nợ quá hạn KH Trần Văn Y", "urgent"),
        ("Lập kế hoạch thu hồi nợ Q1/2026", "high"),
        ("Liên hệ KH nhóm nợ 3 - danh sách tháng 2", "medium"),
    ],
    "GD1": [
        ("Xử lý giao dịch chuyển tiền quốc tế batch 12", "high"),
        ("Hỗ trợ KH mở tài khoản doanh nghiệp mới", "medium"),
        ("Đối soát giao dịch cuối ngày 17/02", "urgent"),
        ("Training nhân viên mới quy trình KYC", "low"),
    ],
    "GD2": [
        ("Xử lý giao dịch tiền gửi tiết kiệm", "medium"),
        ("Hỗ trợ KH phát hành thẻ tín dụng", "medium"),
        ("Báo cáo giao dịch bất thường tuần 8", "high"),
    ],
    "SME": [
        ("Phân tích tài chính Công ty ABC - hạn mức 5 tỷ", "high"),
        ("Giải ngân khoản vay Công ty XYZ", "urgent"),
        ("Review hồ sơ gia hạn nợ Công ty DEF", "medium"),
        ("Báo cáo danh mục tín dụng SME tháng 2", "medium"),
    ],
    "ONBRD": [
        ("Onboarding 5 nhân viên mới tháng 3", "medium"),
        ("Cập nhật tài liệu đào tạo hội nhập", "low"),
        ("Tổ chức buổi orientation cho intern batch Q1", "medium"),
    ],
    "CBM": [
        ("Migration data khách hàng từ T24 sang core mới", "urgent"),
        ("Thiết kế data mapping cho module tiền gửi", "high"),
        ("UAT testing module chuyển tiền nội bộ", "high"),
        ("Setup parallel run environment", "medium"),
        ("Viết migration script cho master data", "medium"),
    ],
    "DT26": [
        ("Khảo sát nhu cầu Digital Banking cho KH cá nhân", "medium"),
        ("POC chatbot AI hỗ trợ khách hàng", "high"),
        ("Đánh giá vendor giải pháp eKYC", "medium"),
    ],
    "ITOV": [
        ("Review tiến độ dự án Q1/2026", "high"),
        ("Budget planning IT Q2/2026", "medium"),
        ("Đánh giá performance team tháng 2", "medium"),
        ("Chuẩn bị báo cáo IT cho Ban TGĐ", "urgent"),
    ],
}
