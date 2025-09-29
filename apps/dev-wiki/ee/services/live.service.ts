// import { LIVE_URL } from "@plane/constants";
import { LIVE_BASE_URL } from "@plane/constants";
import { IframelyResponse } from "@plane/types";
import { APIService } from "@/services/api.service";

export class LiveService extends APIService {
  constructor() {
    super(LIVE_BASE_URL);
  }

  /**
   * Fetches embed data for a URL from the iframely service
   */
  async getEmbedData(
    url: string,
    isDarkTheme: boolean = false,
    workspaceSlug: string,
    userId: string
  ): Promise<IframelyResponse> {
    const response = await this.get(
      `/iframely`,
      {
        params: {
          url: url,
          _theme: isDarkTheme ? "dark" : "light",
          workspaceSlug,
          userId,
        },
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  }

  async getContent(url: string): Promise<string> {
    const response = await this.get(`/content`, {
      params: { url: url },
    });
    return response.data.content;
  }
}

// Create a singleton instance
export const liveService = new LiveService();
