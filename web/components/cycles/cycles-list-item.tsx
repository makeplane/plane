import { FC, MouseEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
// hooks
import { useApplication, useCycle, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { CycleCreateUpdateModal, CycleDeleteModal } from "components/cycles";
// ui
import { CustomMenu, Tooltip, CircularProgressIndicator, CycleGroupIcon, AvatarGroup, Avatar } from "@plane/ui";
// icons
import { Check, Info, LinkIcon, Pencil, Star, Trash2, User2 } from "lucide-react";
// helpers
import { findHowManyDaysLeft, renderFormattedDate } from "helpers/date-time.helper";
import { copyTextToClipboard } from "helpers/string.helper";
// constants
import { CYCLE_STATUS } from "constants/cycle";
import { EUserWorkspaceRoles } from "constants/workspace";
// types
import { TCycleGroups } from "@plane/types";

type TCyclesListItem = {
  cycleId: string;
  handleEditCycle?: () => void;
  handleDeleteCycle?: () => void;
  handleAddToFavorites?: () => void;
  handleRemoveFromFavorites?: () => void;
  workspaceSlug: string;
  projectId: string;
};

export const CyclesListItem: FC<TCyclesListItem> = (props) => {
  const { cycleId, workspaceSlug, projectId } = props;
  // states
  const [updateModal, setUpdateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  // router
  const router = useRouter();
  // store hooks
  const {
    eventTracker: { setTrackElement },
  } = useApplication();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getCycleById, addCycleToFavorites, removeCycleFromFavorites } = useCycle();
  // toast alert
  const { setToastAlert } = useToast();

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
    setTrackElement("CYCLE_PAGE_LIST_LAYOUT");
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

  const cycleDetails = getCycleById(cycleId);

  if (!cycleDetails) return null;

  // computed
  // TODO: change this logic once backend fix the response
  const cycleStatus = cycleDetails.status ? (cycleDetails.status.toLocaleLowerCase() as TCycleGroups) : "draft";
  const isCompleted = cycleStatus === "completed";
  const endDate = new Date(cycleDetails.end_date ?? "");
  const startDate = new Date(cycleDetails.start_date ?? "");

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserWorkspaceRoles.MEMBER;

  const cycleTotalIssues =
    cycleDetails.backlog_issues +
    cycleDetails.unstarted_issues +
    cycleDetails.started_issues +
    cycleDetails.completed_issues +
    cycleDetails.cancelled_issues;

  const renderDate = cycleDetails.start_date || cycleDetails.end_date;

  // const areYearsEqual = startDate.getFullYear() === endDate.getFullYear();

  const completionPercentage = (cycleDetails.completed_issues / cycleTotalIssues) * 100;

  const progress = isNaN(completionPercentage) ? 0 : Math.floor(completionPercentage);

  const currentCycle = CYCLE_STATUS.find((status) => status.value === cycleStatus);

  const daysLeft = findHowManyDaysLeft(cycleDetails.end_date ?? new Date());

  return (
    <>
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
        <div className="group flex h-16 w-full items-center justify-between gap-5 border-b border-custom-border-100 bg-custom-background-100 px-5 py-6 text-sm hover:bg-custom-background-90">
          <div className="flex w-full items-center gap-3 truncate">
            <div className="flex items-center gap-4 truncate">
              <span className="flex-shrink-0">
                <CircularProgressIndicator size={38} percentage={progress}>
                  {isCompleted ? (
                    progress === 100 ? (
                      <Check className="h-3 w-3 stroke-[2] text-custom-primary-100" />
                    ) : (
                      <span className="text-sm text-custom-primary-100">{`!`}</span>
                    )
                  ) : progress === 100 ? (
                    <Check className="h-3 w-3 stroke-[2] text-custom-primary-100" />
                  ) : (
                    <span className="text-xs text-custom-text-300">{`${progress}%`}</span>
                  )}
                </CircularProgressIndicator>
              </span>

              <div className="flex items-center gap-2.5">
                <span className="flex-shrink-0">
                  <CycleGroupIcon cycleGroup={cycleStatus} className="h-3.5 w-3.5" />
                </span>
                <Tooltip tooltipContent={cycleDetails.name} position="top">
                  <span className="truncate text-base font-medium">{cycleDetails.name}</span>
                </Tooltip>
              </div>
            </div>
            <button onClick={openCycleOverview} className="z-10 hidden flex-shrink-0 group-hover:flex">
              <Info className="h-4 w-4 text-custom-text-400" />
            </button>
          </div>

          <div className="flex w-full items-center justify-end gap-2.5 md:w-auto md:flex-shrink-0 ">
            <div className="flex items-center justify-center">
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
            </div>

            {renderDate && (
              <span className="flex w-40 items-center justify-center gap-2 text-xs text-custom-text-300">
                {renderFormattedDate(startDate) ?? "_ _"} - {renderFormattedDate(endDate) ?? "_ _"}
              </span>
            )}

            <Tooltip tooltipContent={`${cycleDetails.assignees.length} Members`}>
              <div className="flex w-16 cursor-default items-center justify-center gap-1">
                {cycleDetails.assignees.length > 0 ? (
                  <AvatarGroup showTooltip={false}>
                    {cycleDetails.assignees.map((assignee) => (
                      <Avatar key={assignee.id} name={assignee.display_name} src={assignee.avatar} />
                    ))}
                  </AvatarGroup>
                ) : (
                  <span className="flex h-5 w-5 items-end justify-center rounded-full border border-dashed border-custom-text-400 bg-custom-background-80">
                    <User2 className="h-4 w-4 text-custom-text-400" />
                  </span>
                )}
              </div>
            </Tooltip>
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

            <CustomMenu ellipsis>
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
      </Link>
    </>
  );
};
