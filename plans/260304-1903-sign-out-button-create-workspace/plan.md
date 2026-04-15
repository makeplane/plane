---
title: "Sign Out Button in Create Workspace Page"
description: "Add a Sign Out button to the header of the create-workspace page"
status: complete
priority: P3
effort: 15m
branch: triho
tags: [ui, auth, create-workspace]
created: 2026-03-04
---

# Sign Out Button — Create Workspace Page

## Overview

Add a "Sign out" button to the header of `/create-workspace` so users can log out from that page.

## Phases

| #   | Phase                                                                | Status   | File                                           |
| --- | -------------------------------------------------------------------- | -------- | ---------------------------------------------- |
| 1   | [Implement Sign Out button](./phase-01-implement-sign-out-button.md) | complete | `apps/web/app/(all)/create-workspace/page.tsx` |

## Validation Log

### Session 1 — 2026-03-04

**Trigger:** Initial plan creation validation
**Questions asked:** 3

#### Questions & Answers

1. **[UI]** What button style should the Sign Out button use in the header?
   - Options: link-danger | neutral-link | secondary
   - **Answer:** link-danger (red text link)
   - **Rationale:** Visually distinct, signals destructive action without being prominent

2. **[UX]** Should the button show a loading/disabled state while the sign-out request is in-flight?
   - Options: No (keep it simple) | Yes (disable button while signing out)
   - **Answer:** No (keep it simple)
   - **Rationale:** Sign-out is near-instant; KISS principle applies

3. **[i18n]** Should the sign-out follow the sidebar pattern and use the i18n key t("sign_out") with a LogOut icon?
   - Options: Yes — use t("sign_out") + LogOut icon | No — plain text, no icon
   - **Answer:** Yes — use t("sign_out") + LogOut icon
   - **Rationale:** Consistent with existing sidebar sign-out pattern; i18n-ready

#### Confirmed Decisions

- Button variant: `link-danger`
- Loading state: none
- Label: `t("sign_out")` with `LogOut` icon from lucide-react

#### Action Items

- [x] Update phase-01 with confirmed styling decisions

#### Impact on Phases

- Phase 1: Update implementation steps with correct variant, icon, i18n key

---

## Key Facts

- Single file change: `apps/web/app/(all)/create-workspace/page.tsx`
- `useUser()` already imported; exposes `signOut` action
- Pattern from `switch-account-modal.tsx`: `await signOut()` → `router.push("/")`
- No new files, no new dependencies
