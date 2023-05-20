import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";

// types
import { IJiraMetadata, IJiraResponse, IJiraImporterForm } from "types";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

class JiraImportedService extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
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

  async createJiraImporter(workspaceSlug: string, data: IJiraImporterForm): Promise<IJiraResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/importers/jira/`, data)
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackImporterEvent(response?.data, "JIRA_IMPORTER_CREATE");
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const jiraImporterService = new JiraImportedService();

export default jiraImporterService;
