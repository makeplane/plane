---
last_mapped: 2026-06-29
focus: concerns
---

# Concerns

## Type Safety Debt

- `any` is still common in shared TypeScript packages and services. Examples include `packages/shared-state/src/store/user.store.ts`, `packages/services/src/api.service.ts`, `packages/services/src/issue/sites-issue.service.ts`, and multiple editor extension files.
- `packages/shared-state/src/store/user.store.ts` includes a large commented-out older implementation. This can confuse future store work and should not be used as source of truth.
- UI component icon props in `packages/ui/src/button/button.tsx` use `any` for `appendIcon` and `prependIcon`; changes to icon handling should tighten types carefully.

## Logging And Debug Leftovers

- `console.log` appears in editor internals, codemod docs/tests, i18n scripts, and file upload paths. Some are script output, but editor runtime logs such as `packages/editor/src/core/extensions/custom-list-keymap/list-keymap.ts` and `packages/editor/src/core/extensions/code/utils/replace-code-block-with-text.ts` should be reviewed before production-facing changes.
- Several TODO/FIXME markers exist in editor code, codemods, and space helpers. Notable examples include `packages/editor/src/core/extensions/trailing-node.ts`, `packages/editor/src/core/extensions/code/lowlight-plugin.ts`, and `apps/space/helpers/string.helper.ts`.

## Cross-App Complexity

- The main web app is split between `apps/web/core/` and `apps/web/ce/`. Feature planning needs to identify which side owns the behavior before editing.
- Former Next.js compatibility wrappers exist in all React Router apps under `app/compat/next/`. Migration-sensitive changes should verify these wrappers rather than assuming native Next.js behavior.
- Domain features often span Django models/views, TypeScript service clients, shared types, MobX stores, and UI components. Partial implementation is easy if phases are sliced by file type instead of user flow.

## Backend Security And Configuration Risks

- Many security-critical settings are environment-driven in `apps/api/plane/settings/common.py`: CORS, CSRF, cookies, webhook SSRF allow/disallow rules, storage, and secret key handling.
- Webhook behavior is security-sensitive. Existing SSRF guard settings in `apps/api/plane/settings/common.py` should be preserved and tested when touching webhook code under `apps/api/plane/app/views/webhook/` or `apps/api/plane/db/models/webhook.py`.
- Compose files contain placeholder/test fallback credentials for local and test services. Avoid propagating these into docs or production configuration.
- `ALLOWED_HOSTS` defaults to `*` in `apps/api/plane/settings/common.py`; deployment hardening may require explicit host configuration.

## Test Coverage Concerns

- Frontend packages rely heavily on lint/type/build checks, with limited visible unit tests outside `apps/live` and `packages/codemods`.
- API tests are stronger structurally but require Docker and generated env files, which increases verification cost.
- Shared UI behavior likely needs Storybook/manual checks or new tests for changes with interaction complexity.

## Operational Concerns

- Self-hosted deployment depends on a multi-container stack. Changes can break compose orchestration across API, workers, live, proxy, and backing services.
- Celery imports are statically listed in `apps/api/plane/settings/common.py`; new tasks may not run unless imported there or otherwise discovered.
- Live collaboration requires API URL, Redis, Hocuspocus, and `LIVE_SERVER_SECRET_KEY`; failures can look like editor bugs even when infrastructure is misconfigured.
- File handling uses S3-compatible storage and MIME allowlists. Changes to attachments/editor assets should account for API settings and live/editor behavior.

## Planning Recommendations

- For backend feature phases, start from API URL/view/serializer/model path and map frontend services after the endpoint shape is known.
- For frontend feature phases, identify whether the screen is in `apps/web/core` or `apps/web/ce` first, then update shared services/types as needed.
- For editor/page/collaboration work, include `packages/editor`, `apps/live`, and `apps/api/plane/app/views/page/` in the same context window.
- For admin/instance settings, include `apps/admin/components/`, `packages/types/src/instance/`, backend settings, and any Docker/env defaults.

