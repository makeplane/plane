# Plane Local Architecture Snapshot

This file is generated from local repository structure. Treat it as a navigation layer, not the only source of truth.

## Repository

- Root: repository checkout (`.`)
- Frontend apps: 6
- Shared packages: 15
- Backend path exists: True

## Apps

- `apps/admin`
- `apps/api`
- `apps/live`
- `apps/proxy`
- `apps/space`
- `apps/web`

## Packages

- `packages/codemods`
- `packages/constants`
- `packages/decorators`
- `packages/editor`
- `packages/hooks`
- `packages/i18n`
- `packages/logger`
- `packages/propel`
- `packages/services`
- `packages/shared-state`
- `packages/tailwind-config`
- `packages/types`
- `packages/typescript-config`
- `packages/ui`
- `packages/utils`

## Backend Entry Points

- `apps/api/plane/app/urls/views.py`
- `apps/api/plane/authentication/urls.py`
- `apps/api/plane/license/urls.py`
- `apps/api/plane/urls.py`
- `apps/api/plane/web/urls.py`
- `apps/api/plane/web/views.py`

## Frontend Package Manifests

- `apps/admin/package.json`
- `apps/api/package.json`
- `apps/live/package.json`
- `apps/space/package.json`
- `apps/web/package.json`
- `package.json`
- `packages/codemods/package.json`
- `packages/constants/package.json`
- `packages/decorators/package.json`
- `packages/editor/package.json`
- `packages/hooks/package.json`
- `packages/i18n/package.json`
- `packages/logger/package.json`
- `packages/propel/package.json`
- `packages/services/package.json`
- `packages/shared-state/package.json`
- `packages/tailwind-config/package.json`
- `packages/types/package.json`
- `packages/typescript-config/package.json`
- `packages/ui/package.json`
- `packages/utils/package.json`

## Source-Backed Domain Mappings

### `map.work_items.core`

- Domain: `work_items`
- Api: `apps/api/plane/api/urls/work_item.py`
- Backend: `apps/api/plane/api/views/issue.py`, `apps/api/plane/api/serializers/issue.py`
- Database: `apps/api/plane/db/models/issue.py`, `apps/api/plane/db/migrations/0120_issueview_archived_at.py`
- Frontend: `apps/web/core/services/issue/issue.service.ts`, `apps/web/core/store/issue/issue.store.ts`, `apps/web/core/store/issue/project/issue.store.ts`, `packages/types/src/issues/issue.ts`
- Test: `apps/api/plane/tests/contract/api/test_issues.py`, `apps/api/plane/tests/unit/serializers/test_issue_recent_visit.py`


## Next AI Steps

- Promote seed domains in `docs/semantic/domains.json` only after source paths are confirmed.
- Add source-backed rows to `docs/semantic/mappings.json` for each changed feature.
- Run `powershell -ExecutionPolicy Bypass -File .plane-ai-doc-loop/runtime/Invoke-PlaneDocLoop.ps1 -PlanePath .` before asking an agent to implement code from documentation.
