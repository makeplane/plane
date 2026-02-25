# Phase 1: Delete Unused Locales + Update Config

## Overview

- **Priority**: P1
- **Status**: pending
- **Description**: Remove 16 locale directories and update TypeScript config files

## Related Code Files

### Files to Delete (16 directories)

- `packages/i18n/src/locales/cs/`
- `packages/i18n/src/locales/de/`
- `packages/i18n/src/locales/es/`
- `packages/i18n/src/locales/fr/`
- `packages/i18n/src/locales/id/`
- `packages/i18n/src/locales/it/`
- `packages/i18n/src/locales/ja/`
- `packages/i18n/src/locales/pl/`
- `packages/i18n/src/locales/pt-BR/`
- `packages/i18n/src/locales/ro/`
- `packages/i18n/src/locales/ru/`
- `packages/i18n/src/locales/sk/`
- `packages/i18n/src/locales/tr-TR/`
- `packages/i18n/src/locales/ua/`
- `packages/i18n/src/locales/zh-CN/`
- `packages/i18n/src/locales/zh-TW/`

### Files to Modify

- `packages/i18n/src/types/language.ts` -- trim TLanguage union
- `packages/i18n/src/constants/language.ts` -- trim SUPPORTED_LANGUAGES array
- `packages/i18n/src/locales/index.ts` -- remove deleted locale imports from `locales` map

## Implementation Steps

1. Delete 16 locale directories:

   ```bash
   rm -rf packages/i18n/src/locales/{cs,de,es,fr,id,it,ja,pl,pt-BR,ro,ru,sk,tr-TR,ua,zh-CN,zh-TW}
   ```

2. Rename `vi-VN` → `vi` for short-code consistency:

   ```bash
   mv packages/i18n/src/locales/vi-VN packages/i18n/src/locales/vi
   ```

3. Update `packages/i18n/src/types/language.ts`:

   ```typescript
   export type TLanguage = "en" | "ko" | "vi";
   ```

4. Update `packages/i18n/src/constants/language.ts` -- SUPPORTED_LANGUAGES:

   ```typescript
   export const SUPPORTED_LANGUAGES: ILanguageOption[] = [
     { label: "English", value: "en" },
     { label: "Tiếng Việt", value: "vi" },
     { label: "한국어", value: "ko" },
   ];
   ```

   Note: capitalize "Tiếng Việt" (currently lowercase "việt" in codebase).

5. Update `packages/i18n/src/locales/index.ts` -- keep only en, ko, vi in `locales` map. Also add `core` entry to ko and vi (after Phase 2 creates the files):
   ```typescript
   export const locales = {
     en: {
       core: () => import("./en/core"),
       translations: () => import("./en/translations"),
       accessibility: () => import("./en/accessibility"),
       editor: () => import("./en/editor"),
       "empty-state": () => import("./en/empty-state"),
     },
     ko: {
       core: () => import("./ko/core"),
       translations: () => import("./ko/translations"),
       accessibility: () => import("./ko/accessibility"),
       editor: () => import("./ko/editor"),
       "empty-state": () => import("./ko/empty-state"),
     },
     vi: {
       core: () => import("./vi/core"),
       translations: () => import("./vi/translations"),
       accessibility: () => import("./vi/accessibility"),
       editor: () => import("./vi/editor"),
       "empty-state": () => import("./vi/empty-state"),
     },
   };
   ```

## Todo List

- [ ] Delete 16 locale directories
- [ ] Rename vi-VN → vi
- [ ] Update TLanguage type
- [ ] Update SUPPORTED_LANGUAGES array
- [ ] Update locales/index.ts

## Success Criteria

- Only en, ko, vi directories remain under `packages/i18n/src/locales/`
- TypeScript compiles without errors referencing deleted locales
