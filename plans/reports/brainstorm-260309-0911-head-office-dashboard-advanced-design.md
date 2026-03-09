# Brainstorm: Head Office Dashboard - Advanced Design

**Date**: 2026-03-09
**Type**: Enterprise Management Dashboard Design
**Context**: Mở rộng Head Office Dashboard MVP thành management analytics platform đầy đủ
**Dependency**: plans/260308-2215-head-office-analytics-dashboard/plan.md (MVP plan)

---

## Problem Statement

Plan hiện tại (5 phases, 22h) chỉ cover MVP: summary cards + workspace health table + activity feed. Chưa có:

- Drill-down vào workspace/project/staff chi tiết
- Tìm kiếm nhân viên across workspaces
- Filter linh hoạt (date range, multi-criteria)
- So sánh workspaces
- Xuất báo cáo PDF
- Staff workload analysis (issues assigned)

Cần thiết kế dashboard phục vụ 5 cấp quản lý: Team Leader → Trưởng phòng → Director → Phó TGĐ → Giám đốc.

---

## Confirmed Decisions

| #   | Decision             | Answer                                                   |
| --- | -------------------- | -------------------------------------------------------- |
| 1   | Entry point          | Workspace bất kỳ — Head Office hiện scope theo org chart |
| 2   | Drill-down UX        | Inline trong Head Office (không mở tab mới cho detail)   |
| 3   | Navigation pattern   | Tab-based: Overview, Workspaces, Staff, Reports          |
| 4   | Staff detail level   | Full profile + activity timeline                         |
| 5   | Workload definition  | Số issues đang assign cho nhân viên                      |
| 6   | Workspace comparison | Có, so sánh 2-3 workspace side-by-side                   |
| 7   | Export               | PDF báo cáo formatted cho management                     |
| 8   | Access               | Manager + Admin only                                     |

---

## Dashboard Architecture

### Tab Structure

```
HEAD OFFICE (/:workspaceSlug/head-office/)
├── Tab 1: OVERVIEW (tổng quan)
│   ├── Summary KPI Cards (6 cards)
│   ├── Workspace Health Grid (traffic light)
│   ├── Alerts Panel (overdue, at-risk)
│   ├── Active Cycles Progress
│   └── Recent Activity Feed
│
├── Tab 2: WORKSPACES (drill-down)
│   ├── Filter Bar (date range, health status)
│   ├── Workspace Cards/Table (sortable, filterable)
│   ├── [Expand] → Workspace Detail Panel
│   │   ├── Projects list + status
│   │   ├── Members + workload
│   │   └── Cycle progress
│   └── Comparison Mode (select 2-3, side-by-side charts)
│
├── Tab 3: STAFF (tìm kiếm + profile)
│   ├── Global Search Bar
│   ├── Filter: department, workspace, position, status
│   ├── Staff Table (sortable)
│   └── [Expand] → Staff Profile Panel
│       ├── HR Info (dept, position, joining date, status)
│       ├── Workload (assigned issues by status/priority)
│       ├── Projects participating
│       └── Activity Timeline (recent actions)
│
└── Tab 4: REPORTS (xuất báo cáo)
    ├── Template Selector
    │   ├── Executive Summary
    │   ├── Workspace Comparison
    │   └── Staff Overview
    ├── Date Range Picker
    ├── Preview Panel
    └── Export PDF Button
```

---

## Detailed Design: Mỗi Tab

### Tab 1: OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEAD OFFICE                      [Overview] [Workspaces] [Staff] [Reports] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Date Range: [Last 30 days ▼]  Scope: ITG + 3 descendants (4 WS)      │
│                                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  │ 47 Staff │ │ 23 Proj  │ │ 156 Open │ │ 4 Overdue│ │ 78% Done │ │ 12 Cycles│
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
│                                                                         │
│  ┌─ ALERTS ──────────────────────────────────────────────────────────┐  │
│  │ ⚠ 2 workspaces AT RISK: Backend Team (45%), Frontend Team (38%) │  │
│  │ ⚠ 4 overdue issues across managed workspaces                     │  │
│  │ ✓ 3 cycles completing this week                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ WORKSPACE HEALTH ────────────────┐  ┌─ ACTIVE CYCLES ───────────┐  │
│  │ WS          │ Proj │ Done │ Status│  │ Sprint 24 (BE) ████░░ 80% │  │
│  │─────────────┼──────┼──────┼───────│  │ Sprint 12 (FE) ██████ 91% │  │
│  │ IT Group    │   5  │  85% │ 🟢   │  │ Sprint 8 (Dev) ███░░░ 55% │  │
│  │ Software Dev│   8  │  72% │ 🟡   │  │                            │  │
│  │ Backend     │   6  │  45% │ 🟠   │  │ Avg velocity: 34 pts      │  │
│  │ Frontend    │   4  │  38% │ 🔴   │  └────────────────────────────┘  │
│  └────────────────────────────────────┘                                  │
│                                                                         │
│  ┌─ RECENT ACTIVITY ────────────────────────────────────────────────┐   │
│  │ ● [Backend] Nguyen A closed "API v2 endpoint" — 2 min ago       │   │
│  │ ● [Frontend] Tran B opened PR "UI redesign" — 15 min ago        │   │
│  │ ● [Dev] Le C completed Sprint 7 — 1 hour ago                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Expert insight - Alerts Panel:**
Đây là phần quan trọng nhất cho management. Manager bận rộn không có thời gian đọc bảng số. Alerts panel highlight ngay những gì cần chú ý:

- Workspaces có health status AT RISK hoặc CRITICAL
- Issues overdue vượt deadline
- Cycles sắp kết thúc nhưng progress thấp
- Staff mới join hoặc deactivated

### Tab 2: WORKSPACES (Drill-down)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEAD OFFICE                      [Overview] [Workspaces] [Staff] [Reports] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Filters: [Date: Last 30d ▼] [Status: All ▼] [Sort: Name ▼]          │
│  [☐ Compare mode]                                                       │
│                                                                         │
│  ┌─ IT Group ──────────────────────────────────────── 🟢 Good ──────┐  │
│  │ 5 projects │ 23 issues │ 85% done │ 5 members │ Sprint 24 (80%) │  │
│  │ [Expand ▼]                                        [Open WS →]    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ Backend Team ──────────────────────────────────── 🟠 At Risk ───┐  │
│  │ 6 projects │ 52 issues │ 45% done │ 18 members │ Sprint 8 (55%) │  │
│  │                                                                    │  │
│  │ ┌─ [EXPANDED] ──────────────────────────────────────────────────┐ │  │
│  │ │                                                                │ │  │
│  │ │  PROJECTS                              MEMBERS (top workload)  │ │  │
│  │ │  ┌───────────────────┬──────┬─────┐   ┌─────────────┬────────┐│ │  │
│  │ │  │ Project           │Issues│ Done│   │ Staff       │Assigned││ │  │
│  │ │  │ API Gateway       │  12  │ 75% │   │ Nguyen A    │   8    ││ │  │
│  │ │  │ Auth Service      │   8  │ 50% │   │ Tran B      │   7    ││ │  │
│  │ │  │ Payment Module    │  15  │ 33% │   │ Le C        │   6    ││ │  │
│  │ │  │ Data Pipeline     │  10  │ 40% │   │ Pham D      │   5    ││ │  │
│  │ │  │ Testing Framework │   4  │ 25% │   │ Hoang E     │   4    ││ │  │
│  │ │  │ DevOps Infra      │   3  │ 67% │   │             │        ││ │  │
│  │ │  └───────────────────┴──────┴─────┘   └─────────────┴────────┘│ │  │
│  │ │                                                                │ │  │
│  │ │  CYCLE PROGRESS                                                │ │  │
│  │ │  Sprint 8: ███████░░░░░░░░ 55% (8/15 issues) — 3 days left   │ │  │
│  │ │                                                                │ │  │
│  │ └────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ Frontend Team ────────────────────────────────── 🔴 Critical ───┐  │
│  │ 4 projects │ 36 issues │ 38% done │ 16 members │ Sprint 12 (91%)│  │
│  │ [Expand ▼]                                        [Open WS →]    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Comparison Mode (khi bật checkbox):**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COMPARE: [Backend Team ▼] vs [Frontend Team ▼]                        │
│                                                                         │
│  Metric           │ Backend Team │ Frontend Team │ Delta               │
│  ──────────────────┼──────────────┼───────────────┼──────────────────  │
│  Projects          │      6       │       4       │ +2                 │
│  Open Issues       │     52       │      36       │ +16                │
│  Completion (30d)  │     45%      │      38%      │ +7%               │
│  Active Members    │     18       │      16       │ +2                 │
│  Avg Issues/Person │    2.9       │     2.3       │ +0.6              │
│  Overdue Issues    │      3       │       1       │ +2                 │
│  Current Cycle     │     55%      │      91%      │ -36%              │
│                                                                         │
│  ┌─ COMPLETION TREND (30d) ──────────────────────────────────────────┐ │
│  │         (recharts AreaChart showing both workspace trends)        │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tab 3: STAFF (Search + Profile)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEAD OFFICE                      [Overview] [Workspaces] [Staff] [Reports] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🔍 [Search staff by name, email, staff ID...                    ]     │
│                                                                         │
│  Filters: [Dept: All ▼] [WS: All ▼] [Position: All ▼] [Status: Active]│
│                                                                         │
│  ┌─ STAFF TABLE ────────────────────────────────────────────────────┐  │
│  │ Staff ID │ Name        │ Department   │ Workspace    │ Workload │  │
│  │──────────┼─────────────┼──────────────┼──────────────┼──────────│  │
│  │ NV001    │ Nguyen Van A│ ITG-DEV-BE   │ Backend Team │ 8 issues │  │
│  │ NV002    │ Tran Thi B  │ ITG-DEV-FE   │ Frontend     │ 7 issues │  │
│  │ NV003    │ Le Van C    │ ITG-DEV      │ Software Dev │ 3 issues │  │
│  │ NV004    │ Pham Thi D  │ ITG-DEV-BE   │ Backend Team │ 5 issues │  │
│  │ NV005    │ Hoang Van E │ ITG-DEV-FE   │ Frontend     │ 4 issues │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [Click row → Expand Staff Profile Panel below]                        │
│                                                                         │
│  ┌─ STAFF PROFILE: Nguyen Van A ────────────────────────────────────┐  │
│  │                                                                    │  │
│  │  ┌─ HR INFO ─────────┐  ┌─ WORKLOAD ──────────────────────────┐  │  │
│  │  │ Staff ID: NV001    │  │                                      │  │  │
│  │  │ Dept: ITG-DEV-BE   │  │ Assigned Issues: 8                   │  │  │
│  │  │ Position: Senior   │  │ ├── Backlog:     2  ░░              │  │  │
│  │  │ WS: Backend Team   │  │ ├── In Progress: 3  ███             │  │  │
│  │  │ Manager: Le Van C  │  │ ├── In Review:   2  ██              │  │  │
│  │  │ Joined: 2024-03-15 │  │ └── Done (30d): 12  ████████████   │  │  │
│  │  │ Status: Active     │  │                                      │  │  │
│  │  └────────────────────┘  │ Priority Breakdown:                  │  │  │
│  │                           │ ├── Urgent:  1                      │  │  │
│  │  ┌─ PROJECTS ─────────┐  │ ├── High:    3                      │  │  │
│  │  │ • API Gateway      │  │ ├── Medium:  3                      │  │  │
│  │  │ • Auth Service     │  │ └── Low:     1                      │  │  │
│  │  │ • Payment Module   │  │                                      │  │  │
│  │  └────────────────────┘  │ Completion Rate (30d): 86%           │  │  │
│  │                           └──────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  │  ┌─ ACTIVITY TIMELINE ────────────────────────────────────────┐   │  │
│  │  │ Today                                                       │   │  │
│  │  │ ● 10:30 Closed "Fix auth token refresh" in API Gateway     │   │  │
│  │  │ ● 09:15 Commented on "Payment webhook handler"             │   │  │
│  │  │                                                             │   │  │
│  │  │ Yesterday                                                   │   │  │
│  │  │ ● 16:45 Created "Rate limiting middleware" in API Gateway   │   │  │
│  │  │ ● 14:20 Moved "DB migration script" to In Review           │   │  │
│  │  │ ● 10:00 Closed "API response caching"                      │   │  │
│  │  │                                                             │   │  │
│  │  │ [Load more...]                                              │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tab 4: REPORTS

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEAD OFFICE                      [Overview] [Workspaces] [Staff] [Reports] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Report Type: [Executive Summary ▼]  Period: [2026-03-01] to [2026-03-09]│
│                                                                         │
│  ┌─ REPORT TEMPLATES ───────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │  📊 Executive Summary                                             │  │
│  │  Overview KPIs, workspace health, alerts, top issues              │  │
│  │  Best for: Weekly/monthly management meeting                      │  │
│  │                                                                    │  │
│  │  📈 Workspace Comparison                                          │  │
│  │  Side-by-side metrics, trends, resource allocation                │  │
│  │  Best for: Division review, resource planning                     │  │
│  │                                                                    │  │
│  │  👥 Staff Overview                                                │  │
│  │  Headcount, workload distribution, top performers                 │  │
│  │  Best for: HR review, performance evaluation                      │  │
│  │                                                                    │  │
│  │  📋 Project Status                                                │  │
│  │  All projects across managed workspaces, status, completion       │  │
│  │  Best for: Project steering committee                             │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ PREVIEW ────────────────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │  EXECUTIVE SUMMARY — IT Group                                     │  │
│  │  Period: 2026-03-01 to 2026-03-09                                 │  │
│  │  Generated: 2026-03-09 09:00                                      │  │
│  │                                                                    │  │
│  │  KEY METRICS                                                       │  │
│  │  ┌────────────┬────────────┬────────────┬────────────┐            │  │
│  │  │ Workspaces │ Staff      │ Projects   │ Completion │            │  │
│  │  │     4      │    47      │     23     │    78%     │            │  │
│  │  └────────────┴────────────┴────────────┴────────────┘            │  │
│  │                                                                    │  │
│  │  ATTENTION REQUIRED                                                │  │
│  │  • Backend Team: 45% completion (AT RISK)                         │  │
│  │  • 4 overdue issues across workspaces                             │  │
│  │  ...                                                               │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [📥 Export PDF]  [📊 Export Excel Data]                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Enterprise Management Expert Recommendations

### 1. Progressive Disclosure (Quan trọng nhất)

Người quản lý cấp cao (Giám đốc, Phó TGĐ) KHÔNG cần xem chi tiết từng issue. Họ cần:

- **30 giây**: Nhìn tổng quan, biết có vấn đề gì cần chú ý không (Alerts)
- **2 phút**: Xem workspace nào đang có vấn đề, tại sao
- **5 phút**: Drill-down vào workspace cụ thể để hiểu chi tiết
- **10 phút**: Tìm kiếm nhân viên, xem workload, đánh giá năng suất

Thiết kế phải phục vụ workflow này: **Overview → Alert → Drill-down → Action**.

### 2. Management KPIs cho ngân hàng

Ngoài completion rate, cần thêm các KPIs phù hợp ngành ngân hàng:

| KPI                         | Mô tả                              | Tại sao quan trọng                 |
| --------------------------- | ---------------------------------- | ---------------------------------- |
| **Time to Resolve**         | Trung bình thời gian close issue   | Đo hiệu suất xử lý công việc       |
| **Bottleneck Detection**    | Issues stuck >3 ngày ở 1 status    | Phát hiện điểm nghẽn sớm           |
| **Resource Utilization**    | Avg issues/person across workspace | Phân bổ nguồn lực hợp lý           |
| **Sprint Predictability**   | Planned vs actual velocity         | Đánh giá khả năng lập kế hoạch     |
| **Cross-team Dependencies** | Issues blocked by external team    | Xác định bottleneck liên phòng ban |

### 3. Scope theo Level quản lý

```
Level 0: Giám đốc (CEO/GM)
  Scope: Toàn bộ instance (tất cả workspaces)
  Focus: Strategic — health tổng thể, resource allocation giữa các khối
  Tab mặc định: Overview
  Report: Executive Summary monthly

Level 1: Phó TGĐ (Deputy GM)
  Scope: Division (e.g., Retail Banking Group + tất cả departments con)
  Focus: Tactical — so sánh giữa departments, identify underperformers
  Tab mặc định: Workspaces (comparison view)
  Report: Division Review bi-weekly

Level 2: Director
  Scope: Department group (e.g., Credit Division)
  Focus: Operational — project health, staff workload
  Tab mặc định: Workspaces (drill-down)
  Report: Department Status weekly

Level 3: Trưởng phòng (Dept Head)
  Scope: Department + sub-departments
  Focus: Execution — individual tasks, cycle progress
  Tab mặc định: Staff (workload view)
  Report: Sprint Report per cycle

Level 4: Team Leader
  Scope: Team workspace only
  Focus: Daily — issues, assignments, blockers
  Tab mặc định: Overview (compact)
  Report: Daily standup summary (future)
```

### 4. Filter Architecture

```
Global Filters (áp dụng cho tất cả tabs):
├── Date Range: [Today | 7d | 30d | 90d | Custom range]
├── Workspace: [All | Multi-select from managed list]
└── Department: [All | Multi-select from org chart]

Tab-specific Filters:
├── Overview: (chỉ global filters)
├── Workspaces:
│   ├── Health Status: [All | Good | Fair | At Risk | Critical]
│   └── Sort By: [Name | Completion | Issues | Members]
├── Staff:
│   ├── Position: [All | Manager | Senior | Junior | ...]
│   ├── Employment Status: [Active | Probation | Resigned]
│   ├── Workload: [All | Overloaded (>10) | Normal | Low (<3)]
│   └── Search: [Name | Email | Staff ID]
└── Reports:
    ├── Report Type: [Executive | Comparison | Staff | Project]
    └── Period: [Date range picker]
```

### 5. PDF Report Structure (cho ngân hàng)

```
Executive Summary Report Template:
├── Header
│   ├── Logo + Organization name
│   ├── Report title + scope (department/division)
│   ├── Period + Generated date
│   └── Prepared by (manager name)
├── Key Metrics Dashboard (1 page)
│   ├── KPI cards (staff, projects, completion, overdue)
│   ├── Workspace health summary table
│   └── Alerts / Action items
├── Workspace Details (1 page per workspace)
│   ├── Project status table
│   ├── Cycle progress
│   └── Top issues (overdue/blocked)
├── Staff Summary (1 page)
│   ├── Headcount by department (bar chart)
│   ├── Workload distribution
│   └── New/departed staff
└── Footer
    ├── Confidential marking
    └── Page numbers
```

### 6. Real-time vs Cached Data

Recommendations cho performance:

| Data Type        | Freshness | Approach                        |
| ---------------- | --------- | ------------------------------- |
| Summary KPIs     | 5 phút    | Cache + invalidate on write     |
| Workspace health | 5 phút    | Cache (same as summary)         |
| Activity feed    | Real-time | Direct query, limit 20          |
| Staff table      | On-demand | Query when tab opened           |
| Staff profile    | On-demand | Query when row expanded         |
| Comparison data  | On-demand | Query when comparison triggered |
| Report PDF       | Generated | Build on-demand, cache 1h       |

---

## API Design (Extended)

### New endpoints needed (beyond MVP plan):

```
# Tab 2: Workspace drill-down
GET /head-office/workspaces/<ws_id>/projects/
  → projects in this workspace with issue counts, completion rate

GET /head-office/workspaces/<ws_id>/members/
  → members with workload (assigned issue count)

# Tab 3: Staff
GET /head-office/staff/
  → paginated staff list across managed workspaces
  → query params: search, department, workspace, position, status, sort

GET /head-office/staff/<staff_id>/profile/
  → full staff profile: HR info + workload + projects

GET /head-office/staff/<staff_id>/activity/
  → recent activities by this staff member (IssueActivity filtered by actor)

# Tab 2: Comparison
GET /head-office/compare/?workspace_ids=id1,id2,id3
  → side-by-side metrics for selected workspaces
  → includes 30-day trend data for recharts

# Tab 4: Reports
POST /head-office/reports/generate/
  → body: { type: "executive|comparison|staff|project", date_from, date_to }
  → returns: { report_id, status: "generating" }

GET /head-office/reports/<report_id>/
  → check status, download PDF when ready

GET /head-office/reports/<report_id>/download/
  → download PDF file
```

---

## Implementation Phases (Extended)

Current plan (Phase 1-5, 22h) covers MVP. Additional phases needed:

| #   | Phase                                            | Effort | Description                             |
| --- | ------------------------------------------------ | ------ | --------------------------------------- |
| 6   | Backend: Workspace drill-down APIs               | 4h     | projects, members endpoints             |
| 7   | Backend: Staff search + profile APIs             | 5h     | staff list, profile, activity           |
| 8   | Backend: Comparison + Reports APIs               | 6h     | compare endpoint, PDF generation        |
| 9   | Frontend: Tab navigation + Workspaces drill-down | 5h     | tab structure, expandable cards         |
| 10  | Frontend: Staff tab + profile panel              | 5h     | search, table, profile panel            |
| 11  | Frontend: Comparison view                        | 3h     | side-by-side charts with recharts       |
| 12  | Frontend: Reports tab + PDF export               | 4h     | report templates, PDF preview, download |

**Total extended: 32h additional (54h total with MVP)**

### Priority Recommendation:

- **P1 (MVP)**: Phase 1-5 (22h) — basic dashboard, summary, health table
- **P1.5**: Phase 6, 9 (9h) — workspace drill-down (most requested feature)
- **P2**: Phase 7, 10 (10h) — staff search + profile
- **P2.5**: Phase 11 (3h) — comparison view
- **P3**: Phase 8, 12 (10h) — reports + PDF (can defer)

---

## Risk Assessment

| Risk                                                       | Impact | Mitigation                                        |
| ---------------------------------------------------------- | ------ | ------------------------------------------------- |
| Cross-workspace queries slow (N workspaces × M projects)   | High   | Pagination, caching, async loading                |
| Staff activity query expensive (IssueActivity large table) | Medium | Index on actor_id+created_at, limit results       |
| PDF generation timeout (large reports)                     | Medium | Celery async task, progress polling               |
| Tab navigation complex (many components)                   | Medium | Lazy-load tab content, code splitting             |
| Scope resolution edge cases (staff in multiple depts)      | Low    | Post-migration: 1 staff = 1 dept (instance-level) |
| Comparison recharts bundle size                            | Low    | recharts already in bundle                        |

---

## Security Considerations

- All APIs enforce scope resolution: user only sees workspaces under their dept hierarchy
- Staff profile data: only visible to managers in org chart chain
- PDF reports: watermark with generator name + timestamp
- No PII in cached data (cache keys use IDs, not names)
- Activity timeline: respects workspace membership (no cross-workspace activity leakage)

---

## Success Metrics

| Metric                             | Target                        |
| ---------------------------------- | ----------------------------- |
| Dashboard load time (Overview tab) | < 2s                          |
| Workspace drill-down response      | < 1s                          |
| Staff search result                | < 500ms                       |
| PDF report generation              | < 30s                         |
| Manager adoption (weekly active)   | > 80% of dept managers        |
| Time saved per manager per week    | > 30 min (vs manual tracking) |

---

## Unresolved Questions

1. **PDF template customization**: nên cho phép user tùy chỉnh report template hay fixed templates?
2. **Data retention**: Activity timeline giữ bao lâu? 30d? 90d? All-time?
3. **Notifications**: Có cần push notification khi workspace chuyển sang AT RISK?
4. **Mobile view**: Head Office có cần responsive cho tablet/mobile không?
5. **Localization**: PDF report ngôn ngữ nào? Tiếng Việt? Song ngữ?
