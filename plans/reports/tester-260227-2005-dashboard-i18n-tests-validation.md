# Tester Report: Dashboard i18n + Tests Validation

**Date:** 2026-02-27 | **Slug:** dashboard-i18n-tests-validation

## Summary

**VERDICT: PASS (with 1 fix applied)**

One TypeScript error found and fixed during validation. All checks now pass.

---

## 1. TypeScript Check (dashboard-specific)

**Result: PASS** (no dashboard-related type errors)

- Pre-existing errors (`AnalyticsTableDataMap`, `CycleInsightColumns`, etc.) excluded per task instructions
- No new type errors introduced by i18n changes or component updates

---

## 2. i18n Translation Files

**Result: PASS (after fix)**

**Bug found and fixed:** Duplicate object keys in `ko` and `vi` translation files.

- `ko/translations.ts` lines 1485/1489: `total_admins` and `total_guests` were added inside `workspace_analytics` object, where they already existed at lines 1392/1393
- `vi/translations.ts` lines 1502/1506: same duplicate keys in same object

**Fix applied:** Removed duplicate `total_admins` and `total_guests` entries from `workspace_analytics` block in both files. The correct translations live in the `analytics_dashboard` section (lines 3126+ in ko, 3154+ in vi).

**Post-fix TypeScript check on `packages/i18n`:** Clean (0 errors)

All 3 files (`en`, `ko`, `vi`) now:

- Parse without errors
- Contain `analytics_dashboard` section with ~60 keys
- No duplicate keys

---

## 3. Lint Check (dashboard files)

**Result: PASS** (warnings only, no errors)

| File                           | Issues                                                      |
| ------------------------------ | ----------------------------------------------------------- |
| `analytics-dashboard-card.tsx` | 4 warnings: `no-unsafe-member-access` on `any` typed values |
| `dashboards/page.tsx`          | 3 warnings: `useCallback` missing `t` dependency            |
| `home-dashboard-widgets.tsx`   | 1 warning: `react-refresh/only-export-components`           |

All warnings are pre-existing patterns. Zero errors across all dashboard files.

---

## 4. Test File Syntax Check

**Result: PASS**

```
File: apps/api/plane/tests/contract/app/test_analytics_dashboard.py
Syntax: OK
Test methods: 41
```

Python `ast.parse()` confirmed syntactically valid.

---

## 5. useTranslation Imports

**Result: PASS**

All modified frontend components correctly import and use `useTranslation`:

| File                                                         | Has Import | Has Usage |
| ------------------------------------------------------------ | ---------- | --------- |
| `dashboards/[dashboardId]/dashboard-toolbar.tsx`             | yes        | yes       |
| `dashboards/[dashboardId]/page.tsx`                          | yes        | yes       |
| `dashboards/components/analytics-dashboard-list-header.tsx`  | yes        | yes       |
| `dashboards/components/analytics-dashboard-delete-modal.tsx` | yes        | yes       |
| `dashboards/page.tsx`                                        | yes        | yes       |
| `core/components/home/home-dashboard-widgets.tsx`            | yes        | yes       |

---

## Files Modified by This Validation

- `/Volumes/Data/SHBVN/plane.so/packages/i18n/src/locales/ko/translations.ts` — removed 2 duplicate keys
- `/Volumes/Data/SHBVN/plane.so/packages/i18n/src/locales/vi/translations.ts` — removed 2 duplicate keys

---

## Unresolved Questions

None.
