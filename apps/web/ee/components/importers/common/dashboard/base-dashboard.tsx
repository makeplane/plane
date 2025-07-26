"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Briefcase, CircleX, Info, Loader, RefreshCcw } from "lucide-react";
import { IMPORTER_TRACKER_ELEMENTS, IMPORTER_TRACKER_EVENTS } from "@plane/constants";
import { E_JOB_STATUS, TJobStatus } from "@plane/etl/core";

import { useTranslation } from "@plane/i18n";
import { TImportJob, TLogoProps } from "@plane/types";
import { Button, ModalCore, Tooltip } from "@plane/ui";
import { renderFormattedDate, renderFormattedTime } from "@plane/utils";
import { Logo } from "@/components/common";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import ImporterHeader from "../../header";
import { RerunModal, CancelModal } from "./modals";
import { DashboardLoaderTable, IconFieldRender, SyncJobStatus } from "./";

export type TImporterConfig<T> = {
  serviceName: string;
  hideProject?: boolean;
  hideWorkspace?: boolean;
  hideDeactivate?: boolean;
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

export const BaseDashboard = observer(<T,>(props: IBaseDashboardProps<T>) => {
  const { config, useImporterHook } = props;
  const { serviceName, logo, swrKey, modals, getWorkspaceName, getProjectName, getPlaneProject } = config;
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

    return ![E_JOB_STATUS.CREATED, E_JOB_STATUS.FINISHED, E_JOB_STATUS.ERROR, E_JOB_STATUS.CANCELLED].includes(
      job?.status as E_JOB_STATUS
    );
  };

  const isCancelDisabled = (job: any) => {
    if (!job || !job?.status) return true;

    return [E_JOB_STATUS.FINISHED, E_JOB_STATUS.ERROR, E_JOB_STATUS.CANCELLED].includes(job?.status as E_JOB_STATUS);
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
        captureSuccess({
          eventName: IMPORTER_TRACKER_EVENTS.RE_RUN,
          payload: {
            jobId: reRunJobId,
          },
        });
      }
    } catch (error) {
      console.error(`Error while re-running ${serviceName} job`, error);
      captureError({
        eventName: IMPORTER_TRACKER_EVENTS.RE_RUN,
        error: error as Error,
        payload: {
          jobId: reRunJobId,
        },
      });
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
        captureSuccess({
          eventName: IMPORTER_TRACKER_EVENTS.CANCEL,
          payload: {
            jobId: cancelJobId,
          },
        });
      }
    } catch (error) {
      console.error(`Error while cancelling ${serviceName} job`, error);
      captureError({
        eventName: IMPORTER_TRACKER_EVENTS.CANCEL,
        error: error as Error,
        payload: {
          jobId: cancelJobId,
        },
      });
    } finally {
      setModalLoader(false);
    }
  };

  const handleJobsRefresh = async () => {
    try {
      if (currentAuth?.isAuthenticated) {
        await fetchJobs();
        captureSuccess({
          eventName: IMPORTER_TRACKER_EVENTS.REFRESH,
          payload: {
            serviceName,
          },
        });
      }
    } catch (error) {
      console.error(`Error while refreshing ${serviceName} jobs`, error);
      captureError({
        eventName: IMPORTER_TRACKER_EVENTS.REFRESH,
        error: error as Error,
        payload: {
          serviceName,
        },
      });
    }
  };

  const handleDeactivateAuth = async () => {
    try {
      setDeactivateLoader(true);
      await deactivateAuth();
      handleDashboardView();
      captureSuccess({
        eventName: IMPORTER_TRACKER_EVENTS.DEACTIVATE,
        payload: {
          serviceName,
        },
      });
    } catch (error) {
      console.error(`Error while deactivating ${serviceName} auth`, error);
      captureError({
        eventName: IMPORTER_TRACKER_EVENTS.DEACTIVATE,
        error: error as Error,
        payload: {
          serviceName,
        },
      });
    } finally {
      setDeactivateLoader(false);
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
                  variant="link-danger"
                  size="sm"
                  onClick={handleDeactivateAuth}
                  className="bg-transparent"
                  disabled={deactivateLoader}
                  data-ph-element={IMPORTER_TRACKER_ELEMENTS.IMPORTER_DASHBOARD_DEACTIVATE_BUTTON}
                >
                  {deactivateLoader ? "Deactivating..." : "Deactivate"}
                </Button>
              )}
              {!currentAuth?.sourceTokenInvalid ? (
                <Button
                  size="sm"
                  onClick={handleDashboardView}
                  data-ph-element={IMPORTER_TRACKER_ELEMENTS.IMPORTER_DASHBOARD_IMPORT_BUTTON}
                >
                  {t("importers.import")}
                </Button>
              ) : (
                <Tooltip tooltipContent={t("importers.source_token_expired_description")}>
                  <div className="flex gap-1.5 cursor-help flex-shrink-0 items-center text-custom-text-200">
                    <Info size={12} />
                    <div className="text-xs">{t("importers.source_token_expired")}</div>
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
                <div className="flex-shrink-0 text-base font-medium py-2">{t("importers.migrations")}</div>
                <Button
                  size="sm"
                  variant="neutral-primary"
                  className="whitespace-nowrap border-none !px-1"
                  onClick={handleJobsRefresh}
                  disabled={loader === "re-fetch"}
                  data-ph-element={IMPORTER_TRACKER_ELEMENTS.IMPORTER_DASHBOARD_REFRESH_BUTTON}
                >
                  <div className="relative flex items-center gap-1.5 text-xs">
                    {loader === "re-fetch" ? <Loader size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
                    {loader === "re-fetch" && <div>{t("importers.refreshing")}</div>}
                  </div>
                </Button>
              </div>
              <div className="w-full h-full overflow-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-0 bg-custom-background-90 text-sm !font-medium text-left rounded-t">
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
                      <td className="p-3 whitespace-nowrap text-center">{t("importers.total_batches")}</td>
                      <td className="p-3 whitespace-nowrap text-center">{t("importers.imported_batches")}</td>
                      <td className="p-3 whitespace-nowrap text-center">{t("importers.re_run")}</td>
                      <td className="p-3 whitespace-nowrap text-center">{t("importers.cancel")}</td>
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
                          <tr key={job.id} className="text-sm text-custom-text-200 even:bg-custom-background-90">
                            <td className="p-3 whitespace-nowrap">{index + 1}</td>
                            <td className="p-3 whitespace-nowrap">
                              <IconFieldRender
                                icon={(() => {
                                  const planeProject = getPlaneProject(job);
                                  return planeProject?.logo_props ? (
                                    <Logo logo={planeProject.logo_props} size={16} />
                                  ) : (
                                    <Briefcase className="w-4 h-4" />
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
                            <td className="p-3 whitespace-nowrap text-center">
                              {job?.report.total_batch_count || "-"}
                            </td>
                            <td className="p-3 whitespace-nowrap text-center">
                              {job?.report.imported_batch_count || "-"}
                            </td>
                            <td className="p-3 whitespace-nowrap text-center flex justify-center">
                              <Button
                                variant="link-primary"
                                size="sm"
                                prependIcon={<RefreshCcw className="w-3 h-3" />}
                                onClick={() => handleRerunOpen(job.id)}
                                disabled={isReRunDisabled(job)}
                                data-ph-element={IMPORTER_TRACKER_ELEMENTS.IMPORTER_DASHBOARD_RE_RUN_BUTTON}
                              >
                                {t("importers.re_run")}
                              </Button>
                            </td>
                            <td className="p-3 whitespace-nowrap text-center">
                              <Button
                                variant="link-danger"
                                size="sm"
                                prependIcon={<CircleX className="w-3 h-3" />}
                                onClick={() => handleCancelOpen(job.id)}
                                disabled={isCancelDisabled(job)}
                                data-ph-element={IMPORTER_TRACKER_ELEMENTS.IMPORTER_DASHBOARD_CANCEL_BUTTON}
                              >
                                {t("importers.cancel")}
                              </Button>
                            </td>
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
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-custom-background-90">
                  <Briefcase className="h-10 w-10 text-custom-text-200" />
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <h4 className="text-xl font-medium">{t("importers.no_jobs_found")}</h4>
                  <p className="text-sm text-custom-text-200">{t("importers.no_project_imports", { serviceName })}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
});
