import { APIService } from "services/api.service";
import { TrackEventService } from "services/track_event.service";
import { API_BASE_URL } from "helpers/common.helper";
// types
import { IJiraMetadata, IJiraResponse, IJiraImporterForm, IUser } from "types";

const trackEventService = new TrackEventService();

export class JiraImporterService extends APIService {
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
    user: IUser | undefined
  ): Promise<IJiraResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/importers/jira/`, data)
      .then((response) => {
        trackEventService.trackImporterEvent(response?.data, "JIRA_IMPORTER_CREATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
