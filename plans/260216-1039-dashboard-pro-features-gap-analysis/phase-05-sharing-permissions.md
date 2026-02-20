# Phase 5: Dashboard Sharing/Permissions Enhancement

## Context Links

- Backend views: `apps/api/plane/app/views/analytics_dashboard.py`
- Models: `apps/api/plane/db/models/analytics_dashboard.py`
- Current permission: `WorkSpaceAdminPermission` on all endpoints
- Dashboard detail page: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`

## Overview

- **Priority:** Low
- **Status:** Deferred (Validation Session 1: focus on Phases 1-4 first)
- **Effort:** 5h
- **Description:** Currently only WorkspaceAdmin can access dashboards. Need granular sharing: view-only access for members, share links, and per-dashboard permission levels.

## Key Insights

- Plane already has role-based permissions (Admin, Member, Guest, Viewer)
- `WorkSpaceAdminPermission` is too restrictive for dashboard viewing
- Need distinction between dashboard CRUD (admin) and dashboard viewing (member+)
- Share link = public/workspace-scoped read-only URL with token

## Requirements

### Functional

- Workspace members can VIEW dashboards (not just admins)
- Dashboard owner/admin can set visibility: private, workspace, or shared
- Share modal with link generation (workspace-scoped, read-only)
- Permission indicator on dashboard card (private/shared icon)
- View-only mode enforced for non-owner members

### Non-functional

- Share links expire after configurable period (default: never)
- No public internet access (workspace auth still required)

## Architecture

### Backend

1. New model `AnalyticsDashboardAccess` — tracks per-dashboard permissions
2. New permission class `AnalyticsDashboardPermission` — replaces `WorkSpaceAdminPermission`
3. Visibility field on `AnalyticsDashboard`: `private`, `workspace`, `shared`
4. Share endpoint: generates workspace-scoped share token

### Frontend

1. Share modal component with visibility selector + link copy
2. Permission-aware UI (hide edit/delete for non-owners)
3. Dashboard card shows visibility icon

## Related Code Files

### Modify

- `apps/api/plane/db/models/analytics_dashboard.py` — add visibility field
- `apps/api/plane/app/views/analytics_dashboard.py` — replace permission class, add share endpoint
- `apps/api/plane/app/urls/analytics_dashboard.py` — add share URL
- `apps/web/core/store/analytics-dashboard.store.ts` — add share actions
- `apps/web/core/services/analytics-dashboard.service.ts` — add share methods
- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx` — permission-aware UI
- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-card.tsx` — visibility icon

### Create

- `apps/api/plane/db/migrations/0121_analytics_dashboard_sharing.py`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-share-modal.tsx`

## Implementation Steps

1. **Model changes** — Add `visibility` field to AnalyticsDashboard:
   ```python
   class Visibility(models.TextChoices):
       PRIVATE = "private"
       WORKSPACE = "workspace"
   # Validated: default=WORKSPACE confirmed in Validation Session 1
   visibility = models.CharField(max_length=20, choices=Visibility.choices, default=Visibility.WORKSPACE)
   ```
2. **Migration** — Generate migration for new field
3. **Custom permission class** — `AnalyticsDashboardPermission`:
   - Admin: full CRUD
   - Member: view workspace-visible dashboards, edit own dashboards
   - Viewer/Guest: view workspace-visible dashboards only
4. **Update views** — Replace `WorkSpaceAdminPermission` with new permission class
5. **List view filter** — Filter dashboards by visibility + ownership for non-admins
6. **Share modal** — Component with visibility toggle (private/workspace) and copy link button
7. **Permission-aware UI** — Conditionally render edit/delete buttons based on user role + ownership
8. **Dashboard card icon** — Show lock icon for private, globe icon for workspace

## Todo List

- [ ] Add visibility field to AnalyticsDashboard model
- [ ] Create database migration
- [ ] Create custom AnalyticsDashboardPermission class
- [ ] Update all dashboard views with new permission class
- [ ] Filter dashboard list by visibility + user role
- [ ] Add share endpoint
- [ ] Add service methods for sharing
- [ ] Add store actions for sharing
- [ ] Create share modal component
- [ ] Add visibility icon to dashboard cards
- [ ] Make edit/delete buttons permission-aware
- [ ] Test as admin, member, and viewer roles

## Success Criteria

- Members can view workspace-visible dashboards without admin role
- Private dashboards visible only to owner
- Share modal allows toggling visibility
- Edit/delete UI hidden for non-owners
- No permission escalation vulnerabilities

## Risk Assessment

- **Permission migration**: Changing from admin-only to granular may expose dashboards unintentionally. Mitigation: default visibility is "workspace" matching current behavior where admins already see all.
- **Backward compatibility**: Existing dashboards need default visibility. Mitigation: migration sets default to "workspace".

## Security Considerations

- Permission class must check both workspace membership AND dashboard visibility
- Share tokens scoped to workspace (not public URLs)
- CRUD operations still require admin or owner role
- View-only access prevents widget modifications
