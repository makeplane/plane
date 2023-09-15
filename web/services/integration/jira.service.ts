import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";
import { API_BASE_URL } from "helpers/common.helper";
// types
import { IJiraMetadata, IJiraResponse, IJiraImporterForm, ICurrentUserResponse } from "types";

class JiraImportedService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getJiraProjectInfo(workspaceSlug: string, params: IJiraMetadata): Promise<IJiraResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/importers/jira`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createJiraImporter(
    workspaceSlug: string,
    data: IJiraImporterForm,
    user: ICurrentUserResponse | undefined
  ): Promise<IJiraResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/importers/jira/`, data)
      .then((response) => {
        trackEventServices.trackImporterEvent(response?.data, "JIRA_IMPORTER_CREATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const jiraImporterService = new JiraImportedService();

export default jiraImporterService;
