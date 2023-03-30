// services
import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";

// types
import { IGptResponse } from "types";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

class AiServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createGptTask(
    workspaceSlug: string,
    projectId: string,
    data: { prompt: string; task: string }
  ): Promise<IGptResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/ai-assistant/`, data)
      .then((response) => {
        if (trackEvent) trackEventServices.trackAskGptEvent(response?.data, "ASK_GPT");
        return response?.data;
      })
      .catch((error) => {
        throw error?.response;
      });
  }
}

export default new AiServices();
