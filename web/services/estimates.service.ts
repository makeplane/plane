// services
import APIService from "services/api.service";
// types
import type { ICurrentUserResponse, IEstimate, IEstimateFormData } from "types";
import trackEventServices from "services/track-event.service";

import getConfig from "next/config";
const { publicRuntimeConfig: { NEXT_PUBLIC_API_BASE_URL } } = getConfig();

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

class ProjectEstimateServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createEstimate(
    workspaceSlug: string,
    projectId: string,
    data: IEstimateFormData,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/`, data)
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackIssueEstimateEvent(response?.data, "ESTIMATE_CREATE", user);
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
        if (trackEvent)
          trackEventServices.trackIssueEstimateEvent(response?.data, "ESTIMATE_UPDATE", user);
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
        if (trackEvent)
          trackEventServices.trackIssueEstimateEvent(response?.data, "ESTIMATE_DELETE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectEstimateServices();
