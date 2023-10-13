import { APIService } from "services/api.service";
import { TrackEventService } from "services/track_event.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";
// types
import { IUser, IGithubRepoInfo, IGithubServiceImportFormData } from "types";

const integrationServiceType: string = "github";

const trackEventService = new TrackEventService();

export class GithubIntegrationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async listAllRepositories(workspaceSlug: string, integrationSlug: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/workspace-integrations/${integrationSlug}/github-repositories`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getGithubRepoInfo(workspaceSlug: string, params: { owner: string; repo: string }): Promise<IGithubRepoInfo> {
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
    user: IUser | undefined
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/importers/${integrationServiceType}/`, data)
      .then((response) => {
        trackEventService.trackImporterEvent(response?.data, "GITHUB_IMPORTER_CREATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
