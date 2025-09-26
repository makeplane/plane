"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { Briefcase, Loader, RefreshCcw, ExternalLink } from "lucide-react";
import { IMPORTER_TRACKER_ELEMENTS, IMPORTER_TRACKER_EVENTS } from "@plane/constants";
import { TJobStatus } from "@plane/etl/core";

import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
import { renderFormattedDate, renderFormattedTime } from "@plane/utils";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useZipImporter } from "@/plane-web/hooks/store/importers/use-zip-importer";
import { EDocImporterDestinationType, TZipImporterProps } from "@/plane-web/types/importers/zip-importer";
import { DashboardLoaderTable, SyncJobStatus } from "../../common/dashboard";

export const ZipImporterDashboard: FC<TZipImporterProps> = observer(({ driverType, logo, serviceName }) => {
  const { t } = useTranslation();

  // hooks
  const {
    handleDashboardView,
    job: { loader, jobIds, jobById, fetchJobs },
  } = useZipImporter(driverType);

  // fetching jobs
  useSWR(`${driverType}_IMPORTER_DASHBOARD`, async () => await fetchJobs(), {
    errorRetryCount: 3,
    refreshInterval: 10000,
  });

  // handlers
  const handleJobsRefresh = async () => {
    try {
      await fetchJobs();
      captureSuccess({
        eventName: IMPORTER_TRACKER_EVENTS.REFRESH,
      });
    } catch (error) {
      console.error(`Error while refreshing ${serviceName} jobs`, error);
      captureError({
        eventName: IMPORTER_TRACKER_EVENTS.REFRESH,
        error: error as Error,
      });
    }
  };

  return (
    <div className="space-y-6 relative w-full h-full overflow-auto flex flex-col">
      {/* header */}
      <div className="flex-shrink-0 relative flex items-center gap-4 rounded bg-custom-background-90 p-4">
        <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
          <Image src={logo} layout="fill" objectFit="contain" alt={`${serviceName} Logo`} />
        </div>
        <div className="w-full h-full overflow-hidden">
          <div className="text-lg font-medium">{serviceName}</div>
          <div className="text-sm text-custom-text-200">{t("importers.import_message", { serviceName })}</div>
        </div>
        <div className="flex-shrink-0 relative flex items-center gap-4">
          <Button
            size="sm"
            onClick={handleDashboardView}
            data-ph-element={IMPORTER_TRACKER_ELEMENTS.IMPORTER_DASHBOARD_IMPORT_BUTTON}
          >
            {t("importers.import")}
          </Button>
        </div>
      </div>
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
                    <td className="p-3 whitespace-nowrap">File Name</td>
                    <td className="p-3 whitespace-nowrap text-center">{t("importers.status")}</td>
                    <td className="p-3 whitespace-nowrap text-center">{t("importers.destination")}</td>
                    <td className="p-3 whitespace-nowrap text-center">{t("importers.project")}</td>
                    <td className="p-3 whitespace-nowrap text-center">{t("importers.teamspace")}</td>
                    <td className="p-3 whitespace-nowrap text-center">Total Import Phases</td>
                    <td className="p-3 whitespace-nowrap text-center">Current Import Phase</td>
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
                            {job?.config?.fileName
                              ? job.config.fileName.replace(/\.zip$/i, "").substring(0, 40) +
                                (job.config.fileName.length > 40 ? "..." : "")
                              : "---"}
                          </td>
                          <td className="p-3 whitespace-nowrap text-center">
                            <div className="flex items-center gap-2">
                              <SyncJobStatus status={job?.status as TJobStatus} />
                              {job?.config?.metadata?.rootNodeUrl && (
                                <Link
                                  href={job?.config?.metadata?.rootNodeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3 flex-shrink-0 text-custom-primary-100" />
                                </Link>
                              )}
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap text-center capitalize">
                            {job?.config?.destination?.type || "Wiki"}
                          </td>
                          <td className="p-3 whitespace-nowrap text-center capitalize">
                            {job?.config?.destination?.type === EDocImporterDestinationType.PROJECT
                              ? job?.config?.destination?.project_name
                              : "-"}
                          </td>
                          <td className="p-3 whitespace-nowrap text-center capitalize">
                            {job?.config?.destination?.type === EDocImporterDestinationType.TEAMSPACE
                              ? job?.config?.destination?.teamspace_name
                              : "-"}
                          </td>
                          <td className="p-3 whitespace-nowrap text-center">{job?.report.total_batch_count || "-"}</td>
                          <td className="p-3 whitespace-nowrap text-center">
                            {job?.report.imported_batch_count || "-"}
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
  );
});
