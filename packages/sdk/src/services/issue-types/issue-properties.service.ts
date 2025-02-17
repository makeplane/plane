import { APIService } from "@/services/api.service";
// types
import { ClientOptions, ExIssueProperty } from "@/types";

export class IssuePropertyService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async fetch(
    workspaceSlug: string,
    projectId: string,
    typeId: string
  ): Promise<ExIssueProperty[]> {
    return this.get(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/issue-properties/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  async fetchById(
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    propertyId: string
  ): Promise<ExIssueProperty> {
    return this.get(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/issue-properties/${propertyId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    data: Partial<ExIssueProperty>
  ): Promise<ExIssueProperty> {
    return this.post(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/issue-properties/`,
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
    typeId: string,
    propertyId: string,
    data: Partial<ExIssueProperty>
  ): Promise<ExIssueProperty> {
    return this.patch(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/issue-properties/${propertyId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  async remove(
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    propertyId: string
  ): Promise<void> {
    return this.delete(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/issue-properties/${propertyId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }
}
