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
import { TargetIcon } from "components/icons";
import {
  ChevronDownIcon,
  LinkIcon,
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
    if (!workspaceSlug || !projectId || !cycle) return;

    const cycleStatus = getDateRangeStatus(cycle.start_date, cycle.end_date);

    switch (cycleStatus) {
      case "current":
      case "upcoming":
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
        break;
      case "completed":
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
        break;
      case "draft":
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
        break;
    }

    cyclesService
      .addCycleToFavorites(workspaceSlug as string, projectId as string, {
        cycle: cycle.id,
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
    if (!workspaceSlug || !projectId || !cycle) return;

    const cycleStatus = getDateRangeStatus(cycle.start_date, cycle.end_date);

    switch (cycleStatus) {
      case "current":
      case "upcoming":
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
        break;
      case "completed":
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
        break;
      case "draft":
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
        break;
    }

    cyclesService
      .removeCycleFromFavorites(workspaceSlug as string, projectId as string, cycle.id)
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
      <div className="flex flex-col rounded-[10px] bg-brand-base text-xs shadow">
        <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}>
          <a className="w-full">
            <div className="flex h-full flex-col gap-4 rounded-b-[10px] p-4">
              <div className="flex items-start justify-between gap-1">
                <Tooltip tooltipContent={cycle.name} position="top-left">
                  <h3 className="break-all text-lg font-semibold">
                    {truncateText(cycle.name, 75)}
                  </h3>
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
                    <StarIcon className="h-4 w-4 " color="#858E96" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-start gap-5 text-brand-secondary">
                <div className="flex items-start gap-1 ">
                  <CalendarDaysIcon className="h-4 w-4" />
                  <span>Start :</span>
                  <span>{renderShortDateWithYearFormat(startDate)}</span>
                </div>
                <div className="flex items-start gap-1 ">
                  <TargetIcon className="h-4 w-4" />
                  <span>End :</span>
                  <span>{renderShortDateWithYearFormat(endDate)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-brand-secondary">
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
                    <span className="bg-brand-secondary flex h-5 w-5 items-center justify-center rounded-full capitalize">
                      {cycle.owned_by.first_name.charAt(0)}
                    </span>
                  )}
                  <span>{cycle.owned_by.first_name}</span>
                </div>
                <div className="flex items-center">
                  {!isCompleted && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleEditCycle();
                      }}
                      className="flex cursor-pointer items-center rounded p-1 duration-300 hover:bg-brand-surface-1"
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
