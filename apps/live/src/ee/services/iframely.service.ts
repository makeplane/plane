// services
import { IframelyResponse } from "@plane/types";
import { APIService } from "@/core/services/api.service";
// types
// helpers
import { env } from "@/env";

const IFRAMELY_URL = env.IFRAMELY_URL ?? "";
export class IframelyService extends APIService {
  constructor() {
    super(IFRAMELY_URL);
  }

  async getIframe({ url, theme }: { url: string; theme: string }): Promise<IframelyResponse> {
    return this.get(`/iframely`, {
      params: { url: url, group: true, _theme: theme },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }
}

// Create a singleton instance
export const IframelyAPI = new IframelyService();
