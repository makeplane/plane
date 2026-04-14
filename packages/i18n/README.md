# @plane/i18n

Internationalization package for Plane. Wraps [react-i18next](https://react.i18next.com/) behind a stable API so consumers don't interact with i18next directly.

## Quick start

```tsx
import { useTranslation } from "@plane/i18n";

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t("submit")}</button>;
}
```

ICU message format is supported out of the box:

```tsx
t("issue.count", { count: 5 });
// Translation: "{count, plural, one {# item} other {# items}}"
// Output: "5 items"
```

## Architecture

```
Component -> useTranslation() -> wrapper hook -> react-i18next -> i18next + ICU -> JSON files
                 ^ same API as before
```

All namespaces are eagerly loaded at init for the current language. The `fallbackNS` config searches across all namespaces automatically, so components never need to specify which namespace a key lives in.

**Key resolution:** `t("workspace_settings.general.title")` searches all namespace JSON files until it finds a match. `nsSeparator: false` ensures dots are only key-path separators, never namespace lookups.

## Public API

```ts
// Components
TranslationProvider; // Wrap your app root

// Hooks
useTranslation(); // Returns { t, currentLocale, changeLanguage, languages }

// Imperative (for use outside React)
setLanguage(lng); // Async — changes language, updates localStorage + document.lang

// Constants
FALLBACK_LANGUAGE; // "en"
SUPPORTED_LANGUAGES; // Array of { label, value }
LANGUAGE_STORAGE_KEY; // "userLanguage"

// Types
TLanguage; // Union of supported locale codes
TTranslationKeys; // Union of all valid translation keys (auto-generated)
TNamespace; // Union of namespace names
```

## Project structure

```
packages/i18n/
  src/
    core/
      instance.ts            # i18next instance, plugin setup, init
      set-language.ts         # Imperative setLanguage() for use outside React
    provider/
      index.tsx              # TranslationProvider (thin wrapper over I18nextProvider)
    hooks/
      use-translation.ts     # useTranslation hook (wrapper over react-i18next)
    locales/
      en/                    # English (source of truth)
        common.json          # Shared vocabulary (submit, cancel, etc.)
        workspace.json       # Workspace feature
        project.json         # Project feature
        work-item.json       # Work items / issues
        ...                  # 37 namespace files total
      fr/                    # French (same file structure)
      ...                    # 19 languages total
    constants/
      language.ts            # SUPPORTED_LANGUAGES, FALLBACK_LANGUAGE
      namespaces.ts          # NAMESPACES array, DEFAULT_NAMESPACE
    types/
      keys.generated.ts      # Auto-generated union of all translation keys
      language.ts            # TLanguage, ILanguageOption
  scripts/
    generate-types.ts        # English JSON -> keys.generated.ts
    sync-check.ts            # Cross-locale key comparison + collision detection
```

## Namespaces

Each Plane feature/entity has its own namespace file. The 37 current namespaces:

| Namespace            | Content                                                |
| -------------------- | ------------------------------------------------------ |
| `common`             | Shared vocabulary (submit, cancel, form fields, etc.)  |
| `workspace`          | Workspace core, creation, analytics, projects          |
| `workspace-settings` | Workspace settings (general, members, billing, API)    |
| `project`            | Project core, cycles, views, modules, members          |
| `project-settings`   | Project settings (features, labels, states, estimates) |
| `work-item`          | Issues, relations, comments, bulk operations           |
| `work-item-type`     | Work item types + type hierarchy                       |
| `inbox`              | Intake/inbox issues                                    |
| `pql`                | Plane Query Language                                   |
| `cycle`              | Cycles + active cycle analytics                        |
| `module`             | Modules                                                |
| `page`               | Pages + page navigation                                |
| `wiki`               | Wiki + wiki collections                                |
| `dashboard-widget`   | Dashboard widgets                                      |
| `home`               | Home page                                              |
| `update`             | Progress updates                                       |
| `teamspace`          | Teamspaces                                             |
| `initiative`         | Initiatives                                            |
| `epic`               | Epics + epic relations                                 |
| `release`            | Releases                                               |
| `stickies`           | Stickies / notes                                       |
| `customer`           | Customers                                              |
| `intake-form`        | Intake forms                                           |
| `navigation`         | Sidebar + command palette                              |
| `power-k`            | Power-K (advanced search)                              |
| `notification`       | Notifications                                          |
| `settings`           | Account settings, profile, themes                      |
| `auth`               | Authentication + SSO                                   |
| `integration`        | All integrations (GitHub, GitLab, Slack, etc.)         |
| `importer`           | All importers/exporters                                |
| `automation`         | Automations                                            |
| `workflow`           | Workflows                                              |
| `template`           | Templates                                              |
| `editor`             | Rich text editor                                       |
| `empty-state`        | Empty state messages                                   |
| `accessibility`      | ARIA labels                                            |
| `tour`               | Product tour + onboarding                              |

## How-to guides

### Add a new translation key

1. Add the key to the English JSON file in the appropriate namespace:

```json
// src/locales/en/workspace.json
{
  "workspace": {
    "new_key": "New feature label"
  }
}
```

2. Add the same key to all other locale files (or leave it missing -- the app falls back to English).

3. Use it in your component:

```tsx
const { t } = useTranslation();
t("workspace.new_key"); // "New feature label"
```

4. Run `pnpm run generate:types` to update the key union type (this also runs automatically during `pnpm run build`).

### Add a new namespace

When adding a new Plane feature that doesn't fit existing namespaces:

1. **Create the JSON file** for English and all other locales:

```bash
# Create the namespace file for English
echo '{}' > src/locales/en/my-feature.json

# Create empty files for other locales
for lang in fr es ja zh-CN zh-TW ru it cs sk de ua pl ko pt-BR id ro vi-VN tr-TR; do
  echo '{}' > "src/locales/$lang/my-feature.json"
done
```

2. **Register the namespace** in `src/constants/namespaces.ts`:

```ts
export const NAMESPACES = [
  // ... existing entries (keep sorted)
  "my-feature",
  // ...
] as const;
```

3. **Add the NAMESPACE_MAP entry** in `scripts/convert-translations.ts` so the conversion script knows where keys belong:

```ts
const NAMESPACE_MAP: Record<string, string> = {
  // ...
  my_feature: "my-feature",
  // ...
};
```

4. Add your translation keys to `src/locales/en/my-feature.json` and use them.

### Add a new language

1. **Create the locale directory** with JSON files for each namespace. The easiest way is to copy English and translate:

```bash
cp -r src/locales/en src/locales/xx
```

2. **Register the language** in `src/constants/language.ts`:

```ts
export const SUPPORTED_LANGUAGES: ILanguageOption[] = [
  // ...
  { label: "Language Name", value: "xx" },
];
```

3. **Add the type** in `src/types/language.ts` (the `TLanguage` union).

## Scripts

All scripts are in the `scripts/` directory and can be run with `pnpm run` or directly:

| Command                   | Script               | Description                                                     |
| ------------------------- | -------------------- | --------------------------------------------------------------- |
| `pnpm run build`          |                      | Build the package (runs `generate:types` first, then `tsdown`)  |
| `pnpm run generate:types` | `generate-types.ts`  | Reads English JSON files, outputs `src/types/keys.generated.ts` |
| `pnpm run sync:check`     | `sync-check.ts`      | Report missing/stale keys across all locales                    |
| `pnpm run check:sync`     | `sync-check.ts --ci` | Same, but exits with code 1 on issues (for CI)                  |

### generate-types.ts

Reads all English JSON namespace files, flattens nested keys with dot notation, and generates a TypeScript union type:

```ts
export type TTranslationKeys = "submit" | "cancel" | "workspace.new_key";
// ... ~4,800 keys
```

Also detects cross-namespace key collisions and path conflicts (a key being both a leaf and a prefix).

### sync-check.ts

Compares all locale directories against English. Reports:

- **Missing keys** -- present in English, absent in another locale
- **Stale keys** -- present in a locale but not in English
- **Cross-namespace collisions** -- same key in multiple namespace files
- **Path conflicts** -- a key is both a value and a prefix of another key

Use `--ci` flag in CI pipelines to fail the build on issues.

## Supported languages

| Language            | Code    |
| ------------------- | ------- |
| English             | `en`    |
| French              | `fr`    |
| Spanish             | `es`    |
| Japanese            | `ja`    |
| Simplified Chinese  | `zh-CN` |
| Traditional Chinese | `zh-TW` |
| Russian             | `ru`    |
| Italian             | `it`    |
| Czech               | `cs`    |
| Slovak              | `sk`    |
| German              | `de`    |
| Ukrainian           | `ua`    |
| Polish              | `pl`    |
| Korean              | `ko`    |
| Portuguese (Brazil) | `pt-BR` |
| Indonesian          | `id`    |
| Romanian            | `ro`    |
| Vietnamese          | `vi-VN` |
| Turkish             | `tr-TR` |

## Language sync at runtime

Language is synced imperatively from the MobX profile store, not via React effects:

- **Login / page reload:** `fetchUserProfile()` calls `setLanguage(profile.language)` after loading the profile
- **Settings change:** `updateUserProfile({ language })` calls `setLanguage()` optimistically
- **Logout:** `resetOnSignOut()` calls `setLanguage(FALLBACK_LANGUAGE)` to reset to English

`setLanguage()` is an async function that awaits i18next initialization, changes the language, updates `localStorage`, and sets `document.documentElement.lang`.
