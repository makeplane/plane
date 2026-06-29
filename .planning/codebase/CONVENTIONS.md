---
last_mapped: 2026-06-29
focus: quality
---

# Conventions

## Dependency Conventions

- Internal TypeScript packages use `workspace:*`, as seen in app/package manifests such as `apps/web/package.json`.
- External JavaScript dependencies use `catalog:` and are versioned centrally in `pnpm-workspace.yaml`.
- `apps/api` is excluded from the pnpm workspace and manages Python dependencies with `requirements/*.txt`.
- Shared packages expose ESM builds from `dist/index.js` and TypeScript declarations from `dist/index.d.ts`.

## TypeScript And React

- TypeScript strictness is enforced through package `tsconfig.json` files and `check:types` scripts.
- React Router apps use explicit route config files instead of filesystem-only routing:
  - `apps/web/app/routes.ts`
  - `apps/admin/app/routes.ts`
  - `apps/space/app/routes.ts`
- App-level providers compose shared concerns near the root, e.g. `apps/web/app/provider.tsx`.
- React components use PascalCase exports from kebab-case files.
- UI primitives generally live in `packages/ui/src/<component>/` with helper/type files alongside implementation.
- Styling is Tailwind-oriented with shared utilities such as `cn` from `@plane/utils`, visible in `packages/ui/src/button/button.tsx`.
- Icons are commonly imported from `lucide-react` or shared icon helpers.

## State And Data Fetching

- MobX is the dominant app/store pattern. Shared primitives use `makeObservable` and `observable` in `packages/shared-state/src/store/*.ts`.
- SWR is installed at app root via `SWRConfig` in `apps/web/app/provider.tsx`.
- API calls should be routed through `packages/services/src/**` rather than scattered inline Axios/fetch calls.
- Frontend service errors commonly rethrow `error?.response?.data` or `error?.response`; preserve existing service behavior unless deliberately normalizing errors.

## Backend Python

- Django settings use common/local/production/test split under `apps/api/plane/settings/`.
- DRF serializers live separately from views under `apps/api/plane/app/serializers/`.
- Views are domain-grouped under `apps/api/plane/app/views/`.
- Data models are split by domain under `apps/api/plane/db/models/` and imported through `apps/api/plane/db/models/__init__.py`.
- Python formatting/linting follows Ruff settings in `apps/api/pyproject.toml`: line length 120, double quotes, spaces, and first-party package `plane`.
- Tests use pytest markers from `apps/api/pytest.ini`.

## Error Handling And Logging

- Live service uses `@plane/logger` and wraps startup/global failures in `apps/live/src/start.ts`.
- Live service request logging is installed with `loggerMiddleware` in `apps/live/src/server.ts`.
- Django production logging is JSON-oriented in `apps/api/plane/settings/production.py`.
- API request and API token logging are middleware concerns in `apps/api/plane/settings/common.py`.
- Frontend service methods generally use promise chains with `.catch()` and rethrow API response payloads.

## Security And Configuration Patterns

- Django refuses known insecure `SECRET_KEY` values and falls back on generated keys when unset in `apps/api/plane/settings/common.py`.
- CORS/CSRF/cookie security is environment-derived in `apps/api/plane/settings/common.py`.
- Webhook SSRF guard configuration includes allowlisted IPs/hosts and disallowed domains in `apps/api/plane/settings/common.py`.
- Live service validates environment variables with Zod in `apps/live/src/env.ts`.
- Do not hardcode credentials; compose files use env placeholders and test-only fallback values.

## Comments And Generated Text

- Many files include AGPL copyright headers.
- Keep comments targeted. Existing code has some stale or exploratory commented blocks, e.g. `packages/shared-state/src/store/user.store.ts`; avoid adding similar dead code.
- Public UI copy and locale strings live in `packages/i18n/src/locales/`.

## Common Change Pattern

For a new user-facing feature, expect to touch several layers:

- Backend model/serializer/view/URL under `apps/api/plane/`.
- Frontend service method under `packages/services/src/`.
- Shared type under `packages/types/src/`.
- App store/hooks/components under `apps/web/core/` or `apps/web/ce/`.
- Shared UI primitive under `packages/ui/src/` only if the component is reusable across apps.
- Tests in the relevant package or API suite.

