import { APIService } from "services/api.service";
// types
import { IGptResponse } from "@plane/types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

export class AIService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createGptTask(
    workspaceSlug: string,
    projectId: string,
    data: { prompt: string; task: string }
  ): Promise<IGptResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/ai-assistant/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
