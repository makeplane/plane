# Phase 2: Types, Store, and Service

## Context

- [Plan](./plan.md) | Phase 2 of 3
- Depends on: [Phase 1 Backend](./phase-01-backend.md)

## Overview

Add TypeScript type for frequency, define constants, ensure store and service layer pass frequency through on issue CRUD.

## Key Insights

- `TBaseIssue` type in `packages/types/src/issues/issue.ts` defines all issue fields
- `TIssuePriorities` type alias pattern is perfect reference for `TIssueFrequency`
- `ISSUE_PRIORITIES` constant in `packages/constants/src/issue/common.ts` is the pattern for `ISSUE_FREQUENCIES`
- Issue service (`apps/web/core/services/issue/issue.service.ts`) uses generic CRUD - no changes needed (passes full payload)
- MobX stores pass `Partial<TIssue>` for updates - frequency auto-included once typed
- `TBulkIssueProperties` in issue.ts may need frequency added if bulk operations should support it

## Requirements

- [x] TIssueFrequency type alias
- [x] Add `frequency` field to `TBaseIssue`
- [x] ISSUE_FREQUENCIES constant with key/title/color
- [x] No store/service code changes needed (generic CRUD)

## Implementation Steps

### 1. Types (`packages/types/src/issues/issue.ts`)

Add type alias in `packages/types/src/issues.ts` barrel file (near `TIssuePriorities` at line 111): <!-- Updated: Validation Session 2 - confirmed barrel file, not sub-file -->

```typescript
export type TIssueFrequency =
  | "daily"
  | "weekly"
  | "bi_weekly"
  | "monthly"
  | "quarterly"
  | "half_year"
  | "yearly"
  | "ad_hoc";
```

Add to `TBaseIssue` (in `packages/types/src/issues/issue.ts`, after `priority` line 52):

```typescript
frequency: TIssueFrequency | null;
```

Export `TIssueFrequency` from barrel: already in `packages/types/src/issues.ts` if defined there.

### 2. Constants (`packages/constants/src/issue/common.ts`)

Add after `ISSUE_PRIORITIES` (around line 67):

```typescript
export const ISSUE_FREQUENCIES: {
  key: TIssueFrequency;
  title: string;
  color: string;
}[] = [
  { key: "daily", title: "Daily", color: "#ef4444" },
  { key: "weekly", title: "Weekly", color: "#f97316" },
  { key: "bi_weekly", title: "Bi-weekly", color: "#eab308" },
  { key: "monthly", title: "Monthly", color: "#22c55e" },
  { key: "quarterly", title: "Quarterly", color: "#3b82f6" },
  { key: "half_year", title: "Half-year", color: "#8b5cf6" },
  { key: "yearly", title: "Yearly", color: "#6366f1" },
  { key: "ad_hoc", title: "Ad-hoc", color: "#6b7280" },
];
```

Import `TIssueFrequency` from `@plane/types` at top of file.

### 3. Store / Service - No Changes

The issue service uses generic API calls that pass `Partial<TIssue>` payloads. Once `frequency` is on `TBaseIssue`, all existing update flows will carry it through automatically:

- `issueService.patchIssue()` - passes partial update payload
- MobX issue store `updateIssue()` - passes partial update
- No new store or service files needed

### 4. Bulk Operations (Optional)

If bulk frequency updates are desired, add to `TBulkIssueProperties` in `packages/types/src/issues/issue.ts`:

```typescript
export type TBulkIssueProperties = Pick<
  TIssue,
  | "state_id"
  | "priority"
  | "frequency" // add this
  | "label_ids"
  // ...rest
>;
```

Skip for MVP - can add later.

## Related Files

- `/packages/types/src/issues.ts` - TIssuePriorities type (line 111)
- `/packages/types/src/issues/issue.ts` - TBaseIssue (line 45), TBulkIssueProperties (line 140)
- `/packages/constants/src/issue/common.ts` - ISSUE_PRIORITIES (line 67)
- `/apps/web/core/services/issue/issue.service.ts` - No changes needed

## Todo

- [x] Add TIssueFrequency type to `packages/types/src/issues.ts`
- [x] Add `frequency` to TBaseIssue in `packages/types/src/issues/issue.ts`
- [x] Add ISSUE_FREQUENCIES constant to `packages/constants/src/issue/common.ts`
- [x] Import TIssueFrequency in constants file
- [x] Verify TS compilation passes

## Success Criteria

- TypeScript compiles with no errors
- `TIssue` includes `frequency` field
- Constants available for UI consumption

## Risk Assessment

- **Low**: Additive type changes, no breaking API
- Adding to TBaseIssue means all issue-consuming code sees the field; since it's nullable, no breaking changes

## Security Considerations

- Type-level enforcement of valid frequency values

## Next Steps

Continue to [Phase 3: UI Integration](./phase-03-ui-integration.md)
