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
} from "constants/api-routes";
// services
import APIService from "lib/services/api.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class WorkspaceService extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async userWorkspaces(): Promise<any> {
    return this.get(USER_WORKSPACES)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createWorkspace(data: any): Promise<any> {
    return this.post(WORKSPACES_ENDPOINT, data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspace(workspace_slug: string, data: any): Promise<any> {
    return this.patch(WORKSPACE_DETAIL(workspace_slug), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async deleteWorkspace(workspace_slug: string): Promise<any> {
    return this.delete(WORKSPACE_DETAIL(workspace_slug))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async inviteWorkspace(workspace_slug: string, data: any): Promise<any> {
    return this.post(INVITE_WORKSPACE(workspace_slug), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async joinWorkspace(workspace_slug: string, InvitationId: string, data: any): Promise<any> {
    return this.post(JOIN_WORKSPACE(workspace_slug, InvitationId), data, {
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

  async userWorkspaceInvitations(): Promise<any> {
    return this.get(USER_WORKSPACE_INVITATIONS)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async workspaceMembers(workspace_slug: string): Promise<any> {
    return this.get(WORKSPACE_MEMBERS(workspace_slug))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async updateWorkspaceMember(workspace_slug: string, memberId: string): Promise<any> {
    return this.put(WORKSPACE_MEMBER_DETAIL(workspace_slug, memberId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async deleteWorkspaceMember(workspace_slug: string, memberId: string): Promise<any> {
    return this.delete(WORKSPACE_MEMBER_DETAIL(workspace_slug, memberId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async workspaceInvitations(workspace_slug: string): Promise<any> {
    return this.get(WORKSPACE_INVITATIONS(workspace_slug))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkspaceInvitation(invitation_id: string): Promise<any> {
    return this.get(USER_WORKSPACE_INVITATION(invitation_id), { headers: {} })
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspaceInvitation(workspace_slug: string, invitation_id: string): Promise<any> {
    return this.put(WORKSPACE_INVITATION_DETAIL(workspace_slug, invitation_id))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async deleteWorkspaceInvitations(workspace_slug: string, invitation_id: string): Promise<any> {
    return this.delete(WORKSPACE_INVITATION_DETAIL(workspace_slug, invitation_id))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new WorkspaceService();
