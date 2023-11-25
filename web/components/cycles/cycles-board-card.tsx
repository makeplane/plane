import { FC, MouseEvent, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
// hooks
import useToast from "hooks/use-toast";
// components
import { CycleCreateUpdateModal, CycleDeleteModal } from "components/cycles";
// ui
import { Avatar, AvatarGroup, CustomMenu, Tooltip, LayersIcon, CycleGroupIcon } from "@plane/ui";
// icons
import { Info, LinkIcon, Pencil, Star, Trash2 } from "lucide-react";
// helpers
import {
  getDateRangeStatus,
  findHowManyDaysLeft,
  renderShortDate,
  renderShortMonthDate,
} from "helpers/date-time.helper";
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { ICycle } from "types";
// store
import { useMobxStore } from "lib/mobx/store-provider";
// constants
import { CYCLE_STATUS } from "constants/cycle";

export interface ICyclesBoardCard {
  workspaceSlug: string;
  projectId: string;
  cycle: ICycle;
}

export const CyclesBoardCard: FC<ICyclesBoardCard> = (props) => {
  const { cycle, workspaceSlug, projectId } = props;
  // store
  const { cycle: cycleStore, trackEvent: { setTrackElement } } = useMobxStore();
  // toast
  const { setToastAlert } = useToast();
  // states
  const [updateModal, setUpdateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  // computed
  const cycleStatus = getDateRangeStatus(cycle.start_date, cycle.end_date);
  const isCompleted = cycleStatus === "completed";
  const endDate = new Date(cycle.end_date ?? "");
  const startDate = new Date(cycle.start_date ?? "");
  const isDateValid = cycle.start_date || cycle.end_date;

  const router = useRouter();

  const currentCycle = CYCLE_STATUS.find((status) => status.value === cycleStatus);

  const areYearsEqual = startDate.getFullYear() === endDate.getFullYear();

  const cycleTotalIssues =
    cycle.backlog_issues +
    cycle.unstarted_issues +
    cycle.started_issues +
    cycle.completed_issues +
    cycle.cancelled_issues;

  const completionPercentage = (cycle.completed_issues / cycleTotalIssues) * 100;

  const issueCount = cycle
    ? cycleTotalIssues === 0
      ? "0 Issue"
      : cycleTotalIssues === cycle.completed_issues
      ? `${cycleTotalIssues} Issue${cycleTotalIssues > 1 ? "s" : ""}`
      : `${cycle.completed_issues}/${cycleTotalIssues} Issues`
    : "0 Issue";

  const handleCopyText = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Cycle link copied to clipboard.",
      });
    });
  };

  const handleAddToFavorites = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    cycleStore.addCycleToFavorites(workspaceSlug?.toString(), projectId.toString(), cycle).catch(() => {
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

    cycleStore.removeCycleFromFavorites(workspaceSlug?.toString(), projectId.toString(), cycle).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't add the cycle to favorites. Please try again.",
      });
    });
  };

  const handleEditCycle = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setUpdateModal(true);
  };

  const handleDeleteCycle = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal(true);
    setTrackElement("CYCLE_PAGE_BOARD_LAYOUT");
  };

  const openCycleOverview = (e: MouseEvent<HTMLButtonElement>) => {
    const { query } = router;
    e.preventDefault();
    e.stopPropagation();

    router.push({
      pathname: router.pathname,
      query: { ...query, peekCycle: cycle.id },
    });
  };

  return (
    <div>
      <CycleCreateUpdateModal
        data={cycle}
        isOpen={updateModal}
        handleClose={() => setUpdateModal(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
      />

      <CycleDeleteModal
        cycle={cycle}
        isOpen={deleteModal}
        handleClose={() => setDeleteModal(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
      />

      <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}>
        <a className="flex flex-col justify-between p-4 h-44 w-full min-w-[250px]  text-sm rounded bg-custom-background-100 border border-custom-border-100 hover:shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 truncate">
              <span className="flex-shrink-0">
                <CycleGroupIcon cycleGroup={cycleStatus} className="h-3.5 w-3.5" />
              </span>
              <Tooltip tooltipContent={cycle.name} position="top">
                <span className="text-base font-medium truncate">{cycle.name}</span>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              {currentCycle && (
                <span
                  className="flex items-center justify-center text-xs text-center h-6 w-20 rounded-sm"
                  style={{
                    color: currentCycle.color,
                    backgroundColor: `${currentCycle.color}20`,
                  }}
                >
                  {currentCycle.value === "current"
                    ? `${findHowManyDaysLeft(cycle.end_date ?? new Date())} ${currentCycle.label}`
                    : `${currentCycle.label}`}
                </span>
              )}
              <button onClick={openCycleOverview}>
                <Info className="h-4 w-4 text-custom-text-400" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-custom-text-200">
                <LayersIcon className="h-4 w-4 text-custom-text-300" />
                <span className="text-xs text-custom-text-300">{issueCount}</span>
              </div>
              {cycle.assignees.length > 0 && (
                <Tooltip tooltipContent={`${cycle.assignees.length} Members`}>
                  <div className="flex items-center gap-1 cursor-default">
                    <AvatarGroup showTooltip={false}>
                      {cycle.assignees.map((assignee) => (
                        <Avatar key={assignee.id} name={assignee.display_name} src={assignee.avatar} />
                      ))}
                    </AvatarGroup>
                  </div>
                </Tooltip>
              )}
            </div>

            <Tooltip
              tooltipContent={isNaN(completionPercentage) ? "0" : `${completionPercentage.toFixed(0)}%`}
              position="top-left"
            >
              <div className="flex items-center w-full">
                <div
                  className="bar relative h-1.5 w-full rounded bg-custom-background-90"
                  style={{
                    boxShadow: "1px 1px 4px 0px rgba(161, 169, 191, 0.35) inset",
                  }}
                >
                  <div
                    className="absolute top-0 left-0 h-1.5 rounded bg-blue-600 duration-300"
                    style={{
                      width: `${isNaN(completionPercentage) ? 0 : completionPercentage.toFixed(0)}%`,
                    }}
                  />
                </div>
              </div>
            </Tooltip>

            <div className="flex items-center justify-between">
              {isDateValid ? (
                <span className="text-xs text-custom-text-300">
                  {areYearsEqual ? renderShortDate(startDate, "_ _") : renderShortMonthDate(startDate, "_ _")} -{" "}
                  {areYearsEqual ? renderShortDate(endDate, "_ _") : renderShortMonthDate(endDate, "_ _")}
                </span>
              ) : (
                <span className="text-xs text-custom-text-400">No due date</span>
              )}
              <div className="flex items-center gap-1.5 z-10">
                {cycle.is_favorite ? (
                  <button type="button" onClick={handleRemoveFromFavorites}>
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                  </button>
                ) : (
                  <button type="button" onClick={handleAddToFavorites}>
                    <Star className="h-3.5 w-3.5 text-custom-text-200" />
                  </button>
                )}
                <CustomMenu width="auto" ellipsis className="z-10">
                  {!isCompleted && (
                    <>
                      <CustomMenu.MenuItem onClick={handleEditCycle}>
                        <span className="flex items-center justify-start gap-2">
                          <Pencil className="h-3 w-3" />
                          <span>Edit cycle</span>
                        </span>
                      </CustomMenu.MenuItem>
                      <CustomMenu.MenuItem onClick={handleDeleteCycle}>
                        <span className="flex items-center justify-start gap-2">
                          <Trash2 className="h-3 w-3" />
                          <span>Delete cycle</span>
                        </span>
                      </CustomMenu.MenuItem>
                    </>
                  )}
                  <CustomMenu.MenuItem onClick={handleCopyText}>
                    <span className="flex items-center justify-start gap-2">
                      <LinkIcon className="h-3 w-3" />
                      <span>Copy cycle link</span>
                    </span>
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </div>
          </div>
        </a>
      </Link>
    </div>
  );
};
