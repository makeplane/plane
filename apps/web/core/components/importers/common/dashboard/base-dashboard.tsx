/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { CircleX, Download, InfoIcon, Loader, RefreshCcw } from "lucide-react";
import type { TJobStatus } from "@plane/etl/core";
import { E_JOB_STATUS } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TImportJob, TLogoProps } from "@plane/types";
import { ModalCore } from "@plane/ui";
import { renderFormattedDate, renderFormattedTime, getEditorAssetSrc } from "@plane/utils";
import ImporterHeader from "../../header";
import { RerunModal, CancelModal } from "./modals";
import { DashboardLoaderTable } from "./loader/table";
import { IconFieldRender } from "./icon-field-render";
import { SyncJobStatus } from "./status";

export type TImporterConfig<T> = {
  serviceName: string;
  hideProject?: boolean;
  hideWorkspace?: boolean;
  hideDeactivate?: boolean;
  hideBatches?: boolean;
  hideRerun?: boolean;
  hideCancel?: boolean;
  showSummary?: boolean;
  useReportForSummary?: boolean;
  getWorkspaceName: (job: TImportJob<T>) => string;
  getProjectName: (job: TImportJob<T>) => string;
  getPlaneProject: (job: TImportJob<T>) =>
    | {
        name?: string;
        logo_props?: TLogoProps;
      }
    | undefined;
  logo: any;
  swrKey: string;
  modals?: {
    rerun?: FC<{ onClose: () => void; onSubmit: () => void; isLoading: boolean }>;
    cancel?: FC<{ onClose: () => void; onSubmit: () => void; isLoading: boolean }>;
  };
};

export type TImporterHook<T> = {
  handleDashboardView: () => void;
  auth: {
    currentAuth?: {
      isAuthenticated: boolean;
      sourceTokenInvalid: boolean;
    };
    deactivateAuth: () => Promise<void>;
    apiTokenVerification?: () => Promise<{ message: string } | undefined>;
  };
  job: {
    loader: "fetch" | "re-fetch" | "fetch_by_id" | "create" | "start" | "create_config" | undefined;
    error: object;
    workspaceId: string | undefined;
    externalApiToken: string | undefined;
    jobIds: string[] | undefined;
    jobById: (id: string) => TImportJob<T> | undefined;
    fetchJobs: (loader?: "fetch" | "re-fetch") => Promise<TImportJob<T>[] | undefined>;
    startJob: (jobId: string) => Promise<void>;
    cancelJob: (jobId: string) => Promise<void>;
  };
};

export interface IBaseDashboardProps<T> {
  config: TImporterConfig<T>;
  useImporterHook: () => TImporterHook<T>;
}

export const BaseDashboard = observer(function BaseDashboard<T>(props: IBaseDashboardProps<T>) {
  const { config, useImporterHook } = props;
  const {
    serviceName,
    swrKey,
    modals,
    getWorkspaceName,
    getProjectName,
    getPlaneProject,
    hideBatches,
    hideRerun,
    hideCancel,
    showSummary,
    useReportForSummary,
  } = config;
  const { t } = useTranslation();

  // hooks
  const {
    auth: { currentAuth, deactivateAuth },
    handleDashboardView,
    job: { loader, jobIds, jobById, startJob, cancelJob, fetchJobs },
  } = useImporterHook();

  // states
  const [deactivateLoader, setDeactivateLoader] = useState<boolean>(false);
  const [reRunJobId, setReRunJobId] = useState<string | undefined>(undefined);
  const [cancelJobId, setCancelJobId] = useState<string | undefined>(undefined);
  const [isRerunModalOpen, setIsRerunModalOpen] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [modalLoader, setModalLoader] = useState<boolean>(false);

  // fetching jobs
  useSWR(
    currentAuth?.isAuthenticated ? swrKey : null,
    currentAuth?.isAuthenticated ? async () => await fetchJobs() : null,
    { errorRetryCount: 0, refreshInterval: 30000 }
  );

  // derived values
  const isReRunDisabled = (job: any) => {
    if (!job || !job?.status) return true;

    return ![
      E_JOB_STATUS.CREATED,
      E_JOB_STATUS.FINISHED,
      E_JOB_STATUS.ERROR,
      E_JOB_STATUS.TIMED_OUT,
      E_JOB_STATUS.CANCELLED,
      E_JOB_STATUS.QUEUED,
    ].includes(job?.status as E_JOB_STATUS);
  };

  const isCancelDisabled = (job: any) => {
    if (!job || !job?.status) return true;

    return [E_JOB_STATUS.FINISHED, E_JOB_STATUS.ERROR, E_JOB_STATUS.TIMED_OUT, E_JOB_STATUS.CANCELLED].includes(
      job?.status as E_JOB_STATUS
    );
  };

  const handleSummaryRedirect = (workspaceSlug: string, assetId: string) => {
    const source = getEditorAssetSrc({
      workspaceSlug,
      assetId,
    });

    window.open(source, "_blank");
  };

  // handlers
  const handleRerunOpen = (jobId: string) => {
    setReRunJobId(jobId);
    setIsRerunModalOpen(true);
  };

  const handleCancelOpen = (jobId: string) => {
    setCancelJobId(jobId);
    setIsCancelModalOpen(true);
  };

  const handleClose = () => {
    setReRunJobId(undefined);
    setCancelJobId(undefined);
    setIsRerunModalOpen(false);
    setIsCancelModalOpen(false);
  };

  const handleReRunJob = async () => {
    try {
      if (currentAuth?.isAuthenticated && reRunJobId) {
        setModalLoader(true);
        await startJob(reRunJobId);
        await handleJobsRefresh();
        handleClose();
      }
    } catch (error) {
      console.error(`Error while re-running ${serviceName} job`, error);
    } finally {
      setModalLoader(false);
    }
  };

  const handleCancelJob = async () => {
    try {
      if (currentAuth?.isAuthenticated && cancelJobId) {
        setModalLoader(true);
        await cancelJob(cancelJobId);
        await handleJobsRefresh();
        handleClose();
      }
    } catch (error) {
      console.error(`Error while cancelling ${serviceName} job`, error);
    } finally {
      setModalLoader(false);
    }
  };

  const handleJobsRefresh = async () => {
    try {
      if (currentAuth?.isAuthenticated) {
        await fetchJobs();
      }
    } catch (error) {
      console.error(`Error while refreshing ${serviceName} jobs`, error);
    }
  };

  const handleDeactivateAuth = async () => {
    try {
      setDeactivateLoader(true);
      await deactivateAuth();
      handleDashboardView();
    } catch (error) {
      console.error(`Error while deactivating ${serviceName} auth`, error);
    } finally {
      setDeactivateLoader(false);
    }
  };

  const isSummaryDisabled = (job: TImportJob<T>) => {
    if (useReportForSummary) {
      return job.status !== E_JOB_STATUS.FINISHED && job.status !== E_JOB_STATUS.ERROR;
    }

    return !job.report.summary_asset;
  };

  const handleDownloadSummary = (job: TImportJob<T>) => {
    if (useReportForSummary) {
      const summary = {
        job_id: job.id,
        status: job.status,
        initiator_id: job.initiator_id,
        workspace_id: job.workspace_id,
        config: job.config,
        report: {
          total_issue_count: job.report.total_issue_count,
          imported_issue_count: job.report.imported_issue_count,
          errored_issue_count: job.report.errored_issue_count,
          start_time: job.report.start_time,
          end_time: job.report.end_time,
        },
        success_metadata: job.success_metadata,
        error_metadata: job.error_metadata,
      };

      const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `import-summary-${job.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const workspaceSlug = job.workspace_slug;
      const assetId = job.report.summary_asset as string | undefined;

      if (assetId) {
        const source = getEditorAssetSrc({
          workspaceSlug,
          assetId,
        });

        window.open(source, "_blank");
      }
    }
  };

  const RerunModalComponent = modals?.rerun || RerunModal;
  const CancelModalComponent = modals?.cancel || CancelModal;

  return (
    <>
      <ModalCore isOpen={isRerunModalOpen} handleClose={handleClose}>
        <RerunModalComponent onClose={handleClose} onSubmit={handleReRunJob} isLoading={modalLoader} />
      </ModalCore>

      <ModalCore isOpen={isCancelModalOpen} handleClose={handleClose}>
        <CancelModalComponent onClose={handleClose} onSubmit={handleCancelJob} isLoading={modalLoader} />
      </ModalCore>
      <div className="space-y-6 relative w-full h-full overflow-auto flex flex-col">
        {/* header */}
        <ImporterHeader
          config={config}
          actions={
            <div className="flex-shrink-0 relative flex items-center gap-4">
              {!config.hideDeactivate && (
                <Button
                  variant="error-outline"
                  onClick={handleDeactivateAuth}
                  className="bg-transparent"
                  disabled={deactivateLoader}
                >
                  {deactivateLoader ? "Deactivating..." : "Deactivate"}
                </Button>
              )}
              {!currentAuth?.sourceTokenInvalid ? (
                <Button onClick={handleDashboardView}>{t("importers.import")}</Button>
              ) : (
                <Tooltip tooltipContent={t("importers.source_token_expired_description")}>
                  <div className="flex gap-1.5 cursor-help flex-shrink-0 items-center text-secondary">
                    <InfoIcon height={12} width={12} />
                    <div className="text-11">{t("importers.source_token_expired")}</div>
                  </div>
                </Tooltip>
              )}
            </div>
          }
        />
        {/* migrations */}
        <div className="w-full h-full space-y-3 relative flex flex-col">
          {loader ? (
            <DashboardLoaderTable />
          ) : jobIds && jobIds.length > 0 ? (
            <div className="w-full h-full space-y-3 relative flex flex-col">
              <div className="relative flex items-center gap-2">
                <div className="flex-shrink-0 text-14 font-medium py-2">{t("importers.migrations")}</div>
                <Button
                  variant="secondary"
                  className="whitespace-nowrap border-none !px-1"
                  onClick={handleJobsRefresh}
                  disabled={loader === "re-fetch"}
                >
                  <div className="relative flex items-center gap-1.5 text-11">
                    {loader === "re-fetch" ? <Loader size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
                    {loader === "re-fetch" && <div>{t("importers.refreshing")}</div>}
                  </div>
                </Button>
              </div>
              <div className="w-full h-full overflow-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-0 bg-layer-1 text-13 !font-medium text-left rounded-t">
                      <td className="p-3 whitespace-nowrap">{t("importers.serial_number")}</td>
                      <td className="p-3 whitespace-nowrap">Plane {t("importers.project")}</td>
                      {!config.hideWorkspace && (
                        <td className="p-3 whitespace-nowrap">
                          {serviceName} {t("importers.workspace")}
                        </td>
                      )}
                      {!config.hideProject && (
                        <td className="p-3 whitespace-nowrap">
                          {serviceName} {t("importers.project")}
                        </td>
                      )}
                      <td className="p-3 whitespace-nowrap text-center">{t("importers.status")}</td>
                      {showSummary && <td className="p-3 whitespace-nowrap text-center">Summary</td>}
                      {!hideBatches && (
                        <>
                          <td className="p-3 whitespace-nowrap text-center">{t("importers.total_batches")}</td>
                          <td className="p-3 whitespace-nowrap text-center">{t("importers.imported_batches")}</td>
                        </>
                      )}
                      {!hideRerun && <td className="p-3 whitespace-nowrap text-center">{t("importers.re_run")}</td>}
                      {!hideCancel && <td className="p-3 whitespace-nowrap text-center">{t("importers.cancel")}</td>}
                      <td className="p-3 whitespace-nowrap text-center">{t("importers.start_time")}</td>
                    </tr>
                  </thead>
                  <tbody>
                    {jobIds &&
                      jobIds.length > 0 &&
                      jobIds.map((jobId, index) => {
                        const job = jobById(jobId);
                        if (!job) return null;

                        return (
                          <tr key={job.id} className="text-13 text-secondary even:bg-layer-1">
                            <td className="p-3 whitespace-nowrap">{index + 1}</td>
                            <td className="p-3 whitespace-nowrap">
                              <IconFieldRender
                                icon={(() => {
                                  const planeProject = getPlaneProject(job);
                                  return planeProject?.logo_props ? (
                                    <Logo logo={planeProject.logo_props} size={16} />
                                  ) : (
                                    <ProjectIcon className="w-4 h-4" />
                                  );
                                })()}
                                title={getPlaneProject(job)?.name || "--"}
                              />
                            </td>
                            {!config.hideWorkspace && (
                              <td className="p-3 whitespace-nowrap">
                                <IconFieldRender title={getWorkspaceName(job) || "--"} />
                              </td>
                            )}
                            {!config.hideProject && (
                              <td className="p-3 whitespace-nowrap">
                                <IconFieldRender title={getProjectName(job) || "--"} />
                              </td>
                            )}
                            <td className="p-3 whitespace-nowrap text-center">
                              <SyncJobStatus status={job?.status as TJobStatus} />
                            </td>
                            {showSummary && (
                              <td className="p-3 whitespace-nowrap text-center">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  prependIcon={<Download className="w-3 h-3" />}
                                  onClick={() => handleDownloadSummary(job)}
                                  disabled={isSummaryDisabled(job)}
                                >
                                  Summary
                                </Button>
                              </td>
                            )}
                            {!hideBatches && (
                              <>
                                <td className="p-3 whitespace-nowrap text-center">
                                  {job?.report.total_batch_count || "-"}
                                </td>
                                <td className="p-3 whitespace-nowrap text-center">
                                  {job?.report.imported_batch_count || "-"}
                                </td>
                              </>
                            )}
                            {!hideRerun && (
                              <td className="p-3 whitespace-nowrap text-center flex justify-center">
                                <Button
                                  variant="link"
                                  prependIcon={<RefreshCcw className="w-3 h-3" />}
                                  onClick={() => handleRerunOpen(job.id)}
                                  disabled={isReRunDisabled(job)}
                                >
                                  {t("importers.re_run")}
                                </Button>
                              </td>
                            )}
                            {!hideCancel && (
                              <td className="p-3 whitespace-nowrap text-center">
                                <Button
                                  variant="error-outline"
                                  prependIcon={<CircleX className="w-3 h-3" />}
                                  onClick={() => handleCancelOpen(job.id)}
                                  disabled={isCancelDisabled(job)}
                                >
                                  {t("importers.cancel")}
                                </Button>
                              </td>
                            )}
                            <td className="p-3 whitespace-nowrap text-center">
                              {job?.report.start_time
                                ? `${renderFormattedDate(job?.report.start_time)} ${renderFormattedTime(job?.report.start_time, "12-hour")}`
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center p-5">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-layer-1">
                  <ProjectIcon className="h-10 w-10 text-secondary" />
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <h4 className="text-18 font-medium">{t("importers.no_jobs_found")}</h4>
                  <p className="text-13 text-secondary">{t("importers.no_project_imports", { serviceName })}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
});
