import { TImportJob } from "@plane/types";
import { APIService } from "@/services/api.service";
// types
import { ClientOptions } from "@/types";
import { logger } from "@/logger";

export class ImportJobAPIService<TJobConfig = object> extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async createImportJob(data: Partial<TImportJob<TJobConfig>>): Promise<TImportJob<TJobConfig>> {
    return this.post(`/api/v1/import-jobs/`, data)
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error?.response?.data);
        throw error?.response?.data;
      });
  }

  async updateImportJob(id: string, data: Partial<TImportJob<TJobConfig>>): Promise<TImportJob<TJobConfig>> {
    return this.patch(`/api/v1/import-jobs/${id}/`, data)
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error?.response?.data);
        throw error?.response?.data;
      });
  }

  async getImportJob(id: string): Promise<TImportJob<TJobConfig>> {
    return this.get(`/api/v1/import-jobs/${id}/`)
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error?.response?.data);
        throw error?.response?.data;
      });
  }

  async listImportJobs(params?: Partial<Record<keyof TImportJob, string | boolean | number>>): Promise<TImportJob[]> {
    return this.get(`/api/v1/import-jobs/`, { params: params })
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error?.response?.data);
        throw error?.response?.data;
      });
  }
}
