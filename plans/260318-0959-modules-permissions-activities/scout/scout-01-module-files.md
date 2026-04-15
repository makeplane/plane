# Scout Report: Module-Related Files

## Backend (apps/api/plane)

### Models

- `apps/api/plane/db/models/module.py` — Module, ModuleMember, ModuleIssue, ModuleLink, ModuleUserProperties

### Views

- `apps/api/plane/api/views/module.py` — ModuleListCreateAPIEndpoint (GET/POST), ModuleDetailAPIEndpoint (GET/PATCH/DELETE), ModuleIssueListCreateAPIEndpoint, ModuleIssueDetailAPIEndpoint, ModuleArchiveUnarchiveAPIEndpoint
- `apps/api/plane/app/views/workspace/module.py` — WorkspaceModulesEndpoint

### Serializers

- `apps/api/plane/api/serializers/module.py` — CRUD serializers
- `apps/api/plane/app/serializers/module.py` — ModuleWriteSerializer, ModuleReadSerializer

### URLs

- `apps/api/plane/api/urls/module.py` — CRUD + archive endpoints

## Frontend (apps/web/core)

### THE Mini Sidebar

- `apps/web/core/components/modules/analytics-sidebar/root.tsx` (445 lines) — **ModuleAnalyticsSidebar**: renders status, name, description, date range, lead, members, work items count, progress chart, module links

### Module Stores/Hooks/Services

- `apps/web/core/store/module.store.ts` — MobX store (CRUD, archive, filter)
- `apps/web/core/store/module_filter.store.ts` — filter state
- `apps/web/core/hooks/store/use-module.ts` — store access hook
- `apps/web/core/services/module.service.ts` — API calls (get, create, update, delete, issues, links, favorites)

### Module Components

- `apps/web/core/components/modules/modal.tsx` — create/edit modal
- `apps/web/core/components/modules/form.tsx` — module form
- `apps/web/core/components/modules/delete-module-modal.tsx` — delete confirmation
- `apps/web/core/components/modules/module-list-item.tsx` — list item
- `apps/web/core/components/modules/module-card-item.tsx` — card item
- `apps/web/core/components/modules/module-peek-overview.tsx` — quick preview sidebar

### Routing

- `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(list)/` — list page
- `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(detail)/[moduleId]/page.tsx` — detail page

## Types & Constants

- `packages/types/src/module/modules.ts` — IModule, TModuleStatus, TModuleDistribution
- `packages/types/src/module/module_filters.ts` — filter types
- `packages/constants/src/module.ts` — MODULE_STATUS, defaults

## Key Findings

1. **No existing ModuleActivity model** — activities tracked at issue level only
2. **No CE-specific module files** — all in core
3. **Current permissions**: create/edit = ADMIN+MEMBER, delete = ADMIN+creator
4. **Sidebar component** is `ModuleAnalyticsSidebar` — add Activities section at bottom
5. **CE pattern** will require creating CE overrides for permission changes
