// types
import { API_BASE_URL } from "@plane/constants";
import type { IProjectBulkAddFormData, IProjectMember, IProjectMembership } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class ProjectMemberService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchProjectMembers(workspaceSlug: string, projectId: string): Promise<IProjectMembership[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkAddMembersToProject(
    workspaceSlug: string,
    projectId: string,
    data: IProjectBulkAddFormData
  ): Promise<IProjectMembership[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/members/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async projectMemberMe(workspaceSlug: string, projectId: string): Promise<IProjectMember> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/project-members/me/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getProjectMember(workspaceSlug: string, projectId: string, memberId: string): Promise<IProjectMember> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/members/${memberId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectMember(
    workspaceSlug: string,
    projectId: string,
    memberId: string,
    data: Partial<IProjectMember>
  ): Promise<IProjectMember> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/members/${memberId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectMember(workspaceSlug: string, projectId: string, memberId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/members/${memberId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const projectMemberService = new ProjectMemberService();

export default projectMemberService;
