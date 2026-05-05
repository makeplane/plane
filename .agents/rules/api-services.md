<!-- Scope: apps/web/**/services/**, apps/web/ce/services/** -->

# API Service Pattern

## Service Structure

```typescript
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export class MyModelService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string): Promise<IMyModel[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/my-models/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: Partial<IMyModel>): Promise<IMyModel> {
    return this.post(`/api/workspaces/${workspaceSlug}/my-models/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async update(workspaceSlug: string, id: string, data: Partial<IMyModel>): Promise<IMyModel> {
    return this.patch(`/api/workspaces/${workspaceSlug}/my-models/${id}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async delete(workspaceSlug: string, id: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/my-models/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
```

## URL Convention

Frontend `/api/workspaces/${slug}/...` → Backend `workspaces/<str:slug>/...` (Django prepends `/api/`)

## Rules

- CE services go in `apps/web/ce/services/`, core services in `apps/web/core/services/`
- Always include `.catch((err) => { throw err?.response?.data; })`
- Always include error handling in all service methods
- Use `setToast()` for success/error feedback after API mutations
