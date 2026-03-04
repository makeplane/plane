import { API_BASE_URL } from "@plane/constants";
import type { IWorkLog , TPaginatedResponse } from "@plane/types";
import { APIService } from "@/services/api.service";

// Helper to cast the axios response data to the expected type
function getData<T>(response: { data: T }): T {
  return response.data;
}

export class CEProjectWorklogService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getProjectWorklogs(
    workspaceSlug: string,
    projectId: string,
    cursor?: string,
    params?: Record<string, string>
  ): Promise<TPaginatedResponse<IWorkLog[]>> {
    return (
      this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/worklogs/`, {
        params: {
          ...params,
          cursor,
        },
      }) as Promise<{ data: TPaginatedResponse<IWorkLog[]> }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }
}
