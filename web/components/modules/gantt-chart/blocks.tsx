import { useRouter } from "next/router";
// ui
import { Tooltip, ModuleStatusIcon } from "@plane/ui";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
// types
import { IModule } from "@plane/types";
// constants
import { MODULE_STATUS } from "constants/module";

export const ModuleGanttBlock = ({ data }: { data: IModule }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div
      className="relative flex h-full w-full items-center rounded"
      style={{ backgroundColor: MODULE_STATUS.find((s) => s.value === data?.status)?.color }}
      onClick={() => router.push(`/${workspaceSlug}/projects/${data?.project}/modules/${data?.id}`)}
    >
      <div className="absolute left-0 top-0 h-full w-full bg-custom-background-100/50" />
      <Tooltip
        tooltipContent={
          <div className="space-y-1">
            <h5>{data?.name}</h5>
            <div>
              {renderFormattedDate(data?.start_date ?? "")} to {renderFormattedDate(data?.target_date ?? "")}
            </div>
          </div>
        }
        position="top-left"
      >
        <div className="relative w-full truncate px-2.5 py-1 text-sm text-custom-text-100">{data?.name}</div>
      </Tooltip>
    </div>
  );
};

export const ModuleGanttSidebarBlock = ({ data }: { data: IModule }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div
      className="relative flex h-full w-full items-center gap-2"
      onClick={() => router.push(`/${workspaceSlug}/projects/${data?.project}/modules/${data.id}`)}
    >
      <ModuleStatusIcon status={data?.status ?? "backlog"} height="16px" width="16px" />
      <h6 className="flex-grow truncate text-sm font-medium">{data.name}</h6>
    </div>
  );
};
