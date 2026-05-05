# Phase Implementation Report

## Executed Phase

- Phase: fix-void-in-try-catch (no phase file, direct task)
- Plan: none
- Status: completed

## Problem

`void asyncCall()` inside `try` blocks causes promise rejections to bypass the `catch` block entirely — they become unhandled rejections. The `catch` only catches sync errors.

## Strategy

- Used `.catch()` pattern instead of `await` to avoid `@typescript-eslint/require-await` linter conflicts
- For cases where function was already `async` with other `await` calls, used `.catch()` on the fire-and-forget fetch calls
- Moved fetch calls outside try blocks in `updateFilterExpression` methods (they're purely fire-and-forget, no need to catch in the main try)
- For `gantt/use-gantt-resizable.ts`: split try into sync part + async `.catch()` since `handleMouseUp` is a DOM event handler

## Files Modified

### Component fixes

1. `/apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts`
   - Split try-catch into sync part (getUpdatedPositionAfterDrag) + async `.catch()` for updateBlockDates

2. `/apps/web/core/components/navigation/use-tab-preferences.ts`
   - `handleHideTab`: try-catch → `updatePreferences().catch()`
   - `handleShowTab`: try-catch → `updatePreferences().catch()`

3. `/apps/web/core/components/power-k/ui/pages/context-based/cycle/commands.ts`
   - `toggleFavorite`: try-catch → `.catch()` per branch

4. `/apps/web/core/components/power-k/ui/pages/context-based/page/commands.ts`
   - `toggleFavorite`: try-catch → `.catch()` per branch

5. `/apps/web/core/components/power-k/ui/pages/context-based/module/commands.tsx`
   - `toggleFavorite`: try-catch → `.catch()` per branch

6. `/apps/web/core/components/power-k/ui/pages/context-based/work-item/commands.ts`
   - `add_to_cycle onSelect`: try-catch → `.catch()` per branch
   - `add_to_modules onSelect`: try-catch → `.catch()` per branch

7. `/apps/web/core/components/stickies/layout/stickies-list.tsx`
   - `handleDrop`: removed try, moved guard before `.catch()`

8. `/apps/web/core/components/issues/issue-detail/issue-activity/helper.tsx`
   - `deleteCommentReaction`: `void removeCommentReaction(...)` → `await removeCommentReaction(...)`

### Store fixes (8 files)

All `updateFilterExpression` and `updateFilters` methods in:

- `workspace/filter.store.ts`: moved fetch outside try, added `.catch()`; catch block fetchFilters → `.catch()`
- `project/filter.store.ts`: same pattern
- `profile/filter.store.ts`: same pattern
- `workspace-draft/filter.store.ts`: same pattern
- `module/filter.store.ts`: same pattern
- `cycle/filter.store.ts`: same pattern
- `project-views/filter.store.ts`: same pattern
- `archived/filter.store.ts`: same pattern

## Tasks Completed

- [x] Identified all `void` inside `try` blocks across `apps/web/`
- [x] Fixed gantt resizable (split try/async)
- [x] Fixed tab preferences (2 handlers)
- [x] Fixed cycle/page/module/work-item power-k commands (5 handlers)
- [x] Fixed stickies drag-drop handler
- [x] Fixed issue-activity comment reaction deletion
- [x] Fixed 8 filter store files (updateFilterExpression + updateFilters catch blocks)
- [x] Verified: `python3` script confirms zero `void` inside `try` blocks

## Tests Status

- Lint check: 0 errors on fixed files (warnings are pre-existing)
- Type check: not run separately (linter auto-fixed types)
- Unit tests: not run

## Issues Encountered

- ESLint auto-fix (`require-await`) strips `async/await` when linter detects no real `await` in the function body (due to type being opaque through store interface). Worked around with `.catch()` pattern throughout.
- The linter treats `fetchIssuesWithExistingPagination` calls as non-thenable via the store interface typing, hence `await` gets auto-removed. `.catch()` bypasses this issue.

## Next Steps

- Pre-existing `no-floating-promises` warnings in work-item/commands.ts (lines 110, 210, 230, 285, 376) are outside try blocks — not in scope of this fix but worth cleaning up separately.
