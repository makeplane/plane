import { APIService } from "@/services/api.service";
// types
import { ClientOptions, ExIssuePropertyOption } from "@/types";

export class IssuePropertyOptionService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async fetch(workspaceSlug: string, projectId: string, propertyId: string): Promise<ExIssuePropertyOption[]> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${propertyId}/options/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  async fetchById(
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    optionId: string
  ): Promise<ExIssuePropertyOption> {
    return this.get(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${propertyId}/options/${optionId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    data: Partial<ExIssuePropertyOption>
  ): Promise<ExIssuePropertyOption> {
    return this.post(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${propertyId}/options/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    optionId: string,
    data: Partial<ExIssuePropertyOption>
  ): Promise<ExIssuePropertyOption> {
    return this.patch(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${propertyId}/options/${optionId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  async remove(workspaceSlug: string, projectId: string, propertyId: string, optionId: string): Promise<void> {
    return this.delete(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${propertyId}/options/${optionId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }
}
