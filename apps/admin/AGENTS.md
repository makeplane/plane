# Admin App (God Mode) — Agent Rules

> Rules for `apps/admin/`. Read root `AGENTS.md` first for universal rules.

## Stack

React 18 + React Router v7 (CSR) + Vite + MobX (8 stores) + Tailwind CSS v4

## Key Differences from Web App

| Aspect      | Web App (`apps/web/`)          | Admin App (`apps/admin/`)          |
| ----------- | ------------------------------ | ---------------------------------- |
| i18n        | YES (`useTranslation` + `t()`) | **NO** — English-only, no i18n     |
| Dialog      | Headlessui / ModalCore         | **Propel Dialog** (`onOpenChange`) |
| Menu        | `CustomMenu` from `@plane/ui`  | `Menu` from `@plane/propel/menu`   |
| Permissions | Workspace/Project roles        | Instance admin only (role >= 15)   |
| API base    | `/api/workspaces/{slug}/...`   | `/god-mode/instances/...`          |
| Stores      | 38 stores (CoreRootStore)      | 8 stores (separate root)           |

## NO i18n — English Only

- Do NOT import `useTranslation` or `@plane/i18n`
- Hardcoded English strings are fine in admin app
- This is intentional — admin is internal-only

## Propel Dialog Pattern (MANDATORY in admin)

```typescript
import { Dialog, EDialogWidth } from "@plane/propel/dialog";

<Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()} modal>
  <Dialog.Panel width={EDialogWidth.MD}>
    <div className="p-6">
      <Dialog.Title>Create Feature</Dialog.Title>
      <div className="mt-4 space-y-4">{/* form */}</div>
      <div className="mt-6 flex justify-end gap-2">{/* buttons */}</div>
    </div>
  </Dialog.Panel>
</Dialog>;
```

- Single `<div className="p-6">` wraps ALL content
- `onOpenChange` (NOT `onClose`)
- `mt-4` title→body, `mt-6` body→buttons
- Use `text-13` (NOT `text-sm`) in Propel dialogs

## Menu Pattern (Admin)

```typescript
import { Menu } from "@plane/propel/menu";
// NOT CustomMenu from @plane/ui
```

## Admin Stores (8 total)

| Store                          | Purpose                  |
| ------------------------------ | ------------------------ |
| `instance.store.ts`            | Instance configuration   |
| `root.store.ts`                | Root store               |
| `theme.store.ts`               | Theme management         |
| `user.store.ts`                | Current admin user       |
| `workspace.store.ts`           | Workspace management     |
| `instance-user.store.ts`       | User CRUD (admin panel)  |
| `instance-department.store.ts` | Department hierarchy     |
| `instance-staff.store.ts`      | Staff CRUD + bulk import |

## God Mode Routes & Features

| Route              | Feature                                                         |
| ------------------ | --------------------------------------------------------------- |
| `/users`           | User list, create, detail, workspace assignment, password reset |
| `/departments`     | Department tree, CRUD, hierarchy (max 6 levels)                 |
| `/staff`           | Staff table, CRUD, bulk import/export, deactivation             |
| `/monitoring`      | Email logs, scheduled jobs, worker health (3 tabs)              |
| `/task-categories` | Main/Sub task category CRUD                                     |
| `/configuration`   | Instance settings, OAuth, email, AI, Swing SSO config           |

## Backend Endpoints (God Mode)

All God Mode endpoints use:

- Base: `plane.license.api.views.BaseAPIView` (NOT `plane.app.views`)
- Permission: `InstanceAdminPermission` (NOT `@allow_permission`)
- No `workspace_slug` or `project_id` in kwargs
- URLs under `plane/license/api/urls/`

```
/god-mode/instances/monitoring/email-logs/      # Paginated email logs
/god-mode/instances/monitoring/scheduled-jobs/   # Celery periodic tasks
/god-mode/instances/monitoring/worker-health/    # Live Celery stats (cached 30s)
/god-mode/departments/                           # Department CRUD + tree
/god-mode/staff/                                 # Staff CRUD + bulk ops
```

## Component Usage

- Buttons: `@plane/propel/button` (same as web)
- Inputs: `@plane/propel/input` (add `className="w-full"`)
- Toast: `@plane/propel/toast` (same pattern)
- Icons: Lucide React + `@plane/propel/icons`
- ALL inputs use `bg-layer-2` (same as web)
- Semantic color tokens (same as web)

## MobX Pattern

Same as web app: `makeObservable` explicit, `observer()` from `mobx-react`, `set()` from `lodash-es`, `runInAction` for async updates.
