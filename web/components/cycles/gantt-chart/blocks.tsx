import { useRouter } from "next/router";
// ui
import { Tooltip, ContrastIcon } from "@plane/ui";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
// types
import { ICycle } from "@plane/types";

export const CycleGanttBlock = ({ data }: { data: ICycle }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const cycleStatus = data.status.toLocaleLowerCase();
  return (
    <div
      className="relative flex h-full w-full items-center rounded"
      style={{
        backgroundColor:
          cycleStatus === "current"
            ? "#09a953"
            : cycleStatus === "upcoming"
            ? "#f7ae59"
            : cycleStatus === "completed"
            ? "#3f76ff"
            : cycleStatus === "draft"
            ? "rgb(var(--color-text-200))"
            : "",
      }}
      onClick={() => router.push(`/${workspaceSlug}/projects/${data?.project}/cycles/${data?.id}`)}
    >
      <div className="absolute left-0 top-0 h-full w-full bg-custom-background-100/50" />
      <Tooltip
        tooltipContent={
          <div className="space-y-1">
            <h5>{data?.name}</h5>
            <div>
              {renderFormattedDate(data?.start_date ?? "")} to {renderFormattedDate(data?.end_date ?? "")}
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

export const CycleGanttSidebarBlock = ({ data }: { data: ICycle }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const cycleStatus = data.status.toLocaleLowerCase();

  return (
    <div
      className="relative flex h-full w-full items-center gap-2"
      onClick={() => router.push(`/${workspaceSlug}/projects/${data?.project}/cycles/${data?.id}`)}
    >
      <ContrastIcon
        className="h-5 w-5 flex-shrink-0"
        color={`${
          cycleStatus === "current"
            ? "#09a953"
            : cycleStatus === "upcoming"
            ? "#f7ae59"
            : cycleStatus === "completed"
            ? "#3f76ff"
            : cycleStatus === "draft"
            ? "rgb(var(--color-text-200))"
            : ""
        }`}
      />
      <h6 className="flex-grow truncate text-sm font-medium">{data?.name}</h6>
    </div>
  );
};
