// services
import APIService from "services/api.service";
// types
import { IAnalyticsParams, IAnalytics } from "types";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class AnalyticsServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async getAnalytics(workspaceSlug: string, params: IAnalyticsParams): Promise<IAnalytics> {
    return this.get(`/api/workspaces/${workspaceSlug}/analytics/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new AnalyticsServices();
