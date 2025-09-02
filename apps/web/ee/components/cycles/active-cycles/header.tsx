import { FC } from "react";
import Link from "next/link";
// icons
import { UserCircle2 } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
// types
import { ICycle, TCycleGroups } from "@plane/types";
// ui
import { CycleGroupIcon, getButtonStyling } from "@plane/ui";
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
  return (
    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border-[0.5px] border-custom-border-100 bg-custom-background-90">
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
          <div className="flex gap-2 text-sm whitespace-nowrap text-custom-text-300 font-medium">
            <span className="flex items-center gap-1.5">
              <UserCircle2 className="h-4 w-4" />
              <span className="text-base leading-5">Lead</span>
            </span>
            <div className="flex items-center gap-1.5">
              {cycleOwnerDetails?.avatar_url && cycleOwnerDetails?.avatar_url !== "" ? (
                <img
                  src={getFileURL(cycleOwnerDetails?.avatar_url)}
                  className="rounded-full flex-shrink-0 w-5 h-5 object-cover"
                  alt={cycleOwnerDetails?.display_name}
                />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-background-100 capitalize">
                  {cycleOwnerDetails?.display_name.charAt(0)}
                </span>
              )}
              <span className="text-base leading-5">{cycleOwnerDetails?.display_name}</span>
            </div>
          </div>
        </div>
        <Link
          href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}
          className={`${getButtonStyling("primary", "sm")} cursor-pointer`}
        >
          View cycle
        </Link>
      </div>
    </div>
  );
};
