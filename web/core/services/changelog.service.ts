import { PAYLOAD_BASE_URL } from "@plane/constants";
import { ChangelogPaginationData } from "@plane/types";
import { APIService } from "@/services/api.service";

export class ChangelogService extends APIService {
  constructor() {
    super(PAYLOAD_BASE_URL);
  }

  async fetchChangelog(slug: string, limit: number = 5, page: number = 1): Promise<ChangelogPaginationData> {
    return this.get(`/api/${slug}-releases`, {
      params: {
        limit,
        page,
      },
    })
      .then((response) => response?.data || response?.data || [])
      .catch((error) => {
        console.error("Error fetching changelog:", error);
        return [];
      });
  }
}
