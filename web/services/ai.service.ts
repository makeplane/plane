import { APIService } from "services/api.service";
import { TrackEventService } from "services/track_event.service";
// types
import { IUser, IGptResponse } from "types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

const trackEventService = new TrackEventService();

export class AIService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createGptTask(
    workspaceSlug: string,
    projectId: string,
    data: { prompt: string; task: string },
    user: IUser | undefined
  ): Promise<IGptResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/ai-assistant/`, data)
      .then((response) => {
        trackEventService.trackAskGptEvent(response?.data, "ASK_GPT", user as IUser);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response;
      });
  }
}
