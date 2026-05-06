---
paths:
  - apps/admin/**/*.tsx
  - apps/admin/**/*.ts
---

# Admin App (God Mode) Conventions — MANDATORY

**Scope**: `apps/admin/` only. Auto-loads when Claude touches any admin file.

> Admin is intentionally different from `apps/web/`. Do NOT copy patterns from web — many will violate admin rules. When in doubt, check `apps/admin/AGENTS.md` for the full reference.

## Critical Rule #1 — English Only, NO i18n

- **NEVER import `useTranslation` or `@plane/i18n`** in admin code
- **NEVER write Vietnamese (or any non-English) strings** in admin: toasts, labels, modal titles, button text, empty states, error messages, placeholders, headers, descriptions
- All user-facing strings are **hardcoded English**
- Admin is internal-only — no localization needed

```tsx
// ❌ WRONG — non-English string in admin
setToast({ type: TOAST_TYPE.SUCCESS, title: "Đã lưu" });
<Button>Huỷ</Button>
<p>Chưa có dữ liệu</p>

// ❌ WRONG — i18n in admin
const { t } = useTranslation();
<Button>{t("common.cancel")}</Button>

// ✅ CORRECT
setToast({ type: TOAST_TYPE.SUCCESS, title: "Saved" });
<Button>Cancel</Button>
<p>No data yet</p>
```

If you encounter pre-existing non-English strings in admin: they are **tech debt, not precedent**. Convert to English when touching the file.

## Critical Rule #2 — Propel Dialog (NOT Headlessui / ModalCore)

```tsx
import { Dialog, EDialogWidth } from "@plane/propel/dialog";

<Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()} modal>
  <Dialog.Panel width={EDialogWidth.MD}>
    <div className="p-6">
      <Dialog.Title>Create Feature</Dialog.Title>
      <div className="mt-4 space-y-4">{/* form body */}</div>
      <div className="mt-6 flex justify-end gap-2">{/* buttons */}</div>
    </div>
  </Dialog.Panel>
</Dialog>;
```

- Single `<div className="p-6">` wraps ALL content (title + body + buttons)
- `onOpenChange` (NOT `onClose`) — Propel signature
- `mt-4` title→body, `mt-6` body→buttons
- Use `text-13` (NOT `text-sm`) in Propel dialogs

## Critical Rule #3 — Menu from Propel (NOT @plane/ui)

```tsx
import { Menu } from "@plane/propel/menu"; // ✅ admin
// NOT: import { CustomMenu } from "@plane/ui";   ❌ that's for web
```

## Critical Rule #4 — bg-layer-2 for ALL Inputs

ALL `<input>`, `<select>`, `<textarea>`, date pickers use `bg-layer-2`:

```tsx
<Input className="bg-layer-2 ..." />   // ✅
<Input className="bg-surface-1 ..." />  // ❌ that's for cards/panels
```

## Web App vs Admin App — Quick Reference

| Aspect      | Web (`apps/web/`)              | Admin (`apps/admin/`)              |
| ----------- | ------------------------------ | ---------------------------------- |
| i18n        | YES — `useTranslation` + `t()` | **NO** — English-only              |
| Dialog      | Headlessui / ModalCore         | **Propel Dialog** (`onOpenChange`) |
| Menu        | `CustomMenu` from `@plane/ui`  | `Menu` from `@plane/propel/menu`   |
| Permissions | Workspace/Project roles        | `InstanceAdminPermission`          |
| API base    | `/api/workspaces/{slug}/...`   | `/god-mode/instances/...`          |
| Stores      | 38 stores (CoreRootStore)      | 8 stores (separate root)           |

## Same as Web (no special admin rule)

- Buttons: `@plane/propel/button`
- Toast: `@plane/propel/toast` + `setToast` after every mutation
- Icons: Lucide React + `@plane/propel/icons`
- Semantic color tokens (`text-primary`, `border-subtle`, `bg-surface-1`, etc.)
- MobX: `observer()` from `mobx-react`, `makeObservable` explicit, `set()` from `lodash-es`
- File size: <200L code, <150L components

## When You Encounter Conflicting Pre-existing Code

1. Pre-existing VN strings → tech debt. Convert to English when touching the file. Don't extend the pattern.
2. Pre-existing `useTranslation` → should not exist in admin. Flag and remove.
3. Pre-existing Headlessui Dialog → should not exist in admin. Flag and migrate to Propel.

## Full Reference

For complete admin app context (stores list, route map, backend endpoints), see `apps/admin/AGENTS.md`.
