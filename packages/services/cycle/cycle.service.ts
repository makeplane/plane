// services
import { APIService } from "services/api.service";
// types
import type { CycleDateCheckData, ICycle, TIssue, TIssueMap } from "@plane/types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

export class CycleService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createCycle(workspaceSlug: string, projectId: string, data: any): Promise<ICycle> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCyclesWithParams(workspaceSlug: string, projectId: string, cycleType?: "current"): Promise<ICycle[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/`, {
      params: {
        cycle_view: cycleType,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCycleDetails(workspaceSlug: string, projectId: string, cycleId: string): Promise<ICycle> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getCycleIssues(workspaceSlug: string, projectId: string, cycleId: string): Promise<TIssue[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCycleIssuesWithParams(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    queries?: any
  ): Promise<TIssue[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchCycle(workspaceSlug: string, projectId: string, cycleId: string, data: Partial<ICycle>): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteCycle(workspaceSlug: string, projectId: string, cycleId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async cycleDateCheck(workspaceSlug: string, projectId: string, data: CycleDateCheckData): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/date-check/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addCycleToFavorites(
    workspaceSlug: string,
    projectId: string,
    data: {
      cycle: string;
    }
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-cycles/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async transferIssues(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: {
      new_cycle_id: string;
    }
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/transfer-issues/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeCycleFromFavorites(workspaceSlug: string, projectId: string, cycleId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-cycles/${cycleId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
