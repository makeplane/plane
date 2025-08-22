import { APIService } from "@/services/api.service";
// types
import { ClientOptions, ExIssueType } from "@/types";

export class IssueTypeService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async fetch(
    workspaceSlug: string,
    projectId: string
  ): Promise<ExIssueType[]> {
    return this.get(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  async fetchById(
    workspaceSlug: string,
    projectId: string,
    typeId: string
  ): Promise<ExIssueType> {
    return this.get(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    data: Partial<ExIssueType>
  ): Promise<ExIssueType> {
    return this.post(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`,
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
    data: Partial<ExIssueType>
  ): Promise<ExIssueType> {
    return this.patch(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/`,
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
    typeId: string
  ): Promise<void> {
    return this.delete(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }
}
