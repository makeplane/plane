import React from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import cyclesService from "services/cycles.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomMenu, LinearProgressIndicator } from "components/ui";
import { Disclosure, Transition } from "@headlessui/react";
// icons
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
import { ChevronDownIcon, PencilIcon, StarIcon } from "@heroicons/react/24/outline";
// helpers
import { getDateRangeStatus, renderShortDateWithYearFormat } from "helpers/date-time.helper";
import { groupBy } from "helpers/array.helper";
import { capitalizeFirstLetter, copyTextToClipboard } from "helpers/string.helper";
// types
import {
  CompletedCyclesResponse,
  CurrentAndUpcomingCyclesResponse,
  CycleIssueResponse,
  DraftCyclesResponse,
  ICycle,
} from "types";
// fetch-keys
import {
  CYCLE_COMPLETE_LIST,
  CYCLE_CURRENT_AND_UPCOMING_LIST,
  CYCLE_DRAFT_LIST,
  CYCLE_ISSUES,
  CYCLE_LIST,
} from "constants/fetch-keys";

type TSingleStatProps = {
  cycle: ICycle;
  handleEditCycle: () => void;
  handleDeleteCycle: () => void;
};

const stateGroupColours: {
  [key: string]: string;
} = {
  backlog: "#DEE2E6",
  unstarted: "#26B5CE",
  started: "#F7AE59",
  cancelled: "#D687FF",
  completed: "#09A953",
};

export const SingleCycleCard: React.FC<TSingleStatProps> = (props) => {
  const { cycle, handleEditCycle, handleDeleteCycle } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  const { setToastAlert } = useToast();

  const { data: cycleIssues } = useSWR<CycleIssueResponse[]>(
    workspaceSlug && projectId && cycle.id ? CYCLE_ISSUES(cycle.id as string) : null,
    workspaceSlug && projectId && cycle.id
      ? () => cyclesService.getCycleIssues(workspaceSlug as string, projectId as string, cycle.id)
      : null
  );

  const endDate = new Date(cycle.end_date ?? "");
  const startDate = new Date(cycle.start_date ?? "");

  const groupedIssues = {
    backlog: [],
    unstarted: [],
    started: [],
    cancelled: [],
    completed: [],
    ...groupBy(cycleIssues ?? [], "issue_detail.state_detail.group"),
  };

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

  const progressIndicatorData = Object.keys(groupedIssues).map((group, index) => ({
    id: index,
    name: capitalizeFirstLetter(group),
    value:
      cycleIssues && cycleIssues.length > 0
        ? (groupedIssues[group].length / cycleIssues.length) * 100
        : 0,
    color: stateGroupColours[group],
  }));

  return (
    <div className="h-full w-full">
      <div className="flex flex-col rounded-[10px] bg-white text-xs shadow">
        <div className="flex h-full flex-col gap-4 rounded-b-[10px] px-5  py-5">
          <div className="flex items-center justify-between gap-1">
            <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}>
              <a className="w-full">
                <h3 className="text-xl font-semibold leading-5 ">{cycle.name}</h3>
              </a>
            </Link>
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

        <div className="flex h-full  flex-col rounded-b-[10px]">
          <div className="flex items-center justify-between px-5 py-4">
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
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 capitalize  text-white">
                  {cycle.owned_by.first_name.charAt(0)}
                </span>
              )}
              <span className="text-gray-900">{cycle.owned_by.first_name}</span>
            </div>
            <div className="flex items-center ">
              <button
                onClick={handleEditCycle}
                className="flex cursor-pointer items-center rounded p-1 duration-300 hover:bg-gray-100"
              >
                <span>
                  <PencilIcon className="h-4 w-4" />
                </span>
              </button>

              <CustomMenu width="auto" verticalEllipsis>
                <CustomMenu.MenuItem onClick={handleDeleteCycle}>Delete cycle</CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={handleCopyText}>Copy cycle link</CustomMenu.MenuItem>
              </CustomMenu>
            </div>
          </div>

          <Disclosure>
            {({ open }) => (
              <div
                className={`flex  h-full  w-full flex-col border-t border-gray-200 bg-gray-100 ${
                  open ? "" : "flex-row"
                }`}
              >
                <div className="flex  w-full items-center gap-2 px-5 py-4 ">
                  <span> Progress </span>
                  <LinearProgressIndicator data={progressIndicatorData} />
                  <Disclosure.Button>
                    <ChevronDownIcon
                      className={`h-3 w-3 ${open ? "rotate-180 transform" : ""}`}
                      aria-hidden="true"
                    />
                  </Disclosure.Button>
                </div>
                <Transition show={open}>
                  <Disclosure.Panel>
                    <div className="overflow-hidden rounded-b-md bg-white p-3 shadow">
                      <div className="col-span-2 space-y-3  px-5">
                        <div className="space-y-3 text-xs">
                          {Object.keys(groupedIssues).map((group) => (
                            <div key={group} className="flex items-center justify-between gap-2">
                              <div className="flex  items-center gap-2">
                                <span
                                  className="block h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor: stateGroupColours[group],
                                  }}
                                />
                                <h6 className="text-xs capitalize">{group}</h6>
                              </div>
                              <div>
                                <span>
                                  {groupedIssues[group].length}{" "}
                                  <span className="text-gray-500">
                                    -{" "}
                                    {cycleIssues && cycleIssues.length > 0
                                      ? `${Math.round(
                                          (groupedIssues[group].length / cycleIssues.length) * 100
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
