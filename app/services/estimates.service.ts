// services
import APIService from "services/api.service";
// types
import type { IEstimate, IEstimateFormData, IEstimatePoint } from "types";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class ProjectEstimateServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createEstimate(
    workspaceSlug: string,
    projectId: string,
    data: IEstimateFormData
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async patchEstimate(
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    data: IEstimateFormData
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`,
      data
    )
      .then((response) => response?.data)
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

  async deleteEstimate(workspaceSlug: string, projectId: string, estimateId: string): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectEstimateServices();
