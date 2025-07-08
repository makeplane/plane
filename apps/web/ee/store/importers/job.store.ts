import orderBy from "lodash/orderBy";
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { E_JOB_STATUS, JobService, TImporterKeys, TJobConfigResponse } from "@plane/etl/core";
import { TImportJob } from "@plane/types";

export type TJobLoader = "fetch" | "re-fetch" | "fetch_by_id" | "create" | "start" | "create_config" | undefined;

export interface IImporterJobStore<T> {
  // observables
  loader: TJobLoader;
  error: object;
  workspaceId: string | undefined; // required for service configuration
  externalApiToken: string | undefined; // required for service configuration
  jobs: Record<string, Record<string, TImportJob<T>>>; // workspaceId -> jobId -> TImportJob<T>
  // computed
  jobIds: string[] | undefined;
  // computed functions
  jobById: (id: string) => TImportJob<T> | undefined;
  // helper actions
  setDefaultServiceConfig: (workspaceId: string | undefined, externalApiToken: string | undefined) => void;
  // actions
  fetchJobs: (loader?: TJobLoader) => Promise<TImportJob<T>[] | undefined>;
  getJobById: (id: string) => Promise<TImportJob<T> | undefined>;
  createJob: (projectId: string | undefined, jobPayload: Partial<TImportJob<T>>) => Promise<TImportJob<T> | undefined>;
  startJob: (jobId: string) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  createJobConfig: (configPayload: object) => Promise<TJobConfigResponse | undefined>;
}

export class ImporterJobStore<T extends object> implements IImporterJobStore<T> {
  // observables
  loader: TJobLoader = undefined;
  error: object = {};
  workspaceId: string | undefined = undefined;
  externalApiToken: string | undefined = undefined;
  jobs: Record<string, Record<string, TImportJob<T>>> = {};
  // service
  service: JobService<T> | undefined = undefined;

  constructor(private source: TImporterKeys) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      error: observable,
      workspaceId: observable,
      externalApiToken: observable,
      jobs: observable,
      // computed
      jobIds: computed,
      // actions
      fetchJobs: action,
      getJobById: action,
      createJob: action,
      startJob: action,
      createJobConfig: action,
    });
  }

  // computed
  /**
   * @description get the job ids
   * @returns { string[] | undefined }
   */
  get jobIds(): string[] | undefined {
    if (!this.workspaceId || !this.jobs || !this?.jobs[this.workspaceId]) return undefined;
    return orderBy(Object.values(this?.jobs[this.workspaceId]), "created_at", "desc").map((job) => job.id);
  }

  // computed functions
  /**
   * @description get a job by its ID
   * @param { string } id
   * @returns { TImportJob<T> | undefined }
   */
  jobById = computedFn(
    (id: string): TImportJob<T> | undefined => (this.workspaceId && this.jobs[this.workspaceId][id]) || undefined
  );

  // helper actions
  /**
   * @description Sets the default service configuration
   * @param { string } workspaceId
   * @param { string } externalApiToken
   * @returns { void }
   */
  setDefaultServiceConfig = (workspaceId: string | undefined, externalApiToken: string | undefined): void => {
    if (workspaceId) {
      set(this, "workspaceId", workspaceId);
      set(this, "externalApiToken", externalApiToken);
      this.service = new JobService<T>(encodeURI(SILO_BASE_URL + SILO_BASE_PATH), externalApiToken || null);
    }
  };

  // actions
  /**
   * @description Fetches all jobs
   * @returns { Promise<TImportJob<T>[]> | undefined }
   */
  fetchJobs = async (loader: TJobLoader = "fetch"): Promise<TImportJob<T>[] | undefined> => {
    if (!this.workspaceId || !this.service) return undefined;
    try {
      if (loader === "fetch" && this.jobIds === undefined) {
        this.loader = loader;
      }
      if (loader === "re-fetch") {
        this.loader = loader;
      }
      const jobs = await this.service.list(this.workspaceId, this.source);
      if (jobs) {
        runInAction(() => {
          jobs.forEach((job) => {
            if ((job.id && this, this.workspaceId)) {
              set(this.jobs, [this.workspaceId, job.id], job);
            }
          });
        });
      }
      this.loader = undefined;
      return jobs;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
        this.loader = undefined;
        throw error;
      });
    }
  };

  /**
   * @description Fetches a job by its ID
   * @param { string } id
   * @returns { Promise<TImportJob<T>> | undefined }
   */
  getJobById = async (id: string): Promise<TImportJob<T> | undefined> => {
    if (!this.workspaceId || !this.service) return undefined;

    try {
      this.loader = "fetch_by_id";
      const job = await this.service.retrieve(id);
      if (job) {
        runInAction(() => {
          if (this.workspaceId) set(this.jobs, [this.workspaceId, id], job);
        });
      }
      this.loader = undefined;
      return job;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
        this.loader = undefined;
        throw error;
      });
    }
  };

  /**
   * @description Creates a new job
   * @param { string } projectId
   * @param { Partial<TImportJob> } jobPayload
   * @returns { Promise<TImportJob<T> | undefined> }
   */
  createJob = async (
    projectId: string | undefined,
    jobPayload: Partial<TImportJob<T>>
  ): Promise<TImportJob<T> | undefined> => {
    if (!this.workspaceId || !this.service) return undefined;

    try {
      this.loader = "create";
      const job = await this.service.create(this.workspaceId, projectId, jobPayload);
      if (job) {
        runInAction(() => {
          if (job.id && this.workspaceId) {
            set(this.jobs, [this.workspaceId, job.id], job);
          }
        });
      }
      this.loader = undefined;
      return job;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
        this.loader = undefined;
        throw error;
      });
    }
  };

  /**
   * @description Starts a job
   * @param { string } jobId
   * @returns { Promise<void> }
   */
  startJob = async (jobId: string): Promise<void> => {
    try {
      if (!this.workspaceId || !this.service) return undefined;

      this.loader = "start";
      await this.service.start(jobId, this.source);
      this.loader = undefined;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
        this.loader = undefined;
        throw error;
      });
    }
  };

  /**
   * @description Cancels a job
   * @param { string } jobId
   * @returns { Promise<void> }
   */
  cancelJob = async (jobId: string): Promise<void> => {
    try {
      if (!this.workspaceId || !this.service) return undefined;

      this.loader = "start";
      await this.service.cancel(jobId, this.source);
      set(this.jobs, [this.workspaceId, jobId], {
        ...this.jobs[this.workspaceId][jobId],
        status: E_JOB_STATUS.CANCELLED,
      });
      this.loader = undefined;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
        this.loader = undefined;
        throw error;
      });
    }
  };

  /**
   * @description Creates a new job configuration
   * @param { object } configPayload
   * @returns { Promise<TJobConfigResponse> | undefined }
   */
  createJobConfig = async (configPayload: object): Promise<TJobConfigResponse | undefined> => {
    try {
      if (!this.workspaceId || !this.service) return undefined;

      this.loader = "create_config";
      const config = await this.service.createConfig(configPayload);
      this.loader = undefined;
      return config;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
        this.loader = undefined;
        throw error;
      });
    }
  };
}
