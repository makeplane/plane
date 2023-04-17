// services
import APIService from "services/api.service";
// types
import type { IEstimate, IEstimatePoint } from "types";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class ProjectEstimateServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createEstimate(workspaceSlug: string, projectId: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getEstimate(
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

  async patchEstimate(
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    data: Partial<IEstimate>
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`,
      data
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
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

  async createEstimatePoints(
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    data: {
      estimate_points: {
        key: number;
        value: string;
      }[];
    }
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/bulk-estimate-points/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getEstimatesPointDetails(
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    estimatePointId: string
  ): Promise<any> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimate/${estimateId}/estimate-points/${estimatePointId}`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getEstimatesPointsList(
    workspaceSlug: string,
    projectId: string,
    estimateId: string
  ): Promise<IEstimatePoint[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/estimate-points/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchEstimatePoints(
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    data: any
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/bulk-estimate-points/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectEstimateServices();
