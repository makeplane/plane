// api routes
import {
  CHECK_PROJECT_IDENTIFIER,
  INVITE_PROJECT,
  JOIN_PROJECT,
  PROJECTS_ENDPOINT,
  PROJECT_DETAIL,
  PROJECT_INVITATIONS,
  PROJECT_INVITATION_DETAIL,
  PROJECT_MEMBERS,
  PROJECT_MEMBER_DETAIL,
  USER_PROJECT_INVITATIONS,
  PROJECT_VIEW_ENDPOINT,
  PROJECT_MEMBER_ME,
} from "constants/api-routes";
// services
import APIService from "lib/services/api.service";
// types
import type { IProject, IProjectMember, IProjectMemberInvitation, ProjectViewTheme } from "types";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class ProjectServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createProject(workspacSlug: string, data: Partial<IProject>): Promise<IProject> {
    return this.post(PROJECTS_ENDPOINT(workspacSlug), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response;
      });
  }

  async checkProjectIdentifierAvailability(workspaceSlug: string, data: string): Promise<any> {
    return this.get(CHECK_PROJECT_IDENTIFIER(workspaceSlug), {
      params: {
        name: data,
      },
    })
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjects(workspacSlug: string): Promise<IProject[]> {
    return this.get(PROJECTS_ENDPOINT(workspacSlug))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProject(workspacSlug: string, projectId: string): Promise<IProject> {
    return this.get(PROJECT_DETAIL(workspacSlug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProject(
    workspacSlug: string,
    projectId: string,
    data: Partial<IProject>
  ): Promise<IProject> {
    return this.patch(PROJECT_DETAIL(workspacSlug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProject(workspacSlug: string, projectId: string): Promise<any> {
    return this.delete(PROJECT_DETAIL(workspacSlug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async inviteProject(workspacSlug: string, projectId: string, data: any): Promise<any> {
    return this.post(INVITE_PROJECT(workspacSlug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async joinProject(workspacSlug: string, data: any): Promise<any> {
    return this.post(JOIN_PROJECT(workspacSlug), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async joinProjects(data: any): Promise<any> {
    return this.post(USER_PROJECT_INVITATIONS, data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async projectMembers(workspacSlug: string, projectId: string): Promise<IProjectMember[]> {
    return this.get(PROJECT_MEMBERS(workspacSlug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async projectMemberMe(workspacSlug: string, projectId: string): Promise<IProjectMember> {
    return this.get(PROJECT_MEMBER_ME(workspacSlug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectMember(
    workspacSlug: string,
    projectId: string,
    memberId: string
  ): Promise<IProjectMember> {
    return this.get(PROJECT_MEMBER_DETAIL(workspacSlug, projectId, memberId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectMember(
    workspacSlug: string,
    projectId: string,
    memberId: string,
    data: Partial<IProjectMember>
  ): Promise<IProjectMember> {
    return this.put(PROJECT_MEMBER_DETAIL(workspacSlug, projectId, memberId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectMember(
    workspacSlug: string,
    projectId: string,
    memberId: string
  ): Promise<any> {
    return this.delete(PROJECT_MEMBER_DETAIL(workspacSlug, projectId, memberId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async projectInvitations(
    workspacSlug: string,
    projectId: string
  ): Promise<IProjectMemberInvitation[]> {
    return this.get(PROJECT_INVITATIONS(workspacSlug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectInvitation(
    workspacSlug: string,
    projectId: string,
    invitationId: string
  ): Promise<any> {
    return this.put(PROJECT_INVITATION_DETAIL(workspacSlug, projectId, invitationId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectInvitation(
    workspacSlug: string,
    projectId: string,
    invitationId: string
  ): Promise<any> {
    return this.delete(PROJECT_INVITATION_DETAIL(workspacSlug, projectId, invitationId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async setProjectView(
    workspacSlug: string,
    projectId: string,
    data: ProjectViewTheme
  ): Promise<any> {
    await this.post(PROJECT_VIEW_ENDPOINT(workspacSlug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectServices();
