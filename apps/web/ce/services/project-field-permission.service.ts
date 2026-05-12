import { API_BASE_URL } from "@plane/constants";
import type { IProjectFieldPermission } from "@plane/types";
import { APIService } from "@/services/api.service";

export class ProjectFieldPermissionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /** GET /workspaces/{slug}/projects/{projectId}/field-permissions/ */
  async fetch(workspaceSlug: string, projectId: string): Promise<IProjectFieldPermission> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/field-permissions/`)
      .then((res: { data: IProjectFieldPermission }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  /** PATCH /workspaces/{slug}/projects/{projectId}/field-permissions/ */
  async update(
    workspaceSlug: string,
    projectId: string,
    payload: Partial<IProjectFieldPermission>
  ): Promise<IProjectFieldPermission> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/field-permissions/`, payload)
      .then((res: { data: IProjectFieldPermission }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }
}

export const projectFieldPermissionService = new ProjectFieldPermissionService();
