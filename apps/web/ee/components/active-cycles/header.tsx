import { FC } from "react";
import Link from "next/link";
import { CycleGroupIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
// types
import { ICycle, TCycleGroups } from "@plane/types";
// ui
import { Avatar,AvatarGroup,getButtonStyling } from "@plane/ui";
// helpers
import { findHowManyDaysLeft, getFileURL, renderFormattedDate, truncateText } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";

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
  const currentCycleStatus = cycle?.status?.toLocaleLowerCase() as TCycleGroups;

  const cycleAssignee = (cycle.distribution?.assignees ?? []).filter((assignee) => assignee.display_name);

  return (
    <div className="flex items-center justify-between px-3 py-1.5 rounded border-[0.5px] border-custom-border-100 bg-custom-background-90">
      <div className="flex items-center gap-2 cursor-default">
        <CycleGroupIcon cycleGroup={currentCycleStatus} className="h-4 w-4" />
        <Tooltip tooltipContent={cycle.name} position="top-start">
          <h3 className="break-words text-lg font-medium">{truncateText(cycle.name, 70)}</h3>
        </Tooltip>
        <Tooltip
          tooltipContent={`Start date: ${renderFormattedDate(cycle.start_date ?? "")} Due Date: ${renderFormattedDate(
            cycle.end_date ?? ""
          )}`}
          position="top-start"
        >
          <span className="flex gap-1 whitespace-nowrap rounded-sm text-custom-text-400 font-semibold text-sm leading-5">
            {`${daysLeft} ${daysLeft > 1 ? "days" : "day"} left`}
          </span>
        </Tooltip>
      </div>
      <div className="flex items-center gap-4">
        <div className="rounded-sm text-sm">
          <div className="flex gap-2 divide-x spac divide-x-border-300 text-sm whitespace-nowrap text-custom-text-300 font-medium">
            <Avatar name={cycleOwnerDetails?.display_name} src={getFileURL(cycleOwnerDetails?.avatar_url ?? "")} />
            {cycleAssignee.length > 0 && (
              <span className="pl-2">
                <AvatarGroup showTooltip>
                  {cycleAssignee.map((member) => (
                    <Avatar
                      key={member.assignee_id}
                      name={member?.display_name ?? ""}
                      src={getFileURL(member?.avatar_url ?? "")}
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
          View cycle
        </Link>
      </div>
    </div>
  );
};
