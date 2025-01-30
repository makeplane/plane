import { GithubApiProps, GithubIssue } from "../types";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

// Service connected with octokit and facilitating github data
export class GithubService {
  client: Octokit;

  constructor(params: GithubApiProps) {
    if (params.forUser) {
      this.client = new Octokit({
        auth: params.accessToken,
      });
    } else {
      const decodedKey = Buffer.from(params.privateKey, "base64").toString("ascii");

      this.client = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: params.appId,
          privateKey: decodedKey,
          installationId: params.installationId,
        },
      });
    }
  }

  async getUser() {
    const user = await this.client.users.getAuthenticated();
    return user.data;
  }

  async getAccessTokens(installationId: number) {
    const token = await this.client.apps.createInstallationAccessToken({
      installation_id: installationId,
    });

    return token;
  }

  async getRepos() {
    const pageRepos = this.client.paginate.iterator(this.client.apps.listReposAccessibleToInstallation);
    const data: any = [];

    for await (const { data: repos } of pageRepos) {
      // @ts-ignore
      data.push(...repos);
    }

    return data;
  }

  async createIssue(issue: GithubIssue) {
    return this.client.issues.create(issue);
  }

  async updateIssue(id: number, issue: GithubIssue) {
    return this.client.issues.update({
      issue_number: id,
      ...issue,
    });
  }

  async createIssueComment(owner: string, repo: string, issue_number: number, body: string) {
    return this.client.issues.createComment({
      owner,
      repo,
      issue_number,
      body,
    });
  }

  async getAttachment(url: string) {
    try {
      // use the github api to download the file
      const response = await this.client.request({
        method: "GET",
        url,
      });

      return response.data;
    } catch (e) {
      console.error("Assest download failed", e);
    }
    return undefined;
  }

  async updateIssueComment(owner: string, repo: string, comment_id: number, body: string) {
    return this.client.issues.updateComment({
      owner,
      repo,
      comment_id,
      body,
    });
  }

  async getReposForInstallation(installationId: number) {
    const pageRepos = this.client.paginate.iterator(this.client.apps.listReposAccessibleToInstallation, {
      installation_id: installationId,
    });

    const data: any = [];

    for await (const { data: repos } of pageRepos) {
      // @ts-ignore
      data.push(...repos);
    }

    return data;
  }

  async getPullRequest(owner: string, repo: string, pull_number: number) {
    return this.client.pulls.get({
      owner,
      repo,
      pull_number,
    });
  }

  async getPullRequestWithClosingReference(
    owner: string,
    repo: string,
    pull_number: number
  ): Promise<PRClosingReferences> {
    const issues = this.client.graphql<PRClosingReferences>({
      query: `
				query($owner: String!, $repo: String!, $pull_number: Int!) {
					repository(owner: $owner, name: $repo) {
					pullRequest(number: $pull_number) {
							id
							closingIssuesReferences (first: 50) {
								edges {
									node {
										id
										databaseId
										body
										number
										title
									}
								}
							}
					  }
					}
				}
			`,
      owner,
      repo,
      pull_number,
    });

    return issues;
  }

  async getPullRequestComments(owner: string, repo: string, pull_number: number) {
    return this.client.issues.listComments({
      owner,
      repo,
      issue_number: pull_number,
    });
  }

  async updatePullRequestComment(owner: string, repo: string, comment_id: number, body: string) {
    return this.client.issues.updateComment({
      owner,
      repo,
      comment_id,
      body,
    });
  }

  async createPullRequestComment(owner: string, repo: string, pull_number: number, body: string) {
    return this.client.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body,
    });
  }

  async searchRepos(query: string) {
    return this.client.search.repos({
      q: query,
    });
  }

  async getIssues(owner: string, repo: string) {
    return this.client.issues.listForRepo({
      owner,
      repo,
    });
  }

  async getIssue(owner: string, repo: string, issue_number: number) {
    return this.client.issues.get({
      owner,
      repo,
      issue_number,
    });
  }

  async getBodyHtml(owner: string, repo: string, issueNumber: number) {
    const query = `
      query GetIssueBody($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $number) {
            bodyHTML
          }
        }
      }
    `;

    const variables = {
      owner,
      repo,
      number: issueNumber
    };

    const response = await this.client.graphql<{
      repository: {
        issue: {
          bodyHTML: string | null;
        };
      };
    }>(query, variables);
    return response.repository.issue.bodyHTML || null;
  }

  async getCommentHtml(owner: string, repo: string, issueNumber: string, commentId: number) {
    const response = await this.client.rest.issues.getComment({
      owner,
      repo,
      comment_id: commentId,
      mediaType: {
        format: "html"
      }
    });

    return response.data.body_html || null;
  }

  async getLabels(owner: string, repo: string) {
    return this.client.issues.listLabelsForRepo({
      owner,
      repo,
    });
  }

  async getProjects(owner: string, repo: string) {
    return this.client.projects.listForRepo({
      owner,
      repo,
    });
  }

  async getProjectIssues(projectId: number) {
    return this.client.projects.listColumns({
      project_id: projectId,
    });
  }

  async getOrganizationMembers(org: string) {
    return this.client.orgs.listMembers({
      org: org,
    });
  }

  async getUsersForRepo(owner: string, repo: string) {
    return this.client.repos.listCollaborators({
      owner,
      repo,
    });
  }

  async getInstallation(installationId: number) {
    return this.client.apps.getInstallation({
      installation_id: installationId,
    });
  }

  async deleteInstallation(installationId: number) {
    return this.client.apps.deleteInstallation({
      installation_id: installationId,
    });
  }
}

export type PRClosingReferences = {
  repository: {
    pullRequest: {
      id: string;
      closingIssuesReferences: {
        edges: {
          node: {
            id: string;
            body: string;
            number: number;
            databaseId: number;
            title: string;
          };
        }[];
      };
    };
  };
};
