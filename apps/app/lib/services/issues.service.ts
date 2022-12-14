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
  REMOVE_ISSUE_FROM_CYCLE,
  ISSUE_LABEL_DETAILS,
} from "constants/api-routes";
// services
import APIService from "lib/services/api.service";
import { IIssue, IIssueComment } from "types";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class ProjectIssuesServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createIssues(workspaceSlug: string, projectId: string, data: any): Promise<any> {
    return this.post(ISSUES_ENDPOINT(workspaceSlug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssues(workspaceSlug: string, projectId: string): Promise<any> {
    return this.get(ISSUES_ENDPOINT(workspaceSlug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssue(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.get(ISSUE_DETAIL(workspaceSlug, projectId, issueId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueActivities(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<any> {
    return this.get(ISSUE_ACTIVITIES(workspaceSlug, projectId, issueId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueComments(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.get(ISSUE_COMMENTS(workspaceSlug, projectId, issueId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueProperties(workspaceSlug: string, projectId: string): Promise<any> {
    return this.get(ISSUE_PROPERTIES_ENDPOINT(workspaceSlug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addIssueToCycle(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: {
      issue: string;
    }
  ) {
    return this.post(CYCLE_DETAIL(workspaceSlug, projectId, cycleId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeIssueFromCycle(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    bridgeId: string
  ) {
    return this.delete(REMOVE_ISSUE_FROM_CYCLE(workspaceSlug, projectId, cycleId, bridgeId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueProperties(workspaceSlug: string, projectId: string, data: any): Promise<any> {
    return this.post(ISSUE_PROPERTIES_ENDPOINT(workspaceSlug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchIssueProperties(
    workspaceSlug: string,
    projectId: string,
    issuePropertyId: string,
    data: any
  ): Promise<any> {
    return this.patch(
      ISSUE_PROPERTIES_ENDPOINT(workspaceSlug, projectId) + `${issuePropertyId}/`,
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
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: any
  ): Promise<any> {
    return this.post(ISSUE_COMMENTS(workspaceSlug, projectId, issueId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchIssueComment(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    data: IIssueComment
  ): Promise<any> {
    return this.patch(ISSUE_COMMENT_DETAIL(workspaceSlug, projectId, issueId, commentId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueComment(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string
  ): Promise<any> {
    return this.delete(ISSUE_COMMENT_DETAIL(workspaceSlug, projectId, issueId, commentId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueLabels(workspaceSlug: string, projectId: string): Promise<any> {
    return this.get(ISSUE_LABELS(workspaceSlug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueLabel(workspaceSlug: string, projectId: string, data: any): Promise<any> {
    return this.post(ISSUE_LABELS(workspaceSlug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchIssueLabel(
    workspaceSlug: string,
    projectId: string,
    labelId: string,
    data: any
  ): Promise<any> {
    return this.patch(ISSUE_LABEL_DETAILS(workspaceSlug, projectId, labelId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueLabel(workspaceSlug: string, projectId: string, labelId: string): Promise<any> {
    return this.delete(ISSUE_LABEL_DETAILS(workspaceSlug, projectId, labelId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateIssue(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: any
  ): Promise<any> {
    return this.put(ISSUE_DETAIL(workspaceSlug, projectId, issueId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchIssue(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<IIssue>
  ): Promise<any> {
    return this.patch(ISSUE_DETAIL(workspaceSlug, projectId, issueId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssue(workspaceSlug: string, projectId: string, issuesId: string): Promise<any> {
    return this.delete(ISSUE_DETAIL(workspaceSlug, projectId, issuesId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkDeleteIssues(workspaceSlug: string, projectId: string, data: any): Promise<any> {
    return this.delete(BULK_DELETE_ISSUES(workspaceSlug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkAddIssuesToCycle(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: any
  ): Promise<any> {
    return this.post(BULK_ADD_ISSUES_TO_CYCLE(workspaceSlug, projectId, cycleId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectIssuesServices();
