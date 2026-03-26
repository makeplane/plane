# Phase 3 — Bank-wide Projects Page

**Plan**: [plan.md](./plan.md)
**Depends on**: Phase 1 (backend API), Phase 2 (sidebar item)
**Status**: completed | **Effort**: 2.5h

## Context

Create the route, page component, frontend service, and MobX store for displaying all bank-wide projects. Projects are grouped by workspace. Follows HO page pattern (`apps/web/app/(all)/[workspaceSlug]/(projects)/ho/`).

## Key Insights

- HO page structure: `layout.tsx` + `page.tsx` + CE component
- No existing service/store for bank-wide cross-workspace projects — must create in `ce/`
- Use `@plane/propel` for UI components (cards, loading states)
- Store pattern: MobX observable, action, computed — see `core/store/workspace.store.ts` or `core/store/project/` for reference
- Service pattern: `core/services/project/project.service.ts`

## Related Code Files

- `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/layout.tsx` — Layout reference
- `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/page.tsx` — Page reference
- `apps/web/ce/components/ho/` — HO CE components (reference pattern)
- `apps/web/core/services/project/project.service.ts` — Service reference
- `apps/web/core/store/root.store.ts` — Root store (register new store here)
- `packages/types/src/project/project.d.ts` — IProject type

## Architecture

```
Route: /:workspaceSlug/bank-wide-projects/
  layout.tsx           → minimal wrapper (same as HO layout)
  page.tsx             → imports BankWideProjectsRoot from ce/

ce/components/bank-wide-projects/
  root.tsx             → observer, fetches data, renders list
  project-card.tsx     → single project card (workspace badge + project info)

ce/store/bank-wide-projects.store.ts
  - fetchBankWideProjects(workspaceSlug): Promise<void>
  - bankWideProjects: IProject[]  (observable)
  - isLoading: boolean

ce/services/bank-wide-projects.service.ts
  - fetchAll(workspaceSlug): Promise<IProject[]>
  → GET /api/workspaces/{slug}/bank-wide-projects/

Root store: register BankWideProjectsStore in root.store.ts (ce/ override)
```

## IProject Type Extension

Check `packages/types/src/project/project.d.ts` — if `workspace_slug` / `workspace_name` are not in `IProject`, extend type or create `IBankWideProject`:

```typescript
export interface IBankWideProject extends IProject {
  workspace_slug: string;
  workspace_name: string;
}
```

## Implementation Steps

### 1. Service: `apps/web/ce/services/bank-wide-projects.service.ts`

```typescript
import { APIService } from "@/services/api.service";
import type { IBankWideProject } from "@plane/types";

export class BankWideProjectsService extends APIService {
  fetchAll(workspaceSlug: string): Promise<IBankWideProject[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/bank-wide-projects/`)
      .then(({ data }) => data)
      .catch((error) => { throw error; });
  }
}
```

### 2. Store: `apps/web/ce/store/bank-wide-projects.store.ts`

```typescript
import { makeObservable, observable, action, runInAction } from "mobx";
import { BankWideProjectsService } from "@/ce/services/bank-wide-projects.service";
import type { IBankWideProject } from "@plane/types";

export class BankWideProjectsStore {
  projects: IBankWideProject[] = [];
  isLoading = false;
  error: string | null = null;

  private service = new BankWideProjectsService();

  constructor() {
    makeObservable(this, {
      projects: observable,
      isLoading: observable,
      error: observable,
      fetchProjects: action,
    });
  }

  fetchProjects = async (workspaceSlug: string) => {
    this.isLoading = true;
    this.error = null;
    try {
      const data = await this.service.fetchAll(workspaceSlug);
      runInAction(() => {
        this.projects = data;
        this.isLoading = false;
      });
    } catch {
      runInAction(() => {
        this.error = "Failed to load bank-wide projects";
        this.isLoading = false;
      });
    }
  };
}
```

### 3. Register in CE root store

Find the CE root store override (likely `apps/web/ce/store/root.store.ts` or similar). If it extends core `RootStore`, add:
```typescript
bankWideProjects = new BankWideProjectsStore();
```

If no CE root store override exists, check if core `RootStore` is extended in CE — follow the pattern used for other CE stores.

### 4. CE Component: `apps/web/ce/components/bank-wide-projects/root.tsx`

<!-- Updated: Validation Session 1 - confirmed grouped-by-workspace layout -->
```typescript
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { useEffect } from "react";

// Group projects by workspace_slug:
// const grouped = projects.reduce((acc, p) => {
//   (acc[p.workspace_slug] ??= []).push(p);
//   return acc;
// }, {} as Record<string, IBankWideProject[]>);
//
// Render one <section> per workspace key, with BankWideProjectCard for each project
```

**Layout**: Section per workspace → workspace name as heading → project cards below.

### 5. CE Component: `apps/web/ce/components/bank-wide-projects/project-card.tsx`

<!-- Updated: Validation Session 1 - confirmed link uses project's own workspace slug -->
Simple card showing:
- Project logo/cover
- Project name + identifier
- Workspace badge (workspace name)
- Link: `/${project.workspace_slug}/projects/${project.id}/issues/`
  > **CONFIRMED**: Link uses the **project's own** `workspace_slug`, NOT the current BoD `workspaceSlug` param — user navigates into the project's workspace

### 6. Route files

`apps/web/app/(all)/[workspaceSlug]/(projects)/bank-wide-projects/layout.tsx`
```typescript
// Same structure as /ho/layout.tsx — likely just children passthrough
export default function BankWideProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

`apps/web/app/(all)/[workspaceSlug]/(projects)/bank-wide-projects/page.tsx`
```typescript
import { PageHead } from "@/components/core/page-title";
import { BankWideProjectsRoot } from "@/plane-web/components/bank-wide-projects/root";

export default function BankWideProjectsPage() {
  return (
    <>
      <PageHead title="Bank-wide Projects" />
      <BankWideProjectsRoot />
    </>
  );
}
```

## Todo

- [ ] Create `IBankWideProject` type in `packages/types/`
- [ ] Create `apps/web/ce/services/bank-wide-projects.service.ts`
- [ ] Create `apps/web/ce/store/bank-wide-projects.store.ts`
- [ ] Register store in CE root store
- [ ] Create `apps/web/ce/components/bank-wide-projects/root.tsx`
- [ ] Create `apps/web/ce/components/bank-wide-projects/project-card.tsx`
- [ ] Create route `layout.tsx` and `page.tsx`
- [ ] Run `pnpm check:lint` — 0 errors

## Success Criteria

- Page loads at `/:workspaceSlug/bank-wide-projects/`
- Lists all projects with `is_bank_wide=true` across all workspaces
- Each card shows project name, workspace name, and links to correct workspace's project
- Loading state shown while fetching
- Empty state shown when no bank-wide projects exist
- Lint passes

## Risk Assessment

- **CE root store registration**: need to confirm how CE overrides the root store; wrong pattern will break the store injection
- **Workspace slug on links**: clicking a project must navigate to its own workspace's URL, not the BoD workspace URL — important UX detail
- **i18n**: page title and empty-state strings must use translation keys

## Security Considerations

- Frontend should also guard route: redirect if `!currentWorkspace?.is_board_of_director_workspace`
- Add a route-level guard in `layout.tsx` (redirect to home if not BoD workspace)

## Next Steps

After all 3 phases: run `pnpm check:lint`, smoke test in browser with a BoD workspace, verify non-BoD workspace cannot see the menu or access the route.
