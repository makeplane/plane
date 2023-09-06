// services
import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";

import getConfig from "next/config";
const { publicRuntimeConfig: { NEXT_PUBLIC_API_BASE_URL } } = getConfig();

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

// types
import type { ICurrentUserResponse, IState, IStateResponse } from "types";

class ProjectStateServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createState(
    workspaceSlug: string,
    projectId: string,
    data: any,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/`, data)
      .then((response) => {
        if (trackEvent) trackEventServices.trackStateEvent(response?.data, "STATE_CREATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response;
      });
  }

  async getStates(workspaceSlug: string, projectId: string): Promise<IStateResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssuesByState(workspaceSlug: string, projectId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/?group_by=state`)

      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getState(workspaceSlug: string, projectId: string, stateId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateState(
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    data: IState,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.put(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}/`,
      data
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackStateEvent(response?.data, "STATE_UPDATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response;
      });
  }

  async patchState(
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    data: Partial<IState>,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}/`,
      data
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackStateEvent(response?.data, "STATE_UPDATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteState(
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}/`)
      .then((response) => {
        if (trackEvent) trackEventServices.trackStateEvent(response?.data, "STATE_DELETE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response;
      });
  }
}

export default new ProjectStateServices();
