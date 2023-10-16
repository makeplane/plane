import { FC, MouseEvent, useState } from "react";
import Link from "next/link";
// hooks
import useToast from "hooks/use-toast";
// components
import { CycleCreateEditModal } from "./cycle-create-edit-modal";
import { CycleDeleteModal } from "./cycle-delete-modal";
// ui
import { RadialProgressBar, Tooltip, LinearProgressIndicator } from "@plane/ui";
import { CustomMenu } from "components/ui";
// icons
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
import {
  TargetIcon,
  ContrastIcon,
  PersonRunningIcon,
  ArrowRightIcon,
  TriangleExclamationIcon,
  AlarmClockIcon,
} from "components/icons";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
import { LinkIcon, PencilIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
// helpers
import { getDateRangeStatus, renderShortDateWithYearFormat, findHowManyDaysLeft } from "helpers/date-time.helper";
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { ICycle } from "types";

type TCyclesListItem = {
  cycle: ICycle;
  handleEditCycle?: () => void;
  handleDeleteCycle?: () => void;
  handleAddToFavorites?: () => void;
  handleRemoveFromFavorites?: () => void;
  workspaceSlug: string;
  projectId: string;
};

const stateGroups = [
  {
    key: "backlog_issues",
    title: "Backlog",
    color: "#dee2e6",
  },
  {
    key: "unstarted_issues",
    title: "Unstarted",
    color: "#26b5ce",
  },
  {
    key: "started_issues",
    title: "Started",
    color: "#f7ae59",
  },
  {
    key: "cancelled_issues",
    title: "Cancelled",
    color: "#d687ff",
  },
  {
    key: "completed_issues",
    title: "Completed",
    color: "#09a953",
  },
];

export const CyclesListItem: FC<TCyclesListItem> = (props) => {
  const { cycle, workspaceSlug, projectId } = props;

  const [updateModal, setUpdateModal] = useState(false);
  const updateModalCallback = () => {};

  const [deleteModal, setDeleteModal] = useState(false);
  const deleteModalCallback = () => {};

  // store
  const { cycle: cycleStore } = useMobxStore();

  // toast
  const { setToastAlert } = useToast();

  const cycleStatus = getDateRangeStatus(cycle.start_date, cycle.end_date);
  const isCompleted = cycleStatus === "completed";
  const endDate = new Date(cycle.end_date ?? "");
  const startDate = new Date(cycle.start_date ?? "");

  const handleCopyText = () => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Cycle link copied to clipboard.",
      });
    });
  };

  const progressIndicatorData = stateGroups.map((group, index) => ({
    id: index,
    name: group.title,
    value: cycle.total_issues > 0 ? ((cycle[group.key as keyof ICycle] as number) / cycle.total_issues) * 100 : 0,
    color: group.color,
  }));

  const handleAddToFavorites = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    cycleStore.addCycleToFavorites(workspaceSlug?.toString(), projectId.toString(), cycle.id).catch(() => {
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

    cycleStore.removeCycleFromFavorites(workspaceSlug?.toString(), projectId.toString(), cycle.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't add the cycle to favorites. Please try again.",
      });
    });
  };

  return (
    <>
      <div className="relative flex items-center gap-1 hover:bg-custom-background-80 transition-all rounded px-2 pl-3">
        <div className="w-full text-xs py-3">
          <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}>
            <a className="w-full h-full relative overflow-hidden flex items-center gap-2">
              {/* left content */}
              <div className="relative flex items-center gap-2 overflow-hidden">
                {/* cycle state */}
                <div className="flex-shrink-0">
                  <ContrastIcon
                    className="h-5 w-5"
                    color={`${
                      cycleStatus === "current"
                        ? "#09A953"
                        : cycleStatus === "upcoming"
                        ? "#F7AE59"
                        : cycleStatus === "completed"
                        ? "#3F76FF"
                        : cycleStatus === "draft"
                        ? "rgb(var(--color-text-200))"
                        : ""
                    }`}
                  />
                </div>

                {/* cycle title and description */}
                <div className="max-w-xl">
                  <Tooltip tooltipContent={cycle.name} className="break-words" position="top-left">
                    <div className="text-base font-semibold line-clamp-1 pr-5 overflow-hidden break-words">
                      {cycle.name}
                    </div>
                  </Tooltip>
                  {cycle.description && (
                    <div className="mt-1 text-custom-text-200 break-words w-full line-clamp-2">{cycle.description}</div>
                  )}
                </div>
              </div>

              {/* right content */}
              <div className="ml-auto flex-shrink-0 relative flex items-center gap-3 p-2">
                {/* cycle status */}
                <div
                  className={`rounded-full px-2 py-1
                    ${
                      cycleStatus === "current"
                        ? "bg-green-600/10 text-green-600"
                        : cycleStatus === "upcoming"
                        ? "bg-orange-300/10 text-orange-300"
                        : cycleStatus === "completed"
                        ? "bg-blue-500/10 text-blue-500"
                        : cycleStatus === "draft"
                        ? "bg-neutral-400/10 text-neutral-400"
                        : ""
                    }`}
                >
                  {cycleStatus === "current" ? (
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <PersonRunningIcon className="h-3.5 w-3.5" />
                      {findHowManyDaysLeft(cycle.end_date ?? new Date())} days left
                    </span>
                  ) : cycleStatus === "upcoming" ? (
                    <span className="flex items-center gap-1">
                      <AlarmClockIcon className="h-3.5 w-3.5" />
                      {findHowManyDaysLeft(cycle.start_date ?? new Date())} days left
                    </span>
                  ) : cycleStatus === "completed" ? (
                    <span className="flex items-center gap-1">
                      {cycle.total_issues - cycle.completed_issues > 0 && (
                        <Tooltip
                          tooltipContent={`${cycle.total_issues - cycle.completed_issues} more pending ${
                            cycle.total_issues - cycle.completed_issues === 1 ? "issue" : "issues"
                          }`}
                        >
                          <span>
                            <TriangleExclamationIcon className="h-3.5 w-3.5 fill-current" />
                          </span>
                        </Tooltip>
                      )}{" "}
                      Completed
                    </span>
                  ) : (
                    cycleStatus
                  )}
                </div>

                {/* cycle start_date and target_date */}
                {cycleStatus !== "draft" && (
                  <div className="flex items-center justify-start gap-2 text-custom-text-200">
                    <div className="flex items-start gap-1 whitespace-nowrap">
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>{renderShortDateWithYearFormat(startDate)}</span>
                    </div>

                    <ArrowRightIcon className="h-4 w-4" />

                    <div className="flex items-start gap-1 whitespace-nowrap">
                      <TargetIcon className="h-4 w-4" />
                      <span>{renderShortDateWithYearFormat(endDate)}</span>
                    </div>
                  </div>
                )}

                {/* cycle created by */}
                <div className="flex items-center text-custom-text-200">
                  {cycle.owned_by.avatar && cycle.owned_by.avatar !== "" ? (
                    <img
                      src={cycle.owned_by.avatar}
                      height={16}
                      width={16}
                      className="rounded-full"
                      alt={cycle.owned_by.display_name}
                    />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-300 capitalize text-white">
                      {cycle.owned_by.display_name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* cycle progress */}
                <Tooltip
                  position="top-right"
                  tooltipContent={
                    <div className="flex w-80 items-center gap-2 px-4 py-1">
                      <span>Progress</span>
                      <LinearProgressIndicator data={progressIndicatorData} />
                    </div>
                  }
                >
                  <span
                    className={`rounded-md px-1.5 py-1
                    ${
                      cycleStatus === "current"
                        ? "border border-green-600 bg-green-600/5 text-green-600"
                        : cycleStatus === "upcoming"
                        ? "border border-orange-300 bg-orange-300/5 text-orange-300"
                        : cycleStatus === "completed"
                        ? "border border-blue-500 bg-blue-500/5 text-blue-500"
                        : cycleStatus === "draft"
                        ? "border border-neutral-400 bg-neutral-400/5 text-neutral-400"
                        : ""
                    }`}
                  >
                    {cycleStatus === "current" ? (
                      <span className="flex gap-1 whitespace-nowrap">
                        {cycle.total_issues > 0 ? (
                          <>
                            <RadialProgressBar progress={(cycle.completed_issues / cycle.total_issues) * 100} />
                            <span>{Math.floor((cycle.completed_issues / cycle.total_issues) * 100)} %</span>
                          </>
                        ) : (
                          <span className="normal-case">No issues present</span>
                        )}
                      </span>
                    ) : cycleStatus === "upcoming" ? (
                      <span className="flex gap-1">
                        <RadialProgressBar progress={100} /> Yet to start
                      </span>
                    ) : cycleStatus === "completed" ? (
                      <span className="flex gap-1">
                        <RadialProgressBar progress={100} />
                        <span>{100} %</span>
                      </span>
                    ) : (
                      <span className="flex gap-1">
                        <RadialProgressBar progress={(cycle.total_issues / cycle.completed_issues) * 100} />
                        {cycleStatus}
                      </span>
                    )}
                  </span>
                </Tooltip>

                {/* cycle favorite */}
                {cycle.is_favorite ? (
                  <button type="button" onClick={handleRemoveFromFavorites}>
                    <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                  </button>
                ) : (
                  <button type="button" onClick={handleAddToFavorites}>
                    <StarIcon className="h-4 w-4 " color="rgb(var(--color-text-200))" />
                  </button>
                )}
              </div>
            </a>
          </Link>
        </div>

        <div className="flex-shrink-0">
          <CustomMenu width="auto" verticalEllipsis>
            {!isCompleted && (
              <CustomMenu.MenuItem onClick={() => setUpdateModal(true)}>
                <span className="flex items-center justify-start gap-2">
                  <PencilIcon className="h-4 w-4" />
                  <span>Edit Cycle</span>
                </span>
              </CustomMenu.MenuItem>
            )}

            {!isCompleted && (
              <CustomMenu.MenuItem onClick={() => setDeleteModal(true)}>
                <span className="flex items-center justify-start gap-2">
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete cycle</span>
                </span>
              </CustomMenu.MenuItem>
            )}

            <CustomMenu.MenuItem onClick={handleCopyText}>
              <span className="flex items-center justify-start gap-2">
                <LinkIcon className="h-4 w-4" />
                <span>Copy cycle link</span>
              </span>
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>

      <CycleCreateEditModal
        cycle={cycle}
        modal={updateModal}
        modalClose={() => setUpdateModal(false)}
        onSubmit={updateModalCallback}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
      />

      <CycleDeleteModal
        cycle={cycle}
        modal={deleteModal}
        modalClose={() => setDeleteModal(false)}
        onSubmit={deleteModalCallback}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
      />
    </>
  );
};
