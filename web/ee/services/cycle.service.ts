// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { CYCLE_ACTION } from "@/plane-web/constants/cycle";
import { APIService } from "@/services/api.service";
import { CycleService as CycleServiceCore } from "@/services/cycle.service";
import { TCycleUpdateReaction, TCycleUpdates, TCycleUpdateStatus } from "../types";

export class CycleUpdateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // EE Services

  async getCycleUpdates(workspaceSlug: string, projectId: string, cycleId: string): Promise<TCycleUpdates[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/updates/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createCycleUpdate(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: Partial<TCycleUpdates>
  ): Promise<TCycleUpdates> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/updates/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateCycleUpdate(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    updateId: string,
    data: Partial<TCycleUpdates>
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/updates/${updateId}/`,
      data
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteCycleUpdate(workspaceSlug: string, projectId: string, cycleId: string, updateId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/updates/${updateId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // reactions
  async createCycleUpdateReaction(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    updateId: string,
    data: TCycleUpdateReaction
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/updates/${updateId}/reactions`,
      data
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteCycleUpdateReaction(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    updateId: string,
    reactionId: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/updates/${updateId}/reactions/${reactionId}`
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}

export class CycleService extends CycleServiceCore {
  async updateCycleStatus(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    date: string,
    action: CYCLE_ACTION
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/start-stop/`, {
      date,
      action,
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
