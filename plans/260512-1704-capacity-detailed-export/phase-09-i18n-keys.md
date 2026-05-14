# Phase 09 — i18n Keys (en / ko / vi)

## Context Links

- FE research §4
- Rule: `.claude/rules/i18n-rules.md`

## Overview

- Priority: P1 (blocks Phase 07, 08)
- Status: pending
- Brief: Add `capacity.export.*` and `capacity.exports.*` translation keys to all three locale files. Use English text as placeholder for ko/vi (translators replace later).

## Key Insights

- Translation files are TypeScript modules at `packages/i18n/src/locales/{lang}/translations.ts` (NOT JSON).
- Keys must be added to ALL three locales; missing keys silently fall back to key string.
- Nested `capacity` namespace already exists (~line 410–440 in en/translations.ts).

## Requirements

**Functional**

- All FE strings introduced in Phases 07 & 08 have keys in en/ko/vi.

## Architecture

Keys to add (under existing `capacity:` namespace):

```ts
capacity: {
  // ... existing
  export: {
    menu: "Export",
    summary: "Capacity summary",
    summary_desc: "CSV with member × daily totals",
    detailed: "Detailed work-item report",
    detailed_desc: "XLSX with per-entry breakdown, one sheet per member",
    queued_title: "Export queued",
    queued_message: "We'll email you when ready",
    failed_title: "Export failed",
    failed_message: "Please try again",
    cross_workspace_disabled: "Not available in cross-workspace mode",
    already_queued: "An export is already queued. Please wait 30 seconds.",
    no_data: "No data to export for the selected filters",
    col: {
      member: "Member",
      date: "Date",
      main_category: "Main Category",
      sub_category: "Sub Category",
      work_item: "Work Item",
      time_spent_hours: "Time Spent (h)",
      total_hours: "Total Hours",
      entry_count: "Entry Count",
      grand_total: "Grand Total",
    },
  },
  exports: {
    tab: "My Exports",
    title: "My Exports",
    empty: "No exports yet. Create one from the Capacity page.",
    refresh: "Refresh",
    download: "Download",
    copy_link: "Copy link",
    status: {
      queued: "Queued",
      processing: "Processing",
      ready: "Ready",
      failed: "Failed",
      expired: "Expired",
    },
    col: {
      status: "Status",
      range: "Date range",
      members: "Members",
      rows: "Rows",
      size: "Size",
      created: "Created",
      expires: "Expires",
      actions: "Actions",
    },
  },
}
```

## Related Code Files

**Modify**

- `packages/i18n/src/locales/en/translations.ts`
- `packages/i18n/src/locales/ko/translations.ts`
- `packages/i18n/src/locales/vi/translations.ts`

## Implementation Steps

1. Locate `capacity:` block in `en/translations.ts`. Append `export:` and `exports:` sub-objects.
2. Mirror exact key structure into `ko/translations.ts` and `vi/translations.ts` with English placeholders.
3. (Translators replace ko/vi text in follow-up.)
4. `pnpm check:lint` / TypeScript build to confirm no parse errors.

## Todo List

- [ ] en keys added
- [ ] ko keys added (English placeholder)
- [ ] vi keys added (English placeholder)
- [ ] Build passes

## Success Criteria

- `t("capacity.export.detailed")` resolves in all three locales.
- No TypeScript errors.

## Risk Assessment

| Risk                                          | Likelihood | Impact | Mitigation                                                  |
| --------------------------------------------- | ---------- | ------ | ----------------------------------------------------------- |
| Key collision with existing `capacity.export` | Low        | Med    | Grep before adding; current code has no `capacity.export.*` |
| ICU plural needed for `members`/`rows`        | Low        | Low    | Use plain count for now; upgrade later if PM requests       |

## Security Considerations

- None.

## Next Steps

- Unblocks Phases 07 & 08 UI work.
