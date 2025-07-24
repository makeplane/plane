import { API_BASE_URL } from "@plane/constants";
import { TImportReport } from "@plane/types";
import { APIService } from "../api.service";
// types

export class ImportReportService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async updateImportReport(workspaceSlug: string, id: string, data: Partial<TImportReport>): Promise<TImportReport> {
    return this.patch(`/api/workspaces/${workspaceSlug}/import-reports/${id}`, data)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async getImportReport(workspaceSlug: string, id: string): Promise<TImportReport> {
    return this.get(`/api/workspaces/${workspaceSlug}/import-reports/${id}`)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async listImportReports(
    workspaceSlug: string,
    params?: Partial<Record<keyof TImportReport, string | boolean | number>>
  ): Promise<TImportReport[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/import-reports/`, { params })
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }
}
