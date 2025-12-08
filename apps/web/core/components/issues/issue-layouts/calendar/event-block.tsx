import React, { useRef } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import type { TIssue } from "@plane/types";
import { cn } from "@plane/utils";
import type { TRenderQuickActions } from "../list/list-view-types";

type Props = {
  issue: TIssue;
  quickActions: TRenderQuickActions;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
  style?: React.CSSProperties;
};

export const CalendarEventBlock: React.FC<Props> = observer(({
  issue,
  quickActions,
  canEditProperties,
  isEpic = false,
  style,
}) => {
  const router = useRouter();
  const issueRef = useRef<HTMLDivElement | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Navigate to issue detail
    const url = `/${issue.workspace_id}/projects/${issue.project_id}/${isEpic ? 'epics' : 'issues'}/${issue.id}`;
    router.push(url);
  };

  // Format time display
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const startTime = issue.start_time ? formatTime(issue.start_time) : null;
  const endTime = issue.end_time ? formatTime(issue.end_time) : null;

  return (
    <div
      ref={issueRef}
      className={cn(
        "absolute left-1 right-1 rounded-md border border-custom-border-300 bg-custom-background-100",
        "hover:bg-custom-background-80 cursor-pointer transition-colors",
        "overflow-hidden shadow-sm hover:shadow-md",
        "group"
      )}
      style={style}
      onClick={handleClick}
    >
      <div className="h-full p-2 flex flex-col gap-1">
        {/* Time range */}
        {startTime && (
          <div className="text-[10px] font-medium text-custom-text-300">
            {startTime}{endTime && ` - ${endTime}`}
          </div>
        )}

        {/* Issue title */}
        <div className="text-xs font-medium text-custom-text-100 line-clamp-2">
          {issue.name}
        </div>

        {/* Issue metadata */}
        <div className="flex items-center gap-2 text-[10px] text-custom-text-300 mt-auto">
          {issue.project_id && (
            <span className="truncate">{issue.project_id}</span>
          )}
          {issue.sequence_id && (
            <span className="font-mono">#{issue.sequence_id}</span>
          )}
        </div>

        {/* Quick actions on hover */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {quickActions({
            issue,
            parentRef: issueRef,
          })}
        </div>
      </div>
    </div>
  );
});