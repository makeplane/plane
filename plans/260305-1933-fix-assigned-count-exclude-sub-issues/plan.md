---
title: "Fix Work Items Assigned Count - Exclude Sub-Issues"
description: "Add parent__isnull=True filter to assigned issues count queries so sub-issues are excluded"
status: pending
priority: P2
effort: 30m
branch: triho
tags: [backend, django, profile, dashboard, bugfix]
created: 2026-03-05
---

# Fix Work Items Assigned Count - Exclude Sub-Issues

## Overview

Currently "Work items assigned" stat counts ALL issues assigned to a user, including sub-issues (child issues with a parent). The fix adds `parent__isnull=True` filter to exclude sub-issues from the count.

## Phases

| #   | Phase                     | Status     | File                                                |
| --- | ------------------------- | ---------- | --------------------------------------------------- |
| 1   | Fix Backend Count Queries | ⏳ pending | [phase-01](./phase-01-fix-backend-count-queries.md) |

## Validation Log

### Session 1 — 2026-03-05

**Trigger:** Initial plan validation before implementation
**Questions asked:** 2

#### Questions & Answers

1. **[Scope]** The plan fixes ALL assigned-related counts (assigned + pending + completed). Should pending/completed counts also exclude sub-issues, or only the "assigned" count?
   - Options: All 3 counts | Assigned count only
   - **Answer:** All 3 counts
   - **Rationale:** Consistency — pending/completed are derived views of assigned issues; filtering sub-issues from all avoids confusing discrepancies between the stats.

2. **[Scope]** The state_distribution and priority_distribution queries also include sub-issues. Should these be fixed too?
   - Options: No, keep as-is | Yes, fix distributions too
   - **Answer:** No, keep as-is
   - **Rationale:** Out of scope — user request is specifically the count stat only.

#### Confirmed Decisions

- Fix all 3 assigned-related counts (assigned, pending, completed) with `parent__isnull=True`
- Leave state/priority distribution queries unchanged

#### Action Items

- [x] Plan already covers all 3 counts — no changes needed

#### Impact on Phases

- No phase changes required — plan already aligned with decisions

---

## Affected Files

- `apps/api/plane/app/views/workspace/base.py` — dashboard assigned count (line 292)
- `apps/api/plane/app/views/workspace/user.py` — profile stats counts (lines 307-315, 448-481)
