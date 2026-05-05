import { API_BASE_URL } from "@plane/constants";
import type { IWorkLog, TPaginatedResponse } from "@plane/types";
import type { IExporterHistory } from "@/plane-web/types/worklog-export";
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

  async triggerExport(
    workspaceSlug: string,
    projectId: string,
    provider: "csv" | "xlsx",
    filters?: Record<string, string>
  ): Promise<{ message: string; export_id: string }> {
    return (
      this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/worklogs/export/`, {
        provider,
        filters,
      }) as Promise<{ data: { message: string; export_id: string } }>
    ).then(getData);
  }

  async getExportHistory(
    workspaceSlug: string,
    projectId: string,
    cursor?: string
  ): Promise<TPaginatedResponse<IExporterHistory[]>> {
    return (
      this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/worklogs/export/`, {
        params: { per_page: 10, ...(cursor ? { cursor } : {}) },
      }) as Promise<{ data: TPaginatedResponse<IExporterHistory[]> }>
    ).then(getData);
  }
}
