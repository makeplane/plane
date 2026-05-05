---
parent: ../plan.md
---

# Phase 01 — Hide CE Component

## Overview

- **Date:** 2026-03-12
- **Priority:** P2
- **Status:** pending
- **Effort:** ~15min

## Context

The "Delete this workspace" section is rendered via a CE-layer component. Per the CE pattern, `core/` must not be modified — but the CE component itself is fair game.

## Key Insights

- `DeleteWorkspaceSection` lives in `ce/` → safe to modify
- Simplest approach: return `null` from the CE component
- No logic removal needed — just UI suppression
- `core/workspace-details.tsx` still imports/renders it but component returns nothing

## Related Files

| File                                                                | Role                                                       |
| ------------------------------------------------------------------- | ---------------------------------------------------------- |
| `apps/web/ce/components/workspace/delete-workspace-section.tsx`     | **MODIFY** — return null                                   |
| `apps/web/core/components/workspace/settings/workspace-details.tsx` | Renders `<DeleteWorkspaceSection>` at line 324 — no change |

## Implementation Steps

1. Open `apps/web/ce/components/workspace/delete-workspace-section.tsx`
2. Replace component body to return `null`
3. Keep file structure valid (no broken imports needed by other files)

### Code Change

**Before** (`delete-workspace-section.tsx`):

```tsx
// full component rendering SettingsBoxedControlItem + DeleteWorkspaceModal
export const DeleteWorkspaceSection = ...
```

**After:**

```tsx
import React from "react";
import { TWorkspace } from "@plane/types";

type Props = { workspace: TWorkspace };

export const DeleteWorkspaceSection: React.FC<Props> = () => null;
```

## Todo

- [ ] Modify `delete-workspace-section.tsx` to return null
- [ ] Verify settings page no longer shows delete section
- [ ] Confirm no TypeScript errors

## Success Criteria

- "Delete this workspace" section absent from `/[slug]/settings/`
- No TS/lint errors
- No other settings sections affected

## Risk Assessment

- **Low** — pure UI suppression, no data/logic changes
- Component still exported with correct type signature → no downstream TS errors

## Security Considerations

- Hiding UI does not prevent API calls — backend still allows deletion if called directly
- If hard-blocking is needed, backend permission check should be added separately

## Next Steps

After implementation: run `/watzup` to review changes, then commit via `/git`.
