import { API_BASE_URL } from "@plane/constants";
import { TPageResponse } from "@/plane-web/types";
// services
import { APIService } from "@/services/api.service";
// types
import { IIssue } from "@/types/issue";

export class PageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchPageDetails(anchor: string): Promise<TPageResponse> {
    return this.get(`/api/public/anchor/${anchor}/pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async fetchPageIssueEmbeds(anchor: string): Promise<IIssue[]> {
    return this.get(`/api/public/anchor/${anchor}/page-issues/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
