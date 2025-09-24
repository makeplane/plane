import { GitLabService as GitLabAPIService } from "@plane/etl/gitlab";
import { logger } from "@/logger";
import { IGitComment, IPullRequestDetails, IPullRequestService } from "@/types/behaviours/git";

export class GitlabIntegrationService implements IPullRequestService {
  private apiService: GitLabAPIService;
  private projectId: string;

  constructor(
    access_token: string,
    refresh_token: string,
    refresh_callback: (access_token: string, refresh_token: string) => Promise<void>,
    hostname: string = "gitlab.com",
    projectId: string
  ) {
    this.apiService = new GitLabAPIService(access_token, refresh_token, refresh_callback, hostname);
    this.projectId = projectId;
  }

  async getPullRequest(
    owner: string,
    repositoryName: string,
    pullRequestIdentifier: string
  ): Promise<IPullRequestDetails> {
    try {
      const response = await this.apiService.client.get(
        `/projects/${encodeURIComponent(this.projectId)}/merge_requests/${pullRequestIdentifier}`
      );
      const mergeRequest = response.data;

      return this.transformMergeRequestToPR(mergeRequest, owner, repositoryName);
    } catch (error) {
      logger.error(`Error fetching pull request: ${error}`);
      throw error;
    }
  }

  async getPullRequestComments(owner: string, repo: string, pullRequestIdentifier: string): Promise<IGitComment[]> {
    try {
      const comments = await this.apiService.getMergeRequestComments(
        Number(this.projectId),
        Number(pullRequestIdentifier)
      );

      return comments.map(this.transformComment);
    } catch (error) {
      logger.error(`Error fetching pull request comments: ${error}`);
      throw error;
    }
  }

  async createPullRequestComment(
    owner: string,
    repo: string,
    pullRequestIdentifier: string,
    body: string
  ): Promise<IGitComment> {
    try {
      const comment = await this.apiService.createMergeRequestComment(
        Number(this.projectId),
        Number(pullRequestIdentifier),
        body
      );

      return this.transformComment(comment);
    } catch (error) {
      logger.error(`Error creating pull request comment: ${error}`);
      throw error;
    }
  }

  async updatePullRequestComment(
    owner: string,
    repo: string,
    commentId: number | string,
    body: string
  ): Promise<IGitComment> {
    try {
      const mergeRequestIid = await this.getMergeRequestIidForComment(commentId);

      const comment = await this.apiService.updateMergeRequestComment(
        Number(this.projectId),
        mergeRequestIid,
        Number(commentId),
        body
      );

      return this.transformComment(comment);
    } catch (error) {
      logger.error(`Error updating pull request comment: ${error}`);
      throw error;
    }
  }

  private async getMergeRequestIidForComment(commentId: number | string): Promise<number> {
    try {
      const response = await this.apiService.client.get(`/projects/${this.projectId}/notes/${commentId}`);
      return response.data.noteable_iid;
    } catch (error) {
      logger.error(`Error getting merge request IID for comment: ${error}`);
      throw error;
    }
  }

  private transformMergeRequestToPR(mergeRequest: any, owner: string, repositoryName: string): IPullRequestDetails {
    return {
      title: mergeRequest.title,
      description: mergeRequest.description || "",
      number: mergeRequest.iid,
      url: mergeRequest.web_url,
      repository: {
        owner,
        name: repositoryName,
        id: mergeRequest.project_id,
      },
      state: mergeRequest.state === "opened" ? "open" : "closed",
      merged: mergeRequest.state === "merged",
      draft: mergeRequest.work_in_progress || false,
      mergeable: mergeRequest.mergeable || null,
      mergeable_state: mergeRequest.merge_status || null,
    };
  }

  private transformComment(comment: any): IGitComment {
    return {
      id: comment.id,
      body: comment.body,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user: {
        id: comment.author.id,
        username: comment.author.username,
        name: comment.author.name,
      },
    };
  }
}
