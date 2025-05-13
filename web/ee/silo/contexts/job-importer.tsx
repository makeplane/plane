/* eslint-disable no-useless-catch */
"use client";

import { createContext, ReactNode } from "react";
import useSWR, { KeyedMutator, SWRResponse } from "swr";
import { JobService, TJobConfigResponse, TImporterKeys } from "@plane/etl/core";
import { TImportJob } from "@plane/types";
// silo hooks
import { useApiServiceToken, useBaseImporter } from "@/plane-web/silo/hooks";

export type TImporterCreateContext<T> = {
  allSyncJobs: TImportJob<T>[] | undefined;
  syncJobLoader: boolean;
  syncJobError: SWRResponse;
  jobMutate: KeyedMutator<TImportJob<T>[]>;
  getJobById: (syncJobId: string) => Promise<TImportJob<T> | undefined>;
  createJob: (projectId: string, syncJobPayload: Partial<TImportJob>) => Promise<TImportJob<T> | undefined>;
  startJob: (syncJobId: string) => Promise<void>;
  createJobConfiguration: (configuration: T) => Promise<TJobConfigResponse | undefined>;
};

export const ImporterSyncJobContext = createContext<TImporterCreateContext<any>>({} as TImporterCreateContext<any>);

type TImporterSyncJobContextProvider<T> = {
  importerType: TImporterKeys;
  children: ReactNode;
};

export const ImporterSyncJobContextProvider = <T extends object>(props: TImporterSyncJobContextProvider<T>) => {
  const { importerType, children } = props;
  // hooks
  const { workspaceSlug, workspaceId } = useBaseImporter();
  const { data: serviceToken } = useApiServiceToken(workspaceSlug);
  const { siloBaseUrl } = useBaseImporter();
  // service initialization
  const jobService = serviceToken ? new JobService<T>(siloBaseUrl, serviceToken) : undefined;

  // fetching list of jobs
  const {
    data: allSyncJobs,
    isLoading: syncJobLoader,
    error: syncJobError,
    mutate: jobMutate,
  } = useSWR<TImportJob<T>[]>(
    siloBaseUrl && jobService ? `IMPORTER_JOBS_${importerType}` : null,
    siloBaseUrl && jobService ? async () => await jobService?.list(workspaceId, importerType) : null
  );

  /**
   * @description Fetches a job by its ID.
   * @param syncJobId - Unique identifier of the job to fetch
   * @returns Promise resolving to an array of Job objects
   */
  const getJobById = async (syncJobId: string): Promise<TImportJob<T> | undefined> => {
    try {
      const response = await jobService?.retrieve(syncJobId);
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
  const createJob = async (projectId: string, syncJobPayload: Partial<TImportJob>) => {
    try {
      const response = await jobService?.create(workspaceId, projectId, syncJobPayload);
      if (response) {
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
      await jobService?.start(syncJobId, importerType);
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
      const response = await jobService?.createConfig(configuration);
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
