import { FC, useCallback } from "react";
import Link from "next/link";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// ui
import { Tooltip, Button, CycleGroupIcon } from "@plane/ui";
// types
import { ICycle, TCycleGroups, TCycleLayout, TCycleView } from "@plane/types";
// helpers
import { truncateText } from "helpers/string.helper";
import { renderFormattedDate, findHowManyDaysLeft } from "helpers/date-time.helper";

export type ActiveCycleHeaderProps = {
  cycle: ICycle;
  workspaceSlug: string;
  projectId: string;
};

export const ActiveCycleHeader: FC<ActiveCycleHeaderProps> = (props) => {
  const { cycle, workspaceSlug, projectId } = props;
  // local storage
  const { setValue: setCycleTab } = useLocalStorage<TCycleView>("cycle_tab", "active");
  const { setValue: setCycleLayout } = useLocalStorage<TCycleLayout>("cycle_layout", "list");

  const handleCurrentLayout = useCallback(
    (_layout: TCycleLayout) => {
      setCycleLayout(_layout);
    },
    [setCycleLayout]
  );

  const handleCurrentView = useCallback(
    (_view: TCycleView) => {
      setCycleTab(_view);
      if (_view === "draft") handleCurrentLayout("list");
    },
    [handleCurrentLayout, setCycleTab]
  );

  const daysLeft = findHowManyDaysLeft(cycle.end_date ?? new Date());
  const currentCycleStatus = cycle.status.toLocaleLowerCase() as TCycleGroups;

  return (
    <div className="flex items-center justify-between px-3 pt-3 pb-1">
      <div className="flex items-center gap-2 cursor-default">
        <CycleGroupIcon cycleGroup={currentCycleStatus} className="h-4 w-4" />
        <Tooltip tooltipContent={cycle.name} position="top-left">
          <h3 className="break-words text-lg font-medium">{truncateText(cycle.name, 70)}</h3>
        </Tooltip>
        <Tooltip
          tooltipContent={`Start date: ${renderFormattedDate(cycle.start_date ?? "")} Due Date: ${renderFormattedDate(
            cycle.end_date ?? ""
          )}`}
          position="top-left"
        >
          <span className="flex gap-1 whitespace-nowrap rounded-sm text-sm px-3 py-0.5 bg-amber-500/10 text-amber-500">
            {`${daysLeft} ${daysLeft > 1 ? "days" : "day"} left`}
          </span>
        </Tooltip>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="rounded-sm text-sm px-3 py-1 bg-custom-background-80">
          <span className="flex gap-2 text-sm whitespace-nowrap font-medium">
            <span>Lead:</span>
            <div className="flex items-center gap-1.5">
              {cycle.owned_by.avatar && cycle.owned_by.avatar !== "" ? (
                <img
                  src={cycle.owned_by.avatar}
                  height={18}
                  width={18}
                  className="rounded-full"
                  alt={cycle.owned_by.display_name}
                />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-background-100 capitalize">
                  {cycle.owned_by.display_name.charAt(0)}
                </span>
              )}
              <span>{cycle.owned_by.display_name}</span>
            </div>
          </span>
        </span>
        <Link href={`/${workspaceSlug}/projects/${projectId}/cycles`}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              handleCurrentView("active");
            }}
          >
            View Cycle
          </Button>
        </Link>
      </div>
    </div>
  );
};
