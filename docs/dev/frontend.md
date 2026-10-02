# Frontend: reusable components, styling and file structure

## 1. Reusable component libraries

There are three layers, and the web app imports from all of them.

| Layer              | Package                                     | Import style                                                                   | Notes                                                     |
| ------------------ | ------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Primitives         | `@makeplane/propel` (published npm package) | `@makeplane/propel/components/<name>`, `/elements/<name>`, `/icons`, `/styles` | Design tokens, animations and base components             |
| Composite blocks   | `@plane/blocks` (`packages/blocks`)         | Subpath imports only, for example `@plane/blocks/toast`                        | Plane-specific composites, built with `tsdown` to `dist/` |
| Feature components | `apps/web/components/<feature>`             | `@/components/...`                                                             | App-specific UI                                           |

Propel's source isn't installed in the workspace, so its component list below comes from how the web app imports it.

**Propel components used** (811 imports across 427 files): `button`, `icon`, `icon-button`, `input` (`Input`, `InputGroup`), `text-area`, `field`, `dialog`, `menu`, `popover`, `combobox`, `tooltip`, `avatar`, `tabs`, `table`, `checkbox`, `switch`, `collapsible`, `banner`, `linear-progress`, `circular-progress`. A few files import `Button` from `elements/button`, so older `elements/*` imports still sit next to the newer `components/*` ones. Icons come from `@makeplane/propel/icons` and are named like `AddOutline`, `SearchOutline` and `MoreHorizontalOutline`.

**`@plane/blocks` exports** (from its `package.json`): `auth`, `breadcrumb`, `card`, `charts/*` (area, bar, line, pie, radar, tree-map), `common`, `context-menu`, `dialog`, `emoji-icon-picker`, `emoji-reaction`, `empty-state`, `icons`, `layout`, `pill-button`, `portal`, `property-select`, `select`, `skeleton`, `spinner`, `toast`, `virtual-list`, `types` and `utils`. It has no root `index.ts`, so you must use the subpaths. It uses `class-variance-authority` and `clsx` for variants, `@base-ui/react` for headless primitives, and Vitest with Testing Library for tests.

**Other shared UI dependencies:**

- `lucide-react` for icons.
- `@atlaskit/pragmatic-drag-and-drop` for drag and drop.
- `@tanstack/react-virtual` for virtualised lists.
- `recharts` for charts, `react-hook-form` for forms, and `cmdk` for the command palette.
- `@tanstack/react-table` for tables.
- `cn` from `@plane/utils` for merging class names.

**Reuse for the copilot:**

- `Dialog`, `Menu`, `Combobox`, `Field`, `Input`, `TextArea`, `Switch`, `Collapsible`, `Tabs`, `Tooltip`, `Banner` and `Button` from Propel.
- `setToast` and `PlaneToastProvider` from `@plane/blocks/toast`, plus `empty-state` and `skeleton`.
- `Collapsible` fits the "collapse answered widgets" requirement, and `Combobox` fits the ticket picker.

## 2. Styling

- **Tailwind CSS v4** via `@tailwindcss/postcss`, configured in CSS rather than `tailwind.config.js`. The shared entry is `packages/tailwind-config/index.css`. It runs `@import "tailwindcss"` then `@import "@makeplane/propel/styles"`, which provides the tokens and animations and the `@source` scan of Propel's `dist` so its classes are generated.
- `apps/web/styles/globals.css` imports that config, then `@plane/editor/styles`, `power-k.css`, `emoji.css` and `@tailwindcss/typography`. It also defines editor and sticky colour variables and a few custom animations.
- **Semantic tokens, not raw colours.** The code uses names like `bg-canvas`, `bg-surface-1`, `bg-surface-2`, `text-primary`, `text-secondary`, `text-placeholder`, `border-subtle` and `bg-layer-transparent`. Theming comes from CSS variables keyed on `[data-theme*="dark"]` and `[data-theme="dark-contrast"]`. Prefer these over hard-coded colours.
- **Theme handling:** `next-themes` sets `data-theme`, and `StoreWrapper` syncs the user's saved theme. The "custom" theme writes CSS variables through `applyCustomTheme`.
- **Custom utilities** in the shared CSS: `vertical-scrollbar`, `horizontal-scrollbar`, scrollbar sizes (`scrollbar-sm`, `scrollbar-md`, `scrollbar-lg`), `conical-gradient`, `progress-bar` and `vertical-lr`. Native scrollbars are hidden globally, so scrollable regions need one of the scrollbar classes (as `workspace-views/page.tsx` does).
- **Fonts:** Inter Variable and IBM Plex Mono through `@fontsource`, and Material Symbols Rounded.
- The shared CSS notes that Propel's token values differ from what Plane shipped before, and that some scrollbar utility names (`sm`, `md`, `lg`) are defined by both Propel and Plane, with Plane's overriding.

## 3. File structure and conventions

**Routes (`apps/web/app`).** Each route has a `page.tsx` and usually a `layout.tsx`, grouped in folders such as `(all)/[workspaceSlug]/(projects)/...`. Routes are declared in `routes/core.ts`. A page is a thin default export wrapped in `observer`, which composes feature components and hooks. A layout renders `<Outlet />` inside the shell: sidebar, extended sidebar and a `<main className="... bg-surface-1">`.

**Feature components (`apps/web/components/<feature>/`).**

- Files are kebab-case, one component per file, and named by role: `root.tsx`, `modal.tsx`, `form.tsx`, `header.tsx`, `quick-actions.tsx`, `list-item.tsx`, `loader.tsx`, `empty-state.tsx`, `delete-*-modal.tsx`.
- Nested subfolders appear for larger features (`project-states/create-update/`, `onboarding/steps/...`).
- An `index.ts` barrel re-exports the folder (`export * from "./root"`), though some folders have none.
- Every file starts with the AGPL licence header.

**Component conventions** (see `workspace/views/modal.tsx`):

- Named exports of `observer(function Name(props: Props) {...})`. `Props` is a local `type`.
- Import order is grouped with comments: third-party, then `// plane imports`, `// hooks`, `// components`, and `// local imports`.
- Hooks are grouped under comments such as `// router`, `// plane hooks`, `// store hooks`, `// derived values`.
- User feedback goes through `setToast({ type, title, message })`.
- Text goes through `useTranslation()` and `t("key")`.
- The `@/*` alias maps to the app root.

**Where shared code lives:**

- `apps/web/hooks/store/use-*.ts`: typed wrappers over the MobX `RootStore` (`use-cycle`, `use-project`, `use-page`, `use-issues` and so on).
- `apps/web/hooks/use-*.tsx`: general hooks.
- `apps/web/store/**`: MobX stores, with `root.store.ts` as the entry.
- `packages/services`: API clients.
- `packages/types`, `packages/constants`, `packages/utils`: types, constants and utilities.
- `core/` and `common/` in `components`: shared building blocks. `core/` holds modals, theme, sidebar and filters, and `common/` holds `empty-state`, `count-chip`, `data-table`, `layout-error-boundary` and `breadcrumb-link`.
- `extended-*` files such as `extended-sidebar.tsx`, `extended-project-sidebar.tsx` and `routes/extended.ts` are hooks for add-on features, empty or minimal in this repo.

**Tooling checks.** `pnpm check:types` runs `react-router typegen && tsc --noEmit`, `check:lint` runs OxLint, and `check:format` runs `oxfmt`. These mean new files must follow the formatting and typing rules.

## Takeaways for building the copilot panel

- Put it in `apps/web/components/<feature>/` (for example `ai-copilot/`), with `root.tsx`, one file per widget and an `index.ts`.
- Use Propel and `@plane/blocks` components, semantic Tailwind tokens, `cn()` and `vertical-scrollbar`.
- Add a MobX store and a `hooks/store/use-*.ts` wrapper, a service in `@plane/services`, and i18n keys.
- Wrap components in `observer` and use `setToast` for errors.
- Dock the panel inside the page layout (`(projects)/layout.tsx` is the shell) or next to the page and work item content.
