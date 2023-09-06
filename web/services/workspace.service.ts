// services
import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";

import getConfig from "next/config";
const { publicRuntimeConfig: { NEXT_PUBLIC_API_BASE_URL } } = getConfig();

// types
import {
  IWorkspace,
  IWorkspaceMember,
  IWorkspaceMemberInvitation,
  ILastActiveWorkspaceDetails,
  IWorkspaceSearchResults,
  IProductUpdateResponse,
  ICurrentUserResponse,
  IWorkspaceBulkInviteFormData,
  IWorkspaceViewProps,
} from "types";

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

class WorkspaceService extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async userWorkspaces(): Promise<IWorkspace[]> {
    return this.get("/api/users/me/workspaces/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkspace(workspaceSlug: string): Promise<IWorkspace> {
    return this.get(`/api/workspaces/${workspaceSlug}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createWorkspace(
    data: Partial<IWorkspace>,
    user: ICurrentUserResponse | undefined
  ): Promise<IWorkspace> {
    return this.post("/api/workspaces/", data)
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackWorkspaceEvent(response.data, "CREATE_WORKSPACE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspace(
    workspaceSlug: string,
    data: Partial<IWorkspace>,
    user: ICurrentUserResponse | undefined
  ): Promise<IWorkspace> {
    return this.patch(`/api/workspaces/${workspaceSlug}/`, data)
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackWorkspaceEvent(response.data, "UPDATE_WORKSPACE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkspace(
    workspaceSlug: string,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/`)
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackWorkspaceEvent({ workspaceSlug }, "DELETE_WORKSPACE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async inviteWorkspace(
    workspaceSlug: string,
    data: IWorkspaceBulkInviteFormData,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/invite/`, data)
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackWorkspaceEvent(response.data, "WORKSPACE_USER_INVITE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async joinWorkspace(
    workspaceSlug: string,
    invitationId: string,
    data: any,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.post(
      `/api/users/me/invitations/workspaces/${workspaceSlug}/${invitationId}/join/`,
      data,
      {
        headers: {},
      }
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackWorkspaceEvent(
            response.data,
            "WORKSPACE_USER_INVITE_ACCEPT",
            user
          );
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async joinWorkspaces(data: any): Promise<any> {
    return this.post("/api/users/me/invitations/workspaces/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getLastActiveWorkspaceAndProjects(): Promise<ILastActiveWorkspaceDetails> {
    return this.get("/api/users/last-visited-workspace/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async userWorkspaceInvitations(): Promise<IWorkspaceMemberInvitation[]> {
    return this.get("/api/users/me/invitations/workspaces/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async workspaceMembers(workspaceSlug: string): Promise<IWorkspaceMember[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/workspace-members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async workspaceMembersWithEmail(workspaceSlug: string): Promise<IWorkspaceMember[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async workspaceMemberMe(workspaceSlug: string): Promise<IWorkspaceMember> {
    return this.get(`/api/workspaces/${workspaceSlug}/workspace-members/me/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateWorkspaceView(
    workspaceSlug: string,
    data: { view_props: IWorkspaceViewProps }
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/workspace-views/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspaceMember(
    workspaceSlug: string,
    memberId: string,
    data: Partial<IWorkspaceMember>
  ): Promise<IWorkspaceMember> {
    return this.patch(`/api/workspaces/${workspaceSlug}/members/${memberId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkspaceMember(workspaceSlug: string, memberId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/members/${memberId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async workspaceInvitations(workspaceSlug: string): Promise<IWorkspaceMemberInvitation[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/invitations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async workspaceInvitationsWithEmail(
    workspaceSlug: string
  ): Promise<IWorkspaceMemberInvitation[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/invitations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkspaceInvitation(invitationId: string): Promise<IWorkspaceMemberInvitation> {
    return this.get(`/api/users/me/invitations/${invitationId}/`, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkspaceInvitations(workspaceSlug: string, invitationId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/invitations/${invitationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async workspaceSlugCheck(slug: string): Promise<any> {
    return this.get(`/api/workspace-slug-check/?slug=${slug}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async searchWorkspace(
    workspaceSlug: string,
    params: {
      project_id?: string;
      search: string;
      workspace_search: boolean;
    }
  ): Promise<IWorkspaceSearchResults> {
    return this.get(`/api/workspaces/${workspaceSlug}/search/`, {
      params,
    })
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async getProductUpdates(): Promise<IProductUpdateResponse[]> {
    return this.get("/api/release-notes/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new WorkspaceService();
