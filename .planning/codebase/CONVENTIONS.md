# Coding Conventions

**Analysis Date:** 2026-05-03

## Overview

This monorepo mixes **TypeScript/React** (apps/web, apps/admin, apps/space, apps/live, packages/\*) with **Python/Django** (apps/api). Conventions differ per stack but are unified by:

- **Lint/format:** OxLint + oxfmt at the JS/TS layer; ruff at the Python layer.
- **Single root configs:** `.oxlintrc.json`, `.oxfmtrc.json`, `apps/api/pyproject.toml` (`[tool.ruff]`).
- **Pre-commit gate:** `.husky/pre-commit` → `pnpm lint-staged` → `oxfmt` then `oxlint --fix --deny-warnings` on staged JS/TS/JSON/CSS/MD files (see root `package.json` `lint-staged`).
- **Ratcheting warning budget:** every TS package pins `--max-warnings` (web=11957, admin=759, space=676, live=119, `@plane/ui`=66). When you touch a file, leave the file with fewer warnings, never more. Never raise the budget.

## Naming Patterns

### Files

- **TS source files (non-React):** kebab-case for utilities and hooks. Examples: `apps/web/core/hooks/use-debounce.tsx`, `apps/web/core/hooks/use-keypress.tsx`, `apps/web/core/store/router.store.ts`.
- **Service files:** dotted suffix `.service.ts`. Examples: `apps/web/core/services/api.service.ts`, `apps/web/core/services/cycle.service.ts`.
- **Store files:** dotted suffix `.store.ts`. Examples: `apps/web/core/store/cycle.store.ts`, `apps/web/core/store/timeline/issues-timeline.store.ts`.
- **React component files:** kebab-case `.tsx`. Examples: `apps/web/core/components/cycles/transfer-issues.tsx`, `apps/web/core/components/cycles/applied-filters/root.tsx`. Folders group features, with `root.tsx` as the typical entrypoint inside a feature folder.
- **Tests:** `<name>.test.ts` (Vitest, `apps/live/tests/...`) or `<name>.spec.ts` (Vitest, `packages/codemods/tests/...`; Playwright, `apps/web/e2e/specs/...`).
- **Page Object Models (Playwright):** `<feature>.page.ts` under `apps/web/e2e/pages/`.
- **Python tests:** `test_<name>.py` (enforced by `apps/api/pytest.ini` `python_files = test_*.py`).
- **OxLint disables `unicorn/filename-case`** (see `.oxlintrc.json` rules), so filename casing is by convention only — kebab-case for `.ts`/`.tsx`.

### Functions / Hooks

- **React hooks** start with `use` and are camelCase: `useDebounce`, `useKeypress`, `useCycle`, `useUserPermissions`, `useAppRouter`, `useTranslation`. The hook file name kebab-cases the same identifier (`use-debounce.tsx`).
- **Service classes:** PascalCase ending in `Service` and exported as a class (`CycleService`, `APIService`, `IssueService`).
- **Store classes:** PascalCase ending in `Store` (`CycleStore`, `WorkItemFilterStore`). Stores expose a sibling `interface I<Name>Store` (e.g. `ICycleStore` in `apps/web/core/store/cycle.store.ts:31`).
- **Type aliases:** prefer `T` prefix for type aliases (`TCyclePlotType`, `TProgressSnapshot`, `TIssuesResponse`) and `I` prefix for interfaces describing object shapes/store contracts (`ICycle`, `ICycleStore`, `IWorkItemFilterStore`).
- **Constants:** SCREAMING_SNAKE_CASE inside modules (`DATE_FILTERS`, `DRAG_STEPS`, `AUTH_STATE`).
- **Python:** PEP 8 — `snake_case` functions/methods, `PascalCase` classes (`TestCycleListCreateAPIEndpoint`, `BaseAPIView`, `BaseViewSet`).

### Stores

- One store per domain, file `domain.store.ts` (`apps/web/core/store/cycle.store.ts`, `module.store.ts`, `dashboard.store.ts`). Cross-domain stores live in `@plane/shared-state` (e.g. `WorkItemFilterStore`).
- A `RootStore` composes domain stores and is provided via `@/plane-web/store/root.store` (CE override). The web app's `apps/web/core/store/root.store.ts` re-exports from there and wires `CoreRootStore` types.

### Services

- One class per backend resource: `cycle.service.ts → CycleService extends APIService`. Folder grouping for sub-resources (`apps/web/core/services/issue/`, `apps/web/core/services/project/`).
- `apps/web/core/services/api.service.ts` is the only place axios is configured. Subclasses must extend `APIService` and never instantiate axios directly.

### Django views / serializers / models

- **Views (external API):** under `apps/api/plane/api/views/<resource>.py` with classes ending in `APIEndpoint` (`CycleListCreateAPIEndpoint`) and inheriting from `BaseAPIView` or `BaseViewSet` (`apps/api/plane/api/views/base.py`).
- **Views (web app API):** under `apps/api/plane/app/views/`.
- **Serializers:** `apps/api/plane/app/serializers/<resource>.py`. Convention is two serializers per resource: a `<Resource>Serializer` for reads (returns annotated/joined fields) and a `<Resource>WriteSerializer` for writes (validates dates, applies timezone conversion). Both inherit `BaseSerializer`. See `apps/api/plane/app/serializers/cycle.py:15`.
- **Models:** `apps/api/plane/db/models/<resource>.py`, classes inherit from a domain base like `ProjectBaseModel`. Module-level helpers (`get_default_filters`, `get_default_display_filters`) provide JSON defaults — pass them as `default=` to `JSONField`.

## Code Style

### Formatting (oxfmt)

`.oxfmtrc.json`:

- `printWidth: 120`
- `tabWidth: 2`
- `trailingComma: "es5"`
- Tailwind class sorting via `sortTailwindcss` against `packages/tailwind-config/index.css` for `cn`, `clsx`, `cva` callees. Always pass tailwind class strings through `cn()`/`clsx()`/`cva()` so oxfmt can sort them.
- `packages/codemods/**/*` overrides to `printWidth: 80`.

Run: `pnpm fix:format` (root) or `pnpm --filter <pkg> fix:format`. CI runs `pnpm turbo run check:format --affected`.

### Formatting (Python — apps/api)

`apps/api/pyproject.toml` `[tool.ruff]`:

- `line-length = 120`
- `indent-width = 4`
- `quote-style = "double"`
- Excludes `**/migrations/*`.

Run: `ruff check --fix apps/api` (CI does the same — see `.github/workflows/pull-request-build-lint-api.yml`).

### Linting (oxlint)

`.oxlintrc.json`:

- Plugins: `react`, `typescript`, `jsx-a11y`, `import`, `promise`, `unicorn`, `oxc`.
- Categories: `correctness=warn`, `suspicious=warn`, `perf=warn`.
- Disabled: `react/react-in-jsx-scope`, `react/prop-types`, `unicorn/filename-case`, `unicorn/no-null`, `unicorn/prevent-abbreviations`.
- `no-unused-vars` ignores `_`-prefixed identifiers and rest siblings.
- `jsx-a11y` polymorphic prop name is `as`.
- Ignored paths: `.cache`, `.next`, `.react-router`, `.storybook`, `.turbo`, `.vite`, `*.config.{js,mjs,cjs,ts}`, `build`, `coverage`, `dist`, `**/public/**`, `storybook-static`.

`eslint-disable` comments still suppress OxLint rules and are tolerated when justified. Use sparingly; existing services use `/* eslint-disable @typescript-eslint/no-explicit-any */` only where DRF responses force it (`apps/web/core/services/api.service.ts:7`).

## Import Organization

The convention observed across `apps/web/core/**` is **grouped imports separated by blank lines and labeled with line comments**. Within a group, alphabetical order is not strictly enforced; logical grouping is.

Typical order:

1. **Built-ins / third-party**: `import React from "react"`, `import { observer } from "mobx-react"`, `import { AlertCircle } from "lucide-react"`, `import { isPast, isToday } from "date-fns"`, `import { sortBy, set } from "lodash-es"`, `import { action, computed, observable } from "mobx"`.
2. **Plane workspace packages** (often labeled `// plane imports` or `// ui` / `// types`): `@plane/constants`, `@plane/i18n`, `@plane/propel/...`, `@plane/types`, `@plane/ui`, `@plane/utils`.
3. **CE / plane-web overrides** via `@/plane-web/*`: enterprise-overridable code.
4. **App-local aliases** via `@/*`: `@/services/...`, `@/hooks/store/...`, `@/components/...`.
5. **Relative imports**: `./root`, `../fixtures/env`.

Section comments: lines like `// plane imports`, `// hooks`, `// store hooks`, `// components`, `// types`, `// services`, `// local imports` are used liberally — keep them when editing existing files. The `remove-directives` codemod test (`packages/codemods/tests/remove-directives.spec.ts`) doubles as a style reference.

### Type-only imports

`verbatimModuleSyntax: true` is set in `packages/typescript-config/base.json`. **Always use `import type { ... }`** when you only need types. Examples:

```typescript
import type { ICycle, TCyclePlotType, TProgressSnapshot } from "@plane/types";
import type { DistributionUpdates } from "@plane/utils";
import type { CoreRootStore } from "./root.store";
```

Mixing values and types in one statement is fine when both are needed (`import { type Locator, type Page } from "@playwright/test"` or two separate statements). Type-only imports may carry `.ts`/`.tsx` extensions per `typescript.instructions.md`.

### Path aliases

- `@/*` → `./core/*` (TypeScript path in `apps/web/tsconfig.json`).
- `@/plane-web/*` → `./ce/*` — **always** use this alias for code that may have an enterprise override. Putting an import behind `@/plane-web/*` lets the CE build pull stubs from `apps/web/ce/...` while the EE build (private fork) pulls real implementations from `apps/web/ee/...`. Never reach into `./ce` or `./ee` directly.
- `@/app/*` → `./app/*` (React Router routes only).
- `@/helpers/*`, `@/styles/*` for those folders.
- Shared packages always go through workspace `@plane/*` imports — never `../../packages/...`.

### Workspace and catalog

- Internal packages: `"workspace:*"` in `package.json`.
- External packages: `"catalog:"` in `package.json`; the actual version lives in `pnpm-workspace.yaml`. Add new shared deps to the catalog rather than per-package.
- Root `package.json` `pnpm.overrides` pins many transitive dep versions — do not edit individual transitive dep versions inside leaf packages.

### Next.js compatibility shim

The web app still imports from `next/link`, `next/navigation`, `next/script` in some places (e.g. `apps/web/core/components/cycles/cycle-peek-overview.tsx:9` uses `next/navigation`). These are aliased via Vite to `apps/web/app/compat/next/*`. **In new code, prefer React Router primitives** (`Link` from `react-router`, `useNavigate`, `useLocation`, `useSearchParams` from `react-router`).

## React Component Patterns

- **Function components only**, exported as `function ComponentName(...)` or `export const ComponentName = observer(function ComponentName(...) { ... })`. No class components.
- **`React.FC`/`FC` is not used.** Props are typed inline:

  ```tsx
  type Props = {
    handleClick: () => void;
    canTransferIssues?: boolean;
    disabled?: boolean;
  };

  export function TransferIssues(props: Props) {
    const { handleClick, canTransferIssues = false, disabled = false } = props;
    return (...);
  }
  ```

  See `apps/web/core/components/cycles/transfer-issues.tsx:13`.

- **Destructure `props` inside the body**, not in the parameter list. (Codemod precedent: `packages/codemods/function-declaration.ts` rewrites arrow components into named function declarations destructuring inside the body.)
- **Default values via destructuring defaults**, not `defaultProps`.
- **Hooks-only logic**. Side effects go in `useEffect`. Refs use `React.useRef`. Memoization via `useMemo`/`useCallback` only when measurable.
- **Tailwind class composition**: pass classes through `cn()`/`clsx()` from `@plane/ui` so oxfmt can sort.
- **Internationalize user-facing strings** with `useTranslation` from `@plane/i18n`. Example: `apps/web/core/components/cycles/applied-filters/root.tsx:34` uses `t("common.clear_all")`. Hard-coded English is tolerated in legacy files but should not be added in new code.
- **Section comments inside component bodies** are common to label `// router`, `// refs`, `// store hooks`, `// derived values`, `// handlers`. Keep them when editing.

### `observer()` wrapping

- **Wrap any component that reads from MobX state with `observer()`** from `mobx-react`. Without this, MobX cannot track re-renders and the component will not update when the observed state changes.
- The dominant pattern uses a **named function passed to `observer`** so React DevTools shows the component name:

  ```tsx
  export const CycleAppliedFiltersList = observer(function CycleAppliedFiltersList(props: Props) {
    const { allowPermissions } = useUserPermissions();
    // ...
  });
  ```

  See `apps/web/core/components/cycles/applied-filters/root.tsx:30` and `apps/web/core/components/cycles/cycle-peek-overview.tsx:23`.

- **Pure presentational components that only consume props** (e.g. `TransferIssues` in `transfer-issues.tsx`) are **not** wrapped — only do it when the component dereferences a store.
- **Static rendering during SSR/RSC**: `apps/web/core/store/root.store.ts:7` calls `enableStaticRendering` from `mobx-react` so the build doesn't subscribe during hydration.

## MobX Store Patterns

The canonical store shape is `apps/web/core/store/cycle.store.ts`:

1. **Declare an `interface I<Name>Store`** before the class describing observables, computeds, computed actions, and async actions. Cross-store consumers depend on the interface, not the concrete class.
2. **Class implements the interface**, declares fields with class-property syntax for observables (`loader: boolean = false`).
3. **`makeObservable(this, { ... })`** in the constructor. Mark each field explicitly:
   - `observable` (or `observable.ref` for non-deep), `computed`, `action`.
   - **Do not use decorator syntax** for MobX annotations in this codebase — the explicit `makeObservable` map is the convention.
4. **Take `_rootStore: CoreRootStore` in the constructor**, store as `this.rootStore = _rootStore`. Construct sibling services in the constructor (`this.cycleService = new CycleService()`).
5. **Async actions update state inside `runInAction(() => { ... })`** — no `@action.bound`, no async actions:

   ```typescript
   fetchAllCycles = async (workspaceSlug: string, projectId: string) => {
     try {
       this.loader = true;
       await this.cycleService.getCyclesWithParams(workspaceSlug, projectId).then((response) => {
         runInAction(() => {
           response.forEach((cycle) => set(this.cycleMap, [cycle.id], cycle));
           set(this.fetchedMap, projectId, true);
           this.loader = false;
         });
       });
     } catch {
       this.loader = false;
       return undefined;
     }
   };
   ```

   See `apps/web/core/store/cycle.store.ts:414`.

6. **Computed values are getter properties** (`get currentProjectCycleIds()`); **parameterized derivations use `computedFn` from `mobx-utils`**. Examples: `getProjectCycleIds = computedFn(...)` (`cycle.store.ts:351`), `getIsPointsDataAvailable = computedFn((cycleId: string) => ...)` (`cycle.store.ts:245`).
7. **Mutate observables through `set` from `lodash-es`** for nested paths (`set(this.cycleMap, [cycle.id], cycle)`). This keeps reactivity correct when adding new keys to a record.

## Service Patterns

- **Inherit `APIService`** from `apps/web/core/services/api.service.ts`. Pass `API_BASE_URL` (from `@plane/constants`) to `super()`.
- **Each public method returns a `Promise<T>` chain**: `.get(...).then((res) => res?.data).catch((err) => { throw err?.response?.data; })`. The `?.` chain on `res?.data` and `err?.response?.data` is intentional — never replace it with optional chaining shortcuts that change the rejection shape. See `apps/web/core/services/cycle.service.ts:30`.
- **Stores call services**, not components. Components consume stores via hooks like `useCycle()` defined in `apps/web/core/hooks/store/`.
- **401 handling is centralized** in `APIService.setupInterceptors()` (`apps/web/core/services/api.service.ts:25`) — it redirects to `/?next_path=<currentPath>`. Do not catch 401 in service methods.

## Error Handling

### TS service layer

`response.then(res => res?.data).catch(err => { throw err?.response?.data; })` is the canonical shape. Re-throwing `err?.response?.data` (the JSON body) means callers can read `error.message` / `error.detail` / etc. directly. **Do not catch and swallow**; let the store decide what to do.

### MobX store actions

Two patterns coexist:

- **Reset loader and rethrow / return undefined**:

  ```typescript
  try {
    this.loader = true;
    await fetchSomething();
    runInAction(() => {
      this.loader = false;
    });
  } catch {
    this.loader = false;
    return undefined;
  }
  ```

- **Caller-driven error handling**: the store calls the service inside `.then(...).catch(...)` and lets the caller (often a component using SWR or a user-facing toast) handle the rejection. See `addCycleToFavorites` in `cycle.store.ts`.

When you write a new store action, prefer letting errors bubble unless the store needs to recover its own state (e.g. clearing a loader). Avoid `console.log` for errors in stores; the `@plane/logger` workspace package is the canonical logger.

### React components

- Components rarely throw. Network failures are handled via try/catch around store calls and surfaced through toasts (`@plane/ui`).
- Conditional rendering for missing data is the norm: `if (!appliedFilters) return null;` (`apps/web/core/components/cycles/applied-filters/root.tsx:36`).

### Django views

`BaseAPIView.handle_exception` and `BaseViewSet.handle_exception` (`apps/api/plane/api/views/base.py:77` and `:183`) centralize error mapping:

- `IntegrityError` → 400 with `{"error": "The payload is not valid"}`
- `ValidationError` → 400 with `{"error": "Please provide valid detail"}`
- `ObjectDoesNotExist` → 404 with `{"error": "The requested resource does not exist."}`
- `KeyError` → 400 with `{"error": "The required key does not exist."}`
- Anything else → `log_exception(e)` + 500 `{"error": "Something went wrong please try again later"}`.

When you add a new `BaseAPIView` subclass, **do not override `handle_exception` unless you have a domain-specific error type to translate**. Raise `serializers.ValidationError` or DRF exceptions and let the base class respond.

`logger = logging.getLogger("plane.api")` is the convention; `log_exception` and `logger.warning(..., extra={"error_code": ..., "error_message": str(e)})` are the structured logging idioms.

### Effect-based async (apps/live)

`apps/live` uses the `effect` library for async operations with structured retries and timeouts. See `apps/live/src/services/pdf-export/effect-utils.ts` and its test `apps/live/tests/services/pdf-export/effect-utils.test.ts`. New `apps/live` async code should use `Effect.gen`, `withTimeoutAndRetry`, `recoverWithDefault`, and `tryAsync` rather than raw `async/await + try/catch`.

## Logging

### TS

- **Frontend**: prefer `@plane/logger` (workspace package) over `console.*`. `console.log` is allowed during local debugging but should be removed before commit; CI does not currently fail on `console.*` but reviewers will flag it.
- **apps/live**: `@plane/logger` is in dependencies; use it instead of `console`.

### Python

- `logger = logging.getLogger("plane.api")` (or per-module logger).
- Pass structured `extra={"error_code": ..., "error_message": ...}` for filterable log analysis.
- `plane.utils.exception_logger.log_exception(exc)` is the wrapper for capturing unexpected exceptions; use it before returning a 500 response.

## Comments

- **File header block in every TS source file**:

  ```typescript
  /**
   * Copyright (c) 2023-present Plane Software, Inc. and contributors
   * SPDX-License-Identifier: AGPL-3.0-only
   * See the LICENSE file for details.
   */
  ```

  Enforced via `.github/workflows/copyright-check.yml`. Always include this header on new files.

- **Python files** carry the equivalent `# Copyright (c) 2023-present Plane Software, Inc. and contributors` / `# SPDX-License-Identifier: AGPL-3.0-only` triplet.
- **JSDoc on public store methods** describing intent, parameters, and return type — see `cycle.store.ts:393`. Required for cross-store APIs; optional for private helpers.
- **Section comments** (`// services`, `// store hooks`, `// derived values`, `// router`, `// refs`) are pervasive inside component/store bodies. Keep them when editing.
- **Japanese comments** appear in `apps/web/e2e/...` (e.g. `apps/web/e2e/playwright.config.ts`, `apps/web/e2e/fixtures/api.ts`, `apps/web/e2e/pages/timeline.page.ts`, the timeline spec). The maintainer of those files writes in Japanese; preserve existing Japanese comments and use either language consistently within a file you author.

## Function & Module Design

### Functions

- **Service methods**: one HTTP call per method, named after the verb-noun pair (`getCycleDetails`, `createCycle`, `addCycleToFavorites`).
- **Store async actions**: one mutation per action; long action bodies should split into private helpers rather than nesting `runInAction` calls.
- **No `enum`s** in new code — use union types or `as const` objects (TypeScript 5.8 `--erasableSyntaxOnly` direction). The codebase still has legacy enums (`EUserPermissions`, `EUserPermissionsLevel` in `@plane/constants`); leave them, but don't add new ones.
- **No `namespace`s.**
- **Use `satisfies` over `as` casts** when validating literal shapes against types.
- **Prefer iterator helpers and `Object.groupBy`/`Map.groupBy`** over `lodash-es` for new code; existing files use `lodash-es` heavily and that's fine to maintain.

### Modules

- **Named exports** for everything except React Router route components (which use default exports per RR convention) and codemod transformers (`module.exports = transformer` in `packages/codemods/*.ts`).
- **No barrel files at the root** of `apps/web/core/components/` — folder-level `index.ts` barrels exist where it reduces import noise. Prefer importing from the most specific path; avoid creating new deep barrels.
- **`with { type: "json" }`** for JSON imports, never the deprecated `assert` syntax.

## Decorators

Per `.github/instructions/typescript.instructions.md`, **standard TC39 decorators** are preferred over the legacy `experimentalDecorators` form. The `@plane/decorators` workspace package centralizes shared decorators. Do not enable `experimentalDecorators` in new tsconfigs.

## Tailwind / Styling

- Tailwind classes always pass through `cn`/`clsx`/`cva` so oxfmt can sort them.
- Theme tokens in `packages/tailwind-config/index.css` (e.g. `text-13`, `text-secondary`, `bg-surface-1`). Use the design tokens, not raw colors.
- Inline `style={{...}}` should be reserved for dynamic values (drag offsets, computed widths) — hardcoded sizing belongs in Tailwind classes.

## Forbidden / Discouraged

- **Do not use `enum` or `namespace`** in new code.
- **Do not use `import ... assert`**; use `with { type: "json" }`.
- **Do not configure Prettier** — formatting is owned by oxfmt.
- **Do not configure ESLint** — linting is owned by oxlint.
- **Do not raise the `--max-warnings` budget** in any package's `check:lint` script.
- **Do not import directly from `apps/<app>/ce/...` or `apps/<app>/ee/...`** — go through `@/plane-web/*`.
- **Do not call axios directly** in service methods — extend `APIService`.
- **Do not skip `observer()`** on a component that reads from a MobX store.
- **Do not edit translations.json keys** without also updating consumers; ICU plural syntax is required (`{count, plural, one {...} other {...}}`) — see `packages/i18n/src/locales/<lang>/translations.json`.
- **Do not run `npm` or `yarn`** — pnpm only.

---

_Convention analysis: 2026-05-03_
