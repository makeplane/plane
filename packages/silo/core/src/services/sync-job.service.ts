import axios, { AxiosInstance } from "axios";
import { TSyncJobWithConfig, TSyncServices, propertiesToOmit } from "@/types";

export class SyncJobService<TSyncJobConfig extends object> {
  public axiosInstance: AxiosInstance;

  constructor(baseUrl: string, xApiKey: string) {
    this.axiosInstance = axios.create({ baseURL: baseUrl, headers: { "x-api-key": xApiKey } });
  }

  /**
   * @description Retrieves all jobs
   * @returns Promise resolving to an array of Job objects
   */
  async getSyncJobs(source: TSyncServices): Promise<TSyncJobWithConfig<TSyncJobConfig>[]> {
    return this.axiosInstance
      .get(`/silo/api/jobs?source=${source}`)
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
  async getSyncJobById(jobId: string): Promise<TSyncJobWithConfig<TSyncJobConfig>> {
    return this.axiosInstance
      .get(`/silo/api/jobs/?id=${jobId}`)
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
  async createSyncJob(
    workspaceId: string,
    projectId: string,
    payload: Omit<Partial<TSyncJobWithConfig<TSyncJobConfig>>, (typeof propertiesToOmit)[number]>
  ) {
    // Make workspaceId and projectId required
    return this.axiosInstance
      .post(`/silo/api/jobs/`, {
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
  async updateSyncJob(jobId: string, payload: Partial<TSyncJobWithConfig<TSyncJobConfig>>) {
    return this.axiosInstance
      .put(`/silo/api/jobs/${jobId}`, payload)
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
  async deleteSyncJob(jobId: string) {
    return this.axiosInstance
      .delete(`/silo/api/jobs/${jobId}`)
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
  async createSyncJobConfig(payload: Partial<TSyncJobConfig>): Promise<{ insertedId: string }> {
    const configPayload = { meta: payload };
    return this.axiosInstance
      .post(`/silo/api/job-configs`, configPayload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Initiates a job.
   * @param jobId - Unique identifier of the job to start
   * @param migrationType - Type of migration, defaults to "JIRA"
   * @returns Promise resolving to an array of Job objects
   */
  async startSyncJob(
    jobId: string,
    migrationType: TSyncServices = "JIRA"
  ): Promise<TSyncJobWithConfig<TSyncJobConfig>[]> {
    return this.axiosInstance
      .post(`/silo/api/jobs/run`, { jobId, migrationType })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
