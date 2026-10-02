# Plane frontend summary

## 1. Monorepo layout

pnpm workspaces plus Turborepo. Dependency versions come from `catalog:`, and internal packages use `workspace:*`.

| App          | Purpose                                                                           | Rendering                                              |
| ------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `apps/web`   | Main product app on port 3000                                                     | `ssr: false`, static client bundle served with `serve` |
| `apps/admin` | Instance admin ("god mode"), on port 3001, with a `VITE_ADMIN_BASE_PATH` basename | `ssr: false`                                           |
| `apps/space` | Public published boards, with a `VITE_SPACE_BASE_PATH` basename                   | `ssr: true`, the only SSR app                          |

All three use React Router v7 framework mode (`@react-router/dev`) on Vite and TypeScript, with `vite-tsconfig-paths` and the `@/` alias. Each has its own `react-router.config.ts` with `appDirectory: "app"`.

The shared packages are:

- `@plane/types`, `@plane/constants`, `@plane/utils`, `@plane/hooks`
- `@plane/services`, the typed API client layer
- `@plane/shared-state`, the MobX stores shared across apps
- `@plane/i18n`
- `@plane/editor`
- `@plane/blocks`
- `@plane/tailwind-config`, `@plane/typescript-config`, `@plane/logger`, `@plane/decorators`, `@plane/codemods`

## 2. Routing (React Router v7, config-based)

Routes are declared in code with `route`, `layout` and `index` helpers, not by file-system convention.

- `apps/web/app/routes.ts` merges `coreRoutes` and `extendedRoutes` through `mergeRoutes`. It wraps them in the pathless shell `layout.tsx` and adds a `*` catch-all pointing to `not-found.tsx`.
- `apps/web/app/routes/core.ts` holds the main route tree. `extended.ts` is currently an empty extension point, which suggests a layer for add-on or enterprise routes.
- Folder names such as `(all)`, `(home)`, `(projects)` and `[workspaceSlug]` are only used for grouping. Each route points explicitly at a `page.tsx` and its `layout.tsx`.

The route tree in `core.ts` is nested like this:

```
Sign in (/), /sign-up, /accounts/{forgot,reset,set}-password,
/create-workspace, /onboarding, /invitations, /workspace-invitations
└─ (all)/layout
   └─ :workspaceSlug/layout
      ├─ (projects) layout
      │   ├─ workspace level: home, active-cycles, analytics/:tabId, browse/:workItem,
      │   │   drafts, notifications, profile, stickies, workspace views, archived projects
      │   ├─ project level: project list, issues, cycles, modules, views, pages, intake
      │   └─ project archives: issues, cycles, modules
      └─ settings: workspace settings, project settings
         (members, features, states, labels, estimates, automations)
   └─ standalone routes and profile settings
Legacy redirects (routes/redirects/): sign-up, sign-in, register, project settings,
analytics, api-tokens, inbox, profile and account settings
```

The admin app has a flat `(home)` login route and a `(dashboard)` layout with `general`, `workspace`, `email`, `authentication/{github,gitlab,google,gitea}`, `ai` and `image`. The space app has `/`, `:workspaceSlug/:projectId` and `issues/:anchor`.

The code mixes `next/navigation` (`useParams`) and `next-themes` with React Router. `next/navigation` is leftover from an earlier Next.js version, so check how the web app aliases or shims it before relying on it.

## 3. Provider tree and bootstrapping

Web (`apps/web/app/provider.tsx`):

```
StoreProvider (MobX RootStore context)
 └ AppProgressBar (lazy)
   └ TranslationProvider (@plane/i18n)
     └ PlaneToastProvider (@plane/blocks/toast)
       └ StoreWrapper (lazy: theme sync, sidebar state, route params → router store)
         └ InstanceWrapper (lazy: instance config and gating)
           └ Suspense → SWRConfig (WEB_SWR_CONFIG) → routes
```

Space adds `next-themes`' `ThemeProvider` and an `InstanceProvider`. Admin splits providers into `CoreProviders` and `ExtendedProviders`. The same "core + extended" split appears in routes, hooks and components, so Plane appears to have a base layer that extra features can extend.

## 4. State management and data fetching

- **MobX** (`mobx`, `mobx-react`, `mobx-utils`). Components are wrapped in `observer`.
- A single `RootStore` singleton (`apps/web/store/root.store.ts`) is exposed via React context (`apps/web/lib/store-context.tsx`).
- Domain stores live in `apps/web/store/`, for example `cycle`, `module`, `state`, `label`, `project`, `member`, `user`, `workspace`, `inbox`, `notifications`, `pages`, `sticky`, `estimates`, `dashboard`, `favorite`, `theme`, `router` and `instance`.
- The `issue/` store is split by scope (`workspace`, `project`, `cycle`, `module`, `archived`, `profile`, `project-views`, `workspace-draft`, `issue-details`). It also has per-layout stores (`kanban`, `calendar`, `gantt`).
- `packages/shared-state` holds the stores used across apps: `user`, `workspace`, `rich-filters` and `work-item-filters`.
- Hooks like `useAppTheme`, `useUserProfile` and `useIssueLayoutStore` wrap store access under `apps/web/hooks/store/`.
- **SWR** handles server fetching and caching, configured globally by `WEB_SWR_CONFIG` from `@plane/constants`. Stores usually fetch through services and keep the state, while SWR drives revalidation from components.
- **Services** are in `packages/services/src`. They are axios-based, with `api.service.ts` as the base and one folder per domain (`issue`, `cycle`, `module`, `project`, `state`, `label`, `workspace`, `user`, `auth`, `file`, `intake`, `dashboard`, `instance`, `ai`, `developer`). Plus `live.service.ts` (live server) and `indexedDB.service.ts` (offline cache, with `comlink` suggesting worker usage).

## 5. Component library

The AGENTS.md rule for the library is:

- **Primitives:** `@makeplane/propel`, a published npm package. Import from `@makeplane/propel/components/*`, `elements/*` or `icons`.
- **Composite, Plane-specific components:** `@plane/blocks`. Use subpath imports only, for example `@plane/blocks/toast`. Its source folders are `auth`, `breadcrumb`, `card`, `charts`, `context-menu`, `dialog`, `emoji-icon-picker`, `emoji-reaction`, `empty-state`, `icons`, `layout`, `pill-button`, `portal`, `property-select`, `select`, `skeleton`, `spinner`, `toast`, `virtual-list` and others. It is built with `tsdown` and tested with Vitest.
- **App components:** `apps/web/components` is organised by feature (`issues`, `cycles`, `modules`, `pages`, `inbox`, `gantt-chart`, `rich-filters`, `work-item-filters`, `power-k`, `settings`, `sidebar`, `workspace`, `onboarding` and so on), plus `core`, `common`, `ui` and `dropdowns`.
- `@base-ui/react` is also a dependency.
- Other UI libraries:
  - `lucide-react` for icons, and `@fontsource` fonts (Inter, IBM Plex Mono, Material Symbols).
  - `cmdk` for the command palette (together with the `power-k` stores and components).
  - `recharts` for charts, `@tanstack/react-table` for tables, and `react-hook-form` for forms.
  - `@atlaskit/pragmatic-drag-and-drop` for drag and drop (kanban and sorting).
  - `emoji-picker-react`, `react-dropzone`, and `@react-pdf/renderer` for PDF export.
  - `react-markdown`, `export-to-csv`, `date-fns` and `lodash-es`.

## 6. Styling

Tailwind CSS v4 via `@tailwindcss/postcss`, with `@tailwindcss/typography`. Shared config and tokens are in `packages/tailwind-config` (`index.css`, `postcss.config.js`). `next-themes` handles light, dark and system modes, and a "custom" theme applies a primary and background colour through CSS variables (`applyCustomTheme` in `@plane/utils`). The profile theme is synced from the server once per user, after which it is driven by localStorage.

## 7. Editor

`@plane/editor` (`packages/editor/src`) provides the rich-text and document editor, with `components`, `extensions`, `plugins`, `hooks`, `contexts` and `styles`. It is likely built on TipTap/ProseMirror. Collaborative editing connects to `apps/live` through `live.service.ts` and hooks such as `use-realtime-page-events` and `use-collaborative-page-actions`. The web app also has page and editor hooks (`use-editor-flagging`, `use-parse-editor-content`, `use-page-*`).

## 8. i18n

`@plane/i18n` provides `TranslationProvider`, hooks, and per-language JSON files in `src/locales`. The `translate` skill documents the translation workflow and rules.

## 9. Tooling and conventions

- Lint is OxLint with a shared `.oxlintrc.json`. The web app allows up to 11,957 warnings (`--max-warnings=11957`), so there is a lot of existing lint debt. Formatting is `oxfmt`.
- Type checking is `react-router typegen && tsc --noEmit`, in strict TypeScript.
- Root commands (from AGENTS.md): `pnpm dev`, `pnpm build`, `pnpm check`, `pnpm fix`, and `pnpm turbo run <cmd> --filter=<pkg>`.
- Tests are Vitest in packages (`blocks`, `codemods`) and `live`.
- `packages/codemods` holds codemods (`function-declaration`, `remove-directives`) used for large-scale refactors.
- Lazy loading (`React.lazy`) and the `unstable_optimizeDeps` option keep the Vite dev server from re-optimizing mid-session.
- Docker builds are `Dockerfile.web`, `Dockerfile.admin` and `Dockerfile.space`. Static builds are served by Caddy (`caddy/`) for web and admin, and by nginx for space.
