import { APIService } from "@/services/api.service";
// types
import { ClientOptions, ExcludedProps, ExCycle, Optional, Paginated } from "@/types/types";

export class CycleService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async getCycle(slug: string, projectId: string, cycleId: string): Promise<ExCycle> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/cycles/${cycleId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async list(slug: string, projectId: string): Promise<Paginated<ExCycle>> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/cycles/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(slug: string, projectId: string, payload: Omit<Optional<ExCycle>, ExcludedProps>): Promise<ExCycle> {
    return this.post(`/api/v1/workspaces/${slug}/projects/${projectId}/cycles/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(slug: string, projectId: string, cycleId: string, payload: Omit<Optional<ExCycle>, ExcludedProps>) {
    return this.patch(`/api/v1/workspaces/${slug}/projects/${projectId}/cycles/${cycleId}/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(slug: string, projectId: string, cycleId: string) {
    return this.delete(`/api/v1/workspaces/${slug}/projects/${projectId}/cycles/${cycleId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addIssues(slug: string, projectId: string, cycleId: string, issueIds: string[]) {
    return this.post(`/api/v1/workspaces/${slug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/`, {
      issues: issueIds,
    })
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
