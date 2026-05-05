# Phase 01: Create Seed Script

## Context

- [Plan](./plan.md)
- Admin sign-in: `POST /auth/admin/sign-in/` (form data: email, password) → session cookie `admin-session-id`
- Create workspace: `POST /api/instances/workspaces/` (JSON: name, slug)
- Create project: `POST /api/workspaces/{slug}/projects/` (JSON: name, identifier, network)
- Add user to workspace: `POST /api/instances/users/{userId}/workspaces/` (JSON: workspace_id, role)
- List users: `GET /api/instances/users/`

## Overview

- **Priority:** P2
- **Status:** complete
- **Description:** Single Python script using `requests` to seed 99 workspaces
- **Script location:** `Temp/plans/260303-1625-seed-test-workspaces/seed-test-workspaces.py`
<!-- Updated: Validation Session 1 - Script location changed to plan directory -->

## Requirements

### 99 Departments (workspace data)

Vietnamese bank departments — examples:

- IT Development, IT Infrastructure, IT Security, IT Operations, IT Support
- Retail Banking, Corporate Banking, Investment Banking, Private Banking
- Risk Management, Credit Risk, Market Risk, Operational Risk
- Finance & Accounting, Treasury, Internal Audit, Compliance
- Human Resources, Training, Legal, Marketing, PR & Communications
- Branch Operations, ATM & Card Services, Digital Banking, e-Banking
- Trade Finance, Foreign Exchange, Loan Processing, Debt Recovery
- Customer Service, Call Center, VIP Services
- Facilities, Procurement, General Affairs, Secretary Office
- Anti-Money Laundering, Fraud Prevention, Data Analytics, Business Intelligence
- Project Management Office, Quality Assurance, Change Management
- ... (fill to 99 with realistic bank departments)

### 5-7 Projects per workspace

Each workspace gets realistic project names. Examples:

- "IT Development" → "Core Banking Upgrade", "Mobile App v3", "API Gateway", "CI/CD Pipeline", "Security Audit Q1"
- "HR" → "Recruitment Portal", "Performance Review System", "Training LMS", "Employee Self-Service", "Payroll Integration"

### User distribution

| Pattern            | Count  | Users         | Roles                        |
| ------------------ | ------ | ------------- | ---------------------------- |
| Full team          | ~20 ws | All 5 users   | 1 Admin, 2 Members, 2 Guests |
| Medium team        | ~40 ws | 2-3 users     | 1 Admin, 1-2 Members         |
| Small/restricted   | ~30 ws | 1 user only   | Admin                        |
| Edge: 0 projects   | 1 ws   | 2 users       | Member                       |
| Edge: many members | 1 ws   | All 5 + owner | All Admin                    |

### Owner rotation

Rotate `sh10000001-05@swing.shinhan.com` as workspace owners (admin creates, then transfers or owner creates).

Note: Since API creates workspace as the authenticated admin user, the owner will be duong@shinhan.com. Admin user (duong@shinhan.com) is also explicitly added as Admin member to ALL 99 workspaces. Then add mock users as members.

## Implementation Steps

1. **Define data**: 99 department dicts with name, slug, project list
2. **Auth**: POST form to `/auth/admin/sign-in/` with admin creds, capture `admin-session-id` cookie
3. **Get or create mock users**: GET `/api/instances/users/?search=swing.shinhan.com` to find existing mock users. For any missing users (format: sh+8digits@swing.shinhan.com), create them via the admin API before proceeding.
<!-- Updated: Validation Session 1 - Create users if not existing -->
4. **Create workspaces**: Loop 99 departments, POST to `/api/instances/workspaces/`
   - Skip on 409/duplicate slug error
   - Print progress: `[1/99] Created: IT Development (it-development)`
5. **Create projects**: For each workspace, POST to `/api/workspaces/{slug}/projects/`
   - Fields: name, identifier (3-5 char), network=2
   - Skip on duplicate identifier error
6. **Add members**: Based on distribution pattern, POST to `/api/instances/users/{userId}/workspaces/`
7. **Summary**: Print total created/skipped/failed

## Script structure

```python
#!/usr/bin/env python3
"""Seed 99 bank department workspaces for testing."""

import requests
import sys

API_BASE = "http://localhost:8000"
ADMIN_EMAIL = "duong@shinhan.com"
ADMIN_PASSWORD = "Shinhan@1"

DEPARTMENTS = [
    {"name": "...", "slug": "...", "projects": [...]},
    ...
]

MOCK_USER_EMAILS = [f"sh1000000{i}@swing.shinhan.com" for i in range(1, 6)]

def login() -> requests.Session: ...
def get_or_create_mock_users(session) -> dict: ...
def create_workspace(session, dept) -> str | None: ...
def create_projects(session, slug, projects) -> int: ...
def add_members(session, ws_id, user_ids, pattern) -> int: ...
def main(): ...
```

## Success Criteria

- [ ] 99 workspaces created successfully
- [ ] Each has 5-7 projects (except 1 edge case with 0)
- [ ] 5 mock users distributed across workspaces with varied roles
- [ ] Script is idempotent (re-run skips existing)
- [ ] Progress output clear and informative

## Risk Assessment

- API rate limiting: unlikely on localhost, add small delay if needed
- Session expiry: admin session should last for duration of script
- Slug conflicts: handle gracefully with skip

## Todo

- [ ] Write department data (99 entries)
- [ ] Implement auth + API calls
- [ ] Test with 2-3 workspaces first
- [ ] Run full seed
