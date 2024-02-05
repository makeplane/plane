import { APIService } from "../api.service";
// types
import { GptApiResponse } from "@plane/types";

export class AIService extends APIService {
  constructor(BASE_URL: string) {
    super(BASE_URL);
  }

  async createGptTask(
    workspaceSlug: string,
    projectId: string,
    data: { prompt: string; task: string }
  ): Promise<GptApiResponse> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/ai-assistant/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
