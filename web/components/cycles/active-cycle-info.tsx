import { FC, MouseEvent, useCallback } from "react";
import Link from "next/link";
// ui
import {
  AvatarGroup,
  Tooltip,
  LinearProgressIndicator,
  ContrastIcon,
  RunningIcon,
  LayersIcon,
  StateGroupIcon,
  Avatar,
} from "@plane/ui";
// components
import { SingleProgressStats } from "components/core";
import { ActiveCycleProgressStats } from "./active-cycle-stats";
// hooks
import { useCycle } from "hooks/store";
import useToast from "hooks/use-toast";
import useLocalStorage from "hooks/use-local-storage";
// icons
import { ArrowRight, CalendarDays, Star, Target } from "lucide-react";
// types
import { ICycle, TCycleLayout, TCycleView } from "@plane/types";
// helpers
import { renderFormattedDate, findHowManyDaysLeft } from "helpers/date-time.helper";
import { truncateText } from "helpers/string.helper";
// constants
import { STATE_GROUPS_DETAILS } from "constants/cycle";

export type ActiveCycleInfoProps = {
  cycle: ICycle;
  workspaceSlug: string;
  projectId: string;
};

export const ActiveCycleInfo: FC<ActiveCycleInfoProps> = (props) => {
  const { cycle, workspaceSlug, projectId } = props;

  // store
  const { addCycleToFavorites, removeCycleFromFavorites } = useCycle();
  // local storage
  const { setValue: setCycleTab } = useLocalStorage<TCycleView>("cycle_tab", "active");
  const { setValue: setCycleLayout } = useLocalStorage<TCycleLayout>("cycle_layout", "list");
  // toast alert
  const { setToastAlert } = useToast();

  const groupedIssues: any = {
    backlog: cycle.backlog_issues,
    unstarted: cycle.unstarted_issues,
    started: cycle.started_issues,
    completed: cycle.completed_issues,
    cancelled: cycle.cancelled_issues,
  };

  const progressIndicatorData = STATE_GROUPS_DETAILS.map((group, index) => ({
    id: index,
    name: group.title,
    value: cycle.total_issues > 0 ? ((cycle[group.key as keyof ICycle] as number) / cycle.total_issues) * 100 : 0,
    color: group.color,
  }));

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

  const handleAddToFavorites = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    addCycleToFavorites(workspaceSlug?.toString(), projectId.toString(), cycle.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't add the cycle to favorites. Please try again.",
      });
    });
  };

  const handleRemoveFromFavorites = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    removeCycleFromFavorites(workspaceSlug?.toString(), projectId.toString(), cycle.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't add the cycle to favorites. Please try again.",
      });
    });
  };

  return (
    <div className="grid-row-2 grid divide-y rounded-[10px] border border-custom-border-200 bg-custom-background-100 shadow">
      <div className="grid grid-cols-1 divide-y border-custom-border-200 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <div className="flex flex-col text-xs">
          <div className="h-full w-full">
            <div className="flex h-60 flex-col justify-between gap-5 rounded-b-[10px] p-4">
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1">
                  <span className="h-5 w-5">
                    <ContrastIcon className="h-5 w-5" color="#09A953" />
                  </span>
                  <Tooltip tooltipContent={cycle.name} position="top-left">
                    <h3 className="break-words text-lg font-semibold">{truncateText(cycle.name, 70)}</h3>
                  </Tooltip>
                </span>
                <span className="flex items-center gap-1 capitalize">
                  <span className="rounded-full px-1.5 py-0.5 bg-green-600/5 text-green-600">
                    <span className="flex gap-1 whitespace-nowrap">
                      <RunningIcon className="h-4 w-4" />
                      {findHowManyDaysLeft(cycle.end_date ?? new Date())} Days Left
                    </span>
                  </span>
                  {cycle.is_favorite ? (
                    <button
                      onClick={(e) => {
                        handleRemoveFromFavorites(e);
                      }}
                    >
                      <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        handleAddToFavorites(e);
                      }}
                    >
                      <Star className="h-4 w-4 " color="rgb(var(--color-text-200))" />
                    </button>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-start gap-5 text-custom-text-200">
                <div className="flex items-start gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {cycle?.start_date && <span>{renderFormattedDate(cycle?.start_date)}</span>}
                </div>
                <ArrowRight className="h-4 w-4 text-custom-text-200" />
                <div className="flex items-start gap-1">
                  <Target className="h-4 w-4" />
                  {cycle?.end_date && <span>{renderFormattedDate(cycle?.end_date)}</span>}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 text-custom-text-200">
                  {cycle.owned_by.avatar && cycle.owned_by.avatar !== "" ? (
                    <img
                      src={cycle.owned_by.avatar}
                      height={16}
                      width={16}
                      className="rounded-full"
                      alt={cycle.owned_by.display_name}
                    />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-background-100 capitalize">
                      {cycle.owned_by.display_name.charAt(0)}
                    </span>
                  )}
                  <span className="text-custom-text-200">{cycle.owned_by.display_name}</span>
                </div>

                {cycle.assignees.length > 0 && (
                  <div className="flex items-center gap-1 text-custom-text-200">
                    <AvatarGroup>
                      {cycle.assignees.map((assignee: any) => (
                        <Avatar key={assignee.id} name={assignee.display_name} src={assignee.avatar} />
                      ))}
                    </AvatarGroup>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-custom-text-200">
                <div className="flex gap-2">
                  <LayersIcon className="h-4 w-4 flex-shrink-0" />
                  {cycle.total_issues} issues
                </div>
                <div className="flex items-center gap-2">
                  <StateGroupIcon stateGroup="completed" height="14px" width="14px" />
                  {cycle.completed_issues} issues
                </div>
              </div>
              <div className="flex item-center gap-2">
                <Link
                  href={`/${workspaceSlug}/projects/${projectId}/cycles`}
                  onClick={() => {
                    handleCurrentView("active");
                  }}
                >
                  <span className="w-full rounded-md bg-custom-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-custom-primary/90">
                    View Cycle
                  </span>
                </Link>

                <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}>
                  <span className="w-full rounded-md bg-custom-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-custom-primary/90">
                    View Cycle Issues
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-1 divide-y border-custom-border-200 md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="flex h-60 flex-col border-custom-border-200">
            <div className="flex h-full w-full flex-col p-4 text-custom-text-200">
              <div className="flex w-full items-center gap-2 py-1">
                <span>Progress</span>
                <LinearProgressIndicator data={progressIndicatorData} />
              </div>
              <div className="mt-2 flex flex-col items-center gap-1">
                {Object.keys(groupedIssues).map((group, index) => (
                  <SingleProgressStats
                    key={index}
                    title={
                      <div className="flex items-center gap-2">
                        <span
                          className="block h-3 w-3 rounded-full "
                          style={{
                            backgroundColor: STATE_GROUPS_DETAILS[index].color,
                          }}
                        />
                        <span className="text-xs capitalize">{group}</span>
                      </div>
                    }
                    completed={groupedIssues[group]}
                    total={cycle.total_issues}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="h-60 overflow-y-scroll border-custom-border-200">
            <ActiveCycleProgressStats cycle={cycle} />
          </div>
        </div>
      </div>
    </div>
  );
};
