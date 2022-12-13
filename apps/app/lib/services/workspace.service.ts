// api routes
import {
  USER_WORKSPACES,
  WORKSPACES_ENDPOINT,
  INVITE_WORKSPACE,
  WORKSPACE_DETAIL,
  JOIN_WORKSPACE,
  WORKSPACE_MEMBERS,
  WORKSPACE_MEMBER_DETAIL,
  WORKSPACE_INVITATIONS,
  WORKSPACE_INVITATION_DETAIL,
  USER_WORKSPACE_INVITATION,
  USER_WORKSPACE_INVITATIONS,
  LAST_ACTIVE_WORKSPACE_AND_PROJECTS,
} from "constants/api-routes";
// services
import APIService from "lib/services/api.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

// types
import {
  ILastActiveWorkspaceDetails,
  IWorkspace,
  IWorkspaceMember,
  IWorkspaceMemberInvitation,
} from "types";

class WorkspaceService extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async userWorkspaces(): Promise<IWorkspace[]> {
    return this.get(USER_WORKSPACES)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createWorkspace(data: Partial<IWorkspace>): Promise<IWorkspace> {
    return this.post(WORKSPACES_ENDPOINT, data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspace(workspaceSlug: string, data: Partial<IWorkspace>): Promise<IWorkspace> {
    return this.patch(WORKSPACE_DETAIL(workspaceSlug), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkspace(workspaceSlug: string): Promise<any> {
    return this.delete(WORKSPACE_DETAIL(workspaceSlug))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async inviteWorkspace(workspaceSlug: string, data: any): Promise<any> {
    return this.post(INVITE_WORKSPACE(workspaceSlug), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async joinWorkspace(workspaceSlug: string, InvitationId: string, data: any): Promise<any> {
    return this.post(JOIN_WORKSPACE(workspaceSlug, InvitationId), data, {
      headers: {},
    })
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async joinWorkspaces(data: any): Promise<any> {
    return this.post(USER_WORKSPACE_INVITATIONS, data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getLastActiveWorkspaceAndProjects(): Promise<ILastActiveWorkspaceDetails> {
    return this.get(LAST_ACTIVE_WORKSPACE_AND_PROJECTS)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async userWorkspaceInvitations(): Promise<IWorkspaceMemberInvitation[]> {
    return this.get(USER_WORKSPACE_INVITATIONS)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async workspaceMembers(workspaceSlug: string): Promise<IWorkspaceMember[]> {
    return this.get(WORKSPACE_MEMBERS(workspaceSlug))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspaceMember(
    workspaceSlug: string,
    memberId: string,
    data: Partial<IWorkspaceMember>
  ): Promise<IWorkspaceMember> {
    return this.put(WORKSPACE_MEMBER_DETAIL(workspaceSlug, memberId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkspaceMember(workspaceSlug: string, memberId: string): Promise<any> {
    return this.delete(WORKSPACE_MEMBER_DETAIL(workspaceSlug, memberId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async workspaceInvitations(workspaceSlug: string): Promise<IWorkspaceMemberInvitation[]> {
    return this.get(WORKSPACE_INVITATIONS(workspaceSlug))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkspaceInvitation(invitationId: string): Promise<IWorkspaceMemberInvitation> {
    return this.get(USER_WORKSPACE_INVITATION(invitationId), { headers: {} })
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspaceInvitation(
    workspaceSlug: string,
    invitationId: string
  ): Promise<IWorkspaceMemberInvitation> {
    return this.put(WORKSPACE_INVITATION_DETAIL(workspaceSlug, invitationId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkspaceInvitations(workspaceSlug: string, invitationId: string): Promise<any> {
    return this.delete(WORKSPACE_INVITATION_DETAIL(workspaceSlug, invitationId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new WorkspaceService();
