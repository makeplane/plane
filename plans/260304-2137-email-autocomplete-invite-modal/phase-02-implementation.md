# Phase 02 — Implementation

## Context Links

- Plan: [plan.md](./plan.md)
- Research: [phase-01](./phase-01-research-and-analysis.md)
- Target: `apps/web/core/components/workspace/invite-modal/fields.tsx`
- Reference: `apps/web/core/components/dropdowns/member/member-options.tsx`

## Overview

- **Priority:** P2
- **Status:** ⏳ Pending
- **Description:** Add email autocomplete dropdown to invite modal's email input fields

## Key Insights

- `useMember()` → `memberRoot.memberMap: Record<string, IUserLite>` (userId → user with email/name/avatar)
- `useMember()` → `workspace.memberMap: Record<string, IWorkspaceMembership>` (userId → membership)
- Combine both to get workspace member user details
- `fields.tsx` is currently 127 lines — adding autocomplete will push ~200+, so extract dropdown to separate file
- Use debounce (300ms) before filtering to avoid excessive re-renders

## Requirements

- Show autocomplete suggestions after user types 2+ characters
- Filter workspace members by email or display_name (case-insensitive)
- Show max 5 suggestions: avatar + display_name + email
- Exclude already-added emails in other invite fields
- Keyboard nav: ArrowUp/Down to highlight, Enter to select, Escape to close
- Click outside closes dropdown
- Selecting a suggestion fills the email input and closes dropdown
- Show "No members found" message when query has 2+ chars but no matches
- No new API endpoint needed

## Architecture

```
fields.tsx (modified)
└── EmailAutocompleteDropdown (new component)
    ├── Absolute positioned below input
    ├── Filtered IUserLite[] suggestions
    └── Avatar + display_name + email per item
```

## Related Code Files

**Modify:**

- `apps/web/core/components/workspace/invite-modal/fields.tsx`

**Create:**

- `apps/web/core/components/workspace/invite-modal/email-autocomplete-dropdown.tsx`

**Reference (read-only):**

- `apps/web/core/components/dropdowns/member/member-options.tsx` — avatar + name pattern
- `apps/web/core/hooks/use-debounce.tsx` — debounce hook
- `packages/i18n/src/locales/en/translations.ts` — i18n keys location

## Embedded Rules

1. Keep each file under 200 lines — extract to separate component
2. Use `observer()` wrapper for MobX store components
3. Use `cn()` for className merging
4. Use `useTranslation` for all user-visible strings
5. Follow kebab-case for new file names

## Implementation Steps

### Step 1 — Create `email-autocomplete-dropdown.tsx`

Create file: `apps/web/core/components/workspace/invite-modal/email-autocomplete-dropdown.tsx`

```tsx
import { useRef } from "react";
import { IUserLite } from "@plane/types";
import { Avatar } from "@plane/ui";
import { cn } from "@plane/utils";
import { getFileURL } from "@/helpers/file.helper"; // check exact path

type TEmailAutocompleteDropdownProps = {
  suggestions: IUserLite[];
  activeIndex: number;
  onSelect: (email: string) => void;
  onHover: (index: number) => void;
};

// <!-- Updated: Validation Session 1 - show "No members found" when suggestions empty instead of returning null -->
export const EmailAutocompleteDropdown = ({
  suggestions,
  activeIndex,
  onSelect,
  onHover,
}: TEmailAutocompleteDropdownProps) => {
  return (
    <div className="absolute top-full left-0 z-20 mt-1 w-full max-h-48 overflow-y-auto rounded border border-custom-border-200 bg-custom-background-100 shadow-md">
      {suggestions.length === 0 ? (
        <div className="px-3 py-2 text-caption-sm-regular text-custom-text-300">
          {t("workspace_settings.settings.members.modal.no_suggestions")}
        </div>
      ) : (
        suggestions.map((user, i) => (
          <button
            key={user.id}
            type="button"
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left text-body-xs-regular hover:bg-custom-background-80",
              { "bg-custom-background-80": i === activeIndex }
            )}
            onMouseEnter={() => onHover(i)}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(user.email ?? "");
            }}
          >
            <Avatar name={user.display_name} src={getFileURL(user.avatar_url ?? "")} size="sm" />
            <div className="flex flex-col min-w-0">
              <span className="truncate font-medium">{user.display_name}</span>
              <span className="truncate text-custom-text-300 text-caption-sm-regular">{user.email}</span>
            </div>
          </button>
        ))
      )}
    </div>
  );
};
```

> **Note:** `EmailAutocompleteDropdown` is only rendered when `showDropdown && debouncedEmail.length >= 2` — so the "No members found" message only appears after 2+ chars with no matches. Also add i18n key `no_suggestions` to `translations.ts`.

> **Note:** Verify exact `getFileURL` import path by checking `member-options.tsx`.

### Step 2 — Modify `fields.tsx`

Add to existing `InvitationFields`:

**Imports to add:**

```tsx
import { useMemo, useRef, useState } from "react";
import { IUserLite } from "@plane/types";
import useDebounce from "@/hooks/use-debounce";
import { useMember } from "@/hooks/store";
import { useOutsideClickDetector } from "@plane/hooks";
import { EmailAutocompleteDropdown } from "./email-autocomplete-dropdown";
```

**Per-field state (inside the `fields.map` render, using index as key):**

Since we're in a `.map()`, per-field state must be extracted. Add state arrays to the parent `InvitationFields`:

```tsx
// In InvitationFields component body (before return):
const { memberMap, workspace } = useMember();
const [activeDropdownIndex, setActiveDropdownIndex] = useState<number>(-1); // which field has open dropdown
const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);
```

**Per-field autocomplete logic — inside `render` of Controller (email field):**

Extract inline or via a helper. The simplest approach: create a `FieldWithAutocomplete` sub-component (renders one row):

```tsx
// Replace the fields.map body with a FieldRow sub-component
// FieldRow receives: field, index, control, errors, remove, fields, memberMap, workspace.memberMap
```

**Filtering logic per field:**

```tsx
const debouncedEmail = useDebounce(value, 300);

const suggestions: IUserLite[] = useMemo(() => {
  if (!debouncedEmail || debouncedEmail.length < 2) return [];
  const otherEmails = new Set(
    fields
      .filter((_, i) => i !== index)
      .map((f) => f.email)
      .filter(Boolean)
  );
  const workspaceMemberIds = Object.keys(workspace?.memberMap ?? {});
  const q = debouncedEmail.toLowerCase();
  return workspaceMemberIds
    .map((id) => memberMap?.[id])
    .filter((user): user is IUserLite => {
      if (!user || !user.email || otherEmails.has(user.email)) return false;
      return user.email.toLowerCase().includes(q) || user.display_name?.toLowerCase().includes(q);
    })
    .slice(0, 5);
}, [debouncedEmail, memberMap, workspace?.memberMap, fields, index]);
```

**Keyboard handler on Input:**

```tsx
onKeyDown={(e) => {
  if (!suggestions.length) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setActiveSuggestion((i) => Math.max(i - 1, -1));
  } else if (e.key === "Enter" && activeSuggestion >= 0) {
    e.preventDefault();
    onChange(suggestions[activeSuggestion].email ?? "");
    setShowDropdown(false);
  } else if (e.key === "Escape") {
    setShowDropdown(false);
  }
}}
```

**Wrap input + dropdown in `relative` div:**

```tsx
<div className="relative w-full">
  <Input ... onChange={(e) => { onChange(e); setShowDropdown(true); }} />
  {showDropdown && (
    <EmailAutocompleteDropdown
      suggestions={suggestions}
      activeIndex={activeSuggestion}
      onSelect={(email) => { onChange(email); setShowDropdown(false); }}
      onHover={setActiveSuggestion}
    />
  )}
</div>
```

**Outside click to close:**

```tsx
const fieldRef = useRef<HTMLDivElement>(null);
useOutsideClickDetector(fieldRef, () => setShowDropdown(false));
// wrap the relative div with ref={fieldRef}
```

### Step 3 — Modularization Decision

`fields.tsx` renders N rows. Adding per-field state (showDropdown, activeSuggestion) inside the Controller render causes issues (can't call hooks inside render prop callbacks).

**Solution:** Extract each field row into a `InvitationFieldRow` component within the same file or a new file `invitation-field-row.tsx` if > 200 lines:

```tsx
// invitation-field-row.tsx
type TInvitationFieldRowProps = {
  index: number;
  field: FieldArrayWithId<...>;
  control: Control<...>;
  errors: FormState<...>["errors"];
  remove: (index: number) => void;
  allFields: FieldArrayWithId<...>[];
  currentWorkspaceRole?: number;
};

export const InvitationFieldRow = observer(function InvitationFieldRow(props) {
  // All hooks here: useState, useDebounce, useMemo, useRef
  // Render the row with email input + dropdown + role selector + remove button
});
```

Then `fields.tsx` becomes:

```tsx
{fields.map((field, index) => (
  <InvitationFieldRow key={field.id} index={index} field={field} ... allFields={fields} />
))}
```

### Step 4 — Verify imports

Check exact paths:

- `getFileURL`: likely `@/helpers/file.helper` — verify by checking existing usage in `member-options.tsx`
- `useOutsideClickDetector`: from `@plane/hooks` — verify in existing components
- `IUserLite`: from `@plane/types`

## Todo

- [ ] Verify `getFileURL` import path
- [ ] Create `email-autocomplete-dropdown.tsx`
- [ ] Create `invitation-field-row.tsx` with per-row hooks
- [ ] Modify `fields.tsx` to use `InvitationFieldRow`
- [ ] Test keyboard navigation
- [ ] Test outside-click closes dropdown
- [ ] Test filtering excludes already-added emails
- [ ] Verify no type errors

## Success Criteria

- Typing 2+ chars shows filtered member dropdown
- Avatar + name + email visible per suggestion
- Keyboard Up/Down/Enter/Escape works
- Click outside closes dropdown
- Selecting suggestion fills input
- No regressions in existing invite flow

## Risk Assessment

- **Hook in render prop**: Solved by extracting `InvitationFieldRow` component
- **File size**: Split across `invitation-field-row.tsx` + `email-autocomplete-dropdown.tsx`
- **MobX reactivity**: Use `observer()` on `InvitationFieldRow` so store updates trigger re-render

## Security Considerations

- Only shows members already in workspace — no data leakage
- No new API endpoints introduced

## Next Steps

- After implementation, run TypeScript compiler check
- Manual test in browser: invite modal → type email → verify suggestions appear
