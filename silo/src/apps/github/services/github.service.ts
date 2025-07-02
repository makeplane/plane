import { AppAuthParams, createGithubService, GithubApiProps, GithubService as GithubAPIService, GithubIssueComment } from "@plane/etl/github";
import { IGitComment, IPullRequestDetails, IPullRequestService } from "@/types/behaviours/git";

/**
 * Service connected with octokit and facilitating github data
 */
export class GithubIntegrationService implements IPullRequestService {
  private apiService: GithubAPIService;

  /**
   * Constructor
   * @param params - The parameters
   */
  constructor(params: AppAuthParams) {
    this.apiService = createGithubService(params.appId, params.privateKey, params.installationId, params.baseGithubUrl);
  }

  /**
   * Get a pull request
   * @param owner - The owner of the repository
   * @param repo - The repository name
   * @param pullRequestIdentifier - The pull request identifier
   * @returns The pull request details
   */
  async getPullRequest(owner: string, repo: string, pullRequestIdentifier: string): Promise<IPullRequestDetails> {
    const pullRequest = await this.apiService.client.pulls.get({
      owner,
      repo,
      pull_number: Number(pullRequestIdentifier),
    });

    return {
      title: pullRequest.data.title,
      description: pullRequest.data.body || "",
      number: pullRequest.data.number,
      url: pullRequest.data.html_url,
      state: pullRequest.data.state,
      merged: pullRequest.data.merged,
      draft: pullRequest.data.draft || false,
      mergeable: pullRequest.data.mergeable,
      mergeable_state: pullRequest.data.mergeable_state,
      repository: {
        owner,
        name: repo,
        id: pullRequest.data.number,
      },
    }
  }

  /**
   * Create a pull request comment
   * @param owner - The owner of the repository
   * @param repo - The repository name
   * @param pullRequestIdentifier - The pull request identifier
   * @param body - The body of the comment
   * @returns The comment
   */
  async createPullRequestComment(owner: string, repo: string, pullRequestIdentifier: string, body: string): Promise<IGitComment> {
    const comment = await this.apiService.client.issues.createComment({
      owner,
      repo,
      issue_number: Number(pullRequestIdentifier),
      body,
    });

    return this.transformComment(comment.data);
  }

  /**
   * Get pull request comments
   * @param owner - The owner of the repository
   * @param repo - The repository name
   * @param pullRequestIdentifier - The pull request identifier
   * @returns The comments
   */
  async getPullRequestComments(owner: string, repo: string, pullRequestIdentifier: string): Promise<IGitComment[]> {
    const comments = await this.apiService.client.issues.listComments({
      owner,
      repo,
      issue_number: Number(pullRequestIdentifier),
    });

    if (comments.data.length === 0) {
      return [];
    }

    return comments.data.map(this.transformComment);
  }

  /**
   * Update a pull request comment
   * @param owner - The owner of the repository
   * @param repo - The repository name
   * @param commentId - The comment identifier
   * @param body - The body of the comment
   * @returns The comment
   */
  async updatePullRequestComment(owner: string, repo: string, commentId: string, body: string): Promise<IGitComment> {
    const comment = await this.apiService.client.issues.updateComment({
      owner,
      repo,
      comment_id: Number(commentId),
      body,
    });

    return this.transformComment(comment.data);
  }

  /**
   * Transform a comment
   * @param comment - The comment
   * @returns The transformed comment
   */
  private transformComment(comment: GithubIssueComment): IGitComment {
    return {
      id: comment.id,
      body: comment.body || "",
      created_at: comment.created_at,
      user: {
        id: comment.user?.id || "",
        login: comment.user?.login || "",
        name: comment.user?.name || "",
      },
    };
  }
}
