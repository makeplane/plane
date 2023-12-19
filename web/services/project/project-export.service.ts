import { APIService } from "services/api.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

export class ProjectExportService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async csvExport(
    workspaceSlug: string,
    data: {
      provider: string;
      project: string[];
    }
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/export-issues/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
