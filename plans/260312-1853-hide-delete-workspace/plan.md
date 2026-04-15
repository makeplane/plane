---
title: "Hide Delete Workspace Function"
description: "Remove 'Delete this workspace' section from workspace settings UI"
status: complete
priority: P2
effort: 15m
branch: triho
tags: [ui, workspace, settings, ce]
created: 2026-03-12
---

# Hide Delete Workspace Function

## Overview

Hide the "Delete this workspace" UI section from workspace settings page by modifying the CE component to return null.

## Target URL

`/[workspace-slug]/settings/` → General settings page

## Component Hierarchy

```
WorkspaceDetails (core/) → renders <DeleteWorkspaceSection>
  └── DeleteWorkspaceSection (ce/) ← MODIFY THIS
        └── DeleteWorkspaceModal (ce/)
              └── DeleteWorkspaceForm (core/)
```

## Phases

| #   | Phase                                                | Status      | File                          |
| --- | ---------------------------------------------------- | ----------- | ----------------------------- |
| 1   | [Hide CE component](./phase-01-hide-ce-component.md) | ✅ complete | phase-01-hide-ce-component.md |

## Validation Log

### Session 1 — 2026-03-12

**Trigger:** Initial plan creation
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** The plan hides the UI only — backend API still allows workspace deletion via direct call. Should we also block it at the backend?
   - Options: UI-only hide | UI + backend block
   - **Answer:** UI-only hide
   - **Rationale:** Keeps change minimal and low-risk; backend remains unchanged.

2. **[Permanence]** Should this be a permanent removal or a re-enableable toggle?
   - Options: Permanent hide | Role-based condition | Feature flag / env var
   - **Answer:** Permanent hide
   - **Rationale:** Unconditional `return null` — simplest implementation, no extra logic.

3. **[Nav]** Should the workspace settings sidebar nav item still appear?
   - Options: Keep nav as-is | No change needed
   - **Answer:** Keep nav as-is
   - **Rationale:** General settings page stays accessible; only delete section is hidden.

#### Confirmed Decisions

- Scope: UI-only — no backend changes
- Permanence: Unconditional null return
- Nav: No sidebar changes

#### Action Items

- [ ] No changes to phase-01 required — plan matches decisions

#### Impact on Phases

- No phase changes required
