import type {
  IMainTaskCategory,
  IMainTaskCategoryCreate,
  IMainTaskCategoryUpdate,
  ISubTaskCategory,
  ISubTaskCategoryCreate,
  ISubTaskCategoryUpdate,
  ITaskCategoryBulkImportRequest,
  ITaskCategoryBulkImportResponse,
} from "@plane/types";
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";

export class TaskCategoryService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // ── Main categories (instance admin endpoints) ──────────────────────

  async listMain(): Promise<IMainTaskCategory[]> {
    return this.get("/api/instances/task-categories/main/")
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createMain(data: IMainTaskCategoryCreate): Promise<IMainTaskCategory> {
    return this.post("/api/instances/task-categories/main/", data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateMain(id: string, data: IMainTaskCategoryUpdate): Promise<IMainTaskCategory> {
    return this.patch(`/api/instances/task-categories/main/${id}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteMain(id: string): Promise<void> {
    return this.delete(`/api/instances/task-categories/main/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // ── Sub categories (instance admin endpoints) ────────────────────────

  async listSub(mainCategoryId?: string): Promise<ISubTaskCategory[]> {
    const params = mainCategoryId ? `?main_category=${mainCategoryId}` : "";
    return this.get(`/api/instances/task-categories/sub/${params}`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createSub(data: ISubTaskCategoryCreate): Promise<ISubTaskCategory> {
    return this.post("/api/instances/task-categories/sub/", data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateSub(id: string, data: ISubTaskCategoryUpdate): Promise<ISubTaskCategory> {
    return this.patch(`/api/instances/task-categories/sub/${id}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteSub(id: string): Promise<void> {
    return this.delete(`/api/instances/task-categories/sub/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async bulkImport(data: ITaskCategoryBulkImportRequest): Promise<ITaskCategoryBulkImportResponse> {
    return this.post("/api/instances/task-categories/bulk-import/", data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // ── Web app read-only (workspace-scoped app endpoints — session auth) ──

  async listMainForWorkspace(workspaceSlug: string): Promise<IMainTaskCategory[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/task-categories/main/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async listSubForWorkspace(workspaceSlug: string): Promise<ISubTaskCategory[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/task-categories/sub/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
