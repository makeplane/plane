---
title: "Seed 99 Bank Department Workspaces"
description: "Python script to seed 99 workspaces with projects and user assignments for testing"
status: complete
priority: P2
effort: 1h
branch: develop
tags: [testing, seed-data, admin]
created: 2026-03-03
---

# Seed 99 Bank Department Workspaces

## Goal

Create a standalone Python script (in plan directory) that uses Plane's API to seed 99 bank department workspaces, each with 5-7 projects and varied user assignments.

## Phases

| #   | Phase                                                  | Status   | Effort |
| --- | ------------------------------------------------------ | -------- | ------ |
| 1   | [Create seed script](./phase-01-create-seed-script.md) | complete | 1h     |

## Key Decisions

- **Script type**: Standalone Python using `requests` library (API calls)
- **Auth**: Form POST to `/auth/admin/sign-in/` → session cookie
- **Owner rotation**: 5 mock SSO users (sh10000001-05)
- **Projects**: 5-7 per workspace, realistic bank project names
- **Members**: Varied distribution (1-5 users per workspace, mixed roles)
- **Admin user**: duong@shinhan.com added as Admin to ALL 99 workspaces
- **Error handling**: Skip existing slugs, continue with progress bar

## Test Coverage Goals

- Pagination: 100 workspaces > 10/page limit
- Search: varied department names (English)
- Multi-select: users assigned to 50-99 workspaces
- Role variety: Admin/Member/Guest distribution
- Edge cases: 1 workspace with 0 projects, 1 with only 1 member

## Validation Log

### Session 1 — 2026-03-03

**Trigger:** Initial plan validation before implementation
**Questions asked:** 6

#### Questions & Answers

1. **[Security]** The script hardcodes credentials (ADMIN_EMAIL, ADMIN_PASSWORD) directly in source. How should sensitive config be handled?
   - Options: Hardcode (local test script) | Environment variables | CLI arguments
   - **Answer:** Hardcode (it's a local test script)
   - **Rationale:** Throwaway seed script, won't be committed to git

2. **[Scope]** The plan targets localhost:8000. Should the script also support remote environments?
   - Options: Localhost only | Configurable base URL
   - **Answer:** Localhost only
   - **Rationale:** YAGNI — local testing script only

3. **[Architecture]** Mock users are sh10000001-05@swing.shinhan.com. Are they already in the DB?
   - Options: Already exist | Script should create them | Skip if missing
   - **Answer:** Other
   - **Custom input:** Email mock format: sh+8digits@swing.shinhan.com. Reuse if existing, create if not.
   - **Rationale:** Script must handle both cases — lookup first, create if missing. Changes implementation to add user creation step.

4. **[Scope]** The plan puts script at Temp/seed-test-workspaces.py. Temp/ is not gitignored.
   - Options: Temp/ is fine | Move to scripts/ | Keep in plan directory
   - **Answer:** Keep in plan directory
   - **Rationale:** Script lives alongside plan files for organization

5. **[Assumptions]** Department names — Vietnamese or English?
   - Options: English | Vietnamese | Mix both
   - **Answer:** English names
   - **Rationale:** Easier debugging and searching

6. **[Scope]** Should the script support --dry-run mode?
   - Options: No, keep simple | Yes, add --dry-run
   - **Answer:** No, keep simple
   - **Rationale:** YAGNI — script already skips duplicates for idempotency

#### Confirmed Decisions

- **Credentials**: Hardcode inline — local-only throwaway script
- **Target**: Localhost only, no remote support
- **Mock users**: Create if missing, reuse if existing (format: sh+8digits@swing.shinhan.com)
- **Script location**: In plan directory alongside plan files
- **Names**: English department names
- **Simplicity**: No --dry-run, no CLI args

#### Action Items

- [ ] Update phase-01: add user creation/lookup logic (create if not exists)
- [ ] Update phase-01: change script output path to plan directory

#### Impact on Phases

- Phase 1: Add user creation step — script must POST to create user API if lookup returns no results. Update script path to plan directory.
