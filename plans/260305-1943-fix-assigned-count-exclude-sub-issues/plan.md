---
title: "Fix Work Items Assigned Count - Exclude Sub-Issues"
description: "Add parent__isnull=True to assigned_issues count queries only; leave pending/completed unchanged"
status: completed
priority: P2
effort: 20m
branch: triho
tags: [backend, django, bugfix, dashboard, profile]
created: 2026-03-05
---

# Fix Work Items Assigned Count - Exclude Sub-Issues

## Overview

"Work items assigned" stat counts ALL issues including sub-issues (child issues with `parent_id`).
Fix: add `parent__isnull=True` to `assigned_issues` count queries only.
**Do NOT touch:** `pending_issues_count`, `completed_issues_count`, distributions.

## Phases

| #   | Phase                             | Status       | File                                                |
| --- | --------------------------------- | ------------ | --------------------------------------------------- |
| 1   | Fix assigned_issues count queries | ✅ completed | [phase-01](./phase-01-fix-assigned-issues-count.md) |

## Affected Files

| File                                         | Lines   | Change                                 |
| -------------------------------------------- | ------- | -------------------------------------- |
| `apps/api/plane/app/views/workspace/base.py` | 292     | + `parent__isnull=True`                |
| `apps/api/plane/app/views/workspace/user.py` | 307–315 | + `project_issue__parent__isnull=True` |
| `apps/api/plane/app/views/workspace/user.py` | 448–457 | + `parent__isnull=True`                |
