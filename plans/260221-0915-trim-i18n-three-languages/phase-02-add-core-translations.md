# Phase 2: Add core.ts to ko and vi

## Overview

- **Priority**: P1
- **Status**: pending
- **Description**: en has core.ts with sidebar + auth translations. ko and vi are missing it. Create translated versions.

## Related Code Files

### Source File

- `packages/i18n/src/locales/en/core.ts` (179 lines)

### Files to Create

- `packages/i18n/src/locales/ko/core.ts`
- `packages/i18n/src/locales/vi/core.ts`

## Key Content to Translate

en/core.ts contains two sections:

1. **sidebar** -- navigation labels (Projects, Pages, Home, Inbox, etc.)
2. **auth** -- sign in/up forms, password, unique code, forgot/reset password, toasts

## Implementation Steps

1. Create `packages/i18n/src/locales/ko/core.ts` with Korean translations of all strings in en/core.ts. Keep same structure/keys, translate values only.

2. Create `packages/i18n/src/locales/vi/core.ts` with Vietnamese translations of all strings in en/core.ts. Keep same structure/keys, translate values only.

3. Both files must:
   - Match exact key structure of en/core.ts
   - Use `export default { ... } as const;`
   - Include copyright header
   - Keep placeholder tokens like `{seconds}` untranslated

## Todo List

- [ ] Create ko/core.ts with Korean translations
- [ ] Create vi/core.ts with Vietnamese translations
- [ ] Verify key structure matches en/core.ts exactly

## Success Criteria

- ko and vi directories each have 5 files matching en (core, translations, accessibility, editor, empty-state)
- No missing keys compared to en/core.ts
