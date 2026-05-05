# God-Mode Admin Panel Architecture Research

## 1. God-Mode API Authentication

**Permission Classes:**

- **WorkSpaceAdminPermission**: Used for staff endpoints in `apps/api/plane/app/views/workspace/staff.py`
- **WorkspaceEntityPermission**: Fallback for general workspace entity checks
- Pattern: Permission class validates workspace admin status, controls access to CRUD operations

**URL Organization:**

- God-mode URLs centralized in `apps/api/plane/app/urls/__init__.py`
- Dedicated URL modules: `staff.py`, `department.py`, `analytic.py`
- Routes prefixed with workspace slug: `/workspaces/<slug>/staff/`, `/workspaces/<slug>/department/`
- Admin endpoints support GET, POST, PATCH, DELETE (full CRUD)

---

## 2. God-Mode Frontend Service Pattern

**Admin App Structure:**

- Separate Next.js app at `apps/admin/` with independent routing
- Uses MobX stores for state management (follows main app pattern)
- Hook pattern: `useInstance()` for instance-level data, workspace-level stores as needed
- SWR for data fetching with instance config caching
- Observers on all MobX-reading components

**No Separate Service Layer:** Admin uses shared API client + MobX stores directly (no intermediate service wrapper).

---

## 3. God-Mode Page Structure

**Example: Intercom Config Page**

- Component: `observer()` HOC wrapping page component
- Hooks: `useInstance()` for configurations, `useSWR()` for async data
- State: Local useState for form submission states
- Pattern: Fetch instance configs → display toggle → update via hook

**Layout Pattern:**

- Nested layouts in `apps/admin/app/(all)/(dashboard)/layout.tsx` and `apps/admin/app/(all)/(home)/layout.tsx`
- Route groups `(all)`, `(dashboard)`, `(home)` for layout segmentation
- Providers likely injected at root layout level

---

## 4. Admin Sidebar & Extended Menu

**Pattern Not Found:** No explicit CE override in `apps/admin/hooks/use-sidebar-menu/` detected. Admin likely has its own dedicated sidebar/menu configuration separate from main app (CE override pattern applies to `web/` app only).

---

## 5. Admin Routing

**Router Config:** Uses Next.js App Router (file-based routing via `app/` directory structure)

- File structure: `app/(group)/(subgroup)/feature/page.tsx`
- Route groups: `(all)`, `(home)`, `(dashboard)`, `(settings)` (inferred from layout files)
- No explicit `react-router.config.ts` found (this is Next.js App Router, not React Router v7)

---

## Key Insights

1. **Separation of Concerns**: Admin app is fully isolated—separate Next.js app, dedicated stores, independent routing
2. **Permission Hierarchy**: Workspace admin checks via `WorkSpaceAdminPermission`, instance-level config via `useInstance()`
3. **MobX-First State**: Consistent with main app; all stores use `makeObservable` (explicit), observers on components
4. **API-First Design**: Admin pages fetch data on mount via SWR, update via MobX store hooks
5. **Layout Composition**: Nested layouts with route groups; providers injected early

---

## Unresolved Questions

- Where are MobX instance stores defined (`useInstance()`)?
- Does admin app have its own `.next/` build or shares with web app?
- How is auth token passed from web app to admin app (iframe, separate auth, shared session)?
