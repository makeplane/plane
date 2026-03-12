# Phase 03: MobX Store

## Overview

- **Priority**: High (required by Phase 04)
- **Status**: Not started
- Tạo CE store `opinion.store.ts` keyed by `activityId` + hook + đăng ký root

## Requirements

- Store lưu opinions theo `activityId` (Map: `activityId → TIssueOpinion | undefined`)
- **Batch load** khi activity feed mount: `fetchOpinionsForIssue(slug, projectId, issueId)` gọi batch endpoint, populate toàn bộ map 1 lần (không lazy fetch per row nữa)
- Actions: `fetchOpinionsForIssue(issueId)`, `upsertOpinion(activityId, payload)`, `deleteOpinion(activityId, opinionId)`
- Hook `useOpinion()` để components dùng

<!-- Updated: Validation Session 1 - Replace lazy fetchOpinion with batch fetchOpinionsForIssue -->

## Related Code Files

### Tạo mới

- `apps/web/ce/store/opinion.store.ts`
- `apps/web/ce/hooks/store/use-opinion.ts`

### Sửa đổi

- `apps/web/ce/store/root.store.ts` — thêm `opinion: OpinionStore`

## Embedded Rules

1. **`makeObservable` explicit (KHÔNG `makeAutoObservable`)** — khai báo explicit tất cả observables, actions.
2. **`runInAction`** — dùng trong async methods để update observables sau await.
3. **`set()` từ MobX** — dùng `set(this.opinionByActivity, activityId, opinion)` cho dynamic map keys.
4. **`observer()` wrapper** — components đọc store PHẢI được wrap bằng `observer()`.
5. **CE store pattern** — store trong `ce/store/`, đăng ký trong `ce/store/root.store.ts`.
6. **Hook pattern** — hook dùng `useContext(StoreContext)` (pattern giống `useWorklog()`).

## Implementation Steps

### Step 1 — Store (`apps/web/ce/store/opinion.store.ts`)

> **Updated (Validation Session 1):** Replace `fetchOpinion(activityId)` with `fetchOpinionsForIssue(issueId)` batch method.

```typescript
import { action, makeObservable, observable, runInAction, set } from "mobx";
import type { TIssueOpinion, TIssueOpinionByActivityMap, TIssueOpinionCreate } from "@plane/types";
import { issueOpinionService } from "../services/issue-opinion.service";

export class OpinionStore {
  /** activityId → opinion của current user (nếu có) */
  opinionByActivity: TIssueOpinionByActivityMap = {};
  /** activityId → đang loading */
  loader: Record<string, boolean> = {};

  constructor() {
    makeObservable(this, {
      opinionByActivity: observable,
      loader: observable,
      fetchOpinion: action,
      upsertOpinion: action,
      deleteOpinion: action,
    });
  }

  getOpinionForActivity(activityId: string): TIssueOpinion | undefined {
    return this.opinionByActivity[activityId];
  }

  isLoading(activityId: string): boolean {
    return this.loader[activityId] ?? false;
  }

  /** Batch-load all opinions for an issue (call once when activity feed mounts) */
  async fetchOpinionsForIssue(slug: string, projectId: string, issueId: string): Promise<void> {
    try {
      runInAction(() => {
        set(this.loader, issueId, true);
      });
      const data = await issueOpinionService.listOpinionsForIssue(slug, projectId, issueId);
      runInAction(() => {
        // Merge into map: activityId → opinion
        Object.entries(data).forEach(([activityId, opinion]) => {
          set(this.opinionByActivity, activityId, opinion);
        });
        set(this.loader, issueId, false);
      });
    } catch {
      runInAction(() => {
        set(this.loader, issueId, false);
      });
    }
  }

  async upsertOpinion(
    slug: string,
    projectId: string,
    issueId: string,
    activityId: string,
    payload: TIssueOpinionCreate
  ): Promise<TIssueOpinion> {
    const opinion = await issueOpinionService.upsertOpinion(slug, projectId, issueId, activityId, payload);
    runInAction(() => {
      set(this.opinionByActivity, activityId, opinion);
    });
    return opinion;
  }

  async deleteOpinion(
    slug: string,
    projectId: string,
    issueId: string,
    activityId: string,
    opinionId: string
  ): Promise<void> {
    await issueOpinionService.deleteOpinion(slug, projectId, issueId, activityId, opinionId);
    runInAction(() => {
      set(this.opinionByActivity, activityId, undefined);
    });
  }
}
```

### Step 2 — Đăng ký trong `root.store.ts`

Trong `apps/web/ce/store/root.store.ts`, tìm class `CEStore` và thêm:

```typescript
import { OpinionStore } from "./opinion.store";

// Khai báo trong class:
opinion: OpinionStore;

// Khởi tạo trong constructor:
this.opinion = new OpinionStore();
```

### Step 3 — Hook (`apps/web/ce/hooks/store/use-opinion.ts`)

```typescript
import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { OpinionStore } from "@/plane-web/store/opinion.store";

export const useOpinion = (): OpinionStore => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useOpinion must be used within StoreProvider");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (context as any).opinion as OpinionStore;
};
```

## Post-Phase Checklist

- [ ] `makeObservable` với explicit fields (KHÔNG `makeAutoObservable`)
- [ ] `runInAction` bao quanh mọi observable mutation sau `await`
- [ ] `set()` từ MobX dùng cho dynamic map keys
- [ ] Store keyed by `activityId` (không phải `issueId`)
- [ ] Store đăng ký trong `ce/store/root.store.ts`
- [ ] Hook `useOpinion()` được tạo và export

## Success Criteria

- `fetchOpinion(activityId)` populate `opinionByActivity[activityId]`
- `upsertOpinion` set opinion vào map
- `deleteOpinion` set undefined vào map
- `getOpinionForActivity(activityId)` trả TIssueOpinion | undefined
