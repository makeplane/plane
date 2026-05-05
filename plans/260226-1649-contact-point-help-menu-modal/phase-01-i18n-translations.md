# Phase 01 — i18n Translation Keys

**Context:** [← plan.md](./plan.md)

## Overview

- **Priority:** P2
- **Status:** ⏳ Pending
- **Description:** Add new translation keys needed for the Contact Point modal UI to all 3 locale files.

## Key Insights

- Existing key `contact_point` already present in en/ko/vi — no need to add
- Need keys for modal title, field labels, copy action, and copy success feedback
- EN = canonical; KO + VI use English as placeholder per codebase convention

## Requirements

Add keys to **all 3 files**: `en/translations.ts`, `ko/translations.ts`, `vi/translations.ts`

```ts
// New keys to add (alongside existing contact_point key area, ~line 433-434)
contact_point_full_name: "Full name",
contact_point_email: "Email",
contact_point_phone: "Phone",
contact_point_copy: "Copy",
contact_point_copied: "Copied!",
```

## Related Code Files

- `packages/i18n/src/locales/en/translations.ts` — add English values
- `packages/i18n/src/locales/ko/translations.ts` — add Korean (English placeholder)
- `packages/i18n/src/locales/vi/translations.ts` — add Vietnamese (English placeholder)

## Implementation Steps

1. Open `packages/i18n/src/locales/en/translations.ts`, find `contact_point` key (~line 434), add 5 new keys immediately after it
2. Repeat same 5 keys with English placeholder values in `ko/translations.ts`
3. Repeat same 5 keys with English placeholder values in `vi/translations.ts`

## Todo

- [ ] Add keys to `en/translations.ts`
- [ ] Add keys to `ko/translations.ts`
- [ ] Add keys to `vi/translations.ts`

## Success Criteria

- All 3 locale files compile without errors
- Keys available via `t("contact_point_full_name")` etc. in components
