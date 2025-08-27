/* eslint-disable no-useless-catch */

// helpers
// plane web types
import { API_BASE_URL } from "@/helpers/common.helper";
import { TWorkspaceFeature, TWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
// services
import { APIService } from "@/services/api.service";

export class WorkspaceFeatureService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * @description fetching workspace features
   * @param { string } workspaceSlug
   * @returns { TWorkspaceFeatures | undefined }
   */
  async fetchWorkspaceFeatures(workspaceSlug: string): Promise<TWorkspaceFeatures | undefined> {
    try {
      const { data } = await this.get(`/api/workspaces/${workspaceSlug}/features/`);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description update workspace feature
   * @param { string } workspaceSlug
   * @param { Partial<TWorkspaceFeature> } payload
   * @returns { TWorkspaceFeatures | undefined }
   */
  async updateWorkspaceFeature(
    workspaceSlug: string,
    payload: Partial<TWorkspaceFeature>
  ): Promise<TWorkspaceFeatures | undefined> {
    try {
      const { data } = await this.patch(`/api/workspaces/${workspaceSlug}/features/`, payload);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }
}

const workspaceFeatureService = new WorkspaceFeatureService();

export default workspaceFeatureService;
