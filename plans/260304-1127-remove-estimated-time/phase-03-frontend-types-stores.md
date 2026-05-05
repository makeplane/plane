# Phase 3: Frontend Types & Stores

## Context Links

- Plan: [plan.md](./plan.md)
- Phase 2: [phase-02-backend-api.md](./phase-02-backend-api.md)

## Overview

- **Priority**: P1
- **Status**: pending
- **Description**: Remove `estimate_time` from TypeScript types, MobX stores, and i18n translations

## Key Insights

- `TIssue` interface includes `estimate_time: number | null`
- `TTimeTrackingSummary` type includes `estimate_time` in `by_issue` array
- MobX issue detail store spreads `estimate_time` into issue data
- 3 locale files have `estimate_time` translation key

## Requirements

### Functional

- Remove `estimate_time` from all TypeScript interfaces/types
- Remove from MobX store data mapping
- Remove i18n keys

### Non-functional

- TypeScript compilation must pass after changes
- No unused translation keys

## Architecture

Type-level changes propagate through compiler -- any missed references will show as TS errors.

## Related Code Files

### Files to Modify

| File                                                     | Change                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `packages/types/src/issues/issue.ts`                     | Remove `estimate_time: number \| null;` (line 56)                                           |
| `packages/types/src/worklog.ts`                          | Remove `estimate_time: number \| null;` from `TTimeTrackingSummary.by_issue` type (line 45) |
| `apps/web/core/store/issue/issue-details/issue.store.ts` | Remove `estimate_time: issue?.estimate_time,` (line 154)                                    |
| `packages/i18n/src/locales/en/translations.ts`           | Remove `estimate_time: "Estimate time",` (line 725)                                         |
| `packages/i18n/src/locales/vi/translations.ts`           | Remove `estimate_time: "Thoi gian uoc tinh",` (line 730)                                    |
| `packages/i18n/src/locales/ko/translations.ts`           | Remove `estimate_time: "예상 시간",` (line 716)                                             |

## Embedded Rules

- Use `import type` for type-only imports (tree-shaking)
- Run `pnpm check:lint` after type changes
- Ensure strict TypeScript mode still passes

## Implementation Steps

### Step 1: Remove from Issue Type

1. Open `packages/types/src/issues/issue.ts`
2. Remove line 56: `estimate_time: number | null;`

### Step 2: Remove from Worklog Type

1. Open `packages/types/src/worklog.ts`
2. Remove `estimate_time: number | null;` from the `by_issue` array element type (line 45)

### Step 3: Remove from Issue Detail Store

1. Open `apps/web/core/store/issue/issue-details/issue.store.ts`
2. Remove `estimate_time: issue?.estimate_time,` from the data mapping (line 154)

### Step 4: Remove i18n Keys

1. Open each locale file and remove the `estimate_time` key:
   - `packages/i18n/src/locales/en/translations.ts` (line 725)
   - `packages/i18n/src/locales/vi/translations.ts` (line 730)
   - `packages/i18n/src/locales/ko/translations.ts` (line 716)

### Step 5: Compile Check

1. Run `pnpm tsc --noEmit` or `pnpm check:lint` to find any remaining TS errors
2. Fix any errors from components still referencing `estimate_time` (handled in Phase 4)

## Post-Phase Checklist

- [ ] `estimate_time` removed from `TIssue` interface
- [ ] `estimate_time` removed from `TTimeTrackingSummary` type
- [ ] `estimate_time` removed from issue detail store
- [ ] i18n keys removed from all 3 locales
- [ ] TypeScript compiles (may have errors in UI components -- resolved in Phase 4)

## Todo List

- [ ] Update issue type
- [ ] Update worklog type
- [ ] Update issue detail store
- [ ] Remove i18n keys (en, vi, ko)
- [ ] Run TypeScript check

## Success Criteria

- `grep -r "estimate_time" packages/types/ packages/i18n/` returns zero results
- Store no longer maps `estimate_time`

## Risk Assessment

- **Low**: Type removal will surface all remaining frontend references as compile errors
- Those errors are resolved in Phase 4

## Security Considerations

- No security impact

## Next Steps

- Proceed to Phase 4 (Frontend UI Components)
