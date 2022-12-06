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
} from "constants/api-routes";
// services
import APIService from "lib/services/api.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class ProjectServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createProject(workspace_slug: string, data: any): Promise<any> {
    return this.post(PROJECTS_ENDPOINT(workspace_slug), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
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

  async getProjects(workspace_slug: string): Promise<any> {
    return this.get(PROJECTS_ENDPOINT(workspace_slug))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProject(workspace_slug: string, project_id: string): Promise<any> {
    return this.get(PROJECT_DETAIL(workspace_slug, project_id))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProject(workspace_slug: string, project_id: string, data: any): Promise<any> {
    return this.patch(PROJECT_DETAIL(workspace_slug, project_id), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProject(workspace_slug: string, project_id: string): Promise<any> {
    return this.delete(PROJECT_DETAIL(workspace_slug, project_id))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async inviteProject(workspace_slug: string, project_id: string, data: any): Promise<any> {
    return this.post(INVITE_PROJECT(workspace_slug, project_id), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async joinProject(workspace_slug: string, data: any): Promise<any> {
    return this.post(JOIN_PROJECT(workspace_slug), data)
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

  async projectMembers(workspace_slug: string, project_id: string): Promise<any> {
    return this.get(PROJECT_MEMBERS(workspace_slug, project_id))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectMember(
    workspace_slug: string,
    project_id: string,
    memberId: string,
    data: any
  ): Promise<any> {
    return this.put(PROJECT_MEMBER_DETAIL(workspace_slug, project_id, memberId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectMember(
    workspace_slug: string,
    project_id: string,
    memberId: string
  ): Promise<any> {
    return this.delete(PROJECT_MEMBER_DETAIL(workspace_slug, project_id, memberId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async projectInvitations(workspace_slug: string, project_id: string): Promise<any> {
    return this.get(PROJECT_INVITATIONS(workspace_slug, project_id))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectInvitation(
    workspace_slug: string,
    project_id: string,
    invitation_id: string
  ): Promise<any> {
    return this.put(PROJECT_INVITATION_DETAIL(workspace_slug, project_id, invitation_id))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async deleteProjectInvitation(
    workspace_slug: string,
    project_id: string,
    invitation_id: string
  ): Promise<any> {
    return this.delete(PROJECT_INVITATION_DETAIL(workspace_slug, project_id, invitation_id))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectServices();
