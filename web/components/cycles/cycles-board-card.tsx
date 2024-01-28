import { FC, MouseEvent, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
// hooks
import { useApplication, useCycle, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { CycleCreateUpdateModal, CycleDeleteModal } from "components/cycles";
// ui
import { Avatar, AvatarGroup, CustomMenu, Tooltip, LayersIcon, CycleGroupIcon } from "@plane/ui";
// icons
import { Info, LinkIcon, Pencil, Star, Trash2 } from "lucide-react";
// helpers
import { findHowManyDaysLeft, renderFormattedDate } from "helpers/date-time.helper";
import { copyTextToClipboard } from "helpers/string.helper";
// constants
import { CYCLE_STATUS } from "constants/cycle";
import { EUserWorkspaceRoles } from "constants/workspace";
//.types
import { TCycleGroups } from "@plane/types";

export interface ICyclesBoardCard {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
}

export const CyclesBoardCard: FC<ICyclesBoardCard> = (props) => {
  const { cycleId, workspaceSlug, projectId } = props;
  // states
  const [updateModal, setUpdateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  // router
  const router = useRouter();
  // store
  const {
    eventTracker: { setTrackElement },
  } = useApplication();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { addCycleToFavorites, removeCycleFromFavorites, getCycleById } = useCycle();
  // toast alert
  const { setToastAlert } = useToast();
  // computed
  const cycleDetails = getCycleById(cycleId);

  if (!cycleDetails) return null;

  const cycleStatus = cycleDetails.status.toLocaleLowerCase();
  const isCompleted = cycleStatus === "completed";
  const endDate = new Date(cycleDetails.end_date ?? "");
  const startDate = new Date(cycleDetails.start_date ?? "");
  const isDateValid = cycleDetails.start_date || cycleDetails.end_date;

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserWorkspaceRoles.MEMBER;

  const currentCycle = CYCLE_STATUS.find((status) => status.value === cycleStatus);

  const cycleTotalIssues =
    cycleDetails.backlog_issues +
    cycleDetails.unstarted_issues +
    cycleDetails.started_issues +
    cycleDetails.completed_issues +
    cycleDetails.cancelled_issues;

  const completionPercentage = (cycleDetails.completed_issues / cycleTotalIssues) * 100;

  const issueCount = cycleDetails
    ? cycleTotalIssues === 0
      ? "0 Issue"
      : cycleTotalIssues === cycleDetails.completed_issues
      ? `${cycleTotalIssues} Issue${cycleTotalIssues > 1 ? "s" : ""}`
      : `${cycleDetails.completed_issues}/${cycleTotalIssues} Issues`
    : "0 Issue";

  const handleCopyText = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`).then(() => {
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

    addCycleToFavorites(workspaceSlug?.toString(), projectId.toString(), cycleId).catch(() => {
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

    removeCycleFromFavorites(workspaceSlug?.toString(), projectId.toString(), cycleId).catch(() => {
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
      query: { ...query, peekCycle: cycleId },
    });
  };

  const daysLeft = findHowManyDaysLeft(cycleDetails.end_date ?? new Date());

  return (
    <div>
      <CycleCreateUpdateModal
        data={cycleDetails}
        isOpen={updateModal}
        handleClose={() => setUpdateModal(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
      />

      <CycleDeleteModal
        cycle={cycleDetails}
        isOpen={deleteModal}
        handleClose={() => setDeleteModal(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
      />

      <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`}>
        <div className="flex h-44 w-full min-w-[250px] flex-col justify-between rounded  border border-custom-border-100 bg-custom-background-100 p-4 text-sm hover:shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 truncate">
              <span className="flex-shrink-0">
                <CycleGroupIcon cycleGroup={cycleStatus as TCycleGroups} className="h-3.5 w-3.5" />
              </span>
              <Tooltip tooltipContent={cycleDetails.name} position="top">
                <span className="truncate text-base font-medium">{cycleDetails.name}</span>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              {currentCycle && (
                <span
                  className="flex h-6 w-20 items-center justify-center rounded-sm text-center text-xs"
                  style={{
                    color: currentCycle.color,
                    backgroundColor: `${currentCycle.color}20`,
                  }}
                >
                  {currentCycle.value === "current"
                    ? `${daysLeft} ${daysLeft > 1 ? "days" : "day"} left`
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
              {cycleDetails.assignees.length > 0 && (
                <Tooltip tooltipContent={`${cycleDetails.assignees.length} Members`}>
                  <div className="flex cursor-default items-center gap-1">
                    <AvatarGroup showTooltip={false}>
                      {cycleDetails.assignees.map((assignee) => (
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
              <div className="flex w-full items-center">
                <div
                  className="bar relative h-1.5 w-full rounded bg-custom-background-90"
                  style={{
                    boxShadow: "1px 1px 4px 0px rgba(161, 169, 191, 0.35) inset",
                  }}
                >
                  <div
                    className="absolute left-0 top-0 h-1.5 rounded bg-blue-600 duration-300"
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
                  {renderFormattedDate(startDate) ?? "_ _"} - {renderFormattedDate(endDate) ?? "_ _"}
                </span>
              ) : (
                <span className="text-xs text-custom-text-400">No due date</span>
              )}
              <div className="z-10 flex items-center gap-1.5">
                {isEditingAllowed &&
                  (cycleDetails.is_favorite ? (
                    <button type="button" onClick={handleRemoveFromFavorites}>
                      <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                    </button>
                  ) : (
                    <button type="button" onClick={handleAddToFavorites}>
                      <Star className="h-3.5 w-3.5 text-custom-text-200" />
                    </button>
                  ))}
                <CustomMenu ellipsis className="z-10">
                  {!isCompleted && isEditingAllowed && (
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
        </div>
      </Link>
    </div>
  );
};
