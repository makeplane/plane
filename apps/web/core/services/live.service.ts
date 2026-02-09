import { LIVE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export class LiveService extends APIService {
  constructor() {
    super(LIVE_URL);
  }

  /**
   * Exports a page to PDF via the live server
   * @param params - PDF export parameters
   * @returns Blob of the generated PDF
   */
  async exportToPdf(params: {
    pageId: string;
    workspaceSlug: string;
    projectId?: string;
    title?: string;
    pageSize?: "A4" | "A3" | "A2" | "LETTER" | "LEGAL" | "TABLOID";
    pageOrientation?: "portrait" | "landscape";
    fileName?: string;
    noAssets?: boolean;
    /** API base URL for asset resolution (e.g., "https://plane.example.com/api") */
    apiBaseUrl?: string;
  }): Promise<Blob> {
    const response = await this.post(
      `/pdf-export`,
      {
        ...params,
        baseUrl: window.location.origin,
      },
      {
        withCredentials: true,
        responseType: "blob",
      }
    );
    return response.data;
  }
}

// Create a singleton instance
export const liveService = new LiveService();
