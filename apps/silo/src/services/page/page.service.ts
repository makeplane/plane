import { ExcludedProps, ExPage } from "@plane/sdk";
import { ClientOptions } from "@/types";
import { APIService } from "../api.service";

export class PageAPIService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async bulkCreatePages(workspaceSlug: string, payload: Omit<Partial<ExPage>, ExcludedProps>[]) {
    return this.post(`/api/v1/workspaces/${workspaceSlug}/pages/bulk-operation/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkUpdatePages(workspaceSlug: string, payload: Omit<Partial<ExPage>, ExcludedProps>[]) {
    return this.patch(`/api/v1/workspaces/${workspaceSlug}/pages/bulk-operation/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  // Project pages bulk operations
  async bulkCreateProjectPages(
    workspaceSlug: string,
    projectId: string,
    payload: Omit<Partial<ExPage>, ExcludedProps>[]
  ) {
    return this.post(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/pages/bulk-operation/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkUpdateProjectPages(
    workspaceSlug: string,
    projectId: string,
    payload: Omit<Partial<ExPage>, ExcludedProps>[]
  ) {
    return this.patch(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/pages/bulk-operation/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // Teamspace pages bulk operations
  async bulkCreateTeamspacePages(
    workspaceSlug: string,
    teamspaceId: string,
    payload: Omit<Partial<ExPage>, ExcludedProps>[]
  ) {
    return this.post(`/api/v1/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/bulk-operation/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkUpdateTeamspacePages(
    workspaceSlug: string,
    teamspaceId: string,
    payload: Omit<Partial<ExPage>, ExcludedProps>[]
  ) {
    return this.patch(`/api/v1/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/bulk-operation/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
