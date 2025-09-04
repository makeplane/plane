import { TImportReport } from "@plane/types";
import { removeUndefinedFromObject } from "@/helpers/generic-helpers";
import { logger } from "@/logger";
import { APIService } from "@/services/api.service";
// types
import { ClientOptions } from "@/types";

export class ImportReportAPIService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async updateImportReport(id: string, data: Partial<TImportReport>): Promise<TImportReport> {
    data = removeUndefinedFromObject(data);
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

  async listImportReports(
    params?: Partial<Record<keyof TImportReport, string | boolean | number>>
  ): Promise<TImportReport[]> {
    params = removeUndefinedFromObject(params);
    return this.get(`/api/v1/import-reports/`, { params: params })
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error);
        throw error?.response?.data;
      });
  }

  /**
   * Update the import report count
   * @param id - The id of the import report
   * @param data - The data to increment/decrement the import report count with
   * @returns The updated import report count
   */
  async incrementImportReportCount(id: string, data: Partial<TImportReport>): Promise<TImportReport> {
    return this.post(`/api/v1/import-reports/${id}/count-increment/`, data)
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error);
        throw error?.response?.data;
      });
  }
}
