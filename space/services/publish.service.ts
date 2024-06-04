import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";
// types
import { TPublishSettings } from "@/types/publish";

class PublishService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchPublishSettings(anchor: string): Promise<TPublishSettings> {
    return this.get(`/api/public/publish-settings/${anchor}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async fetchAnchorFromOldDetails(
    workspaceSlug: string,
    projectID: string
  ): Promise<{
    anchor: string;
  }> {
    return this.post(`/api/public/publish-anchor/`, {
      workspaceSlug,
      projectID,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

export default PublishService;
