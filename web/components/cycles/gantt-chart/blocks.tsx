import { useRouter } from "next/router";

// ui
import { Tooltip } from "@plane/ui";
// icons
import { ContrastIcon } from "components/icons";
// helpers
import { getDateRangeStatus, renderShortDate } from "helpers/date-time.helper";
// types
import { ICycle } from "types";

export const CycleGanttBlock = ({ data }: { data: ICycle }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const cycleStatus = getDateRangeStatus(data?.start_date, data?.end_date);

  return (
    <div
      className="flex items-center relative h-full w-full rounded"
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
      <div className="absolute top-0 left-0 h-full w-full bg-custom-background-100/50" />
      <Tooltip
        tooltipContent={
          <div className="space-y-1">
            <h5>{data?.name}</h5>
            <div>
              {renderShortDate(data?.start_date ?? "")} to {renderShortDate(data?.end_date ?? "")}
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

export const CycleGanttSidebarBlock = ({ data }: { data: ICycle }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const cycleStatus = getDateRangeStatus(data?.start_date, data?.end_date);

  return (
    <div
      className="relative w-full flex items-center gap-2 h-full"
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
      <h6 className="text-sm font-medium flex-grow truncate">{data?.name}</h6>
    </div>
  );
};
