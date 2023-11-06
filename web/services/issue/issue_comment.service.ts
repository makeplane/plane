import { APIService } from "services/api.service";
import { TrackEventService } from "services/track_event.service";
// types
import { IIssueComment, IUser } from "types";
// helper
import { API_BASE_URL } from "helpers/common.helper";

const trackEventService = new TrackEventService();

export class IssueCommentService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getIssueComments(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/`)
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
    user: IUser | undefined
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/`, data)
      .then((response) => {
        trackEventService.trackIssueCommentEvent(response.data, "ISSUE_COMMENT_CREATE", user);
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
    data: Partial<IIssueComment>,
    user: IUser | undefined
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/${commentId}/`,
      data
    )
      .then((response) => {
        trackEventService.trackIssueCommentEvent(response.data, "ISSUE_COMMENT_UPDATE", user);
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
    user: IUser | undefined
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/${commentId}/`
    )
      .then((response) => {
        trackEventService.trackIssueCommentEvent(
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
}
