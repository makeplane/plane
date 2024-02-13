import { useState, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
import { observer } from "mobx-react";
// components
import { Tooltip, ControlLink } from "@plane/ui";
// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";
import { useApplication, useIssueDetail, useProject, useProjectState } from "hooks/store";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  isDragging?: boolean;
};

export const CalendarIssueBlock: React.FC<Props> = observer((props) => {
  const { issue, quickActions, isDragging = false } = props;
  // states
  const [isMenuActive, setIsMenuActive] = useState(false);
  // hooks
  const {
    router: { workspaceSlug, projectId },
  } = useApplication();
  const { getProjectById } = useProject();
  const { peekIssue, setPeekIssue } = useIssueDetail();
  const { getProjectStates } = useProjectState();
  // refs
  const menuActionRef = useRef<HTMLDivElement | null>(null);
  useOutsideClickDetector(menuActionRef, () => setIsMenuActive(false));

  const stateColor = getProjectStates(issue?.project_id)?.find((state) => state?.id == issue?.state_id)?.color || "";

  const handleIssuePeekOverview = (issue: TIssue) =>
    workspaceSlug &&
    issue &&
    issue.project_id &&
    issue.id &&
    setPeekIssue({ workspaceSlug, projectId: issue.project_id, issueId: issue.id });

  const customActionButton = (
    <div
      ref={menuActionRef}
      className={`w-full cursor-pointer rounded p-1 text-custom-sidebar-text-400 hover:bg-custom-background-80 ${
        isMenuActive ? "bg-custom-background-80 text-custom-text-100" : "text-custom-text-200"
      }`}
      onClick={() => setIsMenuActive(!isMenuActive)}
    >
      <MoreHorizontal className="h-3.5 w-3.5" />
    </div>
  );
  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`}
      target="_blank"
      onClick={() => handleIssuePeekOverview(issue)}
      className="w-full line-clamp-1 cursor-pointer text-sm text-custom-text-100"
    >
      <>
        {issue?.tempId !== undefined && (
          <div className="absolute left-0 top-0 z-[99999] h-full w-full animate-pulse bg-custom-background-100/20" />
        )}

        <div
          className={cn(
            "group/calendar-block flex h-10 md:h-8 w-full items-center justify-between gap-1.5 rounded md:border-[0.5px] border-custom-border-200 hover:border-custom-border-400 px-1 py-1.5 ",
            {
              "bg-custom-background-90 shadow-custom-shadow-rg border-custom-primary-100": isDragging,
            },
            { "bg-custom-background-100 md:hover:bg-custom-background-90": !isDragging },
            {
              "border border-custom-primary-70 hover:border-custom-primary-70": peekIssue?.issueId === issue.id,
            }
          )}
        >
          <div className="flex h-full items-center gap-1.5">
            <span
              className="h-full w-0.5 flex-shrink-0 rounded"
              style={{
                backgroundColor: stateColor,
              }}
            />
            <div className="flex-shrink-0 text-sm md:text-xs text-custom-text-300">
              {getProjectById(issue?.project_id)?.identifier}-{issue.sequence_id}
            </div>
            <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
              <div className="truncate text-base font-medium md:text-xs">{issue.name}</div>
            </Tooltip>
          </div>
          <div
            className={`md:hidden h-5 w-5 group-hover/calendar-block:block ${isMenuActive ? "!block" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {quickActions(issue, customActionButton)}
          </div>
        </div>
      </>
    </ControlLink>
  );
});
