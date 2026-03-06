# Phase 1: Update i18n and Placeholder

## Context Links

- [plan.md](./plan.md)
- [invitation-field-row.tsx](../../apps/web/core/components/workspace/invite-modal/invitation-field-row.tsx) — uses `t("workspace_settings.settings.members.modal.placeholder")`
- [email-autocomplete-dropdown.tsx](../../apps/web/core/components/workspace/invite-modal/email-autocomplete-dropdown.tsx) — uses `t("workspace_settings.settings.members.modal.no_suggestions")`

## Overview

- **Priority:** P2
- **Status:** Complete
- **Description:** Update placeholder text in all locales to indicate name search is supported. Add missing `no_suggestions` keys.

## Key Insights

- Backend search already works for names — this is purely a UX/copy fix
- Placeholder is the ONLY indicator to users about what the input accepts
- `no_suggestions` key missing from vi and ko locales (shows raw key string)

## Requirements

### Functional

- Placeholder must clearly communicate that both name and email search are supported
- All 3 locales (en, vi, ko) must be updated consistently

### Non-functional

- No component file changes needed
- No API changes needed

## Related Code Files

### Files to Modify

| File                                           | Line(s) | Change                                                                              |
| ---------------------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `packages/i18n/src/locales/en/translations.ts` | ~1748   | placeholder: `"name@company.com"` -> `"Enter name or email"`                        |
| `packages/i18n/src/locales/vi/translations.ts` | ~1759   | placeholder: `"name@company.com"` -> `"Nhap ten hoac email"` + add `no_suggestions` |
| `packages/i18n/src/locales/ko/translations.ts` | ~1740   | placeholder: `"name@company.com"` -> Korean equivalent + add `no_suggestions`       |

### Files NOT Modified (confirmed working)

- `invitation-field-row.tsx` — input type already "text", search logic works for any string
- `email-autocomplete-dropdown.tsx` — already shows name + email in results
- `apps/api/plane/app/views/workspace/member.py` — already searches by name fields

## Implementation Steps

1. **Update EN translations** (`packages/i18n/src/locales/en/translations.ts`)
   - Line ~1748: Change `placeholder: "name@company.com"` to `placeholder: "Enter name or email"`

2. **Update VI translations** (`packages/i18n/src/locales/vi/translations.ts`)
   - Line ~1759: Change `placeholder: "name@company.com"` to `placeholder: "Nhap ten hoac email"`
   - Add `no_suggestions: "Khong tim thay thanh vien"` after placeholder line

3. **Update KO translations** (`packages/i18n/src/locales/ko/translations.ts`)
   - Line ~1740: Change placeholder to appropriate Korean text
   - Add `no_suggestions` key with Korean translation

4. **Verify** — run `pnpm check:lint` to ensure no issues

## Todo List

- [x] Update EN placeholder text
- [x] Update VI placeholder text + add `no_suggestions`
- [x] Update KO placeholder text + add `no_suggestions`
- [x] Run lint check
- [x] Manual test: type a name in invite modal, verify suggestions appear

## Success Criteria

- Placeholder text clearly says "Enter name or email" (or locale equivalent)
- Typing a display name shows matching suggestions in dropdown
- Selecting a suggestion auto-fills the email field
- Form validates correctly on submit (email regex only on final value)
- All 3 locales have consistent placeholder and `no_suggestions` keys

## Risk Assessment

| Risk                                                               | Likelihood | Impact | Mitigation                                                           |
| ------------------------------------------------------------------ | ---------- | ------ | -------------------------------------------------------------------- |
| Placeholder text too long for input width                          | Low        | Low    | Keep text concise, test on mobile                                    |
| Users type name but don't pick suggestion, submit fails validation | Medium     | Low    | Expected behavior — validation error tells them to enter valid email |

## Security Considerations

- No security impact — purely UI copy changes
- No new API endpoints or data exposure

## Next Steps

- After merge, monitor if users still report confusion about name search
- Consider adding a small helper text or icon hint if placeholder alone isn't sufficient
