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

import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { Loader, RefreshCcw } from "lucide-react";
// Plane imports
import { NewTabIcon, ProjectIcon } from "@plane/propel/icons";
import type { TJobStatus } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { renderFormattedDate, renderFormattedTime } from "@plane/utils";
// plane web hooks
import { useZipImporter } from "@/plane-web/hooks/store/importers/use-zip-importer";
import type { TZipImporterProps } from "@/types/importers/zip-importer";
import { EDocImporterDestinationType } from "@/types/importers/zip-importer";
import { DashboardLoaderTable, SyncJobStatus } from "../../common/dashboard";

export const ZipImporterDashboard = observer(function ZipImporterDashboard({
  driverType,
  logo,
  serviceName,
}: TZipImporterProps) {
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
    } catch (error) {
      console.error(`Error while refreshing ${serviceName} jobs`, error);
    }
  };

  return (
    <div className="space-y-6 relative w-full h-full overflow-auto flex flex-col">
      {/* header */}
      <div className="flex-shrink-0 relative flex items-center gap-4 rounded-sm bg-layer-1 p-4">
        <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
          <img src={logo} alt={`${serviceName} Logo`} className="w-full h-full object-cover" />
        </div>
        <div className="w-full h-full overflow-hidden">
          <div className="text-16 font-medium">{serviceName}</div>
          <div className="text-13 text-secondary">{t("importers.import_message", { serviceName })}</div>
        </div>
        <div className="flex-shrink-0 relative flex items-center gap-4">
          <Button onClick={handleDashboardView}>{t("importers.import")}</Button>
        </div>
      </div>
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
                        <tr key={job.id} className="text-13 text-secondary even:bg-layer-1">
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
                                  <NewTabIcon className="h-3 w-3 flex-shrink-0 text-accent-primary" />
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
  );
});
