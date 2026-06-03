---
title: "Bulk Delete Member via Excel in God Mode"
status: completed
created: 2026-06-03
branch: trihob6
---

# Bulk Delete Member via Excel in God Mode

Add a "Bulk Delete" tab to the existing `/workspace/bulk-assign` page in god-mode.
Admins upload an Excel file (`workspace_slug`, `user_id`) to remove members from workspaces in bulk.

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Backend endpoint | pending | [phase-01-backend-endpoint.md](phase-01-backend-endpoint.md) |
| 2 | Frontend components | pending | [phase-02-frontend-components.md](phase-02-frontend-components.md) |
| 3 | Integration & wiring | pending | [phase-03-integration-wiring.md](phase-03-integration-wiring.md) |

## Key Decisions

- **No email** in response — `user_id` only
- **Sole-admin guard**: if user is sole admin in any project → hard-skip row with reason
- **Soft-delete**: `WorkspaceMember.is_active = False` + cascade `ProjectMember.is_active = False`
- Same page as bulk-assign — tab switcher (Bulk Assign | Bulk Delete)
- Excel columns: `workspace_slug`, `user_id` (UUID)
- Row limit 500, file 5 MB (same as assign)
