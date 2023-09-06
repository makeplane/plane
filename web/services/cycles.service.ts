// services
import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";

// types
import type { CycleDateCheckData, ICurrentUserResponse, ICycle, IIssue } from "types";

import getConfig from "next/config";
const { publicRuntimeConfig: { NEXT_PUBLIC_API_BASE_URL } } = getConfig();

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

class ProjectCycleServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createCycle(
    workspaceSlug: string,
    projectId: string,
    data: any,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/`, data)
      .then((response) => {
        if (trackEvent) trackEventServices.trackCycleEvent(response?.data, "CYCLE_CREATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCyclesWithParams(
    workspaceSlug: string,
    projectId: string,
    cycleType: "all" | "current" | "upcoming" | "draft" | "completed" | "incomplete"
  ): Promise<ICycle[]> {
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

  async getCycleDetails(
    workspaceSlug: string,
    projectId: string,
    cycleId: string
  ): Promise<ICycle> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getCycleIssues(
    workspaceSlug: string,
    projectId: string,
    cycleId: string
  ): Promise<IIssue[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/`
    )
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
  ): Promise<IIssue[] | { [key: string]: IIssue[] }> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/`,
      { params: queries }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateCycle(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: any,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.put(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/`,
      data
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackCycleEvent(response?.data, "CYCLE_UPDATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchCycle(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: Partial<ICycle>,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/`,
      data
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackCycleEvent(response?.data, "CYCLE_UPDATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteCycle(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/`)
      .then((response) => {
        if (trackEvent) trackEventServices.trackCycleEvent(response?.data, "CYCLE_DELETE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async cycleDateCheck(
    workspaceSlug: string,
    projectId: string,
    data: CycleDateCheckData
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/date-check/`,
      data
    )
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
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-cycles/`,
      data
    )
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
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/transfer-issues/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeCycleFromFavorites(
    workspaceSlug: string,
    projectId: string,
    cycleId: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-cycles/${cycleId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectCycleServices();
