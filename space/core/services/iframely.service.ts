import { LIVE_URL } from "@plane/constants";
import { APIService } from "./api.service";

export class IframelyService extends APIService {
  constructor() {
    super(LIVE_URL);
  }

  /**
   * Fetches embed data for a URL from the iframely service
   */
  async getEmbedData(url: string, isDarkTheme: boolean = false): Promise<any> {
    const response = await this.get(
      `/iframely?url=${encodeURIComponent(url)}${isDarkTheme ? "&_theme=dark" : ""}`,
      {},
      {
        withCredentials: false,
      }
    );
    return response.data;
  }
}

// Create a singleton instance
export const iframelyService = new IframelyService();
