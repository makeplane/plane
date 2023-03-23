import APIService from "services/api.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

const integrationServiceType: string = "github";

class GithubIntegrationService extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  // fetching all the repositories under the github
  async listAllRepositories(workspaceSlug: string, integrationSlug: string): Promise<any> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/workspace-integrations/${integrationSlug}/github-repositories`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // fetching repository stats under the repository eg: users, labels and issues
  async fetchRepositoryStats(workspaceSlug: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/importers/${integrationServiceType}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // migrating repository data in workspace project
  async migrateRepositoryStatToProject(
    workspaceSlug: string,
    integrationSlug: string
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/importers/${integrationServiceType}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new GithubIntegrationService();
