<!-- Scope: apps/web/**/components/**, apps/admin/**/components/** -->

# Dialog / Modal Patterns

The codebase has **3 dialog systems**. Choose based on which app:

| System                       | Used In              | Props                               |
| ---------------------------- | -------------------- | ----------------------------------- |
| `@plane/propel/dialog`       | `apps/admin/`        | `open`, `onOpenChange`              |
| `@headlessui/react`          | `apps/web/core/`     | `show` (Transition.Root), `onClose` |
| `ModalCore` from `@plane/ui` | `apps/web/` (legacy) | `isOpen`, `handleClose`             |

**Rule**: Admin = Propel. Web core = Headlessui. Don't mix.

## Pattern A: Propel Dialog (`apps/admin/` ONLY)

Dialog.Panel and Dialog.Title have **NO padding** — add your own:

```typescript
import { Dialog, EDialogWidth } from "@plane/propel/dialog";

<Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()} modal>
  <Dialog.Panel width={EDialogWidth.MD}>
    <div className="p-6">
      <Dialog.Title>Create Feature</Dialog.Title>
      <div className="mt-4 space-y-4">{/* form content */}</div>
      <div className="mt-6 flex justify-end gap-2">{/* buttons */}</div>
    </div>
  </Dialog.Panel>
</Dialog>;
```

**Key rules:**

- Single `<div className="p-6">` wraps ALL content (title + body + buttons)
- `mt-4` title→body, `mt-6` body→buttons
- `onOpenChange` (NOT `onClose`)

## Pattern B: Headlessui Dialog (`apps/web/core/`)

```typescript
import { Dialog, Transition } from "@headlessui/react";

<Transition.Root show={isOpen} as={React.Fragment}>
  <Dialog as="div" className="relative z-20" onClose={handleClose}>
    {/* Transition.Child for backdrop + panel */}
  </Dialog>
</Transition.Root>;
```

**Key rules:**

- `onClose` (void function)
- Content padding: `px-4 pb-4 pt-5 sm:p-6 sm:pb-4`
- Dialog.Title uses `as="h3"` prop

## Common Dialog Mistakes

- ❌ Dialog.Title outside padding wrapper → MUST be inside `<div className="p-6">`
- ❌ `onClose` on Propel Dialog → use `onOpenChange`
- ❌ Split padding in Dialog → use single `p-6` wrapper
- ❌ Propel Dialog in web app / Headlessui in admin app → match the app
- ❌ `text-sm` in Propel dialogs → use `text-13`

## Toast Pattern (use after ALL mutations)

```typescript
import { TOAST_TYPE, setToast, setPromiseToast } from "@plane/propel/toast";
setToast({ type: TOAST_TYPE.SUCCESS, title: "Saved!" });
setToast({ type: TOAST_TYPE.ERROR, title: "Failed to save" });
```

Types: `SUCCESS`, `ERROR`, `INFO`, `WARNING`, `LOADING`
