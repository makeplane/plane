import { API_BASE_URL } from "helpers/common.helper";
// services
import { APIService } from "services/api.service";
// types
import { IProjectMemberInvitation } from "types";

export class ProjectInvitationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async projectInvitations(workspaceSlug: string, projectId: string): Promise<IProjectMemberInvitation[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/invitations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async projectInvitationsWithEmail(workspaceSlug: string, projectId: string): Promise<IProjectMemberInvitation[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/invitations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectInvitation(workspaceSlug: string, projectId: string, invitationId: string): Promise<any> {
    return this.put(`/api/workspaces/${workspaceSlug}/projects/${projectId}/invitations/${invitationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectInvitation(workspaceSlug: string, projectId: string, invitationId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/invitations/${invitationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
