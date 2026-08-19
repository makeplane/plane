"use client";

import type { ReactNode } from "react";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { FilterInstance } from "@plane/shared-state";
import type { TFilterConfig, TFilterValue } from "@plane/types";

import type { TMediaTranscodeJobStatus } from "@/services/media-library.service";
import { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaLibraryExternalFilter, TMediaLibraryFilterProperty } from "../utils/media-library-filters";
import { mediaLibraryFiltersAdapter } from "../utils/media-library-filters";

export type TMediaTranscodeJobTrackerInput = {
  workspaceSlug: string;
  projectId: string;
  packageId: string;
  artifactId: string;
  jobId: string;
};

type TMediaLibraryContext = {
  isUploadOpen: boolean;
  pendingUploadFiles: File[];
  openUpload: () => void;
  closeUpload: () => void;
  setPendingUploadFiles: (files: File[]) => void;
  libraryVersion: number;
  refreshLibrary: () => void;
  trackTranscodeJob: (job: TMediaTranscodeJobTrackerInput) => void;
  mediaFilters: FilterInstance<TMediaLibraryFilterProperty, TMediaLibraryExternalFilter>;
  setMediaFilterConfigs: (configs: TFilterConfig<TMediaLibraryFilterProperty, TFilterValue>[]) => void;
};

const MediaLibraryContext = createContext<TMediaLibraryContext | null>(null);
const SECTION_PATH_SEGMENT = "/media-library/section/";
const MEDIA_LIBRARY_PATH_SEGMENT = "/media-library";
const TRANSCODE_JOB_POLL_INTERVAL_MS = 5000;
const TERMINAL_TRANSCODE_STATUSES = new Set<TMediaTranscodeJobStatus>([
  "COMPLETED",
  "READY",
  "UPLOADED",
  "FAILED",
  "QUEUE_FAILED",
  "CANCELLED",
]);

const normalizeTrackedTranscodeJob = (job: TMediaTranscodeJobTrackerInput): TMediaTranscodeJobTrackerInput | null => {
  const workspaceSlug = job.workspaceSlug?.trim();
  const projectId = job.projectId?.trim();
  const packageId = job.packageId?.trim();
  const artifactId = job.artifactId?.trim();
  const jobId = job.jobId?.trim();

  if (!workspaceSlug || !projectId || !packageId || !artifactId || !jobId) return null;

  return {
    workspaceSlug,
    projectId,
    packageId,
    artifactId,
    jobId,
  };
};

const getTrackedTranscodeJobKey = (job: TMediaTranscodeJobTrackerInput) =>
  [job.workspaceSlug, job.projectId, job.packageId, job.artifactId, job.jobId].join(":");

export const MediaLibraryProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
  const [libraryVersion, setLibraryVersion] = useState(0);
  const [trackedTranscodeJobs, setTrackedTranscodeJobs] = useState<Record<string, TMediaTranscodeJobTrackerInput>>({});
  const trackedTranscodeJobsRef = useRef(trackedTranscodeJobs);
  const isMediaLibraryPathRef = useRef(false);
  const filterInstancesRef = useRef(
    new Map<string, FilterInstance<TMediaLibraryFilterProperty, TMediaLibraryExternalFilter>>()
  );
  const filterConfigsRef = useRef(new Map<string, TFilterConfig<TMediaLibraryFilterProperty, TFilterValue>[]>());
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);

  const openUpload = useCallback(() => setIsUploadOpen(true), []);
  const closeUpload = useCallback(() => {
    setPendingUploadFiles([]);
    setIsUploadOpen(false);
  }, []);
  const refreshLibrary = useCallback(() => setLibraryVersion((prev) => prev + 1), []);
  const trackTranscodeJob = useCallback((job: TMediaTranscodeJobTrackerInput) => {
    const normalizedJob = normalizeTrackedTranscodeJob(job);
    if (!normalizedJob) return;

    const jobKey = getTrackedTranscodeJobKey(normalizedJob);
    setTrackedTranscodeJobs((prev) => {
      if (prev[jobKey]) return prev;
      return { ...prev, [jobKey]: normalizedJob };
    });
  }, []);
  const activeScopeKey = useMemo(() => {
    const markerIndex = pathname.indexOf(SECTION_PATH_SEGMENT);
    if (markerIndex === -1) return "all";
    const rawSectionName =
      pathname
        .slice(markerIndex + SECTION_PATH_SEGMENT.length)
        .split("/")[0]
        ?.trim() ?? "";
    if (!rawSectionName) return "all";
    try {
      return `section:${decodeURIComponent(rawSectionName)}`;
    } catch {
      return `section:${rawSectionName}`;
    }
  }, [pathname]);
  const mediaFilters = useMemo(() => {
    const existing = filterInstancesRef.current.get(activeScopeKey);
    if (existing) return existing;
    const nextInstance = new FilterInstance<TMediaLibraryFilterProperty, TMediaLibraryExternalFilter>({
      adapter: mediaLibraryFiltersAdapter,
    });
    filterInstancesRef.current.set(activeScopeKey, nextInstance);
    return nextInstance;
  }, [activeScopeKey]);
  const trackedTranscodeJobSignature = useMemo(
    () => Object.keys(trackedTranscodeJobs).sort().join("|"),
    [trackedTranscodeJobs]
  );

  useEffect(() => {
    trackedTranscodeJobsRef.current = trackedTranscodeJobs;
  }, [trackedTranscodeJobs]);

  useEffect(() => {
    isMediaLibraryPathRef.current = pathname.includes(MEDIA_LIBRARY_PATH_SEGMENT);
  }, [pathname]);

  useEffect(() => {
    if (!trackedTranscodeJobSignature) return;

    let isDisposed = false;
    let isPolling = false;

    const pollJobs = async () => {
      if (isPolling) return;
      isPolling = true;

      try {
        const jobs = Object.entries(trackedTranscodeJobsRef.current);
        const terminalJobKeys: string[] = [];
        let shouldRefreshLibrary = false;

        await Promise.all(
          jobs.map(async ([jobKey, job]) => {
            try {
              const result = await mediaLibraryService.getArtifactTranscodeJob(
                job.workspaceSlug,
                job.projectId,
                job.packageId,
                job.artifactId,
                job.jobId
              );
              if (isDisposed) return;

              shouldRefreshLibrary = true;
              if (TERMINAL_TRANSCODE_STATUSES.has(result.status)) {
                terminalJobKeys.push(jobKey);
              }
            } catch {
              // Keep tracking. The service can be temporarily unavailable while the worker is still running.
            }
          })
        );

        if (isDisposed) return;

        if (terminalJobKeys.length > 0) {
          setTrackedTranscodeJobs((prev) => {
            let next = prev;
            for (const jobKey of terminalJobKeys) {
              if (!next[jobKey]) continue;
              if (next === prev) next = { ...prev };
              delete next[jobKey];
            }
            return next;
          });
        }

        if (shouldRefreshLibrary && isMediaLibraryPathRef.current) {
          refreshLibrary();
        }
      } finally {
        isPolling = false;
      }
    };

    void pollJobs();

    const intervalId = window.setInterval(pollJobs, TRANSCODE_JOB_POLL_INTERVAL_MS);
    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
    };
  }, [mediaLibraryService, refreshLibrary, trackedTranscodeJobSignature]);

  useEffect(() => {
    const configs = filterConfigsRef.current.get(activeScopeKey) ?? [];
    mediaFilters.configManager.setAreConfigsReady(true);
    mediaFilters.configManager.registerAll(configs);
  }, [activeScopeKey, mediaFilters]);

  const setMediaFilterConfigs = useCallback(
    (configs: TFilterConfig<TMediaLibraryFilterProperty, TFilterValue>[]) => {
      filterConfigsRef.current.set(activeScopeKey, configs);
      mediaFilters.configManager.setAreConfigsReady(true);
      mediaFilters.configManager.registerAll(configs);
    },
    [activeScopeKey, mediaFilters]
  );

  const value = useMemo(
    () => ({
      isUploadOpen,
      pendingUploadFiles,
      openUpload,
      closeUpload,
      setPendingUploadFiles,
      libraryVersion,
      refreshLibrary,
      trackTranscodeJob,
      mediaFilters,
      setMediaFilterConfigs,
    }),
    [
      isUploadOpen,
      pendingUploadFiles,
      openUpload,
      closeUpload,
      setPendingUploadFiles,
      libraryVersion,
      refreshLibrary,
      trackTranscodeJob,
      mediaFilters,
      setMediaFilterConfigs,
    ]
  );

  return <MediaLibraryContext.Provider value={value}>{children}</MediaLibraryContext.Provider>;
};

export const useMediaLibrary = () => {
  const context = useContext(MediaLibraryContext);
  if (!context) throw new Error("useMediaLibrary must be used within MediaLibraryProvider");
  return context;
};
