import React from "react";
import { Clock } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { useActiveTimers } from "@/hooks/use-active-timers";

type ActiveTimerBadgeProps = {
  workspaceSlug: string | undefined;
  issueId: string;
};

export const ActiveTimerBadge = ({ workspaceSlug, issueId }: ActiveTimerBadgeProps) => {
  const { activeTimers } = useActiveTimers(workspaceSlug);

  if (!workspaceSlug) return null;

  const issueTimers = activeTimers.filter((t) => t.issue_id === issueId);
  
  if (issueTimers.length === 0) return null;

  const usersText = issueTimers.map(t => t.user_display_name).join(", ");
  const tooltipText = `${usersText} ${issueTimers.length === 1 ? 'is' : 'are'} working on this`;

  return (
    <Tooltip tooltipContent={tooltipText} position="top">
      <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600">
        <Clock className="w-3 h-3 animate-pulse" />
        <span className="text-[10px] font-medium leading-none">
          {issueTimers.length}
        </span>
      </div>
    </Tooltip>
  );
};
