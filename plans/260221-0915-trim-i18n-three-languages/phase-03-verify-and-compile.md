# Phase 3: Verify UI + Compile Check

## Overview

- **Priority**: P1
- **Status**: pending
- **Description**: Ensure UI components work with trimmed language list and project compiles

## Related Code Files (read-only verification)

- `apps/web/core/components/settings/profile/content/pages/preferences/language-and-timezone-list.tsx`
- `apps/web/core/components/power-k/ui/pages/preferences/languages-menu.tsx`

## Implementation Steps

1. Verify `language-and-timezone-list.tsx` iterates over `SUPPORTED_LANGUAGES` -- no hardcoded language values. Should work with 3 entries without changes.

2. Verify `languages-menu.tsx` same check.

3. Run typecheck:

   ```bash
   cd packages/i18n && pnpm tsc --noEmit
   ```

4. Run full build check:

   ```bash
   pnpm turbo run build --filter=@plane/i18n
   ```

5. Grep for any hardcoded references to deleted locales:
   ```bash
   grep -r '"fr"\|"es"\|"ja"\|"zh-CN"\|"zh-TW"\|"ru"\|"it"\|"cs"\|"sk"\|"de"\|"ua"\|"pl"\|"pt-BR"\|"id"\|"ro"\|"tr-TR"' packages/i18n/src/ --include="*.ts"
   ```

## Todo List

- [ ] Verify UI components use SUPPORTED_LANGUAGES dynamically
- [ ] Run TypeScript compile check
- [ ] Run i18n package build
- [ ] Grep for stale locale references

## Success Criteria

- No compile errors
- No references to deleted locales in i18n package source
- Language picker shows only English, Tiếng Việt, 한국어
