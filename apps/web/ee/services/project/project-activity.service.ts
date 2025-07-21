import { API_BASE_URL } from "@plane/constants";
import { TProjectActivity } from "@/plane-web/types";
import { APIService } from "@/services/api.service";

export class ProjectActivityService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }
  async getProjectActivities(workspaceSlug: string, projectId: string): Promise<TProjectActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/history/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
