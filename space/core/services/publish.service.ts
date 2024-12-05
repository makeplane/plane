import { API_BASE_URL } from "@plane/constants";
import { TProjectPublishSettings } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

class PublishService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchPublishSettings(anchor: string): Promise<TProjectPublishSettings> {
    return this.get(`/api/public/anchor/${anchor}/settings/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async fetchAnchorFromProjectDetails(workspaceSlug: string, projectID: string): Promise<TProjectPublishSettings> {
    return this.get(`/api/public/workspaces/${workspaceSlug}/projects/${projectID}/anchor/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

export default PublishService;
