import { API_BASE_URL } from "@/helpers/common.helper";
import { APIService } from "@/services/api.service";
// types
// FIXME:
// import { IGptResponse } from "@plane/types";
// helpers

export class AIService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createGptTask(workspaceSlug: string, data: { prompt: string; task: string }): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/ai-assistant/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
