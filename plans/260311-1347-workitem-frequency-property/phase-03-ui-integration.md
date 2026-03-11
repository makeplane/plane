# Phase 3: UI Component and Integration

## Context

- [Plan](./plan.md) | Phase 3 of 3
- Depends on: [Phase 2 Types](./phase-02-types-store-service.md)
- UI pattern reference: `PriorityDropdown` at `apps/web/core/components/dropdowns/priority.tsx`
- Sidebar reference: `apps/web/core/components/issues/issue-detail/sidebar.tsx`

## Overview

Create FrequencyDropdown component, integrate into issue detail sidebar and issue creation modal. Tag-chip style with colored dots, single-select, clearable.

## Key Insights

- PriorityDropdown uses Headless UI `Combobox` + `usePopper` + `ComboDropDown` wrapper
- Sidebar uses `SidebarPropertyListItem` with icon + dropdown pattern
- Sidebar is in `core/` - we CAN modify it (it's not a store, it's a layout component)
- Issue modal additional properties: CE file `modal-additional-properties.tsx` currently returns null - perfect extension point
- FrequencyDropdown is simpler than PriorityDropdown (no urgency highlighting, just colored dots)
- Need a frequency icon - use `RefreshCw` from lucide-react or create a simple one

## Requirements

- [x] FrequencyDropdown: single-select, searchable, clearable, colored dots
- [x] Sidebar integration via SidebarPropertyListItem
- [x] Issue modal integration via CE modal-additional-properties
- [x] Component <150 lines

## Architecture

```
New files:
  apps/web/ce/components/dropdowns/frequency.tsx       - FrequencyDropdown (~140 lines)  <!-- Updated: Validation Session 1 - moved from core/ to ce/ -->

Modified files:
  apps/web/core/components/issues/issue-detail/sidebar.tsx - Add frequency property row
  apps/web/ce/components/issues/issue-modal/modal-additional-properties.tsx - Add to modal
```

## Implementation Steps

### 1. FrequencyDropdown (`apps/web/ce/components/dropdowns/frequency.tsx`)

<!-- Updated: Validation Session 1 - moved from core/ to ce/ for EE overridability -->

Pattern: simplified PriorityDropdown with colored dot indicators instead of priority icons.

```typescript
// Key props
type Props = TDropdownProps & {
  onChange: (val: TIssueFrequency | null) => void;
  value: TIssueFrequency | null | undefined;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
};
```

Key implementation details:

- Import `ISSUE_FREQUENCIES` from `@plane/constants`
- Import `TIssueFrequency` from `@plane/types`
- Use `Combobox` from `@headlessui/react` (same as PriorityDropdown)
- Use `ComboDropDown` from `@plane/ui`
- Use `usePopper`, `useDropdown` hooks (same pattern)
- Each option renders: colored dot (8px circle) + label text
- Button renders: colored dot + selected text (or "None" placeholder)
- Support clearable: include a "None" option that sets value to `null`
- Transparent button variant for sidebar, border variant for other contexts
- **Icon:** Use `RefreshCw` from `lucide-react` <!-- Updated: Validation Session 1 -->

Colored dot rendering:

```tsx
<span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: frequencyItem.color }} />
```

### 2. Sidebar Integration (`apps/web/core/components/issues/issue-detail/sidebar.tsx`)

Add after the Priority property row (around line 136):

```tsx
import { FrequencyDropdown } from "@/plane-web/components/dropdowns/frequency"; // Updated: Validation Session 1
import { RefreshCw } from "lucide-react"; // Updated: Validation Session 1

<SidebarPropertyListItem icon={RefreshCw} label={t("common.frequency")}>
  <FrequencyDropdown
    value={issue?.frequency}
    onChange={(val) => void issueOperations.update(workspaceSlug, projectId, issueId, { frequency: val })}
    disabled={!isEditable}
    buttonVariant="transparent-with-text"
    className="group w-full grow"
    buttonContainerClassName="w-full text-left h-7.5"
    buttonClassName="text-body-xs-regular"
    dropdownArrow
    dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
  />
</SidebarPropertyListItem>;
```

Note: Add `"common.frequency": "Frequency"` to `apps/web/public/locales/en/common.json`. <!-- Updated: Validation Session 1 - confirmed: use t() key | Session 3 - confirmed exact file path -->

### 3. Issue Modal Integration (`apps/web/ce/components/issues/issue-modal/modal-additional-properties.tsx`)

Currently returns `null`. Update to render frequency selector:

```tsx
import { Controller, useFormContext } from "react-hook-form";
import { FrequencyDropdown } from "@/plane-web/components/dropdowns/frequency"; // Updated: Validation Session 1
import { TIssue } from "@plane/types";

// Updated: Validation Session 2 - use useFormContext instead of prop drilling
export function WorkItemModalAdditionalProperties(props: TWorkItemModalAdditionalPropertiesProps) {
  const { projectId } = props;
  const { control } = useFormContext<TIssue>();
  if (!projectId) return null;

  return (
    <Controller
      control={control}
      name="frequency"
      render={({ field: { value, onChange } }) => (
        <FrequencyDropdown
          value={value}
          onChange={onChange}
          buttonVariant="border-with-text"
          className="grow"
          buttonContainerClassName="w-full text-left"
          buttonClassName="text-body-xs-regular"
          placeholder="Frequency"
        />
      )}
    />
  );
}
```

Note: `useFormContext<TIssue>()` provides `control` from the parent form \u2014 no prop drilling needed.

### 4. i18n Translation

Check existing i18n files for where to add:

- `"common.frequency": "Frequency"`
- Or use the string directly if i18n patterns in this codebase use a fallback

## Related Files

- `/apps/web/core/components/dropdowns/priority.tsx` - Reference pattern (517 lines, but frequency version ~140 lines)
- `/apps/web/core/components/dropdowns/types.ts` - TDropdownProps type
- `/apps/web/core/components/dropdowns/constants.ts` - Button variant constants
- `/apps/web/core/components/issues/issue-detail/sidebar.tsx` - Sidebar (277 lines)
- `/apps/web/ce/components/issues/issue-modal/modal-additional-properties.tsx` - Modal CE extension
- `/apps/web/core/components/common/layout/sidebar/property-list-item.tsx` - SidebarPropertyListItem
- `/apps/web/core/hooks/use-dropdown.ts` - Dropdown behavior hook

## Todo

- [x] Create `apps/web/ce/components/dropdowns/frequency.tsx` <!-- Updated: Validation Session 1 -->
- [x] Add frequency row to sidebar.tsx (after priority)
- [x] Update CE modal-additional-properties.tsx with frequency controller
- [x] Add i18n key for "Frequency" if needed
- [x] Verify lint passes: `pnpm check:lint`
- [x] Verify format: `pnpm check:format`
- [x] Manual test: sidebar shows frequency, modal shows frequency, value persists

## Success Criteria

- FrequencyDropdown renders colored dots with labels
- Single-select: clicking option sets value, clicking again or "None" clears
- Sidebar displays frequency property with correct value
- Issue modal includes frequency in creation form
- Value saved via API and persists on reload
- Component under 150 lines

## Risk Assessment

- **Low**: Additive UI, no existing component modifications beyond sidebar row insertion
- Sidebar.tsx modification is small (add one `SidebarPropertyListItem` block)
- CE modal file currently returns null, safe to populate

## Security Considerations

- Dropdown values constrained to ISSUE_FREQUENCIES constant
- onChange passes typed TIssueFrequency | null

## Unresolved Questions

1. **Icon**: Is there a `FrequencyPropertyIcon` in `@plane/propel/icons`? If not, use `RefreshCw` from lucide-react as a reasonable default. Can create custom icon later.
2. **i18n**: Need to verify the i18n file location and key format for adding "Frequency" translation.
3. **Spreadsheet/Kanban columns**: Should frequency be a groupable/sortable property in list/kanban views? Deferred to future iteration per YAGNI.
4. **Filter support**: Should frequency be filterable in issue list views? Deferred to future iteration.
