// api routes
import { STATES_ENDPOINT, STATE_DETAIL, ISSUES_BY_STATE } from "constants/api-routes";
// services
import APIService from "lib/services/api.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

// types
import type { IState } from "types";

class ProjectStateServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createState(workspace_slug: string, projectId: string, data: any): Promise<any> {
    return this.post(STATES_ENDPOINT(workspace_slug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getStates(workspace_slug: string, projectId: string): Promise<IState[]> {
    return this.get(STATES_ENDPOINT(workspace_slug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssuesByState(workspace_slug: string, projectId: string): Promise<any> {
    return this.get(ISSUES_BY_STATE(workspace_slug, projectId))

      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getState(workspace_slug: string, projectId: string, stateId: string): Promise<any> {
    return this.get(STATE_DETAIL(workspace_slug, projectId, stateId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateState(
    workspace_slug: string,
    projectId: string,
    stateId: string,
    data: IState
  ): Promise<any> {
    return this.put(STATE_DETAIL(workspace_slug, projectId, stateId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchState(
    workspace_slug: string,
    projectId: string,
    stateId: string,
    data: Partial<IState>
  ): Promise<any> {
    return this.patch(STATE_DETAIL(workspace_slug, projectId, stateId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteState(workspace_slug: string, projectId: string, stateId: string): Promise<any> {
    return this.delete(STATE_DETAIL(workspace_slug, projectId, stateId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectStateServices();
