// react
import React from "react";
// next
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// services
import cyclesService from "lib/services/cycles.service";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { Button, CustomMenu } from "ui";
// icons
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
import { ArrowPathIcon, CheckIcon, UserIcon, UserGroupIcon } from "@heroicons/react/24/outline";
// types
import { CycleIssueResponse, ICycle } from "types";
// fetch-keys
import { CYCLE_ISSUES } from "constants/fetch-keys";
// common
import { groupBy, renderShortNumericDateFormat } from "constants/common";

type Props = {
  cycle: ICycle;
  handleEditCycle: () => void;
  handleDeleteCycle: () => void;
};

const stateGroupColours: {
  [key: string]: string;
} = {
  backlog: "#3f76ff",
  unstarted: "#ff9e9e",
  started: "#d687ff",
  cancelled: "#ff5353",
  completed: "#096e8d",
};

const SingleStat: React.FC<Props> = ({ cycle, handleEditCycle, handleDeleteCycle }) => {
  const { activeWorkspace, activeProject } = useUser();

  const router = useRouter();

  const { data: cycleIssues } = useSWR<CycleIssueResponse[]>(
    activeWorkspace && activeProject && cycle.id ? CYCLE_ISSUES(cycle.id as string) : null,
    activeWorkspace && activeProject && cycle.id
      ? () =>
          cyclesService.getCycleIssues(activeWorkspace?.slug, activeProject?.id, cycle.id as string)
      : null
  );
  const groupedIssues = {
    backlog: [],
    unstarted: [],
    started: [],
    cancelled: [],
    completed: [],
    ...groupBy(cycleIssues ?? [], "issue_detail.state_detail.group"),
  };

  const startDate = new Date(cycle.start_date ?? "");
  const endDate = new Date(cycle.end_date ?? "");
  const today = new Date();

  return (
    <>
      <div className="rounded-md border bg-white p-3">
        <div className="grid grid-cols-8 gap-2 divide-x">
          <div className="col-span-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/projects/${activeProject?.id}/cycles/${cycle.id}`}>
                <a>
                  <h2 className="font-medium">{cycle.name}</h2>
                </a>
              </Link>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-xl border px-3 py-0.5 text-xs ${
                      today < startDate
                        ? "border-orange-500 text-orange-500"
                        : today > endDate
                        ? "border-red-500 text-red-500"
                        : "border-green-500 text-green-500"
                    }`}
                  >
                    {today < startDate ? "Not started" : today > endDate ? "Over" : "Active"}
                  </span>
                </div>
                <CustomMenu width="auto" ellipsis>
                  <CustomMenu.MenuItem onClick={handleEditCycle}>Edit cycle</CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={handleDeleteCycle}>
                    Delete cycle permanently
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-x-2 gap-y-3 text-xs">
              <div className="flex items-center gap-2 text-gray-500">
                <CalendarDaysIcon className="h-4 w-4" />
                Cycle dates
              </div>
              <div className="col-span-2">
                {renderShortNumericDateFormat(startDate)} - {renderShortNumericDateFormat(endDate)}
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <UserIcon className="h-4 w-4" />
                Created by
              </div>
              <div className="col-span-2 flex items-center gap-2">
                {cycle.owned_by.avatar && cycle.owned_by.avatar !== "" ? (
                  <Image
                    src={cycle.owned_by.avatar}
                    height={16}
                    width={16}
                    className="rounded-full"
                    alt={cycle.owned_by.first_name}
                  />
                ) : (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-gray-700 capitalize text-white">
                    {cycle.owned_by.first_name.charAt(0)}
                  </span>
                )}
                {cycle.owned_by.first_name}
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <UserGroupIcon className="h-4 w-4" />
                Active members
              </div>
              <div className="col-span-2"></div>
            </div>
            <div className="flex items-center gap-2">
              <Button theme="secondary" className="flex items-center gap-2" disabled>
                <CheckIcon className="h-3 w-3" />
                Participating
              </Button>
              <Button
                theme="secondary"
                className="flex items-center gap-2"
                onClick={() => router.push(`/projects/${activeProject?.id}/cycles/${cycle.id}`)}
              >
                <ArrowPathIcon className="h-3 w-3" />
                Open Cycle
              </Button>
            </div>
          </div>
          <div className="col-span-2 space-y-3 px-5">
            <h4 className="text-sm tracking-widest">PROGRESS</h4>
            <div className="space-y-3 text-xs">
              {Object.keys(groupedIssues).map((group) => {
                return (
                  <div key={group} className="flex items-center gap-2">
                    <div className="flex basis-2/3 items-center gap-2">
                      <span
                        className="block h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: stateGroupColours[group],
                        }}
                      ></span>
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
                );
              })}
            </div>
          </div>
          <div className="col-span-3"></div>
        </div>
      </div>
    </>
  );
};

export default SingleStat;
