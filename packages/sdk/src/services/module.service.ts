import { APIService } from "@/services/api.service";
// types
import { ClientOptions, ExcludedProps, ExModule, Optional, Paginated } from "@/types/types";

export class ModuleService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async getModule(slug: string, projectId: string, moduleId: string): Promise<ExModule> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/modules/${moduleId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getModuleByExternalId(
    slug: string,
    projectId: string,
    externalId: string,
    externalSource: string
  ): Promise<ExModule> {
    return this.get(
      `/api/v1/workspaces/${slug}/projects/${projectId}/modules/?external_id=${externalId}&external_source=${externalSource}`
    )
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async list(slug: string, projectId: string): Promise<Paginated<ExModule>> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/modules/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(slug: string, projectId: string, payload: Omit<Optional<ExModule>, ExcludedProps>): Promise<ExModule> {
    return this.post(`/api/v1/workspaces/${slug}/projects/${projectId}/modules/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(slug: string, projectId: string, moduleId: string, payload: Omit<Optional<ExModule>, ExcludedProps>) {
    return this.patch(`/api/v1/workspaces/${slug}/projects/${projectId}/modules/${moduleId}/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(slug: string, projectId: string, moduleId: string) {
    return this.delete(`/api/v1/workspaces/${slug}/projects/${projectId}/modules/${moduleId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addIssues(slug: string, projectId: string, moduleId: string, moduleName: string, issueIds: string[]) {
    return this.post(`/api/v1/workspaces/${slug}/projects/${projectId}/modules/${moduleId}/module-issues/`, {
      name: moduleName,
      issues: issueIds,
    })
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
