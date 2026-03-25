# Phase 1: Backend — Today Work Items API Endpoint

## Overview

Create a dedicated backend endpoint that returns work items assigned to a specific user that are currently in a valid execution window (start_date ≤ today ≤ due_date) and not in completed/cancelled state groups.

**Priority:** P2 | **Status:** Pending

## Requirements

- Filter issues by `assignees__in=[user_id]`
- Filter by `start_date__lte=today` (started or starting today) — exclude null start_date
- Filter by `target_date__isnull=false` — exclude items with no due date; **include overdue** items (no `target_date__gte` constraint)
- Exclude state groups `completed` and `cancelled`
<!-- Updated: Validation Session 1 - include overdue, exclude null dates -->
- Return `workspace_detail.name` (department), `project_detail.name`, state info, start_date, target_date
- Order by `target_date ASC` (most urgent first)

## Architecture

Reuse the existing `UserProfileIssuesViewSet` pattern at `/api/workspaces/{slug}/user-issues/{userId}/`. Instead of creating a new endpoint, use the **existing endpoint with query parameters** from the frontend. The frontend will pass filters:

- `assignees=[userId]`
- `state_group=backlog,unstarted,started` (exclude completed, cancelled)
- `start_date=;before_including;today` (start_date ≤ today)
- `target_date=;after_including;today` (target_date ≥ today)

### Decision: No new backend endpoint needed

The existing `user-issues` endpoint already supports all required filters. The frontend will construct the filter params. This avoids backend changes entirely.

## Related Files

- `apps/api/plane/app/views/workspace/user.py` — `UserProfileIssuesViewSet` (no changes)
- `apps/api/plane/app/urls/workspace.py` — existing URL (no changes)

## Embedded Rules

1. **Rule**: `Issue.issue_objects` for user queries (NOT `Issue.objects`) — already implemented in existing endpoint
2. **Rule**: `workspace__slug` filter — already implemented in existing endpoint

## Implementation Steps

1. **No backend changes** — the existing `GET /api/workspaces/{slug}/user-issues/{userId}/` endpoint with query params handles all filtering needs
2. Frontend will pass appropriate filter params (Phase 2)

## Post-Phase Checklist

- [x] Existing endpoint supports assignee filter — verified
- [x] Existing endpoint supports state_group filter — verified (via filter params)
- [x] No new backend code needed — confirmed

## Success Criteria

- Existing API endpoint returns correct data when called with today-filter params
- No new migrations, models, views, or serializers needed
