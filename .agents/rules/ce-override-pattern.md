<!-- Scope: apps/web/ce/**, apps/admin/ce/** -->

# CE (Community Edition) Override Pattern

## Directory Structure

```
apps/web/
├── core/          # Upstream shared — DO NOT modify for CE features
│   ├── components/
│   ├── services/
│   ├── hooks/
│   └── store/
└── ce/            # CE-specific overrides (mirrors core/)
    ├── components/
    ├── services/
    ├── hooks/
    └── store/
```

## Import Aliases

- `@/*` → `apps/web/core/*` (core imports)
- `@/plane-web/*` → `apps/web/ce/*` (CE imports)

## Rules

- ✅ New CE features ALWAYS in `ce/`, NEVER in `core/`
- ✅ Mirror `core/` directory structure in `ce/`
- ✅ CE services use `CE` prefix: `CEProjectWorklogService`
- ✅ CE stores extend base: `class UserPermissionStore extends BaseUserPermissionStore`
- ✅ Register CE stores in `ce/store/root.store.ts` (extends `CoreRootStore`)
- ✅ Export via barrel files (`index.ts` → `export * from "./root"`)
- ✅ CE routes in `app/routes/extended.ts` (NOT `core.ts`)
- ❌ Never modify `core/store/root.store.ts` for CE features
- ❌ Never put CE components/services in `core/`

## Service Pattern

```typescript
// ce/services/my-feature.service.ts
import { APIService } from "@/services/api.service";
const API_BASE_URL = ""; // uses proxy

export class CEMyFeatureService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }
  async list(workspaceSlug: string) {
    return this.get(`/api/workspaces/${workspaceSlug}/my-feature/`);
  }
}
```

## Store Pattern

```typescript
// ce/store/root.store.ts
import { CoreRootStore } from "@/store/root.store";
export class RootStore extends CoreRootStore {
  myFeature: IMyFeatureStore;
  constructor() {
    super();
    this.myFeature = new MyFeatureStore(this);
  }
}
```

## Hook Pattern

```typescript
// ce/hooks/store/use-my-feature.ts
import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
export const useMyFeature = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("Must be used within StoreProvider");
  return context.myFeature;
};
```
