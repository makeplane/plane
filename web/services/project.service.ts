// services
import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";

// types
import type {
  GithubRepositoriesResponse,
  ICurrentUserResponse,
  IProject,
  IProjectBulkInviteFormData,
  IProjectMember,
  IProjectMemberInvitation,
  ISearchIssueResponse,
  ProjectPreferences,
  ProjectViewTheme,
  TProjectIssuesSearchParams,
} from "types";

import getConfig from "next/config";
const { publicRuntimeConfig: { NEXT_PUBLIC_API_BASE_URL } } = getConfig();

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

export class ProjectServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createProject(
    workspaceSlug: string,
    data: Partial<IProject>,
    user: ICurrentUserResponse | undefined
  ): Promise<IProject> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/`, data)
      .then((response) => {
        if (trackEvent) trackEventServices.trackProjectEvent(response.data, "CREATE_PROJECT", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response;
      });
  }

  async checkProjectIdentifierAvailability(workspaceSlug: string, data: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/project-identifiers`, {
      params: {
        name: data,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjects(
    workspaceSlug: string,
    params: {
      is_favorite: "all" | boolean;
    }
  ): Promise<IProject[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProject(workspaceSlug: string, projectId: string): Promise<IProject> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProject(
    workspaceSlug: string,
    projectId: string,
    data: Partial<IProject>,
    user: ICurrentUserResponse | undefined
  ): Promise<IProject> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/`, data)
      .then((response) => {
        if (trackEvent) trackEventServices.trackProjectEvent(response.data, "UPDATE_PROJECT", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProject(
    workspaceSlug: string,
    projectId: string,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/`)
      .then((response) => {
        if (trackEvent) trackEventServices.trackProjectEvent({ projectId }, "DELETE_PROJECT", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async inviteProject(
    workspaceSlug: string,
    projectId: string,
    data: IProjectBulkInviteFormData,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/members/add/`, data)
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackProjectEvent(
            {
              workspaceId: response?.data?.workspace?.id,
              workspaceSlug,
              projectId,
              projectName: response?.data?.project?.name,
              memberEmail: response?.data?.member?.email,
            },
            "PROJECT_MEMBER_INVITE",
            user
          );
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async joinProject(workspaceSlug: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/join/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async leaveProject(
    workspaceSlug: string,
    projectId: string,
    user: ICurrentUserResponse
  ): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/members/leave/`)
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackProjectEvent(
            "PROJECT_MEMBER_LEAVE",
            {
              workspaceSlug,
              projectId,
              ...response?.data,
            },
            user
          );
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async joinProjects(data: any): Promise<any> {
    return this.post("/api/users/me/invitations/projects/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async projectMembers(workspaceSlug: string, projectId: string): Promise<IProjectMember[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/project-members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async projectMembersWithEmail(
    workspaceSlug: string,
    projectId: string
  ): Promise<IProjectMember[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/members/`)
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

  async getProjectMember(
    workspaceSlug: string,
    projectId: string,
    memberId: string
  ): Promise<IProjectMember> {
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
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/members/${memberId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectMember(
    workspaceSlug: string,
    projectId: string,
    memberId: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/members/${memberId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async projectInvitations(
    workspaceSlug: string,
    projectId: string
  ): Promise<IProjectMemberInvitation[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/invitations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async projectInvitationsWithEmail(
    workspaceSlug: string,
    projectId: string
  ): Promise<IProjectMemberInvitation[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/invitations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectInvitation(
    workspaceSlug: string,
    projectId: string,
    invitationId: string
  ): Promise<any> {
    return this.put(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/invitations/${invitationId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectInvitation(
    workspaceSlug: string,
    projectId: string,
    invitationId: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/invitations/${invitationId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async setProjectView(
    workspaceSlug: string,
    projectId: string,
    data: {
      view_props?: ProjectViewTheme;
      default_props?: ProjectViewTheme;
      preferences?: ProjectPreferences;
      sort_order?: number;
    }
  ): Promise<any> {
    await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/project-views/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getGithubRepositories(url: string): Promise<GithubRepositoriesResponse> {
    return this.getWithoutBase(url)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async syncGithubRepository(
    workspaceSlug: string,
    projectId: string,
    workspaceIntegrationId: string,
    data: {
      name: string;
      owner: string;
      repository_id: string;
      url: string;
    }
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workspace-integrations/${workspaceIntegrationId}/github-repository-sync/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectGithubRepository(
    workspaceSlug: string,
    projectId: string,
    integrationId: string
  ): Promise<any> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workspace-integrations/${integrationId}/github-repository-sync/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addProjectToFavorites(
    workspaceSlug: string,
    data: {
      project: string;
    }
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/user-favorite-projects/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeProjectFromFavorites(workspaceSlug: string, projectId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/user-favorite-projects/${projectId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async projectIssuesSearch(
    workspaceSlug: string,
    projectId: string,
    params: TProjectIssuesSearchParams
  ): Promise<ISearchIssueResponse[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/search-issues/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectServices();
