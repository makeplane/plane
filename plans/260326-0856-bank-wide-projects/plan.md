---
title: "Bank-wide Projects Menu"
description: "Add 'Bank-wide Projects' sidebar menu for Board of Director workspace, listing all cross-workspace bank-wide projects"
status: completed
priority: P2
effort: 5h
branch: triho
tags: [sidebar, workspace, projects, bank-wide, frontend, backend]
created: 2026-03-26
---

# Bank-wide Projects Menu

## Overview

Add a "Bank-wide Projects" menu item in the workspace sidebar, positioned below the "HO" menu. The menu is only visible in the **Board of Director Workspace** (`is_board_of_director_workspace=true`) and shows all projects across all workspaces that have `is_bank_wide=true`.

## What Already Exists

| Item | Status | Location |
|------|--------|----------|
| `is_bank_wide` model field | ✅ Done | `plane/db/models/project.py:101` |
| Migration 0143 | ✅ Done | `plane/db/migrations/0143_project_is_bank_wide.py` |
| Bank-wide project settings page | ✅ Done | `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/bank-wide/` |
| `BankWideSettingsRoot` toggle component | ✅ Done | `apps/web/ce/components/projects/settings/bank-wide/root.tsx` |
| `is_board_of_director_workspace` flag on workspace | ✅ Done | `packages/types/src/workspace.ts` |
| HO sidebar menu (pattern to follow) | ✅ Done | `packages/constants/src/workspace.ts` |

## What Needs to Be Built

| Item | Phase |
|------|-------|
| Backend: cross-workspace bank-wide projects API endpoint | Phase 1 |
| Frontend: sidebar constants + CE sidebar-item + icon | Phase 2 |
| Frontend: route + page component for bank-wide projects list | Phase 3 |
| Frontend: MobX store + service for bank-wide projects | Phase 3 |

## Implementation Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Backend API Endpoint](./phase-01-backend-api.md) | pending | 1.5h |
| 2 | [Sidebar Navigation Item](./phase-02-sidebar-nav.md) | pending | 1h |
| 3 | [Bank-wide Projects Page](./phase-03-frontend-page.md) | pending | 2.5h |

## Key Decisions

- Menu visibility: same guard as HO — `is_board_of_director_workspace`
- API access: scoped to Board of Director workspace users only (workspace-level permission check)
- URL: `/:workspaceSlug/bank-wide-projects/`
- Backend URL: `/api/workspaces/{slug}/bank-wide-projects/` (returns projects from ALL workspaces)
- Data: cross-workspace `Project.objects.filter(is_bank_wide=True)` — no workspace scoping on result set
- **Page layout**: Grouped by workspace (section per workspace showing its bank-wide projects)
- **Project link**: Navigates to project's own workspace `/{projectWorkspaceSlug}/projects/{projectId}/issues/`
- **Permission**: Backend 403 guard + frontend route redirect (defense in depth)
- **Roles**: ADMIN + MEMBER can view (read-only)

## Validation Log

### Session 1 — 2026-03-26
**Trigger:** Initial plan creation
**Questions asked:** 4

#### Questions & Answers

1. **[UX/Layout]** The plan assumes the bank-wide projects page displays a flat list of project cards grouped by workspace. What layout do you prefer?
   - Options: Grouped by workspace | Flat list sorted by name | Table view
   - **Answer:** Grouped by workspace
   - **Rationale:** Sections per workspace make cross-workspace origin immediately clear; most useful for BoD users tracking bank-wide visibility per workspace.

2. **[Navigation]** When a user clicks a project card on the Bank-wide Projects page, where should they navigate?
   - Options: Project's own workspace issues | Stay in BoD workspace context
   - **Answer:** Project's own workspace issues
   - **Rationale:** Link uses `/{projectWorkspaceSlug}/projects/{projectId}/issues/` — user enters that workspace. Phase 3 project-card.tsx must use `project.workspace_slug`, not the current `workspaceSlug` param.

3. **[Security]** Should the permission guard be enforced at the backend?
   - Options: Backend + frontend guard | Frontend only | Backend only
   - **Answer:** Backend + frontend guard
   - **Rationale:** Defense in depth — server returns 403 for non-BoD workspaces AND frontend hides menu + redirects route. Already planned; confirmed.

4. **[Access]** Who can see the Bank-wide Projects menu?
   - Options: All members (ADMIN + MEMBER) | Admins only
   - **Answer:** All members (ADMIN + MEMBER)
   - **Rationale:** Read-only view; no reason to restrict to admins. Backend `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` already correct.

#### Confirmed Decisions
- Layout: grouped by workspace — Phase 3 root.tsx groups `projects` by `workspace_slug`
- Project links: use `project.workspace_slug` in href — Phase 3 project-card.tsx
- Permissions: ADMIN + MEMBER, both backend and frontend — already in plan, confirmed
- Navigation: user leaves BoD workspace when clicking project — expected, no modal needed

#### Action Items
- [ ] Phase 3 root.tsx: group `projects` array by `workspace_slug` before rendering
- [ ] Phase 3 project-card.tsx: href = `/${project.workspace_slug}/projects/${project.id}/issues/`
- [ ] Phase 3 layout.tsx: add redirect guard if `!currentWorkspace?.is_board_of_director_workspace`

#### Impact on Phases
- Phase 3: Group-by-workspace layout confirmed; project link uses project's own workspace slug
