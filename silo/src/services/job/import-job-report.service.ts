import { TImportReport } from "@plane/types";
import { APIService } from "@/services/api.service";
// types
import { ClientOptions } from "@/types";
import { logger } from "@/logger";

export class ImportReportAPIService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async updateImportReport(id: string, data: Partial<TImportReport>): Promise<TImportReport> {
    return this.patch(`/api/v1/import-reports/${id}/`, data)
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error);
        throw error?.response?.data;
      });
  }

  async getImportReport(id: string): Promise<TImportReport> {
    return this.get(`/api/v1/import-reports/${id}/`)
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error);
        throw error?.response?.data;
      });
  }

  async listImportReports(params?: Partial<Record<keyof TImportReport, string | boolean | number>>): Promise<TImportReport[]> {
    return this.get(`/api/v1/import-reports/`, { params: params })
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error);
        throw error?.response?.data;
      });
  }

}
