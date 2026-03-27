# Phase 03: Column Components & Registration

## Overview

Create two new spreadsheet column components (`SpreadsheetMainTaskCategoryColumn`, `SpreadsheetSubTaskCategoryColumn`) and register them in the `SPREADSHEET_COLUMNS` mapping.

**Priority:** High | **Status:** Not Started

## Requirements

- Two new column components, one for each category, following the existing **sortable** column pattern (check an existing sortable column like `project_name` for the sort indicator pattern). <!-- Updated: Validation Session 1 - sortable + filterable -->
- Columns must display the category **name** (not ID). Since the backend will annotate `main_task_category_name`/`sub_task_category_name` in Phase 01, the columns read directly from the `issue` prop.
- Register both in `SPREADSHEET_COLUMNS` map and the barrel export.

## Related Code Files

- Files to create:
  - `apps/web/ce/components/issues/spreadsheet/columns/main-task-category-column.tsx`
  - `apps/web/ce/components/issues/spreadsheet/columns/sub-task-category-column.tsx`
- Files to modify:
  - `apps/web/ce/components/issues/spreadsheet/columns/index.ts` — Add exports
  - `apps/web/ce/components/issues/issue-layouts/utils.tsx` — Add to `SPREADSHEET_COLUMNS` map and imports

## Embedded Rules

1. **Rule (CE Pattern):** CE components go in `apps/web/ce/`, never in `core/` — `.agent/rules/plane-design-system.md`.
2. **Rule (Semantic Tokens):** Use `text-secondary` for column text — `.agent/rules/color-tokens.md`.
3. **Rule (observer):** Wrap MobX-reading components in `observer()` — `.agent/rules/mobx-stores.md`.
4. **Rule (Component Files):** Components <150 lines, kebab-case filenames — `AGENTS.md`.

## Implementation Steps

1. Create `main-task-category-column.tsx`:

   ```tsx
   import { observer } from "mobx-react";
   import type { TIssue } from "@plane/types";
   import { Row } from "@plane/ui";

   type Props = {
     issue: TIssue;
     onClose: () => void;
     onChange: (issue: TIssue, data: Partial<TIssue>, updates: Record<string, unknown>) => void;
     disabled: boolean;
   };

   export const SpreadsheetMainTaskCategoryColumn = observer(function SpreadsheetMainTaskCategoryColumn({
     issue,
   }: Props) {
     return (
       <Row className="flex h-11 w-full cursor-default items-center border-b-[0.5px] border-subtle px-2 text-11 hover:bg-layer-1 group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10">
         <span className="truncate text-secondary">{issue.main_task_category_name ?? "—"}</span>
       </Row>
     );
   });
   ```

2. Create `sub-task-category-column.tsx` — same pattern but reads `issue.sub_task_category_name`.

3. Add exports to `index.ts`.

4. In `utils.tsx`, import both components and add entries:
   ```typescript
   main_task_category: SpreadsheetMainTaskCategoryColumn,
   sub_task_category: SpreadsheetSubTaskCategoryColumn,
   ```

## Post-Phase Checklist

- [ ] Both column files exist and export correctly
- [ ] `SPREADSHEET_COLUMNS` map includes both entries
- [ ] Components follow existing pattern (observer, Row, semantic tokens)
- [ ] No TypeScript errors

## Success Criteria

- Both columns render the category name for each work item in the spreadsheet view.
- Columns display "—" when no category is set.
- Both columns appear in the Display Properties toggle button.
