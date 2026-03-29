# Frontend Apps Exploration Report

**Date**: 2026-03-29 | **Thoroughness**: Medium

## Executive Summary

Plane monorepo contains **3 frontend apps** built with **React 18 + React Router v7** (migrated from Next.js), **MobX** state management, **Tailwind CSS v4**, and **TypeScript**. All apps use a **CE (Community Edition) override pattern** where `core/` contains upstream shared code and `ce/` contains CE-specific overrides.

---

## 1. apps/web/ - Main Web Application

### Directory Structure (Top 2 Levels)

```
apps/web/
├── app/                    # React Router app directory (SSR-like CSR)
│   ├── (home)/
│   ├── (all)/             # Auth-required routes (layout group)
│   │   ├── [workspaceSlug]/
│   │   ├── settings/
│   │   ├── accounts/
│   │   ├── sign-up/
│   │   └── ...auth routes
│   ├── assets/            # Favicon, images, auth assets
│   ├── compat/            # Next.js compatibility layer
│   ├── root.tsx           # App shell
│   └── provider.tsx       # Root provider setup
├── core/                  # Upstream shared code (DO NOT modify for CE)
│   ├── components/        # 48+ feature modules
│   ├── store/            # 33+ MobX stores
│   ├── services/         # 33+ API services
│   ├── hooks/            # 49+ custom hooks
│   ├── layouts/          # Layout components
│   ├── constants/        # Fetch keys, etc.
│   └── lib/              # Utilities
├── ce/                   # CE overrides (mirrors core/ structure)
│   ├── components/       # 43 override components
│   ├── store/           # Timeline, Worklog, Custom Dashboard, Workflow, Module Activity stores
│   ├── services/        # Worklog service overrides
│   ├── hooks/           # 24 CE-specific hooks
│   └── helpers/
├── styles/              # Global CSS, Tailwind config
├── public/              # Static assets
└── package.json         # React 18, @plane/*, MobX, SWR, react-hook-form
```

### Key Technologies

- **Framework**: React 18 + React Router v7 (Vite-based, no SSR)
- **State Management**: MobX (33+ stores) + SWR (read-only caching)
- **UI Component Libraries**:
  - `@plane/propel/*` (new, subpath imports only)
  - `@plane/ui` (legacy, barrel imports)
  - `@headlessui/react`, Radix UI primitives
- **Styling**: Tailwind v4 with semantic color tokens (no dark: variants)
- **Forms**: react-hook-form 7.51
- **Data Fetching**: SWR + store.fetchX() pattern (dual)
- **i18n**: @plane/i18n (ICU MessageFormat, TypeScript-based)
- **Drag & Drop**: @atlaskit/pragmatic-drag-and-drop
- **Charts**: recharts 2.12
- **Editor**: @plane/editor (custom implementation)

### Major Feature Areas (Core Components)

1. **Issues** (17 submodules) - Core issue management
2. **Cycles** - Sprint/cycle management
3. **Modules** - Feature organization
4. **Views** - Custom issue views (kanban, board, etc.)
5. **Projects** - Project CRUD & settings
6. **Workspace** - Workspace management
7. **Pages** - Document/wiki-like feature
8. **Inbox** - Notification inbox
9. **Analytics** - Reporting & insights
10. **Settings** - User/project/workspace settings
11. **Automation** - Workflow automation
12. **Time Tracking** - Time/effort tracking (CE feature)
13. **Navigation** - Sidebar, breadcrumbs, navigation UI

### Recent Additions (CE-Specific, Mar 25 2026)

- **Worklog Activity** - Time tracking activity tracking (`ce/components/issues/worklog/`)
- **Daily Logtime Indicator** - Visual indicator for daily time logging
- **Field Change Reason Modal** - Capture reason for field changes
- **Due Date Property Overrides** - CE-specific due date handling
- **Completed At Property** - Completion timestamp tracking
- **Profile Today Work Items** - User's daily work items view
- **Module Activity Store** - Track module-level activities

### MobX Store Pattern (33+ stores)

```
CoreRootStore (core/store/root.store.ts)
├── Cycle - cycles management
├── Module - modules management
├── Issue - nested (workspace, project, cycle, module, profile, issue-details)
│   ├── WorkspaceIssueStore - workspace-level issues
│   ├── IssueDetailsStore - single issue + activities
│   └── BaseIssuesStore - shared issue logic
├── Project - project CRUD & filter
├── Favorite - starred items
├── Label - issue labels
├── Dashboard - analytics dashboard
├── GlobalView - workspace-level saved views
├── State - project states
├── User, Workspace, Member - entity stores
└── Theme, Router, Instance stores

CE Extensions (ce/store/root.store.ts):
├── TimelineStore - timeline view
├── WorklogStore - time tracking
├── CustomDashboardStore - CE dashboard
├── ProjectWorklogStore - project worklog
├── WorkflowStore - workflow automation (NEW)
└── ModuleActivityStore - module activity (NEW)
```

### CE Override Pattern

- **Import Alias**: `@/*` → core, `@/plane-web/*` → ce
- **Rule**: Mirror core/ directory structure in ce/, register stores in ce/store/root.store.ts
- **Example**: Time tracking feature entirely in ce/ (no core equivalent)

### Routing Structure

- **Auth Gate**: (all)/ layout wraps authenticated routes
- **Workspace Context**: [workspaceSlug]/ loads workspace data
- **Feature Layout**: (projects)/ provides sidebar + navigation
- **Pages**: Individual feature pages under workspace

### Recent File Modifications (Last 30 Days)

- Issue filter/store updates (Mar 25)
- Worklog components & services (Mar 25, Mar 19)
- Dashboard store & navigation (Mar 18)
- Module store enhancements (Mar 19)
- Workspace view improvements (Mar 13)

---

## 2. apps/admin/ - Admin Dashboard

### Directory Structure (Top 2 Levels)

```
apps/admin/
├── app/
│   ├── (all)/
│   │   ├── (dashboard)/    # Admin dashboard sections
│   │   │   ├── general/
│   │   │   ├── workspace/
│   │   │   ├── departments/  (NEW - Mar 19)
│   │   │   ├── image/
│   │   │   ├── ai/
│   │   │   ├── users/
│   │   │   ├── staff/       (NEW - Mar 16)
│   │   │   ├── monitoring/
│   │   │   ├── authentication/
│   │   │   └── email/
│   │   └── (home)/
│   ├── assets/
│   ├── root.tsx
│   └── routes.ts
├── store/                   # 8 stores (local, no CE layer)
│   ├── instance.store.ts
│   ├── instance-user.store.ts
│   ├── instance-department.store.ts  (NEW - Mar 19)
│   ├── instance-staff.store.ts       (NEW - Mar 16)
│   ├── monitoring.store.ts
│   ├── workspace.store.ts
│   ├── theme.store.ts
│   └── user.store.ts
├── components/             # 5 categories
│   ├── authentication/
│   ├── common/
│   ├── instance/
│   ├── users/
│   └── workspace/
├── providers/              # Provider components (AppProviders)
├── hooks/                  # Custom hooks
├── lib/                    # Utilities
├── utils/                  # Helpers
├── styles/
└── package.json           # Admin-specific deps (xlsx for export)
```

### Key Technologies (Same as Web, Minus i18n)

- **Framework**: React 18 + React Router v7 (CSR, no SSR)
- **State**: MobX (8 stores) - simpler than web
- **UI**: @plane/propel, @headlessui/react
- **Styling**: Tailwind v4 (no i18n)
- **Forms**: react-hook-form 7.51
- **Export**: xlsx 0.18.5 (for bulk operations)
- **Virtualization**: @tanstack/react-virtual (for large tables)

### Major Feature Areas

1. **Instance Management** - System-wide settings
2. **Users Management** - User CRUD, roles, permissions
3. **Departments** - Organizational structure (NEW)
4. **Staff Management** - Staff profiles & roles (NEW)
5. **Workspace Management** - Multi-workspace admin
6. **Monitoring** - System health, metrics
7. **Authentication** - Auth provider settings
8. **Email Settings** - SMTP, email templates
9. **AI Settings** - AI provider configuration
10. **Image Management** - Logo, favicon settings

### MobX Stores (No CE Layer)

- All stores in `/store/` — **no ce/store/ equivalent**
- Instance, Department, Staff, User, Workspace, Monitoring stores
- Simple CRUD pattern (no complex nested structures like web)

### Notable Patterns

- **No i18n**: All text is hardcoded English (admin-only feature)
- **No CE overrides**: Admin doesn't use CE pattern (focused on instance management)
- **Simpler state**: 8 stores vs 33+ in web
- **Dashboard-focused**: Multiple admin dashboards with different roles

### Recent Additions (Mar 16-19)

- **Department Management** - Department CRUD, store, components (Mar 19)
- **Staff Management** - Staff profiles, store, components (Mar 16)
- Both new modules follow existing admin store pattern

---

## 3. apps/space/ - Public Space (Customer Feedback)

### Directory Structure (Top 2 Levels)

```
apps/space/
├── app/
│   ├── [workspaceSlug]/[projectId]/   # Public project view
│   ├── issues/[anchor]/                # Public issue view
│   ├── root.tsx
│   ├── error.tsx
│   └── providers.tsx
├── core/                              # Core public components (lite)
│   ├── components/ (8 categories)
│   │   ├── account/
│   │   ├── common/
│   │   ├── editor/
│   │   ├── instance/
│   │   ├── issues/
│   │   ├── ui/
│   │   └── views/
│   ├── store/ (9 stores - lightweight)
│   ├── hooks/
│   ├── lib/
│   └── types/
├── ce/                                # CE overrides (minimal)
│   ├── components/ (5 categories)
│   ├── hooks/
│   └── store/ (minimal)
├── ee/                                # EE-specific features (if any)
├── styles/
└── package.json                       # No i18n, no admin deps
```

### Key Technologies

- **Framework**: React 18 + React Router v7 (SSR-capable with loaders)
- **State**: MobX (9 stores) - lightweight
- **i18n**: @plane/i18n (ICU MessageFormat)
- **UI**: @plane/propel, @headlessui/react
- **Styling**: Tailwind v4
- **Forms**: react-hook-form 7.51
- **Editor**: @plane/editor (read-only view)
- **Rendering**: SSR-capable (see headers & loaders in root.tsx)

### Major Feature Areas (Minimal Scope)

1. **Public Issues** - Public issue view (read-only)
2. **Public Projects** - Public project listing
3. **Account** - User account (minimal)
4. **Editor** - Markdown editor for issue descriptions (read-only)
5. **Instance** - Instance info
6. **Views** - Simple views (board, list)
7. **Comments** - Public comments on issues

### MobX Stores (Lightweight)

- Workspace, Project, Issue, Comment, Member, User stores
- Minimal nested structures compared to web
- No complex filter/view logic

### Notable Patterns

- **SSR-Ready**: Has `headers()` function for security headers
- **Public-First**: No auth gate, limited features
- **Lightweight State**: 9 stores vs 33+ in web
- **Read-Only**: No create/edit capabilities (mostly)
- **i18n Support**: Translations for public UI

### CE Layer (Minimal)

- Override hooks, components, stores
- Much lighter than web's CE layer
- Focuses on public feature extensions

---

## Common Patterns Across All Apps

### 1. **Routing (React Router v7)**

- **Route Groups** (parenthesized dirs) for layout nesting without URL impact
- **CSR Pattern** (web, admin) vs **SSR Pattern** (space)
- **File-based routing** with app/ directory structure
- **Type-safe routes** via +types/page conventions

### 2. **MobX State Management**

- **makeObservable** with explicit field declarations (NEVER makeAutoObservable)
- **runInAction** for async observable updates
- **set()** from lodash-es for dynamic record keys (NOT mobx.set)
- **observer()** wrapper on all components reading stores
- **Dual fetch patterns**: SWR (read-only) + store.fetchX() (mutations)

### 3. **Component Libraries**

- **@plane/propel/\***: Subpath imports only (new, preferred)
- **@plane/ui**: Barrel imports (legacy, don't add new usage)
- **Custom dropdowns**: CustomMenu, specialized pickers (DatePicker, MemberDropdown)

### 4. **Styling & Tokens**

- **Tailwind v4** with semantic color tokens
- **NO dark: variants** — tokens auto-adapt via data-theme attribute
- **Token naming**: text-primary (NOT text-color-primary), bg-layer-2 (for inputs)
- **Themes**: light, dark, light-contrast, dark-contrast, custom

### 5. **Internationalization (web & space only)**

- **@plane/i18n** with ICU MessageFormat
- **TypeScript-based** translation files (NOT JSON)
- **All visible text** must use t() — never hardcoded
- **3 languages**: en, ko, vi
- **Admin has no i18n** (hardcoded English)

### 6. **CE Override Pattern (web & space)**

- **core/** = upstream shared (read-only)
- **ce/** = CE overrides (mirrors structure)
- **Import aliases**: @/_ → core, @/plane-web/_ (web) or @/plane-space/\* (space) → ce
- **Store registration** in ce/store/root.store.ts (extends CoreRootStore)
- **NO modifications** to core/store/root.store.ts for CE features

### 7. **Service Classes**

- **APIService** base class with axios
- **Workspace/project/item** scoped URLs
- **CE services** use CE prefix (CEWorklogService)

### 8. **Forms & Input Validation**

- **react-hook-form** 7.51
- **@plane/propel/input** and custom form components
- **bg-layer-2** ALWAYS for input backgrounds (NOT bg-surface-1)

### 9. **Data Fetching Patterns**

Two coexist:

- **useSWR**: Read-only, component-local, cache benefits
- **store.fetchX()**: Mutations, shared MobX state, complex logic

### 10. **Providers & Setup**

- **ThemeProvider** (next-themes) wraps app
- **StoreProvider** gives React context access to MobX stores
- **TranslationProvider** for i18n (web & space)
- **ToastProvider** for notifications
- **AppProgressBar** for page loading indicator

---

## File Statistics

| App   | Components      | Stores              | Services       | Hooks           | Routes | Package Size |
| ----- | --------------- | ------------------- | -------------- | --------------- | ------ | ------------ |
| web   | 48 core + 43 ce | 33 core + 6 ce      | 33 core + 1 ce | 49 core + 24 ce | 50+    | ~1.2GB       |
| admin | 5 categories    | 8 (no ce)           | ~10            | ~15             | ~20    | ~600MB       |
| space | 8 core + 5 ce   | 9 core + minimal ce | ~8 core        | ~10             | ~10    | ~500MB       |

---

## Recent Development (Last 2 Weeks)

### apps/web/

- **Worklog/Time Tracking**: Enhanced CE module with activity tracking, reason modals, daily indicators
- **Issue Store**: Filter optimizations, workspace filter updates
- **Module Store**: Activity tracking enhancements
- **Dashboard**: Store improvements for custom dashboards

### apps/admin/

- **New Department Module**: Full CRUD, store, components (Mar 19)
- **New Staff Module**: Staff profiles, roles, components (Mar 16)
- Both follow established admin patterns

### apps/space/

- Stable (no recent major changes in last 2 weeks)

---

## Unresolved Questions / Notes for Follow-up

1. **What's the ee/ directory in apps/space?** - Currently empty/minimal. Clarify future enterprise features there.
2. **SWR vs store.fetchX() decision criteria** - Rules exist but patterns coexist. Standardization opportunity?
3. **Component deduplication** - Web has 48 core + 43 ce = 91 components. Space has only 8 core + 5 ce. Are there opportunities to share?
4. **Admin i18n roadmap** - Currently hardcoded English. Is multi-language admin planned?
5. **Space SSR usage** - App has headers() and loaders defined, but routes.ts may not be configured for full SSR. Clarify the actual rendering strategy.
