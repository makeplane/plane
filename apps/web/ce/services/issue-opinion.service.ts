import type { TIssueOpinion, TIssueOpinionByActivityMap, TIssueOpinionCreate } from "@plane/types";
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

// Helper to cast the axios response data to the expected type
function getData<T>(response: { data: T }): T {
  return response.data;
}

export class IssueOpinionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private activityUrl(slug: string, projectId: string, issueId: string, activityId: string): string {
    return `/api/workspaces/${slug}/projects/${projectId}/issues/${issueId}/activities/${activityId}/opinion/`;
  }

  /** GET opinion on a specific activity row (returns null if none) */
  async getOpinion(
    slug: string,
    projectId: string,
    issueId: string,
    activityId: string
  ): Promise<TIssueOpinion | null> {
    return (this.get(this.activityUrl(slug, projectId, issueId, activityId)) as Promise<{ data: TIssueOpinion }>)
      .then((res) => res?.data ?? null)
      .catch((err: { response?: { status: number; data: unknown } }) => {
        if (err?.response?.status === 404 || err?.response?.status === 204) return null;
        throw err?.response?.data;
      });
  }

  /** POST/upsert opinion on a specific activity row */
  async upsertOpinion(
    slug: string,
    projectId: string,
    issueId: string,
    activityId: string,
    data: TIssueOpinionCreate
  ): Promise<TIssueOpinion> {
    return (this.post(this.activityUrl(slug, projectId, issueId, activityId), data) as Promise<{ data: TIssueOpinion }>)
      .then(getData)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  /** DELETE opinion */
  async deleteOpinion(
    slug: string,
    projectId: string,
    issueId: string,
    activityId: string,
    opinionId: string
  ): Promise<void> {
    return (
      this.delete(`${this.activityUrl(slug, projectId, issueId, activityId)}${opinionId}/`) as Promise<{ data: void }>
    )
      .then(getData)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  /** GET all opinions for an issue, keyed by activityId (for batch loading) */
  async listOpinionsForIssue(slug: string, projectId: string, issueId: string): Promise<TIssueOpinionByActivityMap> {
    return (
      this.get(`/api/workspaces/${slug}/projects/${projectId}/issues/${issueId}/activity-opinions/`) as Promise<{
        data: TIssueOpinionByActivityMap;
      }>
    )
      .then((res) => res?.data ?? {})
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }
}

export const issueOpinionService = new IssueOpinionService();
