import { useRouter } from "next/router";

// ui
import { Tooltip } from "@plane/ui";
// icons
import { ModuleStatusIcon } from "components/icons";
// helpers
import { renderShortDate } from "helpers/date-time.helper";
// types
import { IModule } from "types";
// constants
import { MODULE_STATUS } from "constants/module";

export const ModuleGanttBlock = ({ data }: { data: IModule }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div
      className="relative flex items-center w-full h-full rounded"
      style={{ backgroundColor: MODULE_STATUS.find((s) => s.value === data?.status)?.color }}
      onClick={() => router.push(`/${workspaceSlug}/projects/${data?.project}/modules/${data?.id}`)}
    >
      <div className="absolute top-0 left-0 h-full w-full bg-custom-background-100/50" />
      <Tooltip
        tooltipContent={
          <div className="space-y-1">
            <h5>{data?.name}</h5>
            <div>
              {renderShortDate(data?.start_date ?? "")} to {renderShortDate(data?.target_date ?? "")}
            </div>
          </div>
        }
        position="top-left"
      >
        <div className="relative text-custom-text-100 text-sm truncate py-1 px-2.5 w-full">{data?.name}</div>
      </Tooltip>
    </div>
  );
};

export const ModuleGanttSidebarBlock = ({ data }: { data: IModule }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div
      className="relative w-full flex items-center gap-2 h-full"
      onClick={() => router.push(`/${workspaceSlug}/projects/${data?.project}/modules/${data.id}`)}
    >
      <ModuleStatusIcon status={data?.status ?? "backlog"} height="16px" width="16px" />
      <h6 className="text-sm font-medium flex-grow truncate">{data.name}</h6>
    </div>
  );
};
