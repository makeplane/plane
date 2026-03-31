/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { CircleX, Download, RefreshCcw } from "lucide-react";
import type { TJobStatus } from "@plane/etl/core";
import { E_JOB_STATUS } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon } from "@plane/propel/icons";
import type { TImportJob } from "@plane/types";
import { renderFormattedDate, renderFormattedTime, getEditorAssetSrc } from "@plane/utils";
import { IconFieldRender } from "./icon-field-render";
import { SyncJobStatus } from "./status";
import type { TImporterConfig } from "./base-dashboard";

export type RowData<T> = { job: TImportJob<T>; index: number };

export type UseColumnsParams<T> = {
  config: TImporterConfig<T>;
  onRerunOpen: (jobId: string) => void;
  onCancelOpen: (jobId: string) => void;
};

export function useColumns<T>(params: UseColumnsParams<T>) {
  const { t } = useTranslation();
  const { config, onRerunOpen, onCancelOpen } = params;
  const {
    useReportForSummary,
    serviceName,
    hideWorkspace,
    hideProject,
    hideBatches,
    hideRerun,
    hideCancel,
    showSummary,
    getWorkspaceName,
    getProjectName,
    getPlaneProject,
  } = config;

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
        const source = getEditorAssetSrc({ workspaceSlug, assetId });
        window.open(source, "_blank");
      }
    }
  };

  const isReRunDisabled = (job: TImportJob<T>) => {
    if (!job?.status) return true;
    return ![
      E_JOB_STATUS.CREATED,
      E_JOB_STATUS.FINISHED,
      E_JOB_STATUS.ERROR,
      E_JOB_STATUS.TIMED_OUT,
      E_JOB_STATUS.CANCELLED,
      E_JOB_STATUS.QUEUED,
    ].includes(job.status as E_JOB_STATUS);
  };

  const isCancelDisabled = (job: TImportJob<T>) => {
    if (!job?.status) return true;
    return [E_JOB_STATUS.FINISHED, E_JOB_STATUS.ERROR, E_JOB_STATUS.TIMED_OUT, E_JOB_STATUS.CANCELLED].includes(
      job.status as E_JOB_STATUS
    );
  };

  return [
    {
      key: "serial",
      content: t("importers.serial_number"),
      thRender: () => <div className="text-left">{t("importers.serial_number")}</div>,
      tdRender: (row: RowData<T>) => <div className="text-left">{row.index + 1}</div>,
    },
    {
      key: "plane-project",
      content: `Plane ${t("importers.project")}`,
      thRender: () => <div className="text-left">{`Plane ${t("importers.project")}`}</div>,
      tdRender: (row: RowData<T>) => {
        const planeProject = getPlaneProject(row.job);
        return (
          <div className="text-left">
            <IconFieldRender
              icon={
                planeProject?.logo_props ? (
                  <Logo logo={planeProject?.logo_props} size={16} />
                ) : (
                  <ProjectIcon className="w-4 h-4" />
                )
              }
              title={planeProject?.name || "--"}
            />
          </div>
        );
      },
    },
    ...(!hideWorkspace
      ? [
          {
            key: "workspace",
            content: `${serviceName} ${t("importers.workspace")}`,
            thRender: () => <div className="text-left">{`${serviceName} ${t("importers.workspace")}`}</div>,
            tdRender: (row: RowData<T>) => (
              <div className="text-left">
                <IconFieldRender title={getWorkspaceName(row.job) || "--"} />
              </div>
            ),
          },
        ]
      : []),
    ...(!hideProject
      ? [
          {
            key: "project",
            content: `${serviceName} ${t("importers.project")}`,
            thRender: () => <div className="text-left">{`${serviceName} ${t("importers.project")}`}</div>,
            tdRender: (row: RowData<T>) => (
              <div className="text-left">
                <IconFieldRender title={getProjectName(row.job) || "--"} />
              </div>
            ),
          },
        ]
      : []),
    {
      key: "status",
      content: t("importers.status"),
      thRender: () => <div className="w-full text-center">{t("importers.status")}</div>,
      tdRender: (row: RowData<T>) => (
        <div className="flex w-full justify-center">
          <SyncJobStatus status={row.job?.status as TJobStatus} />
        </div>
      ),
    },
    ...(showSummary
      ? [
          {
            key: "summary",
            content: "Summary",
            thRender: () => <div className="w-full text-center">Summary</div>,
            tdRender: (row: RowData<T>) => (
              <div className="flex w-full justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  prependIcon={<Download className="w-3 h-3" />}
                  onClick={() => handleDownloadSummary(row.job)}
                  disabled={isSummaryDisabled(row.job)}
                >
                  Summary
                </Button>
              </div>
            ),
          },
        ]
      : []),
    ...(!hideBatches
      ? [
          {
            key: "total-batches",
            content: t("importers.total_batches"),
            thRender: () => <div className="w-full text-center">{t("importers.total_batches")}</div>,
            tdRender: (row: RowData<T>) => (
              <div className="w-full text-center">{row.job?.report.total_batch_count || "-"}</div>
            ),
          },
          {
            key: "imported-batches",
            content: t("importers.imported_batches"),
            thRender: () => <div className="w-full text-center">{t("importers.imported_batches")}</div>,
            tdRender: (row: RowData<T>) => (
              <div className="w-full text-center">{row.job?.report.imported_batch_count || "-"}</div>
            ),
          },
        ]
      : []),
    ...(!hideRerun
      ? [
          {
            key: "rerun",
            content: t("importers.re_run"),
            thRender: () => <div className="w-full text-center">{t("importers.re_run")}</div>,
            tdRender: (row: RowData<T>) => (
              <div className="flex w-full justify-center">
                <Button
                  variant="link"
                  prependIcon={<RefreshCcw className="w-3 h-3" />}
                  onClick={() => onRerunOpen(row.job.id)}
                  disabled={isReRunDisabled(row.job)}
                >
                  {t("importers.re_run")}
                </Button>
              </div>
            ),
          },
        ]
      : []),
    ...(!hideCancel
      ? [
          {
            key: "cancel",
            content: t("importers.cancel"),
            thRender: () => <div className="w-full text-center">{t("importers.cancel")}</div>,
            tdRender: (row: RowData<T>) => (
              <div className="flex w-full justify-center">
                <Button
                  variant="error-outline"
                  prependIcon={<CircleX className="w-3 h-3" />}
                  onClick={() => onCancelOpen(row.job.id)}
                  disabled={isCancelDisabled(row.job)}
                >
                  {t("importers.cancel")}
                </Button>
              </div>
            ),
          },
        ]
      : []),
    {
      key: "start-time",
      content: t("importers.start_time"),
      thRender: () => <div className="w-full text-center">{t("importers.start_time")}</div>,
      tdRender: (row: RowData<T>) => (
        <div className="w-full text-center">
          {row.job?.report.start_time
            ? `${renderFormattedDate(row.job.report.start_time)} ${renderFormattedTime(row.job.report.start_time, "12-hour")}`
            : "-"}
        </div>
      ),
    },
  ];
}
