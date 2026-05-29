---
phase: 3
title: "i18n Keys"
status: pending
priority: P2
effort: "0.5d"
dependencies: []
---

# Phase 3: i18n Keys

## Overview

Add Help Center **UI chrome** translation keys for all three locales (vi/en/ko). Article and
category _content_ is data (stored in DB), NOT i18n — only static UI labels live here.

## Requirements

- Functional: every UI string in the Help Center (reading + authoring + discovery) resolvable
  via `t()` in vi/en/ko.
- Non-functional: identical key sets across the 3 locale files (no missing keys → no fallback gaps);
  ICU MessageFormat for interpolation (e.g. fallback notice with `{language}`).

## Architecture

`@plane/i18n` uses TS modules per locale (NOT JSON). **Locale files are deep-merged at the TOP level**
(`merge({}, coreTranslations, translations.default)`, `packages/i18n/src/store/index.ts:128`), so a key
in `core.ts`/`translations.ts` resolves WITHOUT any file-name prefix — e.g. the existing sidebar uses
flat `t("documentation")` (`translations.ts:442`), NOT `t("core.documentation")` (Finding 6). So:

- Put EVERYTHING under ONE top-level `help_center` object in `translations.ts`; access nested, e.g.
  `t("help_center.title")`, `t("help_center.menu_label")`. The sidebar label is `help_center.menu_label`
  — do NOT add a separate top-level `help_center` STRING in `core.ts` (it would collide with the
  `help_center` namespace object). `t("core.help_center")` is WRONG and would render the raw key.

Key set (added incrementally as Phase 5/6/7 components are built — see "approach" below):

```
help_center: {
  menu_label,                       // sidebar Help-menu item ("Trung tâm trợ giúp")
  title, subtitle, search_placeholder, no_results, all_categories,
  category_count_articles, back_to_help, breadcrumb_home,
  shown_in_language_notice,        // ICU: "Shown in {language}" on locale fallback
  read_more, last_updated, content_unavailable,   // empty marker when no translation resolves
  // authoring
  new_article, edit_article, new_category, edit_category, delete, delete_confirm,
  publish, unpublish, draft, published, status, save, saved, cancel,
  title_label, content_label, category_label, locale_tab_vi, locale_tab_en, locale_tab_ko,
  reorder, move_up, move_down, missing_translation, unsaved_changes_warning,
  // permission / empty
  no_articles_yet, no_categories_yet, only_admins_can_edit,
}
```

Vietnamese values are primary (audience), English + Korean translated to match.

**Approach (Findings 14, C7):** `t()` is UNTYPED (`use-translation.ts:14`) and returns the raw key string
as last resort (`store/index.ts:243`) — tsc canNOT catch missing/drifted keys. So this phase is a
namespace + conventions setup; individual keys are added alongside the components that consume them
(Phase 5/6/7) to avoid define-but-unused / need-but-undefined drift. The real safety net is the
cross-locale key-diff QA below (and a Phase 8 test).

## Related Code Files

- Modify: `packages/i18n/src/locales/vi/translations.ts`
- Modify: `packages/i18n/src/locales/en/translations.ts`
- Modify: `packages/i18n/src/locales/ko/translations.ts`
  (menu label lives in the `help_center` namespace in `translations.ts`, NOT in `core.ts`)
- Read for pattern: `packages/i18n/src/locales/index.ts:15-37`, existing `translations.ts` namespaces,
  `packages/i18n/src/store/index.ts:128,243` (flat merge + raw-key fallback),
  `packages/i18n/src/hooks/use-translation.ts:14,30` (`t()` untyped + `currentLocale`)

## Implementation Steps

1. Read one existing namespace block in `en/translations.ts` to match nesting + ICU style.
2. Add the `help_center` namespace skeleton (incl. `menu_label`) in `en/translations.ts` (canonical key list).
3. Mirror exact keys into `vi/translations.ts` (Vietnamese values, primary) and `ko/translations.ts`.
4. (Keys grow as Phase 5/6/7 components need them — keep all three locales in lockstep on each add.)
5. **Cross-locale key-diff QA** (replaces the impossible tsc check): diff the `help_center` key sets of
   vi/en/ko (script or manual) — every key present in all three. (A Phase 8 test asserts this.)
6. Runtime render check: `t("help_center.menu_label")` + a few keys resolve (not raw id) in each locale.

## Success Criteria

- [ ] `help_center` key set (incl. `menu_label`) identical across vi/en/ko `translations.ts` (key-diff clean)
- [ ] Sidebar label resolves via `t("help_center.menu_label")` (flat-merged, no `core.` prefix)
- [ ] Runtime smoke: keys render real strings (not raw key ids) in all 3 locales
- [ ] No new collisions with existing top-level keys (e.g. `documentation`)

## Risk Assessment

- **Key drift between locales** → use en as the canonical key list; diff key sets before finishing.
- **Korean copy quality** → mark uncertain KO strings for native review (note in PR); functional default acceptable.
