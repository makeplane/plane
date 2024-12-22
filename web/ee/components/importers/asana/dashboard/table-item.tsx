import { FC } from "react";
import { observer } from "mobx-react";
import { Briefcase, RefreshCcw } from "lucide-react";
import { TLogoProps } from "@plane/types";
import { Button, Logo } from "@plane/ui";
import { AsanaConfig } from "@silo/asana";
import { E_JOB_STATUS, TJobWithConfig } from "@silo/core";
// helpers
import { renderFormattedDate, renderFormattedTime } from "@/helpers/date-time.helper";
// plane web components
import { IconFieldRender, SyncJobStatus } from "@/plane-web/components/importers/asana";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";

type TProps = {
  index: number;
  jobId: string;
};

export const AsanaDashboardTableItem: FC<TProps> = observer((props) => {
  const { index, jobId } = props;
  // hooks
  const {
    auth: { currentAuth },
    job: { jobById, startJob },
  } = useAsanaImporter();

  // derived values
  const job = jobById(jobId);
  const isReRunDisabled = (job: TJobWithConfig<AsanaConfig>) => {
    if (!job || !job?.status) return true;

    return ![E_JOB_STATUS.CREATED, E_JOB_STATUS.FINISHED, E_JOB_STATUS.ERROR].includes(job?.status as E_JOB_STATUS);
  };

  if (!job) return null;

  // handlers
  const handleReRunJob = async (jobId: string) => {
    try {
      if (currentAuth?.isAuthenticated) {
        await startJob(jobId);
      }
    } catch (error) {
      console.error("Error while re-running Jira job", error);
    }
  };

  return (
    <tr key={job.id} className="text-sm text-custom-text-200 even:bg-custom-background-90">
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
      <td className="p-3 whitespace-nowrap">
        <IconFieldRender title={job?.config?.meta?.workspace?.name || "--"} />
      </td>
      <td className="p-3 whitespace-nowrap">
        <IconFieldRender title={job?.config?.meta?.project?.name || "--"} />
      </td>
      <td className="p-3 whitespace-nowrap text-center">
        <SyncJobStatus status={job?.status} />
      </td>
      <td className="p-3 whitespace-nowrap relative flex justify-center items-center">
        <Button
          variant="outline-primary"
          size="sm"
          prependIcon={<RefreshCcw className="w-3 h-3" />}
          onClick={() => handleReRunJob(job.id)}
          disabled={isReRunDisabled(job)}
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
  );
});
