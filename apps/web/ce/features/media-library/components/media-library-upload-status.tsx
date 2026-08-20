"use client";

import { Fragment, useMemo } from "react";
import { Popover, Transition } from "@headlessui/react";
import { AlertTriangle, CheckCircle2, Clock3, Loader2, RefreshCw, Trash2, UploadCloud, X } from "lucide-react";
import { useMediaLibrary } from "../store/media-library-context";
import {
  formatFileSize,
  getUploadStatusLabel,
  getVisibleUploadProgress,
  isActiveUploadStatus,
  type TMediaLibraryUploadJob,
} from "../utils/media-library-upload-jobs";
import { formatUploadEta, formatUploadSpeed } from "../utils/upload-progress";

const statusToneClass = (status: TMediaLibraryUploadJob["status"]) => {
  if (status === "failed") return "text-red-500 dark:text-[#FF3434]";
  if (status === "completed") return "text-green-500 dark:text-[#12D8A0]";
  if (status === "cancelled") return "text-custom-text-400";
  return "text-custom-primary-100 dark:text-[#2D9CDB]";
};

const statusProgressClass = (status: TMediaLibraryUploadJob["status"]) => {
  if (status === "failed") return "bg-red-500 dark:bg-[#FF3434]";
  if (status === "completed") return "bg-green-500 dark:bg-[#12D8A0]";
  if (status === "cancelled") return "bg-custom-text-400";
  return "bg-custom-primary-100 dark:bg-[#2D9CDB]";
};

const UploadStatusIcon = ({ status }: { status: TMediaLibraryUploadJob["status"] }) => {
  if (status === "failed") return <AlertTriangle className="h-3.5 w-3.5" />;
  if (status === "completed") return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === "cancelled") return <X className="h-3.5 w-3.5" />;
  if (status === "uploading" || status === "processing") return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  return <Clock3 className="h-3.5 w-3.5" />;
};

const UploadJobRow = ({ job }: { job: TMediaLibraryUploadJob }) => {
  const { cancelUploadJob, retryUploadJob, dismissUploadJob } = useMediaLibrary();
  const progress = getVisibleUploadProgress(job);
  const isActive = isActiveUploadStatus(job.status);
  const isFinished = job.status === "completed" || job.status === "failed" || job.status === "cancelled";
  const uploadDetail =
    job.status === "uploading"
      ? `${formatUploadSpeed(job.uploadSpeedBytesPerSecond ?? 0)} / ${formatUploadEta(job.uploadEtaSeconds)}`
      : null;

  return (
    <div className="border-b border-custom-border-200 px-3 py-3 last:border-b-0 dark:border-[#2A2A2A]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded border border-custom-border-200 text-custom-text-400 dark:border-[#303030]">
          <UploadCloud className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0 truncate text-xs font-semibold text-custom-text-100">{job.file.name}</div>
            <div className="shrink-0 text-[11px] text-custom-text-400">{formatFileSize(job.file.size)}</div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-custom-border-200 dark:bg-[#242424]">
              <div
                className={`h-full rounded-full transition-[width] ${statusProgressClass(job.status)}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className={`w-9 text-right text-[11px] font-medium ${statusToneClass(job.status)}`}>{progress}%</div>
          </div>
          <div className={`mt-1 flex min-w-0 items-center gap-1.5 text-xs ${statusToneClass(job.status)}`}>
            <UploadStatusIcon status={job.status} />
            <span className="shrink-0">{getUploadStatusLabel(job.status)}</span>
            {uploadDetail ? <span className="min-w-0 truncate text-custom-text-400">/ {uploadDetail}</span> : null}
          </div>
          {job.error ? (
            <div className="mt-1 truncate text-[11px] text-red-500 dark:text-[#FF3434]">{job.error}</div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {job.status === "queued" || job.status === "uploading" ? (
            <button
              type="button"
              className="rounded px-2 py-1 text-[11px] font-medium text-custom-text-400 hover:bg-custom-background-80 hover:text-custom-text-100"
              onClick={() => cancelUploadJob(job.id)}
            >
              Cancel
            </button>
          ) : null}
          {job.status === "failed" || job.status === "cancelled" ? (
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-custom-primary-100 hover:bg-custom-background-80"
              aria-label={`Retry ${job.file.name}`}
              onClick={() => retryUploadJob(job.id)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {isFinished ? (
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-custom-text-400 hover:bg-custom-background-80 hover:text-custom-text-100"
              aria-label={`Dismiss ${job.file.name}`}
              onClick={() => dismissUploadJob(job.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const MediaLibraryUploadStatus = () => {
  const { uploadJobs, clearCompletedUploadJobs } = useMediaLibrary();
  const summary = useMemo(() => {
    const activeJobs = uploadJobs.filter((job) => isActiveUploadStatus(job.status));
    const uploadingJobs = uploadJobs.filter((job) => job.status === "uploading");
    const processingJobs = uploadJobs.filter((job) => job.status === "processing");
    const failedJobs = uploadJobs.filter((job) => job.status === "failed");
    const completedJobs = uploadJobs.filter((job) => job.status === "completed");
    const cancelledJobs = uploadJobs.filter((job) => job.status === "cancelled");
    const aggregateProgress = uploadJobs.length
      ? Math.round(uploadJobs.reduce((total, job) => total + getVisibleUploadProgress(job), 0) / uploadJobs.length)
      : 0;

    let label = "";
    if (uploadingJobs.length > 0) label = `${uploadingJobs.length} Uploading`;
    else if (processingJobs.length > 0) label = `${processingJobs.length} Processing`;
    else if (activeJobs.length > 0) label = `${activeJobs.length} Queued`;
    else if (failedJobs.length > 0) label = `${failedJobs.length} Failed`;
    else if (completedJobs.length > 0) label = `${completedJobs.length} Completed`;
    else if (cancelledJobs.length > 0) label = `${cancelledJobs.length} Cancelled`;

    return {
      activeCount: activeJobs.length,
      finishedCount: completedJobs.length + failedJobs.length + cancelledJobs.length,
      label,
      aggregateProgress,
    };
  }, [uploadJobs]);

  if (uploadJobs.length === 0) return null;

  return (
    <Popover className="relative">
      <Popover.Button
        type="button"
        className="inline-flex h-8 items-center gap-1.5 rounded border border-custom-border-200 bg-custom-background-100 px-2 text-xs font-medium text-custom-text-200 transition hover:bg-custom-background-80 dark:border-[#303030] dark:bg-[#151515]"
        aria-label="Open upload progress"
      >
        <UploadCloud
          className={`h-3.5 w-3.5 ${summary.activeCount > 0 ? "text-custom-primary-100 dark:text-[#2D9CDB]" : ""}`}
        />
        <span className="hidden @4xl:inline">{summary.label}</span>
        {summary.activeCount > 0 ? (
          <span className="hidden h-1.5 w-10 overflow-hidden rounded-full bg-custom-border-200 dark:bg-[#242424] @4xl:inline-flex">
            <span
              className="h-full rounded-full bg-custom-primary-100 dark:bg-[#2D9CDB]"
              style={{ width: `${summary.aggregateProgress}%` }}
            />
          </span>
        ) : null}
      </Popover.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute right-0 z-30 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100 shadow-custom-shadow-md dark:border-[#303030] dark:bg-[#151515]">
          <div className="flex items-center justify-between border-b border-custom-border-200 px-3 py-2.5 dark:border-[#2A2A2A]">
            <div>
              <div className="text-sm font-semibold text-custom-text-100">Uploads</div>
              <div className="text-[11px] text-custom-text-400">{summary.label}</div>
            </div>
            {summary.finishedCount > 0 ? (
              <button
                type="button"
                className="text-xs font-medium text-custom-text-400 hover:text-custom-text-100"
                onClick={clearCompletedUploadJobs}
              >
                Clear finished
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {uploadJobs.map((job) => (
              <UploadJobRow key={job.id} job={job} />
            ))}
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};
