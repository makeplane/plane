// services
import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";
// type
import type {
  ICurrentUserResponse,
  IIssue,
  IIssueActivity,
  IIssueComment,
  IIssueLabels,
  IIssueViewOptions,
  ISubIssueResponse,
} from "types";

import getConfig from "next/config";
const { publicRuntimeConfig: { NEXT_PUBLIC_API_BASE_URL } } = getConfig();

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

class ProjectIssuesServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createIssues(
    workspaceSlug: string,
    projectId: string,
    data: any,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/`, data)
      .then((response) => {
        if (trackEvent) trackEventServices.trackIssueEvent(response.data, "ISSUE_CREATE", user);
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
    },
    user: ICurrentUserResponse | undefined
  ) {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/`,
      data
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackIssueMovedToCycleOrModuleEvent(
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
            user
          );
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
    data: Partial<IIssueComment>,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/`,
      data
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackIssueCommentEvent(response.data, "ISSUE_COMMENT_CREATE", user);
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
    data: IIssueComment,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/${commentId}/`,
      data
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackIssueCommentEvent(response.data, "ISSUE_COMMENT_UPDATE", user);
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
    commentId: string,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/${commentId}/`
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackIssueCommentEvent(
            {
              issueId,
              commentId,
            },
            "ISSUE_COMMENT_DELETE",
            user
          );
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkspaceLabels(workspaceSlug: string): Promise<IIssueLabels[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/labels/`)
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

  async createIssueLabel(
    workspaceSlug: string,
    projectId: string,
    data: any,
    user: ICurrentUserResponse | undefined
  ): Promise<IIssueLabels> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/`, data)
      .then((response: { data: IIssueLabels; [key: string]: any }) => {
        if (trackEvent)
          trackEventServices.trackIssueLabelEvent(
            {
              workSpaceId: response?.data?.workspace_detail?.id,
              workSpaceName: response?.data?.workspace_detail?.name,
              workspaceSlug,
              projectId,
              projectIdentifier: response?.data?.project_detail?.identifier,
              projectName: response?.data?.project_detail?.name,
              labelId: response?.data?.id,
              color: response?.data?.color,
            },
            "ISSUE_LABEL_CREATE",
            user
          );
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
    data: any,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/${labelId}/`,
      data
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackIssueLabelEvent(
            {
              workSpaceId: response?.data?.workspace_detail?.id,
              workSpaceName: response?.data?.workspace_detail?.name,
              workspaceSlug,
              projectId,
              projectIdentifier: response?.data?.project_detail?.identifier,
              projectName: response?.data?.project_detail?.name,
              labelId: response?.data?.id,
              color: response?.data?.color,
            },
            "ISSUE_LABEL_UPDATE",
            user
          );
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueLabel(
    workspaceSlug: string,
    projectId: string,
    labelId: string,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/${labelId}/`
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackIssueLabelEvent(
            {
              workspaceSlug,
              projectId,
            },
            "ISSUE_LABEL_DELETE",
            user
          );
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
    data: Partial<IIssue>,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/`,
      data
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackIssueEvent(response.data, "ISSUE_UPDATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssue(
    workspaceSlug: string,
    projectId: string,
    issuesId: string,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issuesId}/`)
      .then((response) => {
        if (trackEvent) trackEventServices.trackIssueEvent({ issuesId }, "ISSUE_DELETE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkDeleteIssues(
    workspaceSlug: string,
    projectId: string,
    data: any,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/bulk-delete-issues/`,
      data
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackIssueBulkDeleteEvent(data, user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async subIssues(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<ISubIssueResponse> {
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

  async uploadIssueAttachment(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    file: FormData
  ): Promise<any> {
    return this.mediaUpload(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-attachments/`,
      file
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueAttachment(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<any> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-attachments/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueAttachment(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    assetId: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-attachments/${assetId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getArchivedIssues(workspaceSlug: string, projectId: string, queries?: any): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/archived-issues/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unarchiveIssue(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/unarchive/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieveArchivedIssue(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<any> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/archived-issues/${issueId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteArchivedIssue(
    workspaceSlug: string,
    projectId: string,
    issuesId: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/archived-issues/${issuesId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectIssuesServices();
