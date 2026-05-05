---
title: "Time Tracking Default ON"
description: "Enable time tracking by default for new+existing projects, gate Log Time button on feature flag"
status: complete
priority: P2
effort: 2h
branch: develop
tags: [time-tracking, migration, feature-flag]
created: 2026-03-17
---

# Time Tracking Default ON

## Overview

Three changes: (1) data migration to enable time tracking on all existing projects, (2) gate "Log Time" button + worklog property on `is_time_tracking_enabled`, (3) verify default=True for new projects (already done in model).

## Current State

- Model field `is_time_tracking_enabled` already defaults to `True` (since migration 0124)
- Old projects created before migration 0124 may have `is_time_tracking_enabled=False`
- "Log Time" button visibility checks role/assignment but NOT the feature flag
- Worklog property in sidebar/peek-overview does NOT check feature flag
- Sidebar nav + time-tracking layout already gate on the flag
- Backend API already rejects worklog CRUD when flag is off

## Phases

| #   | Phase                                                                                   | Effort | Status   |
| --- | --------------------------------------------------------------------------------------- | ------ | -------- |
| 1   | [Backend: Data Migration](phase-01-backend-data-migration.md)                           | 0.5h   | complete |
| 2   | [Frontend: Gate Log Time Button + Worklog Property](phase-02-frontend-gate-log-time.md) | 1.5h   | complete |

## Dependencies

- Phase 1 and 2 are independent, can be done in parallel
- No external dependencies

## Risk

- Data migration is one-way; projects explicitly set to OFF will be overridden
- Low risk: migration uses raw SQL, fast even for large datasets
