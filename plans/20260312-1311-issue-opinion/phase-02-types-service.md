# Phase 02: Types + Service

## Overview

- **Priority**: High (required by Phase 03–04)
- **Status**: Not started
- Định nghĩa TypeScript types và API service class cho Opinion — scoped per `activityId`

## Requirements

- `TIssueOpinion` type khớp chính xác với backend response (FK `activity`, không phải `issue`)
- Service URL pattern: `...issues/<issueId>/activities/<activityId>/opinion/`
- Service class đặt trong `apps/web/ce/services/` (CE pattern)
- Tuân thủ import order và naming conventions

## Related Code Files

### Tạo mới

- `packages/types/src/issues/opinion.ts`
- `apps/web/ce/services/issue-opinion.service.ts`

### Sửa đổi

- `packages/types/src/issues.ts` — thêm re-export `* from "./issues/opinion"`
- `packages/types/src/index.ts` — đã re-export qua issues.ts (verify)

## Embedded Rules

1. **`export type` / `import type`** — dùng `export type` cho tất cả type definitions, KHÔNG `export interface`
2. **Import order** — React → `import type` → `@plane/*` → `@/` → relative
3. **No `any`** — explicit types
4. **CE Services** — service classes trong `apps/web/ce/services/`, không trong `core/`
5. **Error rethrow pattern** — `.catch((err) => { throw err?.response?.data; })`
6. **APIService base** — extend `APIService` từ `@/services/api.service`

## Implementation Steps

### Step 1 — Types (`packages/types/src/issues/opinion.ts`)

```typescript
// packages/types/src/issues/opinion.ts

export type TOpinionSentiment = "approve" | "neutral" | "reject";

export type TIssueOpinion = {
  id: string;
  activity: string; // FK → IssueActivity.id
  actor: string; // User.id
  actor_detail?: {
    id: string;
    display_name: string;
    avatar_url: string;
  };
  sentiment: TOpinionSentiment;
  content: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
};

export type TIssueOpinionCreate = {
  sentiment: TOpinionSentiment;
  content?: string;
};

/** Map: activityId → TIssueOpinion (1-to-1 per user) */
export type TIssueOpinionByActivityMap = {
  [activityId: string]: TIssueOpinion | undefined;
};
```

### Step 2 — Export từ `packages/types/src/issues.ts`

Tìm file và thêm:

```typescript
export * from "./issues/opinion";
```

### Step 3 — Service (`apps/web/ce/services/issue-opinion.service.ts`)

```typescript
// apps/web/ce/services/issue-opinion.service.ts
import type { TIssueOpinion, TIssueOpinionCreate } from "@plane/types";
import { APIService } from "@/services/api.service";

export class IssueOpinionService extends APIService {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_BASE_URL || "");
  }

  private activityUrl(slug: string, projectId: string, issueId: string, activityId: string): string {
    return `/api/workspaces/${slug}/projects/${projectId}/issues/${issueId}/activities/${activityId}/opinion/`;
  }

  /** GET opinion của current user trên 1 activity row (trả về null nếu chưa có) */
  async getOpinion(
    slug: string,
    projectId: string,
    issueId: string,
    activityId: string
  ): Promise<TIssueOpinion | null> {
    return this.get(this.activityUrl(slug, projectId, issueId, activityId))
      .then((res) => res?.data ?? null)
      .catch((err) => {
        if (err?.response?.status === 404 || err?.response?.status === 204) return null;
        throw err?.response?.data;
      });
  }

  /** POST/upsert opinion của current user trên 1 activity row */
  async upsertOpinion(
    slug: string,
    projectId: string,
    issueId: string,
    activityId: string,
    data: TIssueOpinionCreate
  ): Promise<TIssueOpinion> {
    return this.post(this.activityUrl(slug, projectId, issueId, activityId), data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /** DELETE opinion */
  async deleteOpinion(
    slug: string,
    projectId: string,
    issueId: string,
    activityId: string,
    opinionId: string
  ): Promise<void> {
    return this.delete(`${this.activityUrl(slug, projectId, issueId, activityId)}${opinionId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}

export const issueOpinionService = new IssueOpinionService();
```

### Step 4 — Add batch service method

```typescript
/** GET all opinions for an issue, keyed by activityId (for batch loading) */
async listOpinionsForIssue(
  slug: string,
  projectId: string,
  issueId: string
): Promise<TIssueOpinionByActivityMap> {
  return this.get(`/api/workspaces/${slug}/projects/${projectId}/issues/${issueId}/activity-opinions/`)
    .then((res) => res?.data ?? {})
    .catch((err) => {
      throw err?.response?.data;
    });
}
```

<!-- Updated: Validation Session 1 - Add listOpinionsForIssue batch method -->

## Post-Phase Checklist

- [ ] `TIssueOpinion` có field `activity` (string UUID), không phải `issue`
- [ ] `TIssueOpinionByActivityMap` dùng `activityId` làm key
- [ ] Dùng `export type` (không phải `export interface`)
- [ ] Service extend `APIService`
- [ ] URL path đúng: `.../activities/<activityId>/opinion/`
- [ ] `getOpinion` trả `null` cho 204/404 (không throw)
- [ ] Service trong `apps/web/ce/services/` (không phải `core/`)

## Success Criteria

- Types compile không lỗi TypeScript
- `TIssueOpinionByActivityMap` map đúng: một activityId → một opinion (hoặc undefined)
- Service calls trả đúng types
