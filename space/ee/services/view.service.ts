import { API_BASE_URL } from "@plane/constants";
import { IProjectView } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class ViewService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getViewDetails(anchor: string): Promise<IProjectView> {
    return this.get(`/api/public/anchor/${anchor}/views/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getViewIssues(anchor: string, params: any): Promise<any> {
    return this.get(`/api/public/anchor/${anchor}/view-issues/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
