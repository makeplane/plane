# Phase 02 — Backend Tolerance Check ✅ Pre-verified

<!-- Updated: Validation Session 3 - SKIPPED; evidence already in Phase 1 Key Insights -->

## Context

- Plan: [plan.md](./plan.md)
- Phase 1: [phase-01-frontend-validation.md](./phase-01-frontend-validation.md)
- Serializer: `apps/api/plane/app/serializers/issue.py` — `IssueCreateSerializer`
- View: `apps/api/plane/app/views/issue/base.py` — `IssueViewSet.create`
- Model: `apps/api/plane/db/models/issue.py` — `Issue`

## Overview

Verify that backend handles workitem creation with null `start_date`, `target_date`, and empty `assignee_ids` without errors in all downstream flows. This is a verification phase — likely no code changes needed.

## Key Insights

1. **IssueCreateSerializer** — all relevant fields are `required=False`:
   - `state_id`: `required=False, allow_null=True`
   - `assignee_ids`: `required=False`
   - `label_ids`: `required=False`
   - `parent_id`: `required=False, allow_null=True`
2. **Issue model** — `start_date` and `target_date` are `DateField(null=True, blank=True)` (nullable)
3. **Assignees** — stored via `IssueAssignee` M2M; empty list = no assignees (valid state)
4. **Date validation** in serializer only triggers when BOTH dates are non-null (line 135-140)

## Verification Checklist

- [ ] `Issue` model: confirm `start_date`, `target_date` are `null=True`
- [ ] `IssueCreateSerializer.validate()`: confirm no required-field checks beyond date ordering
- [ ] Activity logging (`issue_activity.delay`): confirm handles null dates without crash
- [ ] Notification system: confirm handles empty assignee list
- [ ] Workflow checker (`check_workflow_creation`): confirm doesn't enforce field requirements
- [ ] `IssueVersion` model: confirm nullable fields match `Issue`

## Expected Outcome

No backend code changes. All fields are already optional at DB and serializer level. The frontend was the only layer enforcing required fields.

## Contingency

If any downstream task (activity logging, notifications) crashes on null dates or empty assignees:

- Add null guards in the specific Celery task
- Do NOT add required-field enforcement to the serializer (defeats the purpose)

## Todo

- [ ] Read `Issue` model field definitions for `start_date`, `target_date`
- [ ] Grep activity/notification tasks for date/assignee assumptions
- [ ] Test API call: `POST /api/workspaces/{slug}/projects/{pid}/issues/` with only `name` + `state_id` (backlog state)
- [ ] Verify response is 201 with correct data
