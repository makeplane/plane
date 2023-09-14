import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";
import { ICurrentUserResponse } from "types";
import { API_BASE_URL } from "helpers/common.helper";

class CSVIntegrationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async exportCSVService(
    workspaceSlug: string,
    data: {
      provider: string;
      project: string[];
    },
    user: ICurrentUserResponse
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/export-issues/`, data)
      .then((response) => {
        trackEventServices.trackExporterEvent(
          {
            workspaceSlug,
          },
          "CSV_EXPORTER_CREATE",
          user
        );
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new CSVIntegrationService();
