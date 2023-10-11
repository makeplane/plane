import React, { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomMenu } from "components/ui";
import { Tooltip, LinearProgressIndicator } from "@plane/ui";
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
import { LinkIcon, PencilIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
// helpers
import { getDateRangeStatus, renderShortDateWithYearFormat, findHowManyDaysLeft } from "helpers/date-time.helper";
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
// types
import { ICycle } from "types";

type TSingleStatProps = {
  cycle: ICycle;
  handleEditCycle: () => void;
  handleDeleteCycle: () => void;
  handleAddToFavorites: () => void;
  handleRemoveFromFavorites: () => void;
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

type progress = {
  progress: number;
};

function RadialProgressBar({ progress }: progress) {
  const [circumference, setCircumference] = useState(0);

  useEffect(() => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    setCircumference(circumference);
  }, []);

  const progressOffset = ((100 - progress) / 100) * circumference;

  return (
    <div className="relative h-4 w-4">
      <svg className="absolute top-0 left-0" viewBox="0 0 100 100">
        <circle
          className={"stroke-current opacity-10"}
          cx="50"
          cy="50"
          r="40"
          strokeWidth="12"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
        />
        <circle
          className={`stroke-current`}
          cx="50"
          cy="50"
          r="40"
          strokeWidth="12"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={progressOffset}
          transform="rotate(-90 50 50)"
        />
      </svg>
    </div>
  );
}

export const SingleCycleList: React.FC<TSingleStatProps> = ({
  cycle,
  handleEditCycle,
  handleDeleteCycle,
  handleAddToFavorites,
  handleRemoveFromFavorites,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

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

  const completedIssues = cycle.completed_issues + cycle.cancelled_issues;

  const percentage = cycle.total_issues > 0 ? (completedIssues / cycle.total_issues) * 100 : 0;

  return (
    <div>
      <div className="flex flex-col text-xs hover:bg-custom-background-80">
        <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}>
          <a className="w-full">
            <div className="flex h-full flex-col gap-4 rounded-b-[10px] p-4">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-start gap-2">
                  <ContrastIcon
                    className="mt-1 h-5 w-5"
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
                  <div className="max-w-2xl">
                    <Tooltip tooltipContent={cycle.name} className="break-words" position="top-left">
                      <h3 className="break-words w-full text-base font-semibold">{truncateText(cycle.name, 60)}</h3>
                    </Tooltip>
                    <p className="mt-2 text-custom-text-200 break-words w-full">{cycle.description}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-4">
                  <span
                    className={`rounded-full px-1.5 py-0.5
                    ${
                      cycleStatus === "current"
                        ? "bg-green-600/5 text-green-600"
                        : cycleStatus === "upcoming"
                        ? "bg-orange-300/5 text-orange-300"
                        : cycleStatus === "completed"
                        ? "bg-blue-500/5 text-blue-500"
                        : cycleStatus === "draft"
                        ? "bg-neutral-400/5 text-neutral-400"
                        : ""
                    }`}
                  >
                    {cycleStatus === "current" ? (
                      <span className="flex gap-1 whitespace-nowrap">
                        <PersonRunningIcon className="h-4 w-4" />
                        {findHowManyDaysLeft(cycle.end_date ?? new Date())} days left
                      </span>
                    ) : cycleStatus === "upcoming" ? (
                      <span className="flex gap-1">
                        <AlarmClockIcon className="h-4 w-4" />
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
                  </span>

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
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-300 capitalize text-white">
                        {cycle.owned_by.display_name.charAt(0)}
                      </span>
                    )}
                  </div>
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
                          <span>{Math.round(percentage)} %</span>
                        </span>
                      ) : (
                        <span className="flex gap-1">
                          <RadialProgressBar progress={(cycle.total_issues / cycle.completed_issues) * 100} />
                          {cycleStatus}
                        </span>
                      )}
                    </span>
                  </Tooltip>
                  {cycle.is_favorite ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveFromFavorites();
                      }}
                    >
                      <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToFavorites();
                      }}
                    >
                      <StarIcon className="h-4 w-4 " color="rgb(var(--color-text-200))" />
                    </button>
                  )}
                  <div className="flex items-center">
                    <CustomMenu width="auto" verticalEllipsis>
                      {!isCompleted && (
                        <CustomMenu.MenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            handleEditCycle();
                          }}
                        >
                          <span className="flex items-center justify-start gap-2">
                            <PencilIcon className="h-4 w-4" />
                            <span>Edit Cycle</span>
                          </span>
                        </CustomMenu.MenuItem>
                      )}
                      {!isCompleted && (
                        <CustomMenu.MenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteCycle();
                          }}
                        >
                          <span className="flex items-center justify-start gap-2">
                            <TrashIcon className="h-4 w-4" />
                            <span>Delete cycle</span>
                          </span>
                        </CustomMenu.MenuItem>
                      )}
                      <CustomMenu.MenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          handleCopyText();
                        }}
                      >
                        <span className="flex items-center justify-start gap-2">
                          <LinkIcon className="h-4 w-4" />
                          <span>Copy cycle link</span>
                        </span>
                      </CustomMenu.MenuItem>
                    </CustomMenu>
                  </div>
                </div>
              </div>
            </div>
          </a>
        </Link>
      </div>
    </div>
  );
};
