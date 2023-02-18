import React from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

// swr
import useSWR from "swr";
// services
import cyclesService from "services/cycles.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, CustomMenu } from "components/ui";
// icons
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
import { UserIcon } from "@heroicons/react/24/outline";
import { CyclesIcon } from "components/icons";
// helpers
import { renderShortNumericDateFormat } from "helpers/date-time.helper";
import { groupBy } from "helpers/array.helper";
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { CycleIssueResponse, ICycle } from "types";
// fetch-keys
import { CYCLE_ISSUES } from "constants/fetch-keys";

type TSingleStatProps = {
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

const SingleStat: React.FC<TSingleStatProps> = (props) => {
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

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Cycle link copied to clipboard",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Some error occurred",
        });
      });
  };

  return (
    <>
      <div className="rounded-md border bg-white p-3">
        <div className="grid grid-cols-9 gap-2 divide-x">
          <div className="col-span-3 flex flex-col space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/${workspaceSlug}/projects/${projectId as string}/cycles/${cycle.id}`}>
                <a>
                  <h2 className="font-medium w-full max-w-[175px] lg:max-w-[225px] xl:max-w-[300px]  text-ellipsis overflow-hidden">
                    {cycle.name}
                  </h2>
                </a>
              </Link>
              <CustomMenu width="auto" ellipsis>
                <CustomMenu.MenuItem onClick={handleCopyText}>Copy cycle link</CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={handleEditCycle}>Edit cycle</CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={handleDeleteCycle}>
                  Delete cycle permanently
                </CustomMenu.MenuItem>
              </CustomMenu>
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
            </div>
            <div className="flex h-full items-end">
              <Button
                theme="secondary"
                className="flex items-center gap-2"
                onClick={() =>
                  router.push(`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`)
                }
              >
                <CyclesIcon className="h-3 w-3" />
                Open Cycle
              </Button>
            </div>
          </div>
          <div className="col-span-2 space-y-3 px-5">
            <h4 className="text-sm tracking-widest">PROGRESS</h4>
            <div className="space-y-3 text-xs">
              {Object.keys(groupedIssues).map((group) => (
                <div key={group} className="flex items-center gap-2">
                  <div className="flex basis-2/3 items-center gap-2">
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
      </div>
    </>
  );
};

export default SingleStat;
