---
phase: 3
title: "Backend Serializer + Move Endpoint (GREEN: read-back + move forward)"
status: pending
priority: P1
effort: "1h"
dependencies: [2]
---

# Phase 3: Backend Serializer + Move Endpoint

## Overview

GREEN-phase for: (a) `DraftIssueSerializer` exposing both category IDs in GET responses; (b) `create_draft_to_issue` view forwarding stored categories into Issue create payload when caller omits them.

## Requirements

**Functional:**

- `DraftIssueSerializer.Meta.fields` includes `main_task_category_id` and `sub_task_category_id` (read-back parity with Issue serializers).
- `DraftIssueCreateSerializer` — no change needed; `fields = "__all__"` auto-picks new columns.
- `create_draft_to_issue` — before invoking `IssueCreateSerializer`, merge draft's stored categories into request data if request omitted them.

**Non-functional:**

- No new endpoints. No URL changes. No activity-tracking changes (categories are not activity-tracked on Issue currently — verify).

## Architecture

`DraftIssueSerializer` is the explicit read serializer used by list/retrieve endpoints. Both ID fields will be exposed using DRF's `source="main_task_category_id"` shortcut already used for other FKs (`type_id`, `state_id` etc — verify pattern in file).

Move-endpoint forward pattern (per V2 — null/missing both trigger fill):

```python
draft_issue = self.get_object()
payload = request.data.copy()
if not payload.get("main_task_category_id") and draft_issue.main_task_category_id:
    payload["main_task_category_id"] = str(draft_issue.main_task_category_id)
if not payload.get("sub_task_category_id") and draft_issue.sub_task_category_id:
    payload["sub_task_category_id"] = str(draft_issue.sub_task_category_id)
serializer = IssueCreateSerializer(data=payload, ...)
```

RHF sends explicit `null` on move calls — `not in payload` would never fire. `not payload.get(...)` treats absent/None/empty as "use draft value".

<!-- Updated: Validation Session 1 - V2: null/missing both trigger forward-fill -->

## Related Code Files

- Modify: `apps/api/plane/app/serializers/draft.py` (extend `DraftIssueSerializer.Meta.fields`)
- Modify: `apps/api/plane/app/views/workspace/draft.py` (`create_draft_to_issue` at ~line 206)
- Read for context: `apps/api/plane/app/serializers/issue.py` (verify `IssueCreateSerializer` accepts these IDs in `validated_data`)

## Implementation Steps

1. Read existing field exposure in `DraftIssueSerializer` — confirm `*_id` pattern matches `source="type_id"` style.
2. Add `"main_task_category_id"` and `"sub_task_category_id"` to `Meta.fields` list.
3. In `create_draft_to_issue`:
   - Fetch `draft_issue` instance (already done by viewset).
   - Build mutable payload copy.
   - Apply 2 forward-fill merges using `not payload.get(key)` (per V2 — treats null/missing as "use draft value").
   - Pass merged payload to `IssueCreateSerializer`.
4. Run `python run_tests.py -c -v -k draft_categories` — all Phase 1 tests should pass.
5. Run broader contract suite — `python run_tests.py -c` — verify no regression.

## Success Criteria

- [ ] GET draft response includes both category ID fields
- [ ] All 4 Phase 1 tests pass (Green)
- [ ] Move-to-issue with backlog draft + no categories → succeeds (validator skips)
- [ ] Move-to-issue with non-backlog draft + stored categories → succeeds (forward fills payload)
- [ ] No regression in full contract suite

## Risk Assessment

- **Risk:** `request.data` is immutable (QueryDict). Need `.copy()`.
  - **Mitigation:** Use `request.data.copy()` — standard DRF pattern.
- **Risk:** Caller wants to explicitly clear category on move (rare).
  - **Mitigation:** Accepted — V2 decision treats null as "use draft value". Caller must POST a different category ID to override.
- **Verified:** `IssueCreateSerializer` accepts `main_task_category_id` / `sub_task_category_id` (PrimaryKeyRelatedField with `source=` shortcut, `issue.py:101,107`). No naming mismatch.
