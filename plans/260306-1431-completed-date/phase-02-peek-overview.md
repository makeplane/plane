# Phase 02 — Peek Overview Properties

**Plan:** [plan.md](./plan.md)

## Overview

| Field       | Value                                                          |
| ----------- | -------------------------------------------------------------- |
| Date        | 2026-03-06                                                     |
| Description | Add read-only `completed_at` property to peek-overview sidebar |
| Priority    | P2                                                             |
| Status      | ⏳ pending                                                     |

## Key Insights

<!-- Updated: Validation Session 3 - CE override confirmed, rewrite steps for CE wrapper -->

- `peek-overview/properties.tsx` is in `core/` — **DO NOT modify directly**
- Must create/extend a CE override in `apps/web/ce/components/issues/peek-overview/`
- Same icon, same i18n key, same formatting logic as Phase 01

## Related Files

- `apps/web/core/components/issues/peek-overview/properties.tsx` — reference only (do not modify)
- `apps/web/ce/components/issues/peek-overview/` — CE override location (investigate existing files)

## Implementation Steps

1. **Explore CE override** — check `apps/web/ce/components/issues/peek-overview/` for existing properties override
2. **Find injection point** — locate where the CE peek-overview properties renders the Due Date row
3. **Add completed_at block** after the Due Date row — use dual condition (same as Phase 01):
   ```tsx
   {issue.completed_at && issue.state?.group === "completed" && ( ... )}
   ```
4. **Add imports** — `renderFormattedDate`, `renderFormattedTime`, `DueDatePropertyIcon` if missing

## Todo

- [ ] Explore `apps/web/ce/components/issues/peek-overview/` to find properties override file
- [ ] Add completed_at property block after Due Date row in CE override
- [ ] Add missing imports

## Success Criteria

- Peek overview shows `completed_at` row consistently with issue detail sidebar

## Risk

- Low — identical change to Phase 01
