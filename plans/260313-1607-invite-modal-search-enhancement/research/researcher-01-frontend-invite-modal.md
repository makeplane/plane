# Frontend Invite Modal Research Report

## Component Structure

**Main Component:** `/apps/web/ce/components/workspace/members/invite-modal.tsx`

- Wrapper: `SendWorkspaceInvitationModal` (observer, uses MobX)
- Delegates to 3 sub-components: `InvitationForm`, `InvitationFields`, `InvitationModalActions`

**Field Row Component:** `/apps/web/core/components/workspace/invite-modal/invitation-field-row.tsx`

- Renders per-invitation input field
- Handles search/autocomplete logic + keyboard navigation
- Manages state: `showDropdown`, `activeSuggestion`, `rawSuggestions`

**Dropdown Component:** `/apps/web/core/components/workspace/invite-modal/email-autocomplete-dropdown.tsx`

- Pure presentational component
- Renders suggestions list with user details

## Search/Autocomplete Implementation

### API Endpoint

```
GET /api/workspaces/{workspaceSlug}/members/user-search/?search={query}
```

Service method: `WorkspaceService.searchUsersForInvite(workspaceSlug, query)`
Location: `/apps/web/core/services/workspace.service.ts:145`

### Search Logic

1. **Debounce**: 300ms delay via `useDebounce()` hook (line 51)
2. **Min length**: Requires 2+ characters before triggering API call (line 57)
3. **Call trigger**: `useEffect` on `debouncedEmail` change (lines 56-65)
4. **Error handling**: Silent catch — empty suggestions on error

### Duplicate Exclusion

- Filters out emails already in other rows (lines 68-73)
- Uses Set for O(1) lookup performance
- **Limits results to 5 suggestions max** (line 72: `.slice(0, 5)`)

### Keyboard Navigation

- **ArrowDown/ArrowUp**: Navigate suggestions (lines 103-108)
- **Enter**: Select active suggestion, close dropdown (lines 109-113)
- **Escape**: Close dropdown (lines 114-115)
- Prevents default browser behavior with `e.preventDefault()`

## Data Fields Displayed in Dropdown

Current dropdown shows (lines 36-59):

1. **Avatar** — `user.avatar_url` via `getFileURL()`
2. **Full Name** — `first_name + last_name` or fallback `display_name`
3. **Email** — `user.email` (primary identifier)
4. **Department** — `user.department_name` (optional, shown if present)

Return type: `IUserLite[]` from `@plane/types`

## Current UX Pattern

1. User types in email input (auto-opens dropdown)
2. Debounce 300ms, then API call if ≥2 chars
3. Dropdown shows max 5 matching users (duplicates filtered)
4. User can:
   - Click/hover to select
   - Use arrow keys + Enter to select
   - Escape to close
   - Direct email entry (no autocomplete required)
5. Selected email fills field, closes dropdown
6. Per-row: role selector + auto-join checkbox + remove button

## Search Optimization Notes

- **Debounce + min-length** prevents excessive API calls
- **Client-side dedup** (Set-based) avoids duplicate invites
- **Result capping** (5 suggestions) prevents UI overload
- **Keyboard nav** reduces mouse dependency
- **useOutsideClickDetector** auto-closes dropdown on external click

## Integration Points

- Form state: React Hook Form (`react-hook-form`)
- Store: MobX store for user permissions (via `useUserPermissions`)
- i18n: `useTranslation` from `@plane/i18n`
- UI components: `@plane/ui` (Input, CustomSelect, ModalCore)
- Icons: `@plane/propel/icons` (CloseIcon)
