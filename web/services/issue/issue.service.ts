// services
import { APIService } from "services/api.service";
import { TrackEventService } from "services/track_event.service";
// type
import type { IUser, IIssue, IIssueActivity, ISubIssueResponse } from "types";
// helper
import { API_BASE_URL } from "helpers/common.helper";

const trackEventService = new TrackEventService();

export class IssueService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createIssues(workspaceSlug: string, projectId: string, data: any, user: IUser | undefined): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/`, data)
      .then((response) => {
        trackEventService.trackIssueEvent(response.data, "ISSUE_CREATE", user as IUser);
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

  async retrieve(workspaceSlug: string, projectId: string, issueId: string): Promise<IIssue> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueActivities(workspaceSlug: string, projectId: string, issueId: string): Promise<IIssueActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/history/`)
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
    },
    user: IUser | undefined
  ) {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/`, data)
      .then((response) => {
        trackEventService.trackIssueMovedToCycleOrModuleEvent(
          {
            workspaceSlug,
            workspaceName: response?.data?.[0]?.issue_detail?.workspace_detail?.name,
            projectId,
            projectIdentifier: response?.data?.[0]?.issue_detail?.project_detail?.identifier,
            projectName: response?.data?.[0]?.issue_detail?.project_detail?.name,
            issueId: response?.data?.[0]?.issue_detail?.id,
            cycleId,
          },
          response.data.length > 1 ? "ISSUE_MOVED_TO_CYCLE_IN_BULK" : "ISSUE_MOVED_TO_CYCLE",
          user as IUser
        );
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeIssueFromCycle(workspaceSlug: string, projectId: string, cycleId: string, bridgeId: string) {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/${bridgeId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueRelation(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    user: IUser,
    data: {
      related_list: Array<{
        relation_type: "duplicate" | "relates_to" | "blocked_by";
        related_issue: string;
      }>;
      relation?: "blocking" | null;
    }
  ) {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-relation/`, data)
      .then((response) => {
        trackEventService.trackIssueRelationEvent(response.data, "ISSUE_RELATION_CREATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteIssueRelation(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationId: string,
    user: IUser
  ) {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-relation/${relationId}/`
    )
      .then((response) => {
        trackEventService.trackIssueRelationEvent(response.data, "ISSUE_RELATION_DELETE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response;
      });
  }

  async createIssueProperties(workspaceSlug: string, projectId: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/`, data)
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
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/` + `${issuePropertyId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchIssue(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<IIssue>,
    user: IUser | undefined
  ): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/`, data)
      .then((response) => {
        trackEventService.trackIssueEvent(response.data, "ISSUE_UPDATE", user as IUser);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssue(workspaceSlug: string, projectId: string, issuesId: string, user: IUser | undefined): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issuesId}/`)
      .then((response) => {
        trackEventService.trackIssueEvent({ issuesId }, "ISSUE_DELETE", user as IUser);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkDeleteIssues(workspaceSlug: string, projectId: string, data: any, user: IUser | undefined): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/bulk-delete-issues/`, data)
      .then((response) => {
        trackEventService.trackIssueBulkDeleteEvent(data, user as IUser);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async subIssues(workspaceSlug: string, projectId: string, issueId: string): Promise<ISubIssueResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/sub-issues/`)
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
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/sub-issues/`, data)
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
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-links/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateIssueLink(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    linkId: string,
    data: {
      metadata: any;
      title: string;
      url: string;
    }
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-links/${linkId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteIssueLink(workspaceSlug: string, projectId: string, issueId: string, linkId: string): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-links/${linkId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
