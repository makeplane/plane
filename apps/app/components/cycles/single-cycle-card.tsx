import React from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import cyclesService from "services/cycles.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomMenu, LinearProgressIndicator, Tooltip } from "components/ui";
import { Disclosure, Transition } from "@headlessui/react";
// icons
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
import {
  ChevronDownIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  StarIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
// helpers
import { getDateRangeStatus, renderShortDateWithYearFormat } from "helpers/date-time.helper";
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
// types
import {
  CompletedCyclesResponse,
  CurrentAndUpcomingCyclesResponse,
  DraftCyclesResponse,
  ICycle,
} from "types";
// fetch-keys
import {
  CYCLE_COMPLETE_LIST,
  CYCLE_CURRENT_AND_UPCOMING_LIST,
  CYCLE_DRAFT_LIST,
} from "constants/fetch-keys";

type TSingleStatProps = {
  cycle: ICycle;
  handleEditCycle: () => void;
  handleDeleteCycle: () => void;
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
  isCompleted = false,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const endDate = new Date(cycle.end_date ?? "");
  const startDate = new Date(cycle.start_date ?? "");

  const handleAddToFavorites = () => {
    if (!workspaceSlug && !projectId && !cycle) return;

    cyclesService
      .addCycleToFavorites(workspaceSlug as string, projectId as string, {
        cycle: cycle.id,
      })
      .then(() => {
        const cycleStatus = getDateRangeStatus(cycle.start_date, cycle.end_date);

        if (cycleStatus === "current" || cycleStatus === "upcoming")
          mutate<CurrentAndUpcomingCyclesResponse>(
            CYCLE_CURRENT_AND_UPCOMING_LIST(projectId as string),
            (prevData) => ({
              current_cycle: (prevData?.current_cycle ?? []).map((c) => ({
                ...c,
                is_favorite: c.id === cycle.id ? true : c.is_favorite,
              })),
              upcoming_cycle: (prevData?.upcoming_cycle ?? []).map((c) => ({
                ...c,
                is_favorite: c.id === cycle.id ? true : c.is_favorite,
              })),
            }),
            false
          );
        else if (cycleStatus === "completed")
          mutate<CompletedCyclesResponse>(
            CYCLE_COMPLETE_LIST(projectId as string),
            (prevData) => ({
              completed_cycles: (prevData?.completed_cycles ?? []).map((c) => ({
                ...c,
                is_favorite: c.id === cycle.id ? true : c.is_favorite,
              })),
            }),
            false
          );
        else
          mutate<DraftCyclesResponse>(
            CYCLE_DRAFT_LIST(projectId as string),
            (prevData) => ({
              draft_cycles: (prevData?.draft_cycles ?? []).map((c) => ({
                ...c,
                is_favorite: c.id === cycle.id ? true : c.is_favorite,
              })),
            }),
            false
          );

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Successfully added the cycle to favorites.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't add the cycle to favorites. Please try again.",
        });
      });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !cycle) return;

    cyclesService
      .removeCycleFromFavorites(workspaceSlug as string, projectId as string, cycle.id)
      .then(() => {
        const cycleStatus = getDateRangeStatus(cycle.start_date, cycle.end_date);

        if (cycleStatus === "current" || cycleStatus === "upcoming")
          mutate<CurrentAndUpcomingCyclesResponse>(
            CYCLE_CURRENT_AND_UPCOMING_LIST(projectId as string),
            (prevData) => ({
              current_cycle: (prevData?.current_cycle ?? []).map((c) => ({
                ...c,
                is_favorite: c.id === cycle.id ? false : c.is_favorite,
              })),
              upcoming_cycle: (prevData?.upcoming_cycle ?? []).map((c) => ({
                ...c,
                is_favorite: c.id === cycle.id ? false : c.is_favorite,
              })),
            }),
            false
          );
        else if (cycleStatus === "completed")
          mutate<CompletedCyclesResponse>(
            CYCLE_COMPLETE_LIST(projectId as string),
            (prevData) => ({
              completed_cycles: (prevData?.completed_cycles ?? []).map((c) => ({
                ...c,
                is_favorite: c.id === cycle.id ? false : c.is_favorite,
              })),
            }),
            false
          );
        else
          mutate<DraftCyclesResponse>(
            CYCLE_DRAFT_LIST(projectId as string),
            (prevData) => ({
              draft_cycles: (prevData?.draft_cycles ?? []).map((c) => ({
                ...c,
                is_favorite: c.id === cycle.id ? false : c.is_favorite,
              })),
            }),
            false
          );

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Successfully removed the cycle from favorites.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the cycle from favorites. Please try again.",
        });
      });
  };

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

  return (
    <div>
      <div className="flex flex-col rounded-[10px] bg-white text-xs shadow">
        <div className="flex h-full flex-col gap-4 rounded-b-[10px] p-4">
          <div className="flex items-start justify-between gap-1">
            <Tooltip tooltipContent={cycle.name} position="top-left">
              <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}>
                <a className="w-full">
                  <h3 className="break-all text-lg font-semibold">
                    {truncateText(cycle.name, 75)}
                  </h3>
                </a>
              </Link>
            </Tooltip>
            {cycle.is_favorite ? (
              <button onClick={handleRemoveFromFavorites}>
                <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
              </button>
            ) : (
              <button onClick={handleAddToFavorites}>
                <StarIcon className="h-4 w-4 " color="#858E96" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-start gap-5">
            <div className="flex items-start gap-1 ">
              <CalendarDaysIcon className="h-4 w-4 text-gray-900" />
              <span className="text-gray-400">Start :</span>
              <span>{renderShortDateWithYearFormat(startDate)}</span>
            </div>
            <div className="flex items-start gap-1 ">
              <CalendarDaysIcon className="h-4 w-4 text-gray-900" />
              <span className="text-gray-400">End :</span>
              <span>{renderShortDateWithYearFormat(endDate)}</span>
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col rounded-b-[10px]">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2.5">
              {cycle.owned_by.avatar && cycle.owned_by.avatar !== "" ? (
                <Image
                  src={cycle.owned_by.avatar}
                  height={16}
                  width={16}
                  className="rounded-full"
                  alt={cycle.owned_by.first_name}
                />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 capitalize  text-white">
                  {cycle.owned_by.first_name.charAt(0)}
                </span>
              )}
              <span className="text-gray-900">{cycle.owned_by.first_name}</span>
            </div>
            <div className="flex items-center">
              {isCompleted ? (
                ""
              ) : (
                <button
                  onClick={handleEditCycle}
                  className="flex cursor-pointer items-center rounded p-1 duration-300 hover:bg-gray-100"
                >
                  <span>
                    <PencilIcon className="h-4 w-4" />
                  </span>
                </button>
              )}

              <CustomMenu width="auto" verticalEllipsis>
                {isCompleted ? (
                  ""
                ) : (
                  <CustomMenu.MenuItem onClick={handleDeleteCycle}>
                    <span className="flex items-center justify-start gap-2 text-gray-800">
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete Cycle</span>
                    </span>
                  </CustomMenu.MenuItem>
                )}
                <CustomMenu.MenuItem onClick={handleCopyText}>
                  <span className="flex items-center justify-start gap-2 text-gray-800">
                    <DocumentDuplicateIcon className="h-4 w-4" />
                    <span>Copy Cycle Link</span>
                  </span>
                </CustomMenu.MenuItem>
              </CustomMenu>
            </div>
          </div>

          <Disclosure>
            {({ open }) => (
              <div
                className={`flex h-full w-full flex-col border-t border-gray-200 bg-gray-100 ${
                  open ? "" : "flex-row"
                }`}
              >
                <div className="flex w-full items-center gap-2 px-4 py-1">
                  <span>Progress</span>
                  <LinearProgressIndicator data={progressIndicatorData} />
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
                    <div className="overflow-hidden rounded-b-md bg-white py-3 shadow">
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
                                  <span className="text-gray-500">
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
