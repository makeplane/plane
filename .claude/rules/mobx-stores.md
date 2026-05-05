---
paths:
  - apps/web/**/store/**
  - apps/web/ce/store/**
  - apps/web/core/store/**
---

# MobX Store Pattern

## Architecture

```
CoreRootStore (core/store/root.store.ts)
├── cycle, project, issue, label, ... (33+ stores)
└── CE extends via RootStore in ce/store/root.store.ts
```

## Store Structure

```typescript
import { makeObservable, observable, action, computed, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { set } from "lodash-es";

export interface IMyStore {
  dataMap: Record<string, IMyModel>;
  loader: boolean;
  currentItems: IMyModel[] | null;
  getItemById: (id: string) => IMyModel | null;
  fetchItems: (workspaceSlug: string) => Promise<IMyModel[]>;
}

export class MyStore implements IMyStore {
  dataMap: Record<string, IMyModel> = {};
  loader = false;

  constructor(private rootStore: CoreRootStore) {
    makeObservable(this, {
      dataMap: observable,
      loader: observable,
      currentItems: computed,
      fetchItems: action,
    });
  }

  getItemById = computedFn((id: string) => this.dataMap[id] ?? null);
  get currentItems() {
    /* ... */
  }

  fetchItems = async (workspaceSlug: string) => {
    this.loader = true;
    try {
      const response = await myService.list(workspaceSlug);
      runInAction(() => {
        response.forEach((item) => {
          set(this.dataMap, item.id, item);
        });
      });
      return response;
    } finally {
      runInAction(() => {
        this.loader = false;
      });
    }
  };
}
```

## Critical Rules

- **ALWAYS** `makeObservable` with explicit fields (NEVER `makeAutoObservable`)
- **ALWAYS** `runInAction` for async observable updates
- **ALWAYS** `set()` from `lodash-es` for dynamic record keys (NOT `this.map[id] = x`, NOT from `mobx`)
- **ALWAYS** `observer()` wrapper on components reading stores

## Hook Wrapper Pattern

```typescript
// hooks/store/use-my-store.ts
import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";

export const useMyStore = (): IMyStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useMyStore must be used within StoreProvider");
  return context.myStore;
};
```

## CE Store Registration

```typescript
// ce/store/root.store.ts — extends CoreRootStore
import { CoreRootStore } from "@/store/root.store";
export class RootStore extends CoreRootStore {
  myFeature: IMyFeatureStore;
  constructor() {
    super();
    this.myFeature = new MyFeatureStore(this);
  }
}
```

**Rule**: CE stores go in `ce/store/`, NEVER modify `core/store/root.store.ts`.

## Data Fetching: SWR vs Store

Two patterns coexist — use the right one:

### `useSWR` — Read-Only with Cache

```typescript
import useSWR from "swr";

const { data, isLoading, mutate } = useSWR(
  workspaceSlug ? `WORKSPACE_DETAILS_${workspaceSlug}` : null,
  workspaceSlug ? () => workspaceService.getDetails(workspaceSlug) : null
);
```

Use when: read-only display, benefit from SWR cache/revalidation, component-local data.

### `store.fetchX()` — Mutations & Shared State

```typescript
// In component
useEffect(() => {
  store.fetchItems(slug);
}, [slug]);
```

Use when: data feeds MobX observables shared across components, or involves mutations (create/update/delete).

**Rule**: Never mix — don't put SWR data into MobX stores. Choose one pattern per data domain.

## Optimistic Update Pattern

```typescript
updateItem = async (id: string, data: Partial<IMyModel>) => {
  const original = { ...this.dataMap[id] };
  runInAction(() => {
    Object.assign(this.dataMap[id], data);
  });
  try {
    await this.service.update(id, data);
  } catch (error) {
    runInAction(() => {
      this.dataMap[id] = original;
    }); // rollback
    throw error;
  }
};
```
