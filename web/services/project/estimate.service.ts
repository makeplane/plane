// types
import { IEstimate } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class EstimateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // fetching the estimates in workspace level
  async fetchWorkspacesList(workspaceSlug: string): Promise<IEstimate[] | undefined> {
    try {
      const { data } = await this.get(`/api/workspaces/${workspaceSlug}/estimates/`);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  async fetchAll(workspaceSlug: string, projectId: string): Promise<IEstimate[] | undefined> {
    try {
      const { data } = await this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/`);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  async fetchById(workspaceSlug: string, projectId: string, estimateId: string): Promise<IEstimate | undefined> {
    try {
      const { data } = await this.get(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`
      );
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  async create(workspaceSlug: string, projectId: string, payload: Partial<IEstimate>): Promise<IEstimate | undefined> {
    try {
      const { data } = await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/`, payload);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    payload: Partial<IEstimate>
  ): Promise<IEstimate | undefined> {
    try {
      const { data } = await this.patch(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`,
        payload
      );
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  async remove(workspaceSlug: string, projectId: string, estimateId: string): Promise<void> {
    try {
      const { data } = await this.delete(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`
      );
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }
}
