# Design Spec: i18n Package Refactor

**Date:** 2026-03-25
**Package:** `packages/i18n` (`@plane/i18n`)
**Approach:** Swap internals to react-i18next, preserve external API, add type safety and sync tooling

---

## Goals

1. **Type safety** — Compile-time validation of translation keys
2. **Sync detection** — Automated missing key and collision detection across all locales
3. **File maintainability** — Feature-based namespace splitting (no more 7,689-line monolith)
4. **Bundle reduction** — Namespace lazy loading (~280 KB → ~30-50 KB initial)
5. **RTL ready** — Direction metadata and infrastructure for right-to-left languages
6. **Rich text ready** — `<Trans>` component with typed component enforcement
7. **Zero-touch migration** — No changes to the 1,215 files importing `@plane/i18n`

---

## Architecture

### Current

```
Component → useTranslation() → MobX TranslationStore → intl-messageformat → TS objects
```

### New

```
Component → useTranslation() → wrapper hook → react-i18next → i18next + i18next-icu → JSON files
                ↑ same API
```

The wrapper preserves the identical public API. Consumers don't know react-i18next exists.

---

## Package Structure

```
packages/i18n/
├── src/
│   ├── core/                          # i18next initialization (framework-agnostic)
│   │   ├── instance.ts                # i18next instance + plugin setup
│   │   └── index.ts
│   │
│   ├── locales/                       # JSON translation files
│   │   ├── en/                        #   per language, per namespace
│   │   │   ├── common.json            #   shared keys (~200): submit, cancel, common.*
│   │   │   ├── workspace.json         #   workspace_*, workspace.*
│   │   │   ├── project.json           #   project_settings.*, project_views.*
│   │   │   ├── work-item.json         #   issue.*, sub_work_item.*, work_item_types.*
│   │   │   ├── cycle.json             #   cycle.*, active_cycle.*
│   │   │   ├── module.json            #   module.*, project_module.*
│   │   │   ├── page.json              #   page_*, wiki.*
│   │   │   ├── teamspace.json         #   teamspace*
│   │   │   ├── dashboard.json         #   dashboards.*, home.*
│   │   │   ├── settings.json          #   account_settings.*, profile.*, themes.*
│   │   │   ├── integration.json       #   github, gitlab, slack, sentry, etc.
│   │   │   ├── importer.json          #   all importers/exporters
│   │   │   ├── navigation.json        #   sidebar.*, command_k.*, power_k.*
│   │   │   ├── notification.json
│   │   │   ├── customer.json
│   │   │   ├── template.json
│   │   │   ├── automation.json        #   automations.*, workflows.*
│   │   │   ├── auth.json              #   auth.*, sso.*
│   │   │   ├── initiative.json        #   initiatives.*, epics.*
│   │   │   ├── release.json
│   │   │   ├── editor.json
│   │   │   ├── empty-state.json
│   │   │   ├── accessibility.json
│   │   │   └── tour.json
│   │   ├── fr/                        #   Same 22 JSON files per language
│   │   └── ... (17 more languages)
│   │
│   ├── provider/                      # React context (thin wrapper)
│   │   └── index.tsx
│   │
│   ├── hooks/                         # Public hooks
│   │   └── use-translation.ts
│   │
│   ├── types/                         # Types
│   │   ├── keys.generated.ts          # Auto-generated key union type
│   │   ├── language.ts                # TLanguage, ILanguageOption
│   │   └── index.ts
│   │
│   ├── constants/                     # Static configuration
│   │   ├── language.ts                # SUPPORTED_LANGUAGES, FALLBACK_LANGUAGE
│   │   └── namespaces.ts             # Namespace definitions
│   │
│   └── index.ts                       # Public API exports
│
├── scripts/                           # Build-time tooling (not bundled)
│   ├── generate-types.ts              # English JSON → keys.generated.ts
│   └── sync-check.ts                  # Cross-locale key comparison + collision detection
│
├── package.json
├── tsconfig.json
└── tsdown.config.ts
```

---

## Core Setup

### i18next Instance

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ICU from "i18next-icu";
import resourcesToBackend from "i18next-resources-to-backend";

const i18nInstance = i18n
  .use(ICU)                    // Existing ICU format strings work unchanged
  .use(initReactI18next)
  .use(
    resourcesToBackend(         // Lazy load per (language, namespace) pair
      (language, namespace) => import(`../locales/${language}/${namespace}.json`)
    )
  );

// Store the init promise so the provider can await it
export const initPromise = i18nInstance.init({
  fallbackLng: "en",
  supportedLngs: [...],        // From SUPPORTED_LANGUAGES

  // Namespace config
  ns: NAMESPACES,              // All namespaces registered
  defaultNS: DEFAULT_NAMESPACE,
  partialBundledLanguages: true,

  // Key resolution
  keySeparator: ".",           // Dots are key path separators (issue.add.success)
  nsSeparator: false,          // CRITICAL: disable ":" as namespace separator.
                               // Without this, "common.states" is misread as
                               // namespace "common", key "states". With nsSeparator: false,
                               // dots are ONLY key separators, never namespace lookups.

  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: false,    // Returns key if missing (matches current behavior)
  react: { useSuspense: false },
});
```

**Key decisions:**

- **`nsSeparator: false`** — Dots are only key-path separators, never namespace separators. Without this, `t("common.states")` would be misinterpreted as namespace `"common"` + key `"states"` instead of looking up the nested path `common.states`. This is critical because `"common"` is both a namespace name and a top-level key prefix in the translations.

- **All namespaces registered in `ns`** — All namespaces are registered in the i18next config and `fallbackNS` ensures they are all searched for any key. This ensures `t("workspace_settings.general.title")` finds the key regardless of which namespace JSON file it lives in. Each namespace loads as a separate chunk via `resourcesToBackend`.

- **`i18next-icu`** — Preserves `{count, plural, one{# item} other{# items}}` syntax. Zero translation string changes.

- **`useSuspense: false`** — Returns key temporarily while namespace loads, re-renders when ready. Matches current behavior where `t()` returns the key as fallback.

**Key resolution flow:** When `t("workspace_settings.general.title")` is called:
1. `nsSeparator: false` → no namespace extraction from the key string
2. i18next searches all registered namespaces in order
3. Finds the key in `workspace-settings.json` → returns the translated string
4. If not found in any namespace → returns the key itself (fallback)

### Namespaces

```typescript
export const NAMESPACES = [
  "accessibility", "auth", "automation", "common", "customer", "cycle",
  "dashboard-widget", "editor", "empty-state", "epic", "home", "importer",
  "inbox", "initiative", "intake-form", "integration", "module", "navigation",
  "notification", "page", "power-k", "pql", "project", "project-settings",
  "release", "settings", "stickies", "teamspace", "template", "tour",
  "update", "wiki", "work-item", "work-item-type", "workflow", "workspace",
  "workspace-settings",
] as const;

export type TNamespace = (typeof NAMESPACES)[number];
export const DEFAULT_NAMESPACE: TNamespace = "common";
```

Adding a namespace = one entry here + JSON files per locale.

### Dependencies

| Remove | Add |
|--------|-----|
| `intl-messageformat` | `i18next` |
| `mobx` | `react-i18next` |
| `mobx-react` | `i18next-icu` |
| `lodash-es` | `i18next-resources-to-backend` |

---

## Public API

### Provider

```typescript
import { initPromise, i18nInstance } from "../core";

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(i18nInstance.isInitialized);

  useEffect(() => {
    // Wait for i18next init to complete, then set the saved language
    initPromise
      .then(() => {
        if (typeof window === "undefined") return; // SSR guard (space app)
        const savedLocale = localStorage.getItem("userLanguage") || "en";
        return i18nInstance.changeLanguage(savedLocale);
      })
      .then(() => setIsReady(true))
      .catch((err) => {
        console.error("Failed to initialize i18n:", err);
        setIsReady(true); // Render with fallback language rather than blocking
      });
  }, []);

  if (!isReady) return null;
  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};
```

No MobX. i18next instance is a module-level singleton. The provider awaits the `initPromise` to avoid race conditions between `init()` and `changeLanguage()`. SSR guard prevents `localStorage`/`document` access on the server (for the `space` app).

### Hook

```typescript
export type TTranslationStore = {
  t: (key: string, params?: Record<string, unknown>) => string;  // Phase 1: string
  currentLocale: TLanguage;
  changeLanguage: (lng: TLanguage) => void;
  languages: ILanguageOption[];
};

export function useTranslation(): TTranslationStore {
  // No namespace arg — fallbackNS in the i18next config ensures all namespaces
  // are searched for any key. Passing NAMESPACES here would trigger concurrent
  // async loads per component, causing a re-render cascade.
  const { t, i18n } = useI18nextTranslation();

  const changeLanguage = useCallback(
    (lng: TLanguage) => {
      void (async () => {
        try {
          await i18n.changeLanguage(lng);
          if (typeof window === "undefined") return;
          localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
          document.documentElement.lang = lng;
        } catch (err) {
          console.error("Failed to change language:", err);
        }
      })();
    },
    [i18n]
  );

  return {
    t: (key, params) => t(key, params),
    currentLocale: i18n.language as TLanguage,
    changeLanguage,
    languages: SUPPORTED_LANGUAGES,
  };
}
```

**Phase 1:** `key: string` — backward compatible, no enforcement.
**Phase 2:** `key: TTranslationKeys` — TypeScript catches all invalid keys. Dynamic key constants annotated with `TTranslationKeys`.

### Exports

```typescript
// Components
export { TranslationProvider } from "./provider";

// Hooks
export { useTranslation } from "./hooks/use-translation";
export type { TTranslationStore } from "./hooks/use-translation";

// Types
export type { TLanguage, ILanguageOption } from "./types";
export type { TTranslationKeys } from "./types";
export type { TNamespace } from "./constants/namespaces";

// Constants (consumed by apps for language detection, storage, dropdowns)
export { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, LANGUAGE_STORAGE_KEY } from "./constants/language";
```

The i18next instance, plugins, and internals are NOT exported. Consumers see only the wrapper. Constants like `FALLBACK_LANGUAGE` and `SUPPORTED_LANGUAGES` are exported because they are consumed by app-level code (store initialization, language preference UI).

---

## Build Tooling

### Type Generation (`scripts/generate-types.ts`)

Reads all `src/locales/en/*.json` files. Recursively flattens nested keys with dot notation. Outputs `src/types/keys.generated.ts`:

```typescript
// AUTO-GENERATED — DO NOT EDIT
export type TTranslationKeys =
  | "submit"
  | "cancel"
  | "issue.add.success"
  // ... ~7,700 keys
  ;
```

A flat union of string literals — zero TypeScript performance issues, no OOM risk.

### Sync Check (`scripts/sync-check.ts`)

Compares keys across all locales. Detects:

1. **Missing keys** — present in English, absent in other locale
2. **Stale keys** — present in other locale, absent in English
3. **Cross-namespace collisions** — same key path exists in multiple namespace files
4. **Path conflicts** — a key is both a leaf value and branch prefix (e.g., `workspace` is a string AND `workspace.settings` exists)
5. **Duplicate keys** — same key defined twice within a file

Output:
```
en:    7,712 keys (source)
fr:    7,608 keys (98.7%) — 104 missing
es:    7,590 keys (98.4%) — 122 missing
...

PATH CONFLICTS:
  ✗ "workspace" is a string in common.json
    but "workspace.settings" exists in settings.json

CROSS-NAMESPACE DUPLICATES:
  ✗ "notifications" exists in common.json and notification.json
```

### Package Scripts

```json
{
  "generate:types": "tsx scripts/generate-types.ts",
  "sync:check": "tsx scripts/sync-check.ts",
  "check:sync": "tsx scripts/sync-check.ts --ci",
  "build": "pnpm run generate:types && tsdown"
}
```

`generate:types` runs before `build`. `check:sync` runs in CI (exits non-zero on failures).

---

## Phased Rollout

### Phase 1 — Internal Swap (Zero-Touch)

**Changes:** Only inside `packages/i18n/`.
**Impact:** Zero changes to consumer files.

1. Replace MobX store with i18next instance + ICU plugin
2. Convert TS translation objects → JSON files (script-assisted, see below)
3. Split monolithic `translations.ts` into per-feature namespace JSON files
4. Wrap react-i18next in existing `useTranslation` / `TranslationProvider` API
5. Build type generation script (outputs `keys.generated.ts`)
6. Build sync check script with collision detection
7. Keep `t(key: string)` — no type enforcement yet
8. Remove `@plane/utils`, `lodash-es`, `mobx`, `mobx-react`, `intl-messageformat` dependencies
9. Remove dead code: `ETranslationFiles` extended variants (`TRANSLATIONS_EXTENDED`, `EDITOR_EXTENDED`, `EMPTY_STATE_EXTENDED`) that reference non-existent files

#### TS-to-JSON Conversion (completed)

The original TypeScript `export default { ... }` translation files were converted to JSON namespace files using a one-time migration script (`scripts/convert-translations.ts`, since removed). Each top-level key was routed to a feature-based namespace file via a `NAMESPACE_MAP`. The script is preserved in git history if ever needed.

#### Namespace Loading Model (Phase 1)

In Phase 1, all namespaces are eagerly pre-loaded at init via `i18nInstance.loadNamespaces(NAMESPACES)`. The `fallbackNS` config ensures all namespaces are searched for any key, so components don't need to specify which namespace to use. Each namespace is a separate chunk loaded in parallel via HTTP/2.

This is already an improvement over the current approach:
- **Current:** Loads ALL 19 languages in the background (via `loadRemainingLanguages()`)
- **Phase 1:** Loads only the current language + fallback. Other languages load only on switch.
- **Future (Phase 2+):** Components can opt into `useTranslation("work-item")` for true per-route lazy loading, loading only the namespaces they need.

### Phase 2 — Type Enforcement

**Changes:** `packages/i18n` + constant files across packages.

1. Change `t(key: string)` → `t(key: TTranslationKeys)`
2. TypeScript flags all invalid keys across the codebase
3. Annotate dynamic key constants with `TTranslationKeys` type
4. Fix any typos or stale keys surfaced by the type system
5. Add collision detection to `generate:types` (fail if conflicts found)

### Phase 3 — RTL Support

1. Add `dir: "ltr" | "rtl"` to `ILanguageOption` and `SUPPORTED_LANGUAGES`
2. Expose `dir` from `useTranslation()` hook
3. Set `document.documentElement.dir` on language change
4. Migrate Tailwind to CSS logical properties where needed
5. Add RTL languages (Arabic, Hebrew, etc.)

### Phase 4 — Rich Text

1. Extend `generate-types.ts` to detect `<tag>` patterns in translation values
2. Generate `TRichTextComponents` map: key → required tag names
3. Build `TypedTrans` wrapper enforcing component props at compile time
4. Export `TypedTrans` from `@plane/i18n`
5. Adopt incrementally where rich text is needed

---

## Bundle Impact

| Metric | Current | After Phase 1 |
|--------|---------|---------------|
| Library runtime | ~15-20 KB (intl-messageformat + MobX i18n usage) | ~22 KB (i18next + react-i18next + ICU) |
| Translation load (Phase 1) | ~280 KB for current lang + ~280 KB × 18 in background | ~280 KB for current lang only (22 parallel chunks) |
| Translation load (Phase 2+) | Same | Only needed namespaces per route |
| Languages loaded | All 19 (background) | Current + fallback only. Others on switch. |
| Dependencies | 5 (intl-messageformat, mobx, mobx-react, lodash-es, @plane/utils) | 4 (i18next, react-i18next, i18next-icu, i18next-resources-to-backend) |

**Phase 1 improvement:** Eliminates background loading of 18 unused languages (~5 MB of translation code no longer fetched). Translation files split into cacheable chunks.
**Phase 2+ improvement:** Per-route namespace loading reduces per-page translation payload to only what's needed.
