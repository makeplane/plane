import { CMS_BASE_URL } from "@plane/constants";
import { ChangelogPaginationData, TChangeLogConfig } from "@plane/types";
import { APIService } from "@/services/api.service";

export class ChangelogService extends APIService {
  constructor() {
    super(CMS_BASE_URL);
  }

  async fetchChangelog(config: TChangeLogConfig): Promise<ChangelogPaginationData> {
    return this.get(`/api/${config.slug}-releases`, {
      params: {
        limit: config.limit,
        page: config.page,
      },
    })
      .then((response) => {
        if (!response?.data) {
          throw new Error("No data received from changelog API");
        }
        return response.data;
      })
      .catch((error) => {
        console.error("Error fetching changelog:", error);
        throw error;
      });
  }
}
