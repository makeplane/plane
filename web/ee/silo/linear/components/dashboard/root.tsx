"use client";

import { Dispatch, FC, SetStateAction } from "react";
import Image from "next/image";
import { RefreshCcw } from "lucide-react";
// ui
import { Button } from "@plane/ui";
// silo context
import { usePlaneProjects } from "@/plane-web/silo/hooks";
import { useLinearSyncJobs } from "@/plane-web/silo/hooks/context/use-linear-sync-jobs";
// silo components
import { IconFieldRender, SyncJobStatus } from "@/plane-web/silo/linear/components";
// assets
import LinearLogo from "@/public/services/linear.svg";

type TDashboard = {
  setIsDashboardView: Dispatch<SetStateAction<boolean>>;
};

export const Dashboard: FC<TDashboard> = (props) => {
  // props
  const { setIsDashboardView } = props;
  // hooks
  const { allSyncJobs, startJob } = useLinearSyncJobs();
  const { getById: getProjectById } = usePlaneProjects();

  return (
    <div className="space-y-6 relative w-full h-full overflow-hidden flex flex-col">
      <div className="flex-shrink-0 text-lg font-medium">Imports</div>

      {/* header */}
      <div className="flex-shrink-0 relative flex items-center gap-4 rounded bg-custom-background-90 p-4">
        <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
          <Image src={LinearLogo} layout="fill" objectFit="contain" alt={`Linear Logo`} />
        </div>
        <div className="w-full h-full overflow-hidden">
          <div className="text-lg font-medium">Linear</div>
          <div className="text-sm text-custom-text-200">Import your Linear data into plane projects.</div>
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
                <td className="p-3 whitespace-nowrap">Linear Workspace</td>
                <td className="p-3 whitespace-nowrap">Linear Project</td>
                <td className="p-3 whitespace-nowrap text-center">Status</td>
                <td className="p-3 whitespace-nowrap">Total Batches</td>
                <td className="p-3 whitespace-nowrap">Transformed Batched</td>
                <td className="p-3 whitespace-nowrap">Completed Batched</td>
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
                      <IconFieldRender title={getProjectById(job?.project_id)?.name} />
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <IconFieldRender title={job?.config?.meta?.workspace} />
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <IconFieldRender title={job?.config?.meta?.teamName} />
                    </td>
                    <td className="p-3 whitespace-nowrap text-center">
                      <SyncJobStatus status={job?.status} />
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <IconFieldRender title={job?.total_batch_count.toString()} />
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <IconFieldRender title={job?.transformed_batch_count.toString()} />
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <IconFieldRender title={job?.completed_batch_count.toString()} />
                    </td>
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
                    <td className="p-3 whitespace-nowrap text-center">{job?.start_time?.toString() || "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
