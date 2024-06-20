// services
import type { IIssueFiltersResponse } from "@plane/types";
import { API_BASE_URL } from "@/helpers/common.helper";
import { APIService } from "@/services/api.service";
// types

export class IssueFiltersService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // // workspace issue filters
  // async fetchWorkspaceFilters(workspaceSlug: string): Promise<IIssueFiltersResponse> {
  //   return this.get(`/api/workspaces/${workspaceSlug}/user-properties/`)
  //     .then((response) => response?.data)
  //     .catch((error) => {
  //       throw error?.response?.data;
  //     });
  // }
  // async patchWorkspaceFilters(
  //   workspaceSlug: string,
  //   data: Partial<IIssueFiltersResponse>
  // ): Promise<IIssueFiltersResponse> {
  //   return this.patch(`/api/workspaces/${workspaceSlug}/user-properties/`, data)
  //     .then((response) => response?.data)
  //     .catch((error) => {
  //       throw error?.response?.data;
  //     });
  // }

  // project issue filters
  async fetchProjectIssueFilters(workspaceSlug: string, projectId: string): Promise<IIssueFiltersResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/user-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async patchProjectIssueFilters(
    workspaceSlug: string,
    projectId: string,
    data: Partial<IIssueFiltersResponse>
  ): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/user-properties/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // cycle issue filters
  async fetchCycleIssueFilters(
    workspaceSlug: string,
    projectId: string,
    cycleId: string
  ): Promise<IIssueFiltersResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/user-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async patchCycleIssueFilters(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: Partial<IIssueFiltersResponse>
  ): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/user-properties/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // module issue filters
  async fetchModuleIssueFilters(
    workspaceSlug: string,
    projectId: string,
    moduleId: string
  ): Promise<IIssueFiltersResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/user-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async patchModuleIssueFilters(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: Partial<IIssueFiltersResponse>
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/user-properties/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
