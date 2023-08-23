import Link from "next/link";
import { useRouter } from "next/router";

// ui
import { Tooltip } from "components/ui";
// icons
import { ContrastIcon } from "components/icons";
// helpers
import { getDateRangeStatus, renderShortDate } from "helpers/date-time.helper";
// types
import { ICycle } from "types";

export const CycleGanttBlock = ({ cycle }: { cycle: ICycle }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const cycleStatus = getDateRangeStatus(cycle?.start_date, cycle?.end_date);

  return (
    <Link href={`/${workspaceSlug}/projects/${cycle?.project}/cycles/${cycle?.id}`}>
      <a
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
      >
        <div className="absolute top-0 left-0 h-full w-full bg-custom-background-100/50" />
        <Tooltip
          tooltipContent={
            <div className="space-y-1">
              <h5>{cycle?.name}</h5>
              <div>
                {renderShortDate(cycle?.start_date ?? "")} to{" "}
                {renderShortDate(cycle?.end_date ?? "")}
              </div>
            </div>
          }
          position="top-left"
        >
          <div className="relative text-custom-text-100 text-sm truncate py-1 px-2.5 w-full">
            {cycle?.name}
          </div>
        </Tooltip>
      </a>
    </Link>
  );
};

export const CycleGanttSidebarBlock = ({ cycle }: { cycle: ICycle }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const cycleStatus = getDateRangeStatus(cycle?.start_date, cycle?.end_date);

  return (
    <Link href={`/${workspaceSlug}/projects/${cycle?.project}/issues/${cycle?.id}`}>
      <a className="relative w-full flex items-center gap-2 h-full">
        <ContrastIcon
          className="h-5 w-5"
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
        <h6 className="text-sm font-medium flex-grow truncate">{cycle?.name}</h6>
      </a>
    </Link>
  );
};
