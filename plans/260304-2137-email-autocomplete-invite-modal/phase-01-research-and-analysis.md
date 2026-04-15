# Phase 01 — Research & Analysis

## Context Links

- Plan: [plan.md](./plan.md)
- Invite modal: `apps/web/core/components/workspace/invite-modal/`
- Member store: `apps/web/core/store/member/workspace/workspace-member.store.ts`

## Overview

- **Status:** ✅ Complete
- **Description:** Codebase analysis for implementing email autocomplete

## Key Findings

### Target Component

**File:** `apps/web/core/components/workspace/invite-modal/fields.tsx` (~127 lines)

- Renders dynamic email input fields with role selector (using `useFieldArray` from react-hook-form)
- Each row: email `Input` + role `CustomSelect` + remove button
- `onChange` callback updates the field value

### Data Source

**No new API needed.** Workspace members already in store:

- `useMember()` hook → `workspace.workspaceMemberMap` (Record<string, IWorkspaceMember>)
- Each member has: `email`, `display_name`, `first_name`, `last_name`, `avatar`
- Members are fetched on workspace load — available in invite modal context

### Existing Patterns to Follow

- **Dropdown:** `apps/web/core/components/dropdowns/member/member-options.tsx` — uses absolute positioning, Avatar + name + email rendering
- **Debounce:** `apps/web/core/hooks/use-debounce.tsx` — `useDebounce(value, delay)` hook
- **Outside click:** `useOutsideClickDetector` from `@plane/hooks`
- **Avatar:** `<Avatar>` component from `@plane/ui`

### i18n Location

`packages/i18n/src/locales/en/translations.ts` → `workspace_settings.settings.members.modal`

### Filtering Logic

```tsx
const suggestions = useMemo(() => {
  if (!debouncedEmail || debouncedEmail.length < 2) return [];
  const otherEmails = fields.map((f, i) => (i !== fieldIndex ? f.email : null)).filter(Boolean);
  return Object.values(workspaceMemberMap)
    .filter(({ member }) => {
      if (otherEmails.includes(member.email)) return false;
      const q = debouncedEmail.toLowerCase();
      return member.email?.toLowerCase().includes(q) || member.display_name?.toLowerCase().includes(q);
    })
    .slice(0, 5);
}, [debouncedEmail, workspaceMemberMap, fields, fieldIndex]);
```

## Unresolved Questions

- None — all needed info found in codebase.
