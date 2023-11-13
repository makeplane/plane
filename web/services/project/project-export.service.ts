import { APIService } from "services/api.service";
import { TrackEventService } from "services/track_event.service";
// types
import { IUser } from "types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

const trackEventService = new TrackEventService();

export class ProjectExportService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async csvExport(
    workspaceSlug: string,
    data: {
      provider: string;
      project: string[];
    },
    user: IUser
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/export-issues/`, data)
      .then((response) => {
        trackEventService.trackExporterEvent(
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
