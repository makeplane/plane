// services
import { APIService } from "services/api.service";
import { TrackEventService } from "services/track_event.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";
// types
import type { IUser, IState, IStateResponse } from "types";

const trackEventService = new TrackEventService();

export class ProjectStateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createState(workspaceSlug: string, projectId: string, data: any, user: IUser | undefined): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/`, data)
      .then((response) => {
        trackEventService.trackStateEvent(response?.data, "STATE_CREATE", user as IUser);
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
    user: IUser | undefined
  ): Promise<any> {
    return this.put(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}/`, data)
      .then((response) => {
        trackEventService.trackStateEvent(response?.data, "STATE_UPDATE", user as IUser);
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
    user: IUser | undefined
  ): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}/`, data)
      .then((response) => {
        trackEventService.trackStateEvent(response?.data, "STATE_UPDATE", user as IUser);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteState(workspaceSlug: string, projectId: string, stateId: string, user: IUser | undefined): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}/`)
      .then((response) => {
        trackEventService.trackStateEvent(response?.data, "STATE_DELETE", user as IUser);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response;
      });
  }
}
