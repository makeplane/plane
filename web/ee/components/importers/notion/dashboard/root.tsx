"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Briefcase, Loader, RefreshCcw } from "lucide-react";
import { TJobStatus } from "@plane/etl/core";

import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
import { renderFormattedDate, renderFormattedTime } from "@plane/utils";
import { useNotionImporter } from "@/plane-web/hooks/store";
import NotionLogo from "@/public/services/notion.svg";
import { DashboardLoaderTable, SyncJobStatus } from "../../common/dashboard";
import ImporterHeader from "../../header";

export const NotionJobDashboard: FC = observer(() => {
  const { t } = useTranslation();

  // hooks
  const {
    handleDashboardView,
    job: { loader, jobIds, jobById, fetchJobs },
  } = useNotionImporter();

  // fetching jobs
  useSWR("NOTION_IMPORTER_DASHBOARD", async () => await fetchJobs(), { errorRetryCount: 3, refreshInterval: 10000 });

  // handlers
  const handleJobsRefresh = async () => {
    try {
      await fetchJobs();
    } catch (error) {
      console.error("Error while refreshing Notion jobs", error);
    }
  };

  return (
    <div className="space-y-6 relative w-full h-full overflow-auto flex flex-col">
      {/* header */}
      <ImporterHeader
        config={{
          serviceName: "Notion",
          logo: NotionLogo,
        }}
        actions={
          <Button size="sm" onClick={handleDashboardView} className="my-auto">
            {t("importers.import")}
          </Button>
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
                            <SyncJobStatus status={job?.status as TJobStatus} />
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
                <p className="text-sm text-custom-text-200">
                  {t("importers.no_project_imports", { serviceName: "Notion" })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
