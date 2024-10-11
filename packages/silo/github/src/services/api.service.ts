import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

// Service connected with octokit and facilitating github data
export class GithubService {
  private client: Octokit;

  constructor(appId: string, privateKey: string, installationId: string) {
    this.client = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: appId,
        privateKey: privateKey,
        installationId: installationId,
      },
      userAgent: "octokit/rest.js v1.2.3",
    });
  }

  async getRepos() {
    const pageRepos = this.client.paginate.iterator(
      this.client.apps.listReposAccessibleToInstallation,
    );
    const data: any = [];

    for await (const { data: repos } of pageRepos) {
      // @ts-ignore
      data.push(...repos);
    }

    return data;
  }

  async getReposForInstallation(installationId: number) {
    const pageRepos = this.client.paginate.iterator(
      this.client.apps.listReposAccessibleToInstallation,
      {
        installation_id: installationId,
      },
    );

    const data: any = [];

    for await (const { data: repos } of pageRepos) {
      // @ts-ignore
      data.push(...repos);
    }

    return data;
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
}
