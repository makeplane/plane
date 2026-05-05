# Phase 02: Frontend — Update Dropdown Display Format

## Context Links

- [Plan Overview](plan.md)
- [Phase 01 — Backend](phase-01-backend-staff-id-in-search.md)
- [Frontend Research](research/researcher-01-frontend-invite-modal.md)
- Dropdown: `apps/web/core/components/workspace/invite-modal/email-autocomplete-dropdown.tsx`
- Field Row: `apps/web/core/components/workspace/invite-modal/invitation-field-row.tsx`
- Types: `packages/types/src/users.ts`

## Overview

- **Priority:** P2
- **Status:** completed
- **Effort:** 1h15m
- **Description:** Update dropdown display: Line 1 = `UPPER(FULL NAME) (StaffID)`, Line 2 = `Position - Department`. Color differentiation for staff_id (accent). Rich chip display after selection instead of raw email.
- **Completed:** 2026-03-13
<!-- Updated: Validation Session 1 - New display format with uppercase name, position field -->

## Key Insights

- Current dropdown: 3 lines per suggestion (name, email, department) — verbose for 2.5k user base
- Target: compact 2-line format — name on top, `Staff ID - Department` as subtitle
- `EmailAutocompleteDropdown` is a pure presentational component (67 lines) — simple to modify
- `invitation-field-row.tsx` is exactly 201 lines — already at limit, no changes needed there
- `IUserLite` type already has optional `department_name`; Phase 01 adds optional `staff_id`

## Requirements

### Functional

<!-- Updated: Validation Session 1 - UPPER name + (StaffID) - Position, Department format -->

- Each suggestion row shows: Avatar | **UPPER(FULL NAME)** (bold, uppercase) / `(StaffID) - Position, Department` (subtitle)
- When staff_id is null: omit `(StaffID)` portion
- When position is null: omit position portion
- When department_name is null: omit department portion
- When all null (no staff profile): show email as fallback subtitle

### Non-Functional

- Component stays under 150 lines
- No new dependencies
- Matches existing Plane design tokens (text-custom-text-300, text-caption-sm-regular)

## Architecture

```
EmailAutocompleteDropdown (presentational)
  └── Per suggestion row:
      ├── Avatar (unchanged)
      └── Text block:
          ├── Line 1: UPPER(Full Name) (font-medium, uppercase, truncate)
          └── Line 2: "(StaffID) - Position, Department" or fallback (text-custom-text-300, truncate)
```

### Display Logic

```
Line 1: fullName.toUpperCase()

Line 2 (subtitle):
  parts = []
  if (staff_id) → parts.push(`(${staff_id})`)
  if (position || department_name) → parts.push([position, department_name].filter(Boolean).join(", "))
  subtitle = parts.join(" - ")
  if (!subtitle) → subtitle = email (fallback)

Examples:
  "(12345678) - Senior Developer, IT Operations"
  "(12345678) - IT Operations"          // no position
  "(12345678)"                          // no position, no dept
  "Senior Developer, IT Operations"     // no staff_id
  "leduong12c@gmail.com"               // no staff profile at all
```

## Related Code Files

### Files to Modify

1. **`apps/web/core/components/workspace/invite-modal/email-autocomplete-dropdown.tsx`** — Update suggestion row layout

### Files NOT to Modify

- `invitation-field-row.tsx` — no changes needed (already at 201 lines, logic unchanged)
- `invite-modal.tsx` (ce/) — wrapper only, no display logic
- `workspace.service.ts` — API call unchanged, just consumes new field

## Implementation Steps

### Step 1: Update `EmailAutocompleteDropdown` display

**File:** `apps/web/core/components/workspace/invite-modal/email-autocomplete-dropdown.tsx`

Replace the current 3-line display (name + email + department) with a 2-line format:

```tsx
suggestions.map((user, i) => {
  const fullName = (
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
    user.display_name ||
    ""
  ).toUpperCase();

  // Build subtitle: "(StaffID) - Position, Department" with graceful fallback
  const staffIdPart = user.staff_id ? `(${user.staff_id})` : "";
  const roleDeptPart = [user.position, user.department_name].filter(Boolean).join(", ");
  const detailParts = [staffIdPart, roleDeptPart].filter(Boolean);
  const subtitle = detailParts.length > 0 ? detailParts.join(" - ") : (user.email ?? "");

  return (
    <button
      key={user.id}
      type="button"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-body-xs-regular hover:bg-layer-transparent-hover",
        { "bg-layer-transparent-hover": i === activeIndex }
      )}
      onMouseEnter={() => onHover(i)}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(user.email ?? "");
      }}
    >
      <Avatar name={fullName} src={getFileURL(user.avatar_url ?? "")} size="sm" />
      <div className="flex flex-col min-w-0">
        <span className="truncate font-medium">{fullName}</span>
        <span className="truncate text-custom-text-300 text-caption-sm-regular">{subtitle}</span>
      </div>
    </button>
  );
});
```

**Key changes from current code:**

- Removed separate `{user.email}` line
- Removed conditional `{user.department_name && ...}` block
- Added `subtitleParts` array joining staff_id + department_name with " - " separator
- Fallback to email when both staff_id and department_name are absent
- Result: 2 lines per row instead of 3 — more compact for scanning

### Step 2: Verify component stays under 150 lines

Current: 67 lines. After change: ~67 lines (same structure, different content). Well within limit.

## Todo List

- [x] Update subtitle logic in `email-autocomplete-dropdown.tsx`
- [x] Replace 3-line display with 2-line `fullName` + `staff_id - department` format
- [x] Verify fallback: email shown when staff_id and department_name are both null
- [x] Run `pnpm check:lint` to verify no lint errors
- [x] Visual test: confirm dropdown renders correctly with various data combinations
- [x] Verify truncation works for long department names

## Success Criteria

- Dropdown shows `UPPER(FULL NAME)` on line 1, `(StaffID) - Position, Department` on line 2
- User with staff_id "12345678", position "Senior Dev", department "IT Operations" → subtitle: "(12345678) - Senior Dev, IT Operations"
- User without staff profile → subtitle falls back to email
- Component compiles without TypeScript errors
- No lint errors
- Component under 150 lines

## Risk Assessment

| Risk                                   | Likelihood | Impact | Mitigation                                                                                       |
| -------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------ |
| Email no longer visible in dropdown    | Medium     | Low    | Email still used for selection; visible in input field after select. If needed, can add tooltip. |
| Long department names overflow         | Low        | Low    | `truncate` class already applied — CSS handles overflow                                          |
| Users rely on seeing email in dropdown | Low        | Medium | Fallback shows email when no staff_id/department; staff users identified by staff_id instead     |

## Security Considerations

- No new data exposed — staff_id already returned by backend (Phase 01)
- No user input handling changes — onSelect still passes email
- No new network calls

## Next Steps

- After both phases complete: manual QA with test data covering all display permutations
- Consider future enhancement: tooltip on hover showing full details (email + all fields) — YAGNI for now
