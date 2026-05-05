---
title: "God Mode Monitoring Dashboard"
description: "Admin dashboard for monitoring email workers, Celery tasks, and system health"
status: complete
priority: P2
effort: 6h
branch: develop
tags: [god-mode, monitoring, celery, email]
created: 2026-03-11
---

# God Mode Monitoring Dashboard

## Overview

Phase 1 monitoring dashboard for God Mode admin app. Uses ONLY existing infrastructure (no new packages). Provides visibility into email delivery, scheduled jobs, and Celery worker health.

## Architecture

```
/api/instances/monitoring/
  email-logs/       -> EmailNotificationLog query (paginated)
  scheduled-jobs/   -> PeriodicTask query
  worker-health/    -> Celery Inspect API

/monitoring (admin frontend)
  Tab: Issue Email Logs | Scheduled Jobs | Worker Health
```

## Phases

| #   | Phase                                                  | Effort | Status   |
| --- | ------------------------------------------------------ | ------ | -------- |
| 1   | [Backend API](./phase-01-backend-api.md)               | 2.5h   | complete |
| 2   | [Frontend Dashboard](./phase-02-frontend-dashboard.md) | 3.5h   | complete |

## Key Dependencies

- `EmailNotificationLog` model (`plane.db.models.notification`)
- `django-celery-beat` `PeriodicTask` model (already installed)
- `plane.celery.app` for Inspect API
- `@plane/propel/*` UI components
- `BaseAPIView` + `InstanceAdminPermission` for admin-only access

## Constraints

- No new packages
- CE pattern: new files in `ce/` or existing license module
- Files <200 lines, components <150 lines
- Admin-only (InstanceAdminPermission, role >= 15)
- Pagination for email logs (50/page)
- Auto-refresh worker health every 30s

## Research

- [God Mode Patterns](./research/researcher-01-godmode-patterns.md)
- [Backend Infrastructure](./research/researcher-02-backend-infrastructure.md)

## Validation Log

### Session 1 — 2026-03-11

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Scope]** EmailNotificationLog only tracks issue-update email notifications (from email_notification_task.py). Other emails like magic link, invitations, worklog reminders are NOT logged here. The 'Email Logs' tab would only show a subset of all emails sent. How should we handle this?
   - Options: Show only EmailNotificationLog (Recommended) | Create a new EmailSendLog model | Skip Email Logs tab entirely
   - **Answer:** Show only EmailNotificationLog (Recommended)
   - **Rationale:** Phase 1 uses what's available. Tab renamed to "Issue Email Logs" for clarity. Broader email logging is future enhancement.

2. **[Scope]** Should admins be able to enable/disable scheduled jobs from the dashboard in Phase 1, or keep it read-only?
   - Options: Read-only display (Recommended) | Add enable/disable toggle | Add run-now button too
   - **Answer:** Read-only display (Recommended)
   - **Rationale:** Phase 1 is monitoring only. Mutations add risk and complexity. Toggle in future phase.

3. **[Architecture]** Where should the frontend MonitoringService be created? Research found two patterns in the codebase.
   - Options: packages/services/ (Recommended) | apps/admin/services/
   - **Answer:** packages/services/ (Recommended)
   - **Rationale:** Follows instance-level service pattern (InstanceWorkspaceService). Reusable across apps.

4. **[Architecture]** The plan caches worker-health for 30s server-side AND auto-refreshes 30s client-side. This means worst case 60s stale data. Is this acceptable?
   - Options: 30s cache + 30s refresh = OK (Recommended) | Remove server cache, keep 30s client refresh | 15s client refresh, no server cache
   - **Answer:** 30s cache + 30s refresh = OK (Recommended)
   - **Rationale:** Acceptable staleness for monitoring. Reduces Celery Inspect API load.

#### Confirmed Decisions

- Email Logs scope: Show existing EmailNotificationLog only, rename tab to "Issue Email Logs"
- Scheduled Jobs: Read-only in Phase 1, no mutations
- Service location: `packages/services/src/instance/monitoring.service.ts`
- Caching: 30s server + 30s client refresh — confirmed

#### Action Items

- [ ] Rename "Email Logs" to "Issue Email Logs" throughout plan and code
- [ ] Ensure tab description clarifies this tracks issue notification emails only

#### Impact on Phases

- Phase 1: Rename email-logs endpoint description to clarify scope (issue notification emails only)
- Phase 2: Rename tab label "Email Logs" → "Issue Email Logs", update wireframes, update types
