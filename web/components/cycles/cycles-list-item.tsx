import { FC, MouseEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
// stores
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
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
// types
import { ICycle, TCycleGroups } from "types";
// constants
import { CYCLE_STATUS } from "constants/cycle";
import { EUserWorkspaceRoles } from "constants/workspace";

type TCyclesListItem = {
  cycle: ICycle;
  handleEditCycle?: () => void;
  handleDeleteCycle?: () => void;
  handleAddToFavorites?: () => void;
  handleRemoveFromFavorites?: () => void;
  workspaceSlug: string;
  projectId: string;
};

export const CyclesListItem: FC<TCyclesListItem> = (props) => {
  const { cycle, workspaceSlug, projectId } = props;
  // store
  const {
    cycle: cycleStore,
    trackEvent: { setTrackElement },
    user: userStore,
  } = useMobxStore();
  // toast
  const { setToastAlert } = useToast();
  // states
  const [updateModal, setUpdateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  // computed
  const cycleStatus = cycle.status.toLocaleLowerCase() as TCycleGroups;
  const isCompleted = cycleStatus === "completed";
  const endDate = new Date(cycle.end_date ?? "");
  const startDate = new Date(cycle.start_date ?? "");

  const { currentProjectRole } = userStore;
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserWorkspaceRoles.MEMBER;

  const router = useRouter();

  const cycleTotalIssues =
    cycle.backlog_issues +
    cycle.unstarted_issues +
    cycle.started_issues +
    cycle.completed_issues +
    cycle.cancelled_issues;

  const renderDate = cycle.start_date || cycle.end_date;

  const completionPercentage = (cycle.completed_issues / cycleTotalIssues) * 100;

  const progress = isNaN(completionPercentage) ? 0 : Math.floor(completionPercentage);

  const currentCycle = CYCLE_STATUS.find((status) => status.value === cycleStatus);

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
    setTrackElement("CYCLE_PAGE_LIST_LAYOUT");
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
    <>
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
                <Tooltip tooltipContent={cycle.name} position="top">
                  <span className="truncate text-base font-medium">{cycle.name}</span>
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
                    ? `${findHowManyDaysLeft(cycle.end_date ?? new Date())} ${currentCycle.label}`
                    : `${currentCycle.label}`}
                </span>
              )}
            </div>

            {renderDate && (
              <span className="flex w-40 items-center justify-center gap-2 text-xs text-custom-text-300">
                {renderFormattedDate(startDate) ?? "_ _"} - {renderFormattedDate(endDate) ?? "_ _"}
              </span>
            )}

            <Tooltip tooltipContent={`${cycle.assignees.length} Members`}>
              <div className="flex w-16 cursor-default items-center justify-center gap-1">
                {cycle.assignees.length > 0 ? (
                  <AvatarGroup showTooltip={false}>
                    {cycle.assignees.map((assignee) => (
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
              (cycle.is_favorite ? (
                <button type="button" onClick={handleRemoveFromFavorites}>
                  <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                </button>
              ) : (
                <button type="button" onClick={handleAddToFavorites}>
                  <Star className="h-3.5 w-3.5 text-custom-text-200" />
                </button>
              ))}

            <CustomMenu width="auto" ellipsis>
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
