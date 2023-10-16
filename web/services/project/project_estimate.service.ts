// services
import { APIService } from "services/api.service";
import { TrackEventService } from "services/track_event.service";
// types
import type { IUser, IEstimate, IEstimateFormData } from "types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

const trackEventService = new TrackEventService();

export class ProjectEstimateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createEstimate(
    workspaceSlug: string,
    projectId: string,
    data: IEstimateFormData,
    user: IUser | undefined
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/`, data)
      .then((response) => {
        trackEventService.trackIssueEstimateEvent(response?.data, "ESTIMATE_CREATE", user as IUser);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response;
      });
  }

  async patchEstimate(
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    data: IEstimateFormData,
    user: IUser | undefined
  ): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`, data)
      .then((response) => {
        trackEventService.trackIssueEstimateEvent(response?.data, "ESTIMATE_UPDATE", user as IUser);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getEstimateDetails(workspaceSlug: string, projectId: string, estimateId: string): Promise<IEstimate> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getEstimatesList(workspaceSlug: string, projectId: string): Promise<IEstimate[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteEstimate(
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    user: IUser | undefined
  ): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`)
      .then((response) => {
        trackEventService.trackIssueEstimateEvent(response?.data, "ESTIMATE_DELETE", user as IUser);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
