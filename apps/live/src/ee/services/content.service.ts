// services
import { API_BASE_URL, APIService } from "@/core/services/api.service";
import { env } from "@/env";

// Base params interface for content operations
type ContentParams = {
  url: string;
  cookie?: string;
};

export class ContentService extends APIService {
  constructor(baseURL: string = API_BASE_URL) {
    super(baseURL);
  }

  /**
   * Gets the common headers used for requests, similar to BasePageService
   */
  protected getHeaders(params: { cookie?: string }): Record<string, string> {
    const { cookie } = params;
    const headers: Record<string, string> = {};
    const liveServerSecretKey = env.LIVE_SERVER_SECRET_KEY;

    if (cookie) {
      headers.Cookie = cookie;
    }

    if (liveServerSecretKey) {
      headers["live-server-secret-key"] = liveServerSecretKey;
    }

    return headers;
  }

  /**
   * Fetches content from a given URL with proper cookie handling
   */
  async getFileContent(params: ContentParams) {
    const { url, cookie } = params;

    // We have to add the server/ to the url because the asset endpoint server expects it
    // by removing this, the request will fail since server will server asset assuming it is a browser request and it expect some redirect to the asset url
    const serverAssetUrl = url + (url.endsWith("/") ? "server/" : "/server/");
    return this.get(serverAssetUrl, {
      headers: this.getHeaders({ cookie }),
      withCredentials: true,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }
}

// Create a singleton instance
export const ContentAPI = new ContentService();
