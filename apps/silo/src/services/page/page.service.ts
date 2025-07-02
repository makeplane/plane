import { ExcludedProps, ExPage } from "@plane/sdk";
import { ClientOptions } from "@/types";
import { APIService } from "../api.service";

export class PageAPIService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async bulkCreatePages(workspaceSlug: string, payload: Omit<Partial<ExPage>, ExcludedProps>[]) {
    return this.post(`/api/v1/workspaces/${workspaceSlug}/pages/bulk-operation/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkUpdatePages(workspaceSlug: string, payload: Omit<Partial<ExPage>, ExcludedProps>[]) {
    return this.patch(`/api/v1/workspaces/${workspaceSlug}/pages/bulk-operation/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
