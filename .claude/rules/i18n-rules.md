---
paths:
  - apps/web/**/*.tsx
  - packages/i18n/**
---

# i18n (Internationalization) — MANDATORY

**Scope**: `apps/web` and `packages/i18n` ONLY.

> **Admin app (`apps/admin/`) is English-only — NO i18n.** See `.claude/rules/admin-app-conventions.md` (auto-loads when editing admin code). Do NOT import `useTranslation` or `@plane/i18n` in admin.

**NEVER hardcode user-facing strings.** Every visible text must use `t()` from `@plane/i18n`.

## What Must Use `t()`

- Button labels, titles, descriptions, placeholders
- Toast messages (title AND message)
- Empty states, error messages, loading text
- Accessibility labels (aria-label)

## Usage

```typescript
import { useTranslation } from "@plane/i18n";

export const MyComponent = observer(() => {
  const { t } = useTranslation();
  return <Button>{t("common.save")}</Button>;
});

// ✅ CORRECT
setToast({ type: TOAST_TYPE.SUCCESS, title: t("dashboard.created"), message: t("dashboard.created_message") });
<p>{t("dashboard.empty_state")}</p>

// ❌ WRONG — hardcoded English
setToast({ type: TOAST_TYPE.SUCCESS, title: "Success!" });
<p>No dashboards created yet.</p>
<Button>Cancel</Button>
```

## Translation Files

**Path**: `packages/i18n/src/locales/{lang}/translations.ts` — **TypeScript modules, NOT JSON**

```typescript
// packages/i18n/src/locales/en/translations.ts
export default {
  issue: {
    label: "Work item",
    count: "{count, plural, one {Work item} other {Work items}}",
  },
  my_feature: {
    label: "My Feature",
    create: "Create {name}",
    delete_confirm: "Are you sure you want to delete <strong>{name}</strong>?",
  },
};
```

**Rules:**

- Add keys to ALL 3 language files: en, ko, vi (use English as placeholder)
- Use ICU MessageFormat for pluralization
- Never create JSON translation files
