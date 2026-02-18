---
title: "Time Tracking / Work Log Feature"
description: "Log work by members on issues, compare estimated vs actual time"
status: complete
priority: P1
effort: 16h
branch: preview
tags: [time-tracking, worklog, issues, reporting]
created: 2026-02-18
---

# Time Tracking / Work Log

## Overview
Add time tracking to Plane: worklog entries on issues, time estimates, estimated-vs-actual comparison, reporting. Leverages existing CE stubs and `is_time_tracking_enabled` project flag.

## Phases

| # | Phase | Status | Effort | File |
|---|-------|--------|--------|------|
| 1 | Database & API (Backend) | complete | 4h | [phase-01](phase-01-database-and-api.md) |
| 2 | Types, Constants & i18n | complete | 1.5h | [phase-02](phase-02-types-constants-i18n.md) |
| 3 | Frontend Service & Store | complete | 2h | [phase-03](phase-03-frontend-service-and-store.md) |
| 4 | UI Components (Issue Detail) | complete | 4h | [phase-04](phase-04-ui-components-issue-detail.md) |
| 5 | Time Tracking Reports | complete | 3h | [phase-05](phase-05-time-tracking-reports.md) |
| 6 | Testing & Polish | complete | 1.5h | [phase-06](phase-06-testing-and-polish.md) |

## Key Dependencies
- Existing CE stubs: `apps/web/ce/components/issues/worklog/`
- Project flag: `is_time_tracking_enabled` on Project model
- Activity system: `WORKLOG` type already checked in activity-comment-root.tsx
- Exporter: `issue_worklogs` already in exporter choices

## Architecture
```
IssueWorkLog model (new) ←→ DRF ViewSet ←→ worklog.service.ts ←→ MobX store ←→ CE stub components
Issue.estimate_time (new field) ←→ existing Issue serializer ←→ existing issue store
```

## Validation Log

### Session 1 — 2026-02-18
**Trigger:** Initial plan creation validation
**Questions asked:** 5

#### Questions & Answers

1. **[UX]** The plan stores duration as integer minutes only (manual entry). Should we also include a start/stop timer for real-time tracking?
   - Options: Manual entry only (Recommended) | Manual + live timer | Manual + timer in Phase 2
   - **Answer:** Manual entry only
   - **Rationale:** YAGNI — keeps scope focused, most teams log retroactively. Timer adds complexity (background state, browser tab management) with low ROI.

2. **[Architecture]** Where should the Time Tracking Reports page live in the navigation?
   - Options: Project settings tab (Recommended) | Project-level sidebar tab | Workspace analytics | Skip reports
   - **Answer:** Project-level sidebar tab
   - **Rationale:** Reports are a primary view, not a settings page. Sidebar tab (like Issues, Cycles, Modules) makes it more discoverable and frequently accessible.

3. **[Privacy]** Should admins/managers see ALL members' worklogs, or only aggregated summaries?
   - Options: Full visibility (Recommended) | Aggregated only | Configurable per project
   - **Answer:** Full visibility
   - **Rationale:** Standard for time tracking tools. Admins need audit-level detail. Simplifies implementation.

4. **[Architecture]** The plan adds `estimate_time` (minutes) directly to the Issue model. Separate from existing story point EstimatePoint system?
   - Options: Separate field (Recommended) | Extend EstimatePoint | No time estimates
   - **Answer:** Separate field
   - **Rationale:** Keeps story points and time estimates independent. No risk of breaking existing estimate workflows.

5. **[Scope]** What data should the report show by default?
   - Options: Current cycle/sprint | Last 30 days | All time
   - **Answer:** Current cycle/sprint
   - **Rationale:** Most actionable for sprint reviews. Aligns with agile workflow. Users can change filter for broader view.

#### Confirmed Decisions
- **Manual entry only**: No live timer — simple hours+minutes input
- **Reports as sidebar tab**: Project-level tab alongside Issues, Cycles, Modules
- **Full admin visibility**: Admins see all individual worklog entries
- **Separate estimate_time field**: Independent from story point system
- **Default to current cycle**: Report defaults to active cycle's issues

#### Action Items
- [ ] Phase 5: Change reports from project settings to project sidebar tab
- [ ] Phase 5: Add cycle-based default filter
- [ ] Phase 5: Update route from `/settings/time-tracking/` to project-level tab route

#### Impact on Phases
- **Phase 5**: Reports page moves from project settings to project sidebar tab. Route changes from `/settings/time-tracking/` to `/projects/[id]/time-tracking/`. Default filter = current active cycle. Navigation link goes in project sidebar, not settings sidebar.

### Session 2 — 2026-02-18
**Trigger:** Re-validation to cover remaining unvalidated decisions (API version, CE/EE split, default state)
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 1 uses v1 API endpoints (`/api/v1/workspaces/.../worklogs/`). However, the codebase has legacy v0 (`plane/app/`) and new v1 (`plane/api/`). The existing IssueComment pattern is in v0. Which API version should worklogs use?
   - Options: v0 (plane/app/) (Recommended) | v1 (plane/api/) | Both v0 + v1
   - **Answer:** v0 (plane/app/)
   - **Rationale:** Follow IssueComment pattern exactly. Worklogs are issue sub-resources like comments. Keeps consistency with existing codebase patterns. Less disruption.

2. **[Scope]** Phase 4 modifies CE stubs directly (`apps/web/ce/components/issues/worklog/`). The CE/EE split means EE may have its own implementations. Should we implement in CE (available to all) or create a separate layer?
   - Options: Implement in CE (Recommended) | Create EE-only | Core in CE, advanced in EE
   - **Answer:** Implement in CE
   - **Rationale:** Time tracking available to all editions. Fill in the empty stubs directly. No premium gating needed.

3. **[Assumptions]** The plan assumes `is_time_tracking_enabled` is toggled per-project in project settings. Should time tracking be enabled by default for new projects, or opt-in?
   - Options: Opt-in (disabled by default) | Enabled by default (Recommended) | Workspace-level toggle
   - **Answer:** Enabled by default
   - **Rationale:** Available out of the box. Teams can disable if unwanted. Increases feature discoverability. Existing field defaults to `False` — need to change default to `True`.

#### Confirmed Decisions
- **v0 API layer**: Worklogs in `plane/app/` following IssueComment pattern, NOT `plane/api/`
- **CE implementation**: Fill CE stubs directly, available to all editions
- **Enabled by default**: Change `is_time_tracking_enabled` default from `False` to `True`

#### Action Items
- [ ] Phase 1: Change API location from `plane/api/` to `plane/app/` (views, serializers, urls)
- [ ] Phase 1: Update endpoint paths from `/api/v1/` to `/api/v0/` prefix
- [ ] Phase 1: Add migration to change `is_time_tracking_enabled` default to `True`
- [ ] Phase 3: Update service endpoint URLs to match v0 paths

#### Impact on Phases
- **Phase 1**: All API code goes in `plane/app/views/issue/worklog.py`, `plane/app/serializers/worklog.py`, `plane/app/urls/worklog.py` (NOT `plane/api/`). Endpoint prefix is `/api/` not `/api/v1/`. Add migration changing `is_time_tracking_enabled` default to `True`.
- **Phase 3**: Service URLs must match v0 API paths (`/api/workspaces/...` not `/api/v1/workspaces/...`).
- **Phase 4**: Confirmed — implement directly in CE stubs.
