import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";

import { ICurrentUserResponse } from "types";

import getConfig from "next/config";
const { publicRuntimeConfig: { NEXT_PUBLIC_API_BASE_URL } } = getConfig();

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

class CSVIntegrationService extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
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
        if (trackEvent)
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
