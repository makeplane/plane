/* eslint-disable no-useless-catch */

// helpers
import { API_BASE_URL  } from "@plane/constants";
// plane web types
import { TProjectState } from "@/plane-web/types/workspace-project-states";
// services
import { APIService } from "@/services/api.service";

export class ProjectStateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * @description fetching project states
   * @param { string } workspaceSlug
   * @returns { TProjectState[] | undefined }
   */
  async fetchProjectStates(workspaceSlug: string): Promise<TProjectState[] | undefined> {
    try {
      const { data } = await this.get(`/api/workspaces/${workspaceSlug}/project-states/`);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description create project state
   * @param { string } workspaceSlug
   * @param { Partial<TProjectState> } payload
   * @returns { TProjectState | undefined }
   */
  async createProjectState(workspaceSlug: string, payload: Partial<TProjectState>): Promise<TProjectState | undefined> {
    try {
      const { data } = await this.post(`/api/workspaces/${workspaceSlug}/project-states/`, payload);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description update project state by id
   * @param { string } workspaceSlug
   * @param { string } projectStateId
   * @param { Partial<TProjectState> } payload
   * @returns { TProjectState | undefined }
   */
  async updateProjectState(
    workspaceSlug: string,
    projectStateId: string,
    payload: Partial<TProjectState>
  ): Promise<TProjectState | undefined> {
    try {
      const { data } = await this.patch(`/api/workspaces/${workspaceSlug}/project-states/${projectStateId}/`, payload);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description mark project state as default
   * @param { string } workspaceSlug
   * @param { string } projectStateId
   */
  async markAsDefault(workspaceSlug: string, projectStateId: string): Promise<void> {
    try {
      await this.post(`/api/workspaces/${workspaceSlug}/project-states/${projectStateId}/default/`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description remove project state by id
   * @param { string } workspaceSlug
   * @param { string } projectStateId
   * @returns { void }
   */
  async removeProjectState(workspaceSlug: string, projectStateId: string): Promise<void> {
    try {
      const { data } = await this.delete(`/api/workspaces/${workspaceSlug}/project-states/${projectStateId}/`);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }
}

const projectStateService = new ProjectStateService();

export default projectStateService;
