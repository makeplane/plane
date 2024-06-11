"use client";

import { FC } from "react";
import Link from "next/link";
// types
import { ICycle, TCycleGroups } from "@plane/types";
// ui
import { Tooltip, CycleGroupIcon, getButtonStyling, Avatar, AvatarGroup } from "@plane/ui";
// helpers
import { renderFormattedDate, findHowManyDaysLeft } from "@/helpers/date-time.helper";
import { truncateText } from "@/helpers/string.helper";
// hooks
import { useMember } from "@/hooks/store";

export type ActiveCycleHeaderProps = {
  cycle: ICycle;
  workspaceSlug: string;
  projectId: string;
};

export const ActiveCycleHeader: FC<ActiveCycleHeaderProps> = (props) => {
  const { cycle, workspaceSlug, projectId } = props;
  // store
  const { getUserDetails } = useMember();
  const cycleOwnerDetails = cycle && cycle.owned_by_id ? getUserDetails(cycle.owned_by_id) : undefined;

  const daysLeft = findHowManyDaysLeft(cycle.end_date) ?? 0;
  const currentCycleStatus = cycle.status?.toLocaleLowerCase() as TCycleGroups | undefined;

  const cycleAssignee = (cycle.distribution?.assignees ?? []).filter((assignee) => assignee.display_name);

  return (
    <div className="flex items-center justify-between px-3 py-1.5 rounded border-[0.5px] border-custom-border-100 bg-custom-background-90">
      <div className="flex items-center gap-2 cursor-default">
        <CycleGroupIcon cycleGroup={currentCycleStatus ?? "draft"} className="h-4 w-4" />
        <Tooltip tooltipContent={cycle.name} position="top-left">
          <h3 className="break-words text-lg font-medium">{truncateText(cycle.name, 70)}</h3>
        </Tooltip>
        <Tooltip
          tooltipContent={`Start date: ${renderFormattedDate(cycle.start_date ?? "")} Due Date: ${renderFormattedDate(
            cycle.end_date ?? ""
          )}`}
          position="top-left"
        >
          <span className="flex gap-1 whitespace-nowrap rounded-sm text-custom-text-400 font-semibold text-sm leading-5">
            {`${daysLeft} ${daysLeft > 1 ? "days" : "day"} left`}
          </span>
        </Tooltip>
      </div>
      <div className="flex items-center gap-4">
        <div className="rounded-sm text-sm">
          <div className="flex gap-2 divide-x spac divide-x-border-300 text-sm whitespace-nowrap text-custom-text-300 font-medium">
            <Avatar name={cycleOwnerDetails?.display_name} src={cycleOwnerDetails?.avatar} />
            {cycleAssignee.length > 0 && (
              <span className="pl-2">
                <AvatarGroup showTooltip>
                  {cycleAssignee.map((member) => (
                    <Avatar
                      key={member.assignee_id}
                      name={member?.display_name ?? ""}
                      src={member?.avatar ?? ""}
                      showTooltip={false}
                    />
                  ))}
                </AvatarGroup>
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}
          className={`${getButtonStyling("outline-primary", "sm")} cursor-pointer`}
        >
          View Cycle
        </Link>
      </div>
    </div>
  );
};
