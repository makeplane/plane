---
title: "Email Autocomplete in Workspace Invite Modal"
description: "Add email autocomplete suggestions when inviting people to workspace"
status: pending
priority: P2
effort: 3h
branch: triho
tags: [frontend, workspace, members, autocomplete, ux]
created: 2026-03-04
---

# Email Autocomplete — Workspace Invite Modal

## Overview

Add dropdown autocomplete suggestions when user types email in the "Invite people to collaborate" modal (Settings → Members → Invite).

**Data source:** `WorkspaceMemberStore.workspaceMemberMap` (already in store — no new API needed)
**Pattern:** Follows existing `member-options.tsx` dropdown patterns

## Phases

| #   | Phase               | Status  | File                                            |
| --- | ------------------- | ------- | ----------------------------------------------- |
| 1   | Research & Analysis | ✅ done | [phase-01](./phase-01-research-and-analysis.md) |
| 2   | Implementation      | ✅ done | [phase-02](./phase-02-implementation.md)        |

## Validation Log

### Session 1 — 2026-03-04

**Trigger:** Initial plan creation
**Questions asked:** 4

#### Questions & Answers

1. **[Scope]** Should autocomplete show ALL workspace members or only those not yet members?
   - Options: All workspace members | Exclude existing members
   - **Answer:** All workspace members
   - **Rationale:** User may need email for re-invite with different role; also a UX convenience for copy-pasting emails.

2. **[UX]** When should autocomplete suggestions appear?
   - Options: After 2+ chars | After 1 char | On focus
   - **Answer:** After 2+ characters
   - **Rationale:** Reduces noise; matches existing plan assumption.

3. **[Architecture]** Approve extracting each row into `InvitationFieldRow` component?
   - Options: Yes — create invitation-field-row.tsx | No — keep in fields.tsx
   - **Answer:** Yes — create invitation-field-row.tsx
   - **Rationale:** Required to call per-row hooks (useState, useDebounce). Keeps files under 200 lines.

4. **[UX]** Empty state when no suggestions match?
   - Options: Hide silently | Show 'No members found' message
   - **Answer:** Show 'No members found' message
   - **Rationale:** Explicit feedback confirms search ran but no matches — helps user know their query was processed.

#### Confirmed Decisions

- Suggestion scope: all workspace members (include existing ones)
- Trigger: 2+ characters typed
- Modularization: extract `invitation-field-row.tsx` ✅
- Empty state: show "No members found" text in dropdown

#### Action Items

- [ ] Add "No members found" empty state to `EmailAutocompleteDropdown`

#### Impact on Phases

- Phase 2: Update `email-autocomplete-dropdown.tsx` to render "No members found" when `suggestions.length === 0` (instead of returning null)

---

## Key Files

- **Modify:** `apps/web/core/components/workspace/invite-modal/fields.tsx`
- **Create:** `apps/web/core/components/workspace/invite-modal/email-autocomplete-dropdown.tsx`
- **Reference:** `apps/web/core/components/dropdowns/member/member-options.tsx`
- **Utility:** `apps/web/core/hooks/use-debounce.tsx`
