// services
import APIService from "services/api.service";
// types
import type { ICurrentUserResponse, IEstimate, IEstimateFormData } from "types";
import trackEventServices from "services/track-event.service";
import { API_BASE_URL } from "helpers/common.helper";
import PosthogService from "./posthog.service";
import { ESTIMATE_CREATE, ESTIMATE_UPDATE, ESTIMATE_DELETE } from "constants/posthog-events";

const posthogService = new PosthogService();
class ProjectEstimateServices extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createEstimate(
    workspaceSlug: string,
    projectId: string,
    data: IEstimateFormData,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/`, data)
      .then((response) => {
        trackEventServices.trackIssueEstimateEvent(response?.data, "ESTIMATE_CREATE", user);
        posthogService.capture(ESTIMATE_CREATE, response?.data, user);
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
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`,
      data
    )
      .then((response) => {
        trackEventServices.trackIssueEstimateEvent(response?.data, "ESTIMATE_UPDATE", user);
        posthogService.capture(ESTIMATE_UPDATE, response?.data, user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getEstimateDetails(
    workspaceSlug: string,
    projectId: string,
    estimateId: string
  ): Promise<IEstimate> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`
    )
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
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`
    )
      .then((response) => {
        trackEventServices.trackIssueEstimateEvent(response?.data, "ESTIMATE_DELETE", user);
        posthogService.capture(ESTIMATE_DELETE, { workspaceSlug, projectId, estimateId }, user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectEstimateServices();
