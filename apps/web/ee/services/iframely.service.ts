import { LIVE_URL } from "@plane/constants";
import { IframelyResponse } from "@plane/types";
import { APIService } from "@/services/api.service";

export class IframelyService extends APIService {
  constructor() {
    super(LIVE_URL);
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
}

// Create a singleton instance
export const iframelyService = new IframelyService();
