// services
import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";
// type
import type { IIssue, IIssueActivity, IIssueComment, IIssueLabels, IIssueViewOptions } from "types";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

class ProjectIssuesServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createIssues(workspaceSlug: string, projectId: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/`, data)
      .then((response) => {
        if (trackEvent) trackEventServices.trackIssueEvent(response.data, "ISSUE_CREATE");
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssues(workspaceSlug: string, projectId: string): Promise<IIssue[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssuesWithParams(
    workspaceSlug: string,
    projectId: string,
    queries?: any
  ): Promise<IIssue[] | { [key: string]: IIssue[] }> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieve(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueActivities(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<IIssueActivity[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/history/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueComments(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueProperties(workspaceSlug: string, projectId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addIssueToCycle(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: {
      issues: string[];
    }
  ) {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/`,
      data
    )
      .then((response) => response?.data)
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
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/${bridgeId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueProperties(workspaceSlug: string, projectId: string, data: any): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/`,
      data
    )
      .then((response) => response?.data)
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
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/` +
        `${issuePropertyId}/`,
      data
    )
      .then((response) => response?.data)
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
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/`,
      data
    )
      .then((response) => response?.data)
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
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/${commentId}/`,
      data
    )
      .then((response) => response?.data)
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
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/${commentId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueLabels(workspaceSlug: string, projectId: string): Promise<IIssueLabels[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueLabel(workspaceSlug: string, projectId: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/`, data)
      .then((response) => response?.data)
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
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/${labelId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueLabel(workspaceSlug: string, projectId: string, labelId: string): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/${labelId}/`
    )
      .then((response) => response?.data)
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
    return this.put(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/`,
      data
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackIssueEvent(response.data, "ISSUE_UPDATE");
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
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/`,
      data
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackIssueEvent(response.data, "ISSUE_UPDATE");
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssue(workspaceSlug: string, projectId: string, issuesId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issuesId}/`)
      .then((response) => {
        if (trackEvent) trackEventServices.trackIssueEvent({ issuesId }, "ISSUE_DELETE");
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkDeleteIssues(workspaceSlug: string, projectId: string, data: any): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/bulk-delete-issues/`,
      data
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackIssueBulkDeleteEvent(data);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async subIssues(workspaceSlug: string, projectId: string, issueId: string) {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/sub-issues/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addSubIssues(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: { sub_issue_ids: string[] }
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/sub-issues/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueLink(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: {
      metadata: any;
      title: string;
      url: string;
    }
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-links/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteIssueLink(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    linkId: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-links/${linkId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectIssuesServices();
