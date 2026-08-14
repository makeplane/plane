# P5B Jira Importer Frontend

## Summary

- Added a workspace settings Imports route at `/:workspaceSlug/settings/imports`.
- Added Jira Cloud preview, start import, status polling, and cancel controls that consume the P5A backend endpoints.
- Aligned frontend importer types with P5A statuses: `queued`, `processing`, `completed`, `failed`, and `cancelled`.
- Removed the Jira API token from the Jira importer SWR/cache key.
- Added localized UI keys for the Imports page and empty state across all existing locales.

## Self-Hosted Policy

- No plan, edition, billing, subscription, license, entitlement, or Upgrade gate was added.
- Access remains limited by existing workspace member permissions and backend RBAC.
- Jira credentials are user-entered for the active preview/import request only.

## Secret Handling

- The Jira API token is kept in component-local React state.
- The token is not written to persistent stores, URLs, SWR keys, history rows, or importer metadata rendering.
- The token is cleared after a successful import start and after a definitive start failure.
- Import history uses the P5A importer response and does not expect a token to be returned.

## Frontend Contract

- Preview: `GET /api/workspaces/:slug/importers/jira`
- Start import: `POST /api/workspaces/:slug/projects/importers/jira/`
- History: `GET /api/workspaces/:slug/importers/`
- Cancel: `DELETE /api/workspaces/:slug/importers/:service/:importerId/`

## Validation

- `pnpm --filter @plane/i18n run sync:check`: passed.
- `pnpm --filter @plane/types build`: passed.
- `pnpm --filter @plane/constants build`: passed.
- `pnpm --filter @plane/types check:types`: passed.
- `pnpm --filter @plane/constants check:types`: passed.
- `pnpm --filter web check:format`: passed.
- `pnpm --filter web check:types`: failed on pre-existing `@plane/editor` module/type resolution and page/editor callback typing issues; P5B-specific errors were resolved after rebuilding workspace package outputs.

## Test Notes

- `apps/web/package.json` does not define a test script, so no frontend unit test command is available for this slice.
- The workflow was validated through type/package/i18n/format checks and direct contract alignment with the P5A backend tests.
