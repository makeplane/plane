// api routes
import {
  ISSUES_ENDPOINT,
  ISSUE_DETAIL,
  ISSUE_ACTIVITIES,
  ISSUE_COMMENTS,
  ISSUE_COMMENT_DETAIL,
  ISSUE_PROPERTIES_ENDPOINT,
  CYCLE_DETAIL,
  ISSUE_LABELS,
  BULK_DELETE_ISSUES,
  BULK_ADD_ISSUES_TO_CYCLE,
} from "constants/api-routes";
// services
import APIService from "lib/services/api.service";
import { IIssue, IIssueComment } from "types";

class ProjectIssuesServices extends APIService {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createIssues(workspace_slug: string, projectId: string, data: any): Promise<any> {
    return this.post(ISSUES_ENDPOINT(workspace_slug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssues(workspace_slug: string, projectId: string): Promise<any> {
    return this.get(ISSUES_ENDPOINT(workspace_slug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssue(workspace_slug: string, projectId: string, issueId: string): Promise<any> {
    return this.get(ISSUE_DETAIL(workspace_slug, projectId, issueId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueActivities(
    workspace_slug: string,
    projectId: string,
    issueId: string
  ): Promise<any> {
    return this.get(ISSUE_ACTIVITIES(workspace_slug, projectId, issueId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueComments(workspace_slug: string, projectId: string, issueId: string): Promise<any> {
    return this.get(ISSUE_COMMENTS(workspace_slug, projectId, issueId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueProperties(workspace_slug: string, projectId: string): Promise<any> {
    return this.get(ISSUE_PROPERTIES_ENDPOINT(workspace_slug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addIssueToSprint(
    workspace_slug: string,
    projectId: string,
    cycleId: string,
    data: {
      issue: string;
    }
  ) {
    return this.post(CYCLE_DETAIL(workspace_slug, projectId, cycleId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueProperties(workspace_slug: string, projectId: string, data: any): Promise<any> {
    return this.post(ISSUE_PROPERTIES_ENDPOINT(workspace_slug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchIssueProperties(
    workspace_slug: string,
    projectId: string,
    issuePropertyId: string,
    data: any
  ): Promise<any> {
    return this.patch(
      ISSUE_PROPERTIES_ENDPOINT(workspace_slug, projectId) + `${issuePropertyId}/`,
      data
    )

      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueComment(
    workspace_slug: string,
    projectId: string,
    issueId: string,
    data: any
  ): Promise<any> {
    return this.post(ISSUE_COMMENTS(workspace_slug, projectId, issueId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchIssueComment(
    workspace_slug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    data: IIssueComment
  ): Promise<any> {
    return this.patch(ISSUE_COMMENT_DETAIL(workspace_slug, projectId, issueId, commentId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueComment(
    workspace_slug: string,
    projectId: string,
    issueId: string,
    commentId: string
  ): Promise<any> {
    return this.delete(ISSUE_COMMENT_DETAIL(workspace_slug, projectId, issueId, commentId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueLabels(workspace_slug: string, projectId: string): Promise<any> {
    return this.get(ISSUE_LABELS(workspace_slug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueLabel(workspace_slug: string, projectId: string, data: any): Promise<any> {
    return this.post(ISSUE_LABELS(workspace_slug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateIssue(
    workspace_slug: string,
    projectId: string,
    issueId: string,
    data: any
  ): Promise<any> {
    return this.put(ISSUE_DETAIL(workspace_slug, projectId, issueId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchIssue(
    workspace_slug: string,
    projectId: string,
    issueId: string,
    data: Partial<IIssue>
  ): Promise<any> {
    return this.patch(ISSUE_DETAIL(workspace_slug, projectId, issueId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssue(workspace_slug: string, projectId: string, issuesId: string): Promise<any> {
    return this.delete(ISSUE_DETAIL(workspace_slug, projectId, issuesId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkDeleteIssues(workspace_slug: string, projectId: string, data: any): Promise<any> {
    return this.delete(BULK_DELETE_ISSUES(workspace_slug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkAddIssuesToCycle(
    workspace_slug: string,
    projectId: string,
    cycleId: string,
    data: any
  ): Promise<any> {
    return this.post(BULK_ADD_ISSUES_TO_CYCLE(workspace_slug, projectId, cycleId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectIssuesServices();
