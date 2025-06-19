import axios, { AxiosInstance } from "axios";
import { TImportJob } from "@plane/types";
import { TImporterKeys, propertiesToOmit } from "@/core/types";

export class JobService<TSyncJobConfig extends object> {
  public axiosInstance: AxiosInstance;

  constructor(baseUrl: string, xApiKey: string | null) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: xApiKey ? { "x-api-key": xApiKey } : {},
      withCredentials: true,
    });
  }

  /**
   * @description Retrieves all jobs
   * @returns Promise resolving to an array of Job objects
   */
  async list(workspaceId: string, source: TImporterKeys): Promise<TImportJob<TSyncJobConfig>[]> {
    return this.axiosInstance
      .get(`/api/jobs?source=${source}&workspaceId=${workspaceId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Fetches a job by its ID.
   * @param jobId - Unique identifier of the job to fetch
   * @returns Promise resolving to an array of Job objects
   */
  async retrieve(jobId: string): Promise<TImportJob<TSyncJobConfig>> {
    return this.axiosInstance
      .get(`/api/jobs/?id=${jobId}`)
      .then((res) => res.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  /**
   * @description Creates a new job.
   * @param workspaceId - ID of the workspace
   * @param projectId - ID of the project
   * @param payload - Job data, excluding certain properties
   * @returns Promise resolving to the created Job object
   */
  async create(
    workspaceId: string,
    projectId: string | undefined,
    payload: Omit<Partial<TImportJob<TSyncJobConfig>>, (typeof propertiesToOmit)[number]>
  ): Promise<TImportJob<TSyncJobConfig>> {
    // Make workspaceId and projectId required
    return this.axiosInstance
      .post(`/api/jobs/`, {
        ...payload,
        workspace_id: workspaceId,
        project_id: projectId,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Updates an existing job.
   * @param jobId - Unique identifier of the job to update
   * @param payload - Partial job data to update
   * @returns Promise resolving to the updated Job object
   */
  async update(jobId: string, payload: Partial<TImportJob<TSyncJobConfig>>) {
    return this.axiosInstance
      .put(`/api/jobs/${jobId}`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Deletes a job.
   * @param jobId - Unique identifier of the job to delete
   * @returns Promise resolving to the deletion result
   */
  async destroy(jobId: string) {
    return this.axiosInstance
      .delete(`/api/jobs/${jobId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Creates a new job configuration.
   * @param payload - Partial job configuration data
   * @returns Promise resolving to an object containing the inserted ID
   */
  async createConfig(payload: Partial<TSyncJobConfig>): Promise<{ insertedId: string }> {
    const configPayload = { meta: payload };
    return this.axiosInstance
      .post(`/api/job-configs`, configPayload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Initiates a job.
   * @param jobId - Unique identifier of the job to start
   * @param migrationType - Type of migration
   * @returns Promise resolving to an array of Job objects
   */
  async start(jobId: string, migrationType: TImporterKeys): Promise<TImportJob<TSyncJobConfig>[]> {
    return this.axiosInstance
      .post(`/api/jobs/run`, { jobId, migrationType })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Cancels a job.
   * @param jobId - Unique identifier of the job to start
   * @param migrationType - Type of migration
   * @returns Promise resolving to an array of Job objects
   */
  async cancel(jobId: string, migrationType: TImporterKeys): Promise<TImportJob<TSyncJobConfig>[]> {
    return this.axiosInstance
      .post(`/api/jobs/cancel`, { jobId, migrationType })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
