"use client";

import type { ReactNode } from "react";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { FilterInstance } from "@plane/shared-state";
import type { TFilterConfig, TFilterValue } from "@plane/types";

import type { TMediaArtifactPayload, TMediaTranscodeJobStatus } from "@/services/media-library.service";
import { MediaLibraryService } from "@/services/media-library.service";
import { getDocumentThumbnailPath } from "../utils/media-items";
import type { TMediaLibraryExternalFilter, TMediaLibraryFilterProperty } from "../utils/media-library-filters";
import { mediaLibraryFiltersAdapter } from "../utils/media-library-filters";
import {
  buildArtifactName,
  buildMediaLibraryUploadJobs,
  buildUploadAttemptRequestId,
  escapeHtml,
  getErrorMessage,
  getFileExtension,
  getTitleFromFile,
  getUploadErrorMessage,
  isActiveUploadStatus,
  isCompletedUploadStatus,
  isDocumentUploadFormat,
  isImageUploadFormat,
  isMp4Upload,
  isVideoUploadFormat,
  resolveArtifactFormat,
  type TMediaLibraryUploadBatchInput,
  type TMediaLibraryUploadJob,
} from "../utils/media-library-upload-jobs";
import {
  calculateUploadProgressMetrics,
  logMediaUploadLifecycle,
  shouldLogUploadProgress,
} from "../utils/upload-progress";

export type TMediaTranscodeJobTrackerInput = {
  workspaceSlug: string;
  projectId: string;
  packageId: string;
  artifactId: string;
  jobId: string;
  uploadJobId?: string;
};

type TMediaLibraryContext = {
  isUploadOpen: boolean;
  pendingUploadFiles: File[];
  uploadJobs: TMediaLibraryUploadJob[];
  openUpload: () => void;
  closeUpload: () => void;
  setPendingUploadFiles: (files: File[]) => void;
  libraryVersion: number;
  refreshLibrary: () => void;
  trackTranscodeJob: (job: TMediaTranscodeJobTrackerInput) => void;
  enqueueUploadBatch: (input: TMediaLibraryUploadBatchInput) => void;
  cancelUploadJob: (jobId: string) => void;
  retryUploadJob: (jobId: string) => void;
  dismissUploadJob: (jobId: string) => void;
  clearCompletedUploadJobs: () => void;
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
    uploadJobId: job.uploadJobId,
  };
};

const getTrackedTranscodeJobKey = (job: TMediaTranscodeJobTrackerInput) =>
  [job.workspaceSlug, job.projectId, job.packageId, job.artifactId, job.jobId].join(":");

export const MediaLibraryProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
  const [libraryVersion, setLibraryVersion] = useState(0);
  const [uploadJobs, setUploadJobs] = useState<TMediaLibraryUploadJob[]>([]);
  const [trackedTranscodeJobs, setTrackedTranscodeJobs] = useState<Record<string, TMediaTranscodeJobTrackerInput>>({});
  const uploadJobsRef = useRef(uploadJobs);
  const trackedTranscodeJobsRef = useRef(trackedTranscodeJobs);
  const isMediaLibraryPathRef = useRef(false);
  const filterInstancesRef = useRef(
    new Map<string, FilterInstance<TMediaLibraryFilterProperty, TMediaLibraryExternalFilter>>()
  );
  const filterConfigsRef = useRef(new Map<string, TFilterConfig<TMediaLibraryFilterProperty, TFilterValue>[]>());
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);

  const updateUploadJob = useCallback((jobId: string, updates: Partial<TMediaLibraryUploadJob>) => {
    setUploadJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, ...updates, updatedAtMs: Date.now() } : job))
    );
  }, []);

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

  const uploadSingleJob = useCallback(
    async (job: TMediaLibraryUploadJob, packageId: string, index: number, uploadedAt: number) => {
      const latestJob = uploadJobsRef.current.find((entry) => entry.id === job.id);
      if (latestJob?.status === "cancelled") return false;

      const file = job.file;
      const format = resolveArtifactFormat(file.name);
      if (!format) {
        logMediaUploadLifecycle({
          level: "warn",
          event: "upload_rejected",
          uploadId: job.uploadId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || getFileExtension(file.name),
          error: "Unsupported file type",
        });
        updateUploadJob(job.id, {
          status: "failed",
          failedPhase: "upload",
          error: "Unsupported file type",
        });
        return false;
      }

      const artifactName = job.artifactName || buildArtifactName(file.name, uploadedAt, index);
      const title = getTitleFromFile(file.name) || "Untitled Upload";
      const description = `<p>Uploaded file: ${escapeHtml(title)}</p>`;
      const action = isVideoUploadFormat(format) ? "play" : isImageUploadFormat(format) ? "view" : "download";
      const meta = { ...job.meta };
      const requestId = buildUploadAttemptRequestId(job.uploadId, job.retryCount ?? 0);
      meta.upload_id = job.uploadId;
      meta.request_id = requestId;
      meta.upload_client = "plane-web";
      if (isDocumentUploadFormat(format)) {
        meta.kind = "document_file";
        meta.file_size = file.size;
        meta.file_type = file.type || format;
        meta.thumbnail = getDocumentThumbnailPath(format);
      }

      let uploadStartedAtMs: number | undefined;
      try {
        const abortController = new AbortController();
        const startedAtMs = Date.now();
        uploadStartedAtMs = startedAtMs;
        let lastLoggedPercent: number | null = null;
        let lastLoggedAtMs: number | null = null;
        logMediaUploadLifecycle({
          event: "upload_started",
          uploadId: job.uploadId,
          requestId,
          workspaceSlug: job.workspaceSlug,
          projectId: job.projectId,
          packageId,
          artifactName,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || format,
        });
        updateUploadJob(job.id, {
          status: "uploading",
          progress: 0,
          requestId,
          packageId,
          artifactName,
          uploadedBytes: 0,
          totalBytes: file.size,
          uploadStartedAtMs: startedAtMs,
          uploadCompletedAtMs: undefined,
          uploadSpeedBytesPerSecond: undefined,
          uploadEtaSeconds: null,
          error: undefined,
          failedPhase: undefined,
          abortController,
        });

        const artifactPayload: TMediaArtifactPayload = {
          name: artifactName,
          title,
          description,
          format,
          link: null,
          action,
          meta,
          work_item_id: job.workItemId ?? undefined,
        };
        const artifact = await mediaLibraryService.uploadArtifact(
          job.workspaceSlug,
          job.projectId,
          packageId,
          artifactPayload,
          file,
          (progressEvent) => {
            const total = progressEvent.total ?? 0;
            if (!total) return;
            const currentJob = uploadJobsRef.current.find((entry) => entry.id === job.id);
            if (currentJob?.status === "cancelled") return;
            const nowMs = Date.now();
            const metrics = calculateUploadProgressMetrics({
              loadedBytes: progressEvent.loaded,
              totalBytes: total,
              startedAtMs,
              nowMs,
            });
            if (
              shouldLogUploadProgress({
                percent: metrics.percent,
                lastLoggedPercent,
                lastLoggedAtMs,
                nowMs,
              })
            ) {
              logMediaUploadLifecycle({
                event: "upload_progress",
                uploadId: job.uploadId,
                requestId,
                workspaceSlug: job.workspaceSlug,
                projectId: job.projectId,
                packageId,
                artifactName,
                percent: metrics.percent,
                uploadedBytes: metrics.uploadedBytes,
                totalBytes: metrics.totalBytes,
                speedBytesPerSecond: metrics.speedBytesPerSecond,
                etaSeconds: metrics.etaSeconds,
              });
              lastLoggedPercent = metrics.percent;
              lastLoggedAtMs = nowMs;
            }
            updateUploadJob(job.id, {
              progress: metrics.percent,
              status: "uploading",
              uploadedBytes: metrics.uploadedBytes,
              totalBytes: metrics.totalBytes,
              uploadSpeedBytesPerSecond: metrics.speedBytesPerSecond,
              uploadEtaSeconds: metrics.etaSeconds,
            });
          },
          {
            signal: abortController.signal,
            headers: {
              "X-Upload-ID": job.uploadId,
              "X-Request-ID": requestId,
            },
          }
        );

        const uploadCompletedAtMs = Date.now();
        const uploadDurationMs = uploadCompletedAtMs - startedAtMs;
        const transcodeJobId = artifact.transcode_job?.job_id;
        logMediaUploadLifecycle({
          event: "upload_completed",
          uploadId: job.uploadId,
          requestId,
          workspaceSlug: job.workspaceSlug,
          projectId: job.projectId,
          packageId,
          artifactName,
          fileName: file.name,
          fileSize: file.size,
          durationMs: uploadDurationMs,
          transcodeJobId,
        });
        updateUploadJob(job.id, {
          artifact,
          packageId,
          abortController: undefined,
          progress: 100,
          uploadedBytes: file.size,
          totalBytes: file.size,
          uploadCompletedAtMs,
          uploadEtaSeconds: 0,
          status: isMp4Upload(file) && transcodeJobId ? "processing" : "completed",
          transcodeJobId,
        });
        refreshLibrary();

        if (isMp4Upload(file) && transcodeJobId) {
          logMediaUploadLifecycle({
            event: "transcode_tracking_started",
            uploadId: job.uploadId,
            requestId,
            workspaceSlug: job.workspaceSlug,
            projectId: job.projectId,
            packageId,
            artifactName,
            transcodeJobId,
          });
          trackTranscodeJob({
            workspaceSlug: job.workspaceSlug,
            projectId: job.projectId,
            packageId,
            artifactId: artifact.name,
            jobId: transcodeJobId,
            uploadJobId: job.id,
          });
        }

        if (isMp4Upload(file) && artifact.transcode_job_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Background transcoding was not queued",
            message: getErrorMessage(
              artifact.transcode_job_error,
              "The MP4 was uploaded, but transcoding was not queued."
            ),
          });
        }
        return true;
      } catch (error) {
        const wasCancelled =
          error && typeof error === "object" && (error as Record<string, unknown>).code === "ERR_CANCELED";
        const errorMessage = wasCancelled ? "Cancelled" : getUploadErrorMessage(error);
        logMediaUploadLifecycle({
          level: wasCancelled ? "warn" : "error",
          event: wasCancelled ? "upload_cancelled" : "upload_failed",
          uploadId: job.uploadId,
          requestId: job.requestId,
          workspaceSlug: job.workspaceSlug,
          projectId: job.projectId,
          packageId,
          artifactName,
          fileName: file.name,
          fileSize: file.size,
          durationMs: uploadStartedAtMs ? Date.now() - uploadStartedAtMs : undefined,
          error: errorMessage,
        });
        updateUploadJob(job.id, {
          status: wasCancelled ? "cancelled" : "failed",
          failedPhase: wasCancelled ? undefined : "upload",
          abortController: undefined,
          error: errorMessage,
        });
        return false;
      }
    },
    [mediaLibraryService, refreshLibrary, trackTranscodeJob, updateUploadJob]
  );

  const processUploadBatch = useCallback(
    async (jobs: TMediaLibraryUploadJob[]) => {
      if (jobs.length === 0) return;
      const { workspaceSlug, projectId } = jobs[0];
      const uploadedAt = Date.now();
      let packageId: string | null = null;

      try {
        const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
        packageId = typeof manifest?.id === "string" ? manifest.id : null;
      } catch {
        jobs.forEach((job) => {
          const latestJob = uploadJobsRef.current.find((entry) => entry.id === job.id);
          if (latestJob?.status === "cancelled") return;
          updateUploadJob(job.id, {
            status: "failed",
            failedPhase: "upload",
            error: "Unable to initialize media library",
          });
        });
        return;
      }

      if (!packageId) {
        jobs.forEach((job) => {
          const latestJob = uploadJobsRef.current.find((entry) => entry.id === job.id);
          if (latestJob?.status === "cancelled") return;
          updateUploadJob(job.id, {
            status: "failed",
            failedPhase: "upload",
            error: "Media library package not available",
          });
        });
        return;
      }

      const uploadableJobs = jobs.filter((job) => {
        const latestJob = uploadJobsRef.current.find((entry) => entry.id === job.id);
        return latestJob?.status !== "cancelled";
      });
      const results = await Promise.allSettled(
        uploadableJobs.map((job, index) => uploadSingleJob(job, packageId, index, uploadedAt))
      );
      const successCount = results.filter(
        (result): result is PromiseFulfilledResult<boolean> => result.status === "fulfilled" && result.value
      ).length;

      if (successCount > 0) {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Upload started",
          message:
            successCount === 1
              ? "File uploaded. Background processing will continue automatically."
              : `${successCount} files uploaded. Background processing will continue automatically.`,
        });
      }
    },
    [mediaLibraryService, updateUploadJob, uploadSingleJob]
  );

  const enqueueUploadBatch = useCallback(
    (input: TMediaLibraryUploadBatchInput) => {
      if (!input.files.length || !input.workspaceSlug || !input.projectId) return;
      const jobs = buildMediaLibraryUploadJobs(input);
      jobs.forEach((job) => {
        logMediaUploadLifecycle({
          event: "upload_queued",
          uploadId: job.uploadId,
          workspaceSlug: job.workspaceSlug,
          projectId: job.projectId,
          fileName: job.file.name,
          fileSize: job.file.size,
          fileType: job.file.type || getFileExtension(job.file.name),
        });
      });
      setUploadJobs((prev) => [...prev, ...jobs]);
      void processUploadBatch(jobs);
    },
    [processUploadBatch]
  );

  const cancelUploadJob = useCallback(
    (jobId: string) => {
      const job = uploadJobsRef.current.find((entry) => entry.id === jobId);
      if (!job) return;
      logMediaUploadLifecycle({
        level: "warn",
        event: "upload_cancel_requested",
        uploadId: job.uploadId,
        requestId: job.requestId,
        fileName: job.file.name,
        fileSize: job.file.size,
        percent: job.progress,
        uploadedBytes: job.uploadedBytes,
        totalBytes: job.totalBytes,
      });
      if (job.status === "uploading") {
        job.abortController?.abort();
      }
      updateUploadJob(jobId, {
        status: "cancelled",
        abortController: undefined,
        error: "Cancelled",
      });
    },
    [updateUploadJob]
  );

  const retryUploadJob = useCallback(
    (jobId: string) => {
      const job = uploadJobsRef.current.find((entry) => entry.id === jobId);
      if (!job || isActiveUploadStatus(job.status)) return;
      const retryJob: TMediaLibraryUploadJob = {
        ...job,
        status: "queued",
        progress: 0,
        requestId: undefined,
        artifactName: undefined,
        artifact: undefined,
        packageId: undefined,
        transcodeJobId: undefined,
        uploadedBytes: undefined,
        totalBytes: job.file.size,
        uploadStartedAtMs: undefined,
        uploadCompletedAtMs: undefined,
        uploadSpeedBytesPerSecond: undefined,
        uploadEtaSeconds: undefined,
        error: undefined,
        failedPhase: undefined,
        abortController: undefined,
        retryCount: (job.retryCount ?? 0) + 1,
        updatedAtMs: Date.now(),
      };
      setUploadJobs((prev) => prev.map((entry) => (entry.id === jobId ? retryJob : entry)));
      void processUploadBatch([retryJob]);
    },
    [processUploadBatch]
  );

  const dismissUploadJob = useCallback((jobId: string) => {
    const job = uploadJobsRef.current.find((entry) => entry.id === jobId);
    if (job && isActiveUploadStatus(job.status)) return;
    setUploadJobs((prev) => prev.filter((entry) => entry.id !== jobId));
  }, []);

  const clearCompletedUploadJobs = useCallback(() => {
    setUploadJobs((prev) =>
      prev.filter(
        (job) => !isCompletedUploadStatus(job.status) && job.status !== "cancelled" && job.status !== "failed"
      )
    );
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
    uploadJobsRef.current = uploadJobs;
  }, [uploadJobs]);

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
                if (job.uploadJobId) {
                  if (result.status === "FAILED" || result.status === "QUEUE_FAILED" || result.status === "CANCELLED") {
                    updateUploadJob(job.uploadJobId, {
                      status: result.status === "CANCELLED" ? "cancelled" : "failed",
                      failedPhase: result.status === "CANCELLED" ? undefined : "processing",
                      error:
                        result.error?.message ?? result.error?.code ?? `Transcoding ${result.status.toLowerCase()}`,
                    });
                  } else {
                    updateUploadJob(job.uploadJobId, {
                      status: "completed",
                      progress: 100,
                      error: undefined,
                      failedPhase: undefined,
                    });
                  }
                }
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
  }, [mediaLibraryService, refreshLibrary, trackedTranscodeJobSignature, updateUploadJob]);

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
      uploadJobs,
      openUpload,
      closeUpload,
      setPendingUploadFiles,
      libraryVersion,
      refreshLibrary,
      trackTranscodeJob,
      enqueueUploadBatch,
      cancelUploadJob,
      retryUploadJob,
      dismissUploadJob,
      clearCompletedUploadJobs,
      mediaFilters,
      setMediaFilterConfigs,
    }),
    [
      isUploadOpen,
      pendingUploadFiles,
      uploadJobs,
      openUpload,
      closeUpload,
      setPendingUploadFiles,
      libraryVersion,
      refreshLibrary,
      trackTranscodeJob,
      enqueueUploadBatch,
      cancelUploadJob,
      retryUploadJob,
      dismissUploadJob,
      clearCompletedUploadJobs,
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
