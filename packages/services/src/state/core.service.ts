import { IState } from "@plane/types";
import { APIService } from "../api.service";

export class CoreStateService extends APIService {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  async anchorStates(anchor: string): Promise<IState[]> {
    return this.get(`/api/public/anchor/${anchor}/states/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async list(workspaceSlug: string, projectId: string): Promise<IState[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieve(workspaceSlug: string, projectId: string, stateId: string): Promise<IState> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, projectId: string, data: Partial<IState>): Promise<IState> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, projectId: string, stateId: string, data: Partial<IState>): Promise<IState> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, projectId: string, stateId: string): Promise<IState> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
