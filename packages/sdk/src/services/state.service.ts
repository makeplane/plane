import { APIService } from "@/services/api.service";
// types
import { ClientOptions, ExcludedProps, Optional, Paginated, ExState } from "@/types/types";

export class StateService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async list(slug: string, projectId: string): Promise<Paginated<ExState>> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/states/`)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async getState(slug: string, projectId: string, stateId: string): Promise<ExState> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/states/${stateId}/`)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async create(slug: string, projectId: string, payload: Omit<Optional<ExState>, ExcludedProps>): Promise<ExState> {
    return this.post(`/api/v1/workspaces/${slug}/projects/${projectId}/states/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(slug: string, projectId: string, stateId: string, payload: Omit<Optional<ExState>, ExcludedProps>) {
    return this.patch(`/api/v1/workspaces/${slug}/projects/${projectId}/states/${stateId}/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(slug: string, projectId: string, stateId: string) {
    return this.delete(`/api/v1/workspaces/${slug}/projects/${projectId}/states/${stateId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
