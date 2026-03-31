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
import { InfoIcon, Loader, RefreshCcw } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { ProjectIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TImportJob, TLogoProps } from "@plane/types";
import { Table } from "@plane/ui";
import { ModalCore } from "@plane/ui";
import ImporterHeader from "../../header";
import { RerunModal, CancelModal } from "./modals";
import { DashboardLoaderTable } from "./loader/table";
import { useColumns } from "./useColumns";

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
  const { serviceName, swrKey, modals } = config;
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

  const RerunModalComponent = modals?.rerun || RerunModal;
  const CancelModalComponent = modals?.cancel || CancelModal;

  const displayData =
    jobIds
      ?.map((jobId, index) => {
        const job = jobById(jobId);
        return job ? { job, index } : null;
      })
      .filter((row): row is { job: TImportJob<T>; index: number } => row !== null) ?? [];

  const columns = useColumns({
    config,
    onRerunOpen: handleRerunOpen,
    onCancelOpen: handleCancelOpen,
  });

  return (
    <>
      <ModalCore isOpen={isRerunModalOpen} handleClose={handleClose}>
        <RerunModalComponent onClose={handleClose} onSubmit={handleReRunJob} isLoading={modalLoader} />
      </ModalCore>

      <ModalCore isOpen={isCancelModalOpen} handleClose={handleClose}>
        <CancelModalComponent onClose={handleClose} onSubmit={handleCancelJob} isLoading={modalLoader} />
      </ModalCore>
      <div className="relative -mb-9 flex w-full min-h-0 flex-col gap-6 overflow-hidden max-h-[calc(100dvh-8rem)]">
        {/* header */}
        <div className="shrink-0">
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
        </div>
        {/* migrations */}
        <div className="w-full min-h-0 flex-1 flex flex-col gap-3">
          {loader ? (
            <DashboardLoaderTable />
          ) : jobIds && jobIds.length > 0 ? (
            <div className="w-full min-h-0 flex-1 flex flex-col gap-3">
              <div className="shrink-0 flex items-center gap-2">
                <div className="shrink-0 text-14 font-medium py-2">{t("importers.migrations")}</div>
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
              <div className="min-h-0 flex-1 w-full overflow-auto vertical-scrollbar horizontal-scrollbar scrollbar-sm">
                <Table
                  data={displayData}
                  columns={columns}
                  keyExtractor={(row) => row.job.id}
                  tableClassName="min-w-full overflow-visible border-separate border-spacing-0"
                  thClassName="sticky top-0 z-10 border-y border-subtle bg-layer-1 text-left font-medium divide-x-0 text-placeholder"
                  tBodyClassName="divide-y-0"
                  tBodyTrClassName="divide-x-0 text-secondary"
                  tHeadTrClassName="divide-x-0"
                />
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
