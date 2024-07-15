// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// plane web types
import { IAppSearchResults } from "@/plane-web/types";
// services
import { APIService } from "@/services/api.service";

export class AppService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async searchApp(
    workspaceSlug: string,
    params: {
      search: string;
    }
  ): Promise<IAppSearchResults> {
    return this.get(`/api/workspaces/${workspaceSlug}/app-search/`, {
      params,
    })
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
