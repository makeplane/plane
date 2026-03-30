## <!-- Scope: apps/web/**/*.tsx, apps/admin/**/*.tsx, packages/** -->

## description: Canonical frontend import paths -- prevent hallucination/slopsquatting

# Frontend Canonical Imports

Always verify imports exist. These are the CORRECT sources:

| Package           | Import                                                      | Usage                                   |
| ----------------- | ----------------------------------------------------------- | --------------------------------------- |
| `mobx`            | `makeObservable, observable, action, computed, runInAction` | Store definitions                       |
| `mobx-react`      | `observer`                                                  | Component wrapper (NOT mobx-react-lite) |
| `mobx-utils`      | `computedFn`                                                | Parameterized computed                  |
| `lodash-es`       | `set`                                                       | Dynamic record key updates in stores    |
| `@plane/i18n`     | `useTranslation`                                            | i18n (apps/web ONLY, not admin)         |
| `@plane/propel/*` | Subpath imports                                             | New UI components                       |
| `@plane/ui`       | Named imports                                               | Legacy components (don't add new usage) |
| `react-router`    | `Outlet, useParams, useNavigate`                            | Routing                                 |
| `./+types/page`   | `Route` type                                                | Type-safe route params                  |

NEVER import `set` from `mobx` -- always `lodash-es`
NEVER import `observer` from `mobx-react-lite` -- always `mobx-react`
NEVER import from barrel `@plane/propel` -- always subpath `@plane/propel/button`
