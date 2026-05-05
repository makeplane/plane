---
title: "Temporarily Hide Workspace Dashboard"
description: "Remove dashboard nav entries and redirect direct URL access on frontend only"
status: pending
priority: P2
effort: 30m
branch: ngoc-feat/workspaces
tags: [frontend, dashboard, hide, ui]
created: 2026-03-12
---

# Temporarily Hide Workspace Dashboard

## Overview

Hide workspace dashboard from frontend UI without deleting code. Reversible — re-enable by reverting 3 small file edits.

## Entry Points to Hide

| Entry Point             | File                                                                  | Type               |
| ----------------------- | --------------------------------------------------------------------- | ------------------ |
| Sidebar user menu (top) | `apps/web/core/components/workspace/sidebar/user-menu.tsx:33-39`      | Array item removal |
| Sidebar dynamic nav     | `packages/constants/src/workspace.ts:235`                             | Array item removal |
| Direct URL access       | `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/layout.tsx` | Redirect           |

## Phases

| #   | Phase                                                                | Status  | Effort |
| --- | -------------------------------------------------------------------- | ------- | ------ |
| 01  | [Hide Navigation & Redirect Routes](./phase-01-hide-nav-redirect.md) | pending | 30m    |

## Validation Log

### Session 1 — 2026-03-12

**Trigger:** Initial plan validation before implementation
**Questions asked:** 3

#### Questions & Answers

1. **[Approach]** User said 'chỉ cần comment lại' — how should the nav items be hidden?
   - Options: Comment out | Delete the lines
   - **Answer:** Comment out
   - **Rationale:** Ensures reversibility without needing git revert — just uncomment 3 lines

2. **[Scope]** For the layout.tsx redirect — what approach when someone hits /dashboards directly?
   - Options: Redirect to workspace home | Comment out layout, keep Outlet
   - **Answer:** Comment out layout, keep Outlet
   - **Rationale:** URL remains accessible directly; only nav links are hidden. Step 3 (Navigate redirect) is skipped entirely.

3. **[Code Quality]** Should the unused DashboardIcon import in user-menu.tsx be cleaned up?
   - Options: Comment out import too | Keep import as-is
   - **Answer:** Comment out import too
   - **Rationale:** Consistent comment-only approach, avoids lint warnings, easy to restore

#### Confirmed Decisions

- Hide method: comment out (not delete) — easy revert
- layout.tsx: no change — skip Step 3
- DashboardIcon import: comment out alongside the item

#### Action Items

- [ ] Update phase-01 Step 3 to "skip / no change to layout.tsx"
- [ ] Clarify Step 2 includes commenting out the import

#### Impact on Phases

- Phase 01: Step 3 (Navigate redirect) is skipped — layout.tsx untouched. Steps 1 & 2 use comment-out, not deletion.

### Session 2 — 2026-03-12

**Trigger:** Re-validation to fix doc inconsistencies found after Session 1
**Questions asked:** 3

#### Questions & Answers

1. **[Inconsistency]** Phase-01 Success Criteria still said URL redirects, but Step 3 was skipped — should it be corrected?
   - Options: Fix it | Keep as-is
   - **Answer:** Fix it
   - **Rationale:** Success criteria must match actual implementation to avoid confusion during verification

2. **[Revert docs]** Revert Instructions listed step 3 (layout.tsx) which won't be modified — remove?
   - Options: Remove step 3 | Keep for reference
   - **Answer:** Remove step 3
   - **Rationale:** Revert instructions should only list files actually changed

3. **[Next step]** Ready to implement?
   - Options: Implement now | More changes first
   - **Answer:** Other — "đợi kiểm tra lại" (wait, re-check first)
   - **Custom input:** đợi kiểm tra lại
   - **Rationale:** User wants to review plan further before starting implementation

#### Confirmed Decisions

- Success criteria corrected: direct URL stays accessible, only nav hidden
- Revert instructions trimmed to 2 steps
- Implementation on hold pending user review

#### Action Items

- [x] Fix Success Criteria in phase-01
- [x] Remove step 3 from Revert Instructions in phase-01
- [ ] User to confirm readiness before implementing

#### Impact on Phases

- Phase 01: doc fixes applied — no logic changes

### Session 3 — 2026-03-12

**Trigger:** Re-validation — user returned to check plan before implementing
**Questions asked:** 2

#### Questions & Answers

1. **[Readiness]** The plan has 2 prior validation sessions. Both entry points are clear (workspace.ts + user-menu.tsx, comment-out only). Ready to implement?
   - Options: Yes, implement now | Review plan first | Scope change needed
   - **Answer:** Review plan first
   - **Rationale:** User wants to re-read phase-01 before starting implementation

2. **[Import check]** Should we also check if DashboardIcon is used elsewhere in user-menu.tsx before commenting it out?
   - Options: Yes, verify first | No, just comment it out
   - **Answer:** Yes, verify first
   - **Rationale:** Confirm DashboardIcon is only referenced by the dashboard item before commenting the import

#### Confirmed Decisions

- Implementation on hold: user reviewing plan first
- DashboardIcon: grep user-menu.tsx before commenting import

#### Action Items

- [ ] User reviews phase-01-hide-nav-redirect.md
- [ ] Grep `DashboardIcon` in `user-menu.tsx` to confirm no other usages before commenting import
- [ ] Confirm readiness after review

#### Impact on Phases

- Phase 01: add note to Step 2 — verify DashboardIcon has no other usages before commenting import
