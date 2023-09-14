import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";
import { API_BASE_URL } from "helpers/common.helper";

import { ICurrentUserResponse, IGithubRepoInfo, IGithubServiceImportFormData } from "types";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

const integrationServiceType: string = "github";
class GithubIntegrationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async listAllRepositories(workspaceSlug: string, integrationSlug: string): Promise<any> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/workspace-integrations/${integrationSlug}/github-repositories`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getGithubRepoInfo(
    workspaceSlug: string,
    params: { owner: string; repo: string }
  ): Promise<IGithubRepoInfo> {
    return this.get(`/api/workspaces/${workspaceSlug}/importers/${integrationServiceType}/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createGithubServiceImport(
    workspaceSlug: string,
    data: IGithubServiceImportFormData,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/importers/${integrationServiceType}/`,
      data
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackImporterEvent(response?.data, "GITHUB_IMPORTER_CREATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new GithubIntegrationService();
