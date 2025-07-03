// types
import { API_BASE_URL } from "@plane/constants";
import {
  EIssueServiceType,
  TIssueParams,
  type IIssueDisplayProperties,
  type TBulkOperationsPayload,
  type TIssue,
  type TIssueActivity,
  type TIssueLink,
  type TIssueServiceType,
  type TIssuesResponse,
  type TIssueSubIssues,
} from "@plane/types";
// helpers
import { getIssuesShouldFallbackToServer } from "@plane/utils";
import { persistence } from "@/local-db/storage.sqlite";
// services

import { addIssuesBulk, deleteIssueFromLocal, updateIssue } from "@/local-db/utils/load-issues";
import { APIService } from "@/services/api.service";

export class IssueService extends APIService {
  private serviceType: TIssueServiceType;

  constructor(serviceType: TIssueServiceType = EIssueServiceType.ISSUES) {
    super(API_BASE_URL);
    this.serviceType = serviceType;
  }

  async createIssue(workspaceSlug: string, projectId: string, data: Partial<TIssue>): Promise<TIssue> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssuesFromServer(
    workspaceSlug: string,
    projectId: string,
    queries?: any,
    config = {}
  ): Promise<TIssuesResponse> {
    const path =
      (queries.expand as string)?.includes("issue_relation") && !queries.group_by
        ? `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}-detail/`
        : `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/`;
    return this.get(
      path,
      {
        params: queries,
      },
      config
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssuesForSync(
    workspaceSlug: string,
    projectId: string,
    queries?: any,
    config = {}
  ): Promise<TIssuesResponse> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/v2/${this.serviceType}/`,
      { params: queries },
      config
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssues(
    workspaceSlug: string,
    projectId: string,
    queries?: Partial<Record<TIssueParams, string | boolean>>,
    config = {}
  ): Promise<TIssuesResponse> {
    if (getIssuesShouldFallbackToServer(queries) || this.serviceType !== EIssueServiceType.ISSUES) {
      return await this.getIssuesFromServer(workspaceSlug, projectId, queries, config);
    }

    const response = await persistence.getIssues(workspaceSlug, projectId, queries, config);
    return response as TIssuesResponse;
  }

  async getDeletedIssues(workspaceSlug: string, projectId: string, queries?: any): Promise<TIssuesResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/deleted-issues/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssuesWithParams(
    workspaceSlug: string,
    projectId: string,
    queries?: any
  ): Promise<TIssue[] | { [key: string]: TIssue[] }> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieve(workspaceSlug: string, projectId: string, issueId: string, queries?: any): Promise<TIssue> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/`, {
      params: queries,
    })
      .then((response) => {
        // skip issue update when the service type is epic
        if (response.data && this.serviceType === EIssueServiceType.ISSUES) {
          updateIssue({ ...response.data, is_local_update: 1 });
        }
        // add is_epic flag when the service type is epic
        if (response.data && this.serviceType === EIssueServiceType.EPICS) {
          response.data.is_epic = true;
        }
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieveIssues(workspaceSlug: string, projectId: string, issueIds: string[]): Promise<TIssue[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/list/`, {
      params: { issues: issueIds.join(",") },
    })
      .then((response) => {
        if (response?.data && Array.isArray(response?.data) && this.serviceType === EIssueServiceType.ISSUES) {
          addIssuesBulk(response.data);
        }
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueActivities(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/history/`)
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
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/`, data)
      .then((response) => response?.data)
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
    data: {
      related_list: Array<{
        relation_type: "duplicate" | "relates_to" | "blocked_by";
        related_issue: string;
      }>;
      relation?: "blocking" | null;
    }
  ) {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/issue-relation/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteIssueRelation(workspaceSlug: string, projectId: string, issueId: string, relationId: string) {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/issue-relation/${relationId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getIssueDisplayProperties(workspaceSlug: string, projectId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-display-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateIssueDisplayProperties(
    workspaceSlug: string,
    projectId: string,
    data: IIssueDisplayProperties
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-display-properties/`, {
      properties: data,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchIssue(workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssue(workspaceSlug: string, projectId: string, issuesId: string): Promise<any> {
    if (this.serviceType === EIssueServiceType.ISSUES) {
      deleteIssueFromLocal(issuesId);
    }
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issuesId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateIssueDates(
    workspaceSlug: string,
    projectId: string,
    updates: { id: string; start_date?: string; target_date?: string }[]
  ): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-dates/`, { updates })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async subIssues(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    queries?: Partial<Record<TIssueParams, string | boolean>>
  ): Promise<TIssueSubIssues> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/${this.serviceType === EIssueServiceType.EPICS ? "issues" : "sub-issues"}/`,
      { params: queries }
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
  ): Promise<TIssueSubIssues> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/${this.serviceType === EIssueServiceType.EPICS ? "issues" : "sub-issues"}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchIssueLinks(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueLink[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/${this.serviceType === EIssueServiceType.EPICS ? "links" : "issue-links"}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createIssueLink(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssueLink>
  ): Promise<TIssueLink> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/${this.serviceType === EIssueServiceType.EPICS ? "links" : "issue-links"}/`,
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
    data: Partial<TIssueLink>
  ): Promise<TIssueLink> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/${this.serviceType === EIssueServiceType.EPICS ? "links" : "issue-links"}/${linkId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteIssueLink(workspaceSlug: string, projectId: string, issueId: string, linkId: string): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/${this.serviceType === EIssueServiceType.EPICS ? "links" : "issue-links"}/${linkId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkOperations(workspaceSlug: string, projectId: string, data: TBulkOperationsPayload): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/bulk-operation-issues/`, data)
      .then((response) => {
        if (this.serviceType === EIssueServiceType.ISSUES) {
          persistence.syncIssues(projectId);
        }
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkDeleteIssues(
    workspaceSlug: string,
    projectId: string,
    data: {
      issue_ids: string[];
    }
  ): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/bulk-delete-issues/`, data)
      .then((response) => {
        if (this.serviceType === EIssueServiceType.ISSUES) {
          persistence.syncIssues(projectId);
        }
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkArchiveIssues(
    workspaceSlug: string,
    projectId: string,
    data: {
      issue_ids: string[];
    }
  ): Promise<{
    archived_at: string;
  }> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/bulk-archive-issues/`, data)
      .then((response) => {
        if (this.serviceType === EIssueServiceType.ISSUES) {
          persistence.syncIssues(projectId);
        }
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // issue subscriptions
  async getIssueNotificationSubscriptionStatus(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<{
    subscribed: boolean;
  }> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/subscribe/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unsubscribeFromIssueNotifications(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/subscribe/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async subscribeToIssueNotifications(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/subscribe/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkSubscribeIssues(
    workspaceSlug: string,
    projectId: string,
    data: {
      issue_ids: string[];
    }
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/bulk-subscribe-issues/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueMetaFromURL(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<{
    project_identifier: string;
    sequence_id: string;
  }> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/meta/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieveWithIdentifier(
    workspaceSlug: string,
    project_identifier: string,
    issue_sequence: string,
    queries?: any
  ): Promise<TIssue> {
    return this.get(`/api/workspaces/${workspaceSlug}/work-items/${project_identifier}-${issue_sequence}/`, {
      params: queries,
    })
      .then((response) => {
        // skip issue update when the service type is epic
        if (response.data && this.serviceType === EIssueServiceType.ISSUES) {
          updateIssue({ ...response.data, is_local_update: 1 });
        }
        // add is_epic flag when the service type is epic
        if (response.data && this.serviceType === EIssueServiceType.EPICS) {
          response.data.is_epic = true;
        }
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
