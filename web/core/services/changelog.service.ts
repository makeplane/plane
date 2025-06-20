import { CMS_BASE_URL } from "@plane/constants";
import { ChangelogPaginationData, TChangeLogConfig } from "@plane/types";
import { APIService } from "@/services/api.service";

export class ChangelogService extends APIService {
  constructor() {
    super(CMS_BASE_URL);
  }

  async fetchChangelog(config: TChangeLogConfig): Promise<ChangelogPaginationData> {
    const defaultDoc: ChangelogPaginationData = {
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      limit: config.limit,
      page: config.page,
      pagingCounter: 0,
      nextPage: null,
      prevPage: null,
      totalDocs: 0,
      totalPages: 0,
    };

    return this.get(`/api/${config.slug}-releases`, {
      params: {
        limit: config.limit,
        page: config.page,
      },
    })
      .then((response) => response?.data || defaultDoc)
      .catch((error) => {
        console.error("Error fetching changelog:", error);
        throw error;
      });
  }
}
