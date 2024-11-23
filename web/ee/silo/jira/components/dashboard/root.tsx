"use client";

import { Dispatch, FC, SetStateAction } from "react";
import Image from "next/image";
import { Briefcase, RefreshCcw } from "lucide-react";
import { TLogoProps } from "@plane/types";
import { Button } from "@plane/ui";
// components
import { Logo } from "@/components/common";
// helpers
import { renderFormattedDate, renderFormattedTime } from "@/helpers/date-time.helper";
// silo context
import { useJiraSyncJobs } from "@/plane-web/silo/hooks/context/use-jira-sync-jobs";
// silo components
import { IconFieldRender, SyncJobStatus } from "@/plane-web/silo/jira/components";
// assets
import JiraLogo from "@/public/services/jira.svg";

type TDashboard = {
  setIsDashboardView: Dispatch<SetStateAction<boolean>>;
};

export const Dashboard: FC<TDashboard> = (props) => {
  // props
  const { setIsDashboardView } = props;
  // hooks
  const { allSyncJobs, startJob } = useJiraSyncJobs();

  return (
    <div className="space-y-6 relative w-full h-full overflow-auto flex flex-col">
      <div className="flex-shrink-0 text-lg font-medium">Imports</div>

      {/* header */}
      <div className="flex-shrink-0 relative flex items-center gap-4 rounded bg-custom-background-90 p-4">
        <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
          <Image src={JiraLogo} layout="fill" objectFit="contain" alt={`Jira Logo`} />
        </div>
        <div className="w-full h-full overflow-hidden">
          <div className="text-lg font-medium">Jira</div>
          <div className="text-sm text-custom-text-200">Import your Jira data into plane projects.</div>
        </div>
        <div className="flex-shrink-0">
          <Button size="sm" onClick={() => setIsDashboardView((prevData) => !prevData)}>
            Import
          </Button>
        </div>
      </div>

      {/* migrations */}
      <div className="w-full h-full space-y-3 relative flex flex-col">
        <div className="flex-shrink-0 text-base font-medium">Migrations</div>
        <div className="w-full h-full overflow-auto">
          <table className=" w-full table-auto">
            <thead>
              <tr className="bg-custom-background-90 text-sm !font-medium text-left rounded-t">
                <td className="p-3 whitespace-nowrap">Sr No.</td>
                <td className="p-3 whitespace-nowrap">Plane Project</td>
                <td className="p-3 whitespace-nowrap">Jira Workspace</td>
                <td className="p-3 whitespace-nowrap">Jira Project</td>
                <td className="p-3 whitespace-nowrap text-center">Status</td>
                <td className="p-3 whitespace-nowrap text-center">Total Batches</td>
                <td className="p-3 whitespace-nowrap text-center">Transformed Batches</td>
                <td className="p-3 whitespace-nowrap text-center">Completed Batches</td>
                <td className="p-3 whitespace-nowrap text-center">Re Run</td>
                <td className="p-3 whitespace-nowrap text-center">Start Time</td>
              </tr>
            </thead>
            <tbody>
              {allSyncJobs &&
                allSyncJobs.length > 0 &&
                allSyncJobs.map((job, index) => (
                  <tr key={job.id} className="text-sm text-custom-text-200">
                    <td className="p-3 whitespace-nowrap">{index + 1}</td>
                    <td className="p-3 whitespace-nowrap">
                      <IconFieldRender
                        icon={
                          job?.config?.meta?.planeProject && job?.config?.meta?.planeProject?.logo_props ? (
                            <Logo logo={job?.config?.meta?.planeProject?.logo_props as TLogoProps} size={16} />
                          ) : (
                            <Briefcase className="w-4 h-4" />
                          )
                        }
                        title={job?.config?.meta?.planeProject?.name}
                      />
                    </td>
                    {job?.config?.meta?.resource ? (
                      <td className="p-3 whitespace-nowrap">
                        <IconFieldRender
                          icon={
                            <img
                              src={job?.config?.meta?.resource?.avatarUrl}
                              alt={job?.config?.meta?.resource?.name}
                              className="w-full h-full object-contain object-center"
                            />
                          }
                          title={job?.config?.meta?.resource?.name}
                        />
                      </td>
                    ) : (
                      <td className="p-3 whitespace-nowrap text-center">-</td>
                    )}
                    <td className="p-3 whitespace-nowrap">
                      <IconFieldRender
                        icon={
                          <img
                            src={job?.config?.meta?.project.avatarUrls?.["48x48"]}
                            alt={job?.config?.meta?.project.name}
                            className="w-full h-full object-contain object-center"
                          />
                        }
                        title={job?.config?.meta?.project?.name}
                      />
                    </td>
                    <td className="p-3 whitespace-nowrap text-center">
                      <SyncJobStatus status={job?.status} />
                    </td>
                    <td className="p-3 whitespace-nowrap text-center">{job?.total_batch_count || "-"}</td>
                    <td className="p-3 whitespace-nowrap text-center">{job?.transformed_batch_count || "-"}</td>
                    <td className="p-3 whitespace-nowrap text-center">{job?.completed_batch_count || "-"}</td>
                    <td className="p-3 whitespace-nowrap text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        prependIcon={<RefreshCcw className="w-3 h-3" />}
                        onClick={() => startJob(job.id)}
                      >
                        Re Run
                      </Button>
                    </td>
                    <td className="p-3 whitespace-nowrap text-center">
                      {job?.start_time
                        ? `${renderFormattedTime(job?.start_time, "12-hour")}, ${renderFormattedDate(job?.start_time)}`
                        : "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
