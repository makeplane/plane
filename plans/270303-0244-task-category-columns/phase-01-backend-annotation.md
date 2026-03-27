# Phase 01: Backend Annotation

## Overview

Annotate `main_task_category_name` and `sub_task_category_name` in the list serializer so the frontend can display category names directly without a separate API call.

**Priority:** High | **Status:** Not Started

## Requirements

- The `IssueListDetailSerializer.to_representation()` must include `main_task_category_name` and `sub_task_category_name` as string fields.
- The backend issue list queryset must use `select_related("main_task_category", "sub_task_category")` to prevent N+1 queries.

## Related Code Files

- Files to modify:
  - `apps/api/plane/app/serializers/issue.py` — `IssueListDetailSerializer.to_representation()` (line ~927)
  - `apps/api/plane/app/views/issue/base.py` — Issue list queryset, add `select_related`

## Embedded Rules

1. **Rule (Backend Views):** Always use `select_related`/`prefetch_related` to prevent N+1 — `.agent/rules/plane-backend-architecture.md` Rule #7.
2. **Rule (Serializers):** Never mix `plane/app/` and `plane/api/` serializers — `.agent/rules/plane-backend-architecture.md`.

## Implementation Steps

1. In `IssueListDetailSerializer.to_representation()` (around line 927), add:
   ```python
   "main_task_category_name": instance.main_task_category.name if instance.main_task_category else None,
   "sub_task_category_name": instance.sub_task_category.name if instance.sub_task_category else None,
   ```
2. In the Issue list view queryset, ensure `select_related("main_task_category", "sub_task_category")` is included. Search for where the issue list queryset is built and add the `select_related`.

## Post-Phase Checklist

- [ ] `main_task_category_name` and `sub_task_category_name` appear in API response for issue list
- [ ] No N+1 queries — verified `select_related` is in place
- [ ] Existing tests still pass

## Success Criteria

- Issue list API returns category names alongside IDs.
