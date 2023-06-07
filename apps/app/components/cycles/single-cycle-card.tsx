import React from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// hooks
import useToast from "hooks/use-toast";
// components
import { SingleProgressStats } from "components/core";
// ui
import { CustomMenu, LinearProgressIndicator, Tooltip } from "components/ui";
import { AssigneesList } from "components/ui/avatar";
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
import {
  ChevronDownIcon,
  LinkIcon,
  PencilIcon,
  StarIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
// helpers
import {
  getDateRangeStatus,
  renderShortDateWithYearFormat,
  findHowManyDaysLeft,
} from "helpers/date-time.helper";
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
// types
import { ICycle } from "types";

type TSingleStatProps = {
  cycle: ICycle;
  handleEditCycle: () => void;
  handleDeleteCycle: () => void;
  handleAddToFavorites: () => void;
  handleRemoveFromFavorites: () => void;
  isCompleted?: boolean;
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

export const SingleCycleCard: React.FC<TSingleStatProps> = ({
  cycle,
  handleEditCycle,
  handleDeleteCycle,
  handleAddToFavorites,
  handleRemoveFromFavorites,
  isCompleted = false,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const cycleStatus = getDateRangeStatus(cycle.start_date, cycle.end_date);
  const endDate = new Date(cycle.end_date ?? "");
  const startDate = new Date(cycle.start_date ?? "");

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(
      `${originURL}/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`
    ).then(() => {
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
    value:
      cycle.total_issues > 0
        ? ((cycle[group.key as keyof ICycle] as number) / cycle.total_issues) * 100
        : 0,
    color: group.color,
  }));

  const groupedIssues: any = {
    backlog: cycle.backlog_issues,
    unstarted: cycle.unstarted_issues,
    started: cycle.started_issues,
    completed: cycle.completed_issues,
    cancelled: cycle.cancelled_issues,
  };

  return (
    <div>
      <div className="flex flex-col rounded-[10px] bg-brand-base border border-brand-base text-xs shadow">
        <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}>
          <a className="w-full">
            <div className="flex h-full flex-col gap-4 rounded-b-[10px] p-4">
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1">
                  <span className="h-5 w-5">
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
                          ? "#858E96"
                          : ""
                      }`}
                    />
                  </span>
                  <Tooltip tooltipContent={cycle.name} className="break-all" position="top-left">
                    <h3 className="break-all text-lg font-semibold">
                      {truncateText(cycle.name, 15)}
                    </h3>
                  </Tooltip>
                </span>
                <span className="flex items-center gap-1 capitalize">
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
                        {findHowManyDaysLeft(cycle.end_date ?? new Date())} Days Left
                      </span>
                    ) : cycleStatus === "upcoming" ? (
                      <span className="flex gap-1 whitespace-nowrap">
                        <AlarmClockIcon className="h-4 w-4" />
                        {findHowManyDaysLeft(cycle.start_date ?? new Date())} Days Left
                      </span>
                    ) : cycleStatus === "completed" ? (
                      <span className="flex gap-1 whitespace-nowrap">
                        {cycle.total_issues - cycle.completed_issues > 0 && (
                          <Tooltip
                            tooltipContent={`${
                              cycle.total_issues - cycle.completed_issues
                            } more pending ${
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
                      <StarIcon className="h-4 w-4 " color="#858E96" />
                    </button>
                  )}
                </span>
              </div>
              <div className="flex h-4 items-center justify-start gap-5 text-brand-secondary">
                {cycleStatus !== "draft" && (
                  <>
                    <div className="flex items-start gap-1">
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>{renderShortDateWithYearFormat(startDate)}</span>
                    </div>
                    <ArrowRightIcon className="h-4 w-4" />
                    <div className="flex items-start gap-1">
                      <TargetIcon className="h-4 w-4" />
                      <span>{renderShortDateWithYearFormat(endDate)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-2 text-xs text-brand-secondary">
                  <div className="flex items-center gap-2">
                    <div className="w-16">Creator:</div>
                    <div className="flex items-center gap-2.5 text-brand-secondary">
                      {cycle.owned_by.avatar && cycle.owned_by.avatar !== "" ? (
                        <img
                          src={cycle.owned_by.avatar}
                          height={16}
                          width={16}
                          className="rounded-full"
                          alt={cycle.owned_by.first_name}
                        />
                      ) : (
                        <span className="bg-brand-secondary flex h-5 w-5 items-center justify-center rounded-full bg-orange-300 capitalize  text-white">
                          {cycle.owned_by.first_name.charAt(0)}
                        </span>
                      )}
                      <span className="text-brand-secondary">{cycle.owned_by.first_name}</span>
                    </div>
                  </div>
                  <div className="flex h-5 items-center gap-2">
                    <div className="w-16">Members:</div>
                    {cycle.assignees.length > 0 ? (
                      <div className="flex items-center gap-1 text-brand-secondary">
                        <AssigneesList users={cycle.assignees} length={4} />
                      </div>
                    ) : (
                      "No members"
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  {!isCompleted && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleEditCycle();
                      }}
                      className="flex cursor-pointer items-center rounded p-1 text-brand-secondary duration-300 hover:bg-brand-surface-1"
                    >
                      <span>
                        <PencilIcon className="h-4 w-4" />
                      </span>
                    </button>
                  )}

                  <CustomMenu width="auto" verticalEllipsis>
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
          </a>
        </Link>

        <div className="flex h-full flex-col rounded-b-[10px]">
          <Disclosure>
            {({ open }) => (
              <div
                className={`flex h-full w-full flex-col rounded-b-[10px] border-t border-brand-base bg-brand-surface-2 text-brand-secondary ${
                  open ? "" : "flex-row"
                }`}
              >
                <div className="flex w-full items-center gap-2 px-4 py-1">
                  <span>Progress</span>
                  <Tooltip
                    tooltipContent={
                      <div className="flex w-56 flex-col">
                        {Object.keys(groupedIssues).map((group, index) => (
                          <SingleProgressStats
                            key={index}
                            title={
                              <div className="flex items-center gap-2">
                                <span
                                  className="block h-3 w-3 rounded-full "
                                  style={{
                                    backgroundColor: stateGroups[index].color,
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
                    }
                    position="bottom"
                  >
                    <div className="flex w-full items-center">
                      <LinearProgressIndicator data={progressIndicatorData} noTooltip={true} />
                    </div>
                  </Tooltip>
                  <Disclosure.Button>
                    <span className="p-1">
                      <ChevronDownIcon
                        className={`h-3 w-3 ${open ? "rotate-180 transform" : ""}`}
                        aria-hidden="true"
                      />
                    </span>
                  </Disclosure.Button>
                </div>
                <Transition show={open}>
                  <Disclosure.Panel>
                    <div className="overflow-hidden rounded-b-md bg-brand-surface-2 py-3 shadow">
                      <div className="col-span-2 space-y-3 px-4">
                        <div className="space-y-3 text-xs">
                          {stateGroups.map((group) => (
                            <div
                              key={group.key}
                              className="flex items-center justify-between gap-2"
                            >
                              <div className="flex  items-center gap-2">
                                <span
                                  className="block h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor: group.color,
                                  }}
                                />
                                <h6 className="text-xs">{group.title}</h6>
                              </div>
                              <div>
                                <span>
                                  {cycle[group.key as keyof ICycle] as number}{" "}
                                  <span className="text-brand-secondary">
                                    -{" "}
                                    {cycle.total_issues > 0
                                      ? `${Math.round(
                                          ((cycle[group.key as keyof ICycle] as number) /
                                            cycle.total_issues) *
                                            100
                                        )}%`
                                      : "0%"}
                                  </span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Disclosure.Panel>
                </Transition>
              </div>
            )}
          </Disclosure>
        </div>
      </div>
    </div>
  );
};
