/* eslint-disable no-useless-catch */
"use client";

import { createContext, ReactNode } from "react";
import useSWR, { KeyedMutator, SWRResponse } from "swr";
import { SyncJobService, TSyncServices, TSyncJobWithConfig, TSyncJobConfigResponse, TSyncJob } from "@silo/core";
// silo hooks
import { useApiServiceToken, useBaseImporter } from "@/plane-web/silo/hooks";

export type TImporterCreateContext<T> = {
  allSyncJobs: TSyncJobWithConfig<T>[] | undefined;
  syncJobLoader: boolean;
  syncJobError: SWRResponse;
  jobMutate: KeyedMutator<TSyncJobWithConfig<T>[]>;
  getJobById: (syncJobId: string) => Promise<TSyncJobWithConfig<T> | undefined>;
  createJob: (projectId: string, syncJobPayload: Partial<TSyncJob>) => Promise<TSyncJobConfigResponse | undefined>;
  startJob: (syncJobId: string) => Promise<void>;
  createJobConfiguration: (configuration: T) => Promise<TSyncJobConfigResponse | undefined>;
};

export const ImporterSyncJobContext = createContext<TImporterCreateContext<any>>({} as TImporterCreateContext<any>);

type TImporterSyncJobContextProvider<T> = {
  importerType: TSyncServices;
  children: ReactNode;
};

export const ImporterSyncJobContextProvider = <T extends object>(props: TImporterSyncJobContextProvider<T>) => {
  const { importerType, children } = props;
  // hooks
  const { workspaceSlug, workspaceId } = useBaseImporter();
  const { data: serviceToken } = useApiServiceToken(workspaceSlug);
  const { siloBaseUrl } = useBaseImporter();
  // service initialization
  const jobService = serviceToken ? new SyncJobService<T>(siloBaseUrl, serviceToken) : undefined;

  // fetching list of jobs
  const {
    data: allSyncJobs,
    isLoading: syncJobLoader,
    error: syncJobError,
    mutate: jobMutate,
  } = useSWR<TSyncJobWithConfig<T>[]>(
    siloBaseUrl && jobService ? `IMPORTER_JOBS_${importerType}` : null,
    siloBaseUrl && jobService ? async () => await jobService?.getSyncJobs(importerType) : null
  );

  /**
   * @description Fetches a job by its ID.
   * @param syncJobId - Unique identifier of the job to fetch
   * @returns Promise resolving to an array of Job objects
   */
  const getJobById = async (syncJobId: string): Promise<TSyncJobWithConfig<T> | undefined> => {
    try {
      const response = await jobService?.getSyncJobById(syncJobId);
      if (response) {
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description Creates a new job.
   * @param syncJob - Job data, excluding certain properties
   * @returns Promise resolving to the created Job object
   */
  const createJob = async (projectId: string, syncJobPayload: Partial<TSyncJob>) => {
    try {
      const response = await jobService?.createSyncJob(workspaceId, projectId, syncJobPayload);
      if (response) {
        await startJob(response.insertedId);
        jobMutate();
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description Starts a job.
   * @param syncJobId - Unique identifier of the job to start
   */
  const startJob = async (syncJobId: string) => {
    try {
      await jobService?.startSyncJob(syncJobId, importerType);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  /**
   * @description Creates a new job configuration.
   * @param projectId: string - Unique identifier of the job
   * @param configuration: T - Configuration data
   */
  const createJobConfiguration = async (configuration: T) => {
    try {
      const response = await jobService?.createSyncJobConfig(configuration);
      return response;
    } catch (error) {
      throw error;
    }
  };

  return (
    <ImporterSyncJobContext.Provider
      value={{
        allSyncJobs,
        syncJobLoader,
        syncJobError,
        jobMutate,
        getJobById,
        createJob,
        startJob,
        createJobConfiguration,
      }}
    >
      {children}
    </ImporterSyncJobContext.Provider>
  );
};

export default ImporterSyncJobContextProvider;
