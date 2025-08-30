import { TProjectPublishSettings } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Service class for managing project publish operations within plane core application.
 * Extends APIService to handle HTTP requests to the project publish-related endpoints.
 * @extends {APIService}
 * @remarks This service is only available for plane core
 */
export abstract class CoreProjectPublishService extends APIService {
  constructor(BASE_URL: string) {
    super(BASE_URL);
  }

  async retrieve(workspaceSlug: string, projectID: string): Promise<TProjectPublishSettings> {
    return this.get(`/api/public/workspaces/${workspaceSlug}/projects/${projectID}/anchor/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async retrieveSettings(anchor: string): Promise<TProjectPublishSettings> {
    return this.get(`/api/public/anchor/${anchor}/settings/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
