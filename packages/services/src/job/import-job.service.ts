import { API_BASE_URL } from "@plane/constants";
// types
import { TImportJob } from "@plane/types";
import { APIService } from "../api.service";

export class ImportJobService<TJobConfig = object> extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async createImportJob(workspaceSlug: string, data: Partial<TImportJob<TJobConfig>>): Promise<TImportJob<TJobConfig>> {
    return this.post(`/api/workspaces/${workspaceSlug}/import-jobs/`, data)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async updateImportJob(
    workspaceSlug: string,
    id: string,
    data: Partial<TImportJob<TJobConfig>>
  ): Promise<TImportJob<TJobConfig>> {
    return this.patch(`/api/workspaces/${workspaceSlug}/import-jobs/${id}`, data)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async getImportJob(workspaceSlug: string, id: string): Promise<TImportJob<TJobConfig>> {
    return this.get(`/api/workspaces/${workspaceSlug}/import-jobs/${id}`)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async listImportJobs(
    workspaceSlug: string,
    params?: { [K in keyof TImportJob<TJobConfig>]?: string | boolean | number }
  ): Promise<TImportJob<TJobConfig>[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/import-jobs/`, { params })
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }
}
