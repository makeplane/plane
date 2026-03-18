---
title: "Department Auto Join"
description: "Auto Join button in God Mode to join dept manager to workspace projects"
status: complete
priority: P2
effort: 2h
branch: triho
tags: [department, god-mode, project-membership, admin]
created: 2026-03-17
---

# Department Auto Join

Add "Auto Join" button per department in God Mode admin. Joins the department manager to all (or bank-wide) projects in the linked workspace.

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Backend — auto-join endpoint | complete | [phase-01-backend.md](./phase-01-backend.md) |
| 2 | Frontend — service, store, modal, button | complete | [phase-02-frontend.md](./phase-02-frontend.md) |

## Scope

- **Who**: `Department.manager` only (single user)
- **Projects**: All in linked workspace (mode=`all_projects`) OR `is_bank_wide=True` (mode=`bank_wide_projects`)
- **Role**: Admin (role=20)
- **Guard**: Button disabled when `!linked_workspace` or `!manager`
- **Access**: God Mode admin only
- **Response**: `{ newly_added, already_member, total }`
