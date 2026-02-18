# Phase 2: Types, Constants & i18n

## Context Links
- Types package: `packages/types/src/`
- Constants package: `packages/constants/src/`
- i18n EN: `packages/i18n/src/locales/en/translations.ts`
- i18n VI: `packages/i18n/src/locales/vi-VN/translations.ts`
- Activity filter constants: `packages/constants/src/issue/filter.ts`

## Overview
- **Priority**: P1
- **Status**: complete
- Define TypeScript types for worklog, time formatting helpers, i18n strings, activity filter for WORKLOG type.

## Key Insights
- `TIssueActivityComment` already has `activity_type === "WORKLOG"` check in activity-comment-root.tsx
- `EActivityFilterType` enum + `ACTIVITY_FILTER_TYPE_OPTIONS` need WORKLOG entry
- Issue type needs `estimate_time?: number | null` added

## Requirements
### Functional
- TypeScript types matching API response shapes
- Time formatting utility (minutes → "Xh Ym" display)
- i18n strings for worklog UI labels (EN + VI-VN)
- WORKLOG added to activity filter options

### Non-functional
- Types in @plane/types, constants in @plane/constants (existing package pattern)

## Related Code Files
### Create
- `packages/types/src/worklog.d.ts` — IWorkLog, IWorkLogCreate, IWorkLogSummary types
- `packages/constants/src/worklog.ts` — time formatting helpers

### Modify
- `packages/types/src/issues.d.ts` — add estimate_time to IIssue
- `packages/constants/src/issue/filter.ts` — add WORKLOG to EActivityFilterType, ACTIVITY_FILTER_TYPE_OPTIONS
- `packages/constants/src/index.ts` — export worklog constants
- `packages/types/src/index.d.ts` — export worklog types
- `packages/i18n/src/locales/en/translations.ts` — EN strings
- `packages/i18n/src/locales/vi-VN/translations.ts` — VI strings

## Implementation Steps

1. **Create worklog types** in `packages/types/src/worklog.d.ts`
```typescript
export interface IWorkLog {
  id: string;
  issue: string;
  logged_by: string;
  duration_minutes: number;
  description: string;
  logged_at: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
  // expanded fields from API
  logged_by_detail?: {
    id: string;
    display_name: string;
    avatar_url: string;
  };
}

export interface IWorkLogCreate {
  duration_minutes: number;
  description?: string;
  logged_at: string;
}

export interface IWorkLogUpdate {
  duration_minutes?: number;
  description?: string;
  logged_at?: string;
}

export interface IWorkLogSummary {
  total_duration_minutes: number;
  by_member: Array<{
    member_id: string;
    display_name: string;
    total_minutes: number;
  }>;
  by_issue: Array<{
    issue_id: string;
    issue_name: string;
    estimate_time: number | null;
    total_minutes: number;
  }>;
}
```

2. **Add estimate_time to Issue type** — find IIssue interface, add `estimate_time?: number | null;`

3. **Create time formatting constants** in `packages/constants/src/worklog.ts`
```typescript
export const formatMinutesToDisplay = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const parseDisplayToMinutes = (hours: number, minutes: number): number =>
  hours * 60 + minutes;
```

4. **Add WORKLOG to activity filters** in `packages/constants/src/issue/filter.ts`
   - Add `WORKLOG = "WORKLOG"` to `EActivityFilterType` enum
   - Add entry in `ACTIVITY_FILTER_TYPE_OPTIONS`
   - Add to `defaultActivityFilters` array

5. **Export from package indexes**

6. **Add i18n strings** for both EN and VI-VN:
   - `worklog.title`: "Time Tracking" / "Theo doi thoi gian"
   - `worklog.log_time`: "Log Time" / "Ghi nhan thoi gian"
   - `worklog.estimate`: "Time Estimate" / "Uoc tinh thoi gian"
   - `worklog.logged`: "Logged" / "Da ghi nhan"
   - `worklog.hours`: "hours" / "gio"
   - `worklog.minutes`: "minutes" / "phut"
   - `worklog.description`: "Description" / "Mo ta"
   - `worklog.date`: "Date" / "Ngay"
   - `worklog.no_entries`: "No time logged yet" / "Chua co thoi gian ghi nhan"
   - `worklog.delete_confirm`: "Delete this work log?" / "Xoa nhat ky cong viec nay?"
   - `worklog.over_budget`: "Over estimate" / "Vuot uoc tinh"
   - `worklog.on_track`: "On track" / "Dung tien do"

## Todo List
- [ ] Create worklog TypeScript types
- [ ] Add estimate_time to IIssue type
- [ ] Create time formatting helpers
- [ ] Add WORKLOG to activity filter enum + options
- [ ] Export from package indexes
- [ ] Add EN i18n strings
- [ ] Add VI-VN i18n strings

## Success Criteria
- Types compile without errors
- Formatting function: 90 → "1h 30m", 60 → "1h", 25 → "25m"
- WORKLOG appears in activity filter dropdown
- All i18n keys resolve in both locales

## Risk Assessment
- **Type drift**: API may return extra fields → keep types minimal, extend as needed
- **i18n completeness**: other locales may need updates → EN + VI-VN only for now

## Security Considerations
- No security concerns in this phase (client-side types only)

## Next Steps
- Phase 3: Service and store using these types
