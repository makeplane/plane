/* eslint-disable react/display-name */
import { useState, useRef, forwardRef } from "react";
import { observer } from "mobx-react";
import { MoreHorizontal } from "lucide-react";
import { TIssue } from "@plane/types";
// components
import { Tooltip, ControlLink } from "@plane/ui";
// hooks
import { cn } from "@/helpers/common.helper";
import { useAppRouter, useIssueDetail, useProject, useProjectState } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
// helpers
// types
import { usePlatformOS } from "@/hooks/use-platform-os";
import { TRenderQuickActions } from "../list/list-view-types";

type Props = {
  issue: TIssue;
  quickActions: TRenderQuickActions;
  isDragging?: boolean;
};

export const CalendarIssueBlock = observer(
  forwardRef<HTMLAnchorElement, Props>((props, ref) => {
    const { issue, quickActions, isDragging = false } = props;
    // states
    const [isMenuActive, setIsMenuActive] = useState(false);
    // refs
    const blockRef = useRef(null);
    const menuActionRef = useRef<HTMLDivElement | null>(null);
    // hooks
    const { workspaceSlug, projectId } = useAppRouter();
    const { getProjectIdentifierById } = useProject();
    const { getProjectStates } = useProjectState();
    const { getIsIssuePeeked, setPeekIssue } = useIssueDetail();
    const { isMobile } = usePlatformOS();

    const stateColor = getProjectStates(issue?.project_id)?.find((state) => state?.id == issue?.state_id)?.color || "";

    const handleIssuePeekOverview = (issue: TIssue) =>
      workspaceSlug &&
      issue &&
      issue.project_id &&
      issue.id &&
      !getIsIssuePeeked(issue.id) &&
      setPeekIssue({ workspaceSlug, projectId: issue.project_id, issueId: issue.id });

    useOutsideClickDetector(menuActionRef, () => setIsMenuActive(false));

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

    const isMenuActionRefAboveScreenBottom =
      menuActionRef?.current && menuActionRef?.current?.getBoundingClientRect().bottom < window.innerHeight - 220;

    const placement = isMenuActionRefAboveScreenBottom ? "bottom-end" : "top-end";

    return (
      <ControlLink
        id={`issue-${issue.id}`}
        href={`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`}
        target="_blank"
        onClick={() => handleIssuePeekOverview(issue)}
        className="block w-full text-sm text-custom-text-100 rounded border-b md:border-[1px] border-custom-border-200 hover:border-custom-border-400"
        disabled={!!issue?.tempId || isMobile}
        ref={ref}
      >
        <>
          {issue?.tempId !== undefined && (
            <div className="absolute left-0 top-0 z-[99999] h-full w-full animate-pulse bg-custom-background-100/20" />
          )}

          <div
            ref={blockRef}
            className={cn(
              "group/calendar-block flex h-10 md:h-8 w-full items-center justify-between gap-1.5 rounded  md:px-1 px-4 py-1.5 ",
              {
                "bg-custom-background-90 shadow-custom-shadow-rg border-custom-primary-100": isDragging,
                "bg-custom-background-100 hover:bg-custom-background-90": !isDragging,
                "border border-custom-primary-70 hover:border-custom-primary-70": getIsIssuePeeked(issue.id),
              }
            )}
          >
            <div className="flex h-full items-center gap-1.5 truncate">
              <span
                className="h-full w-0.5 flex-shrink-0 rounded"
                style={{
                  backgroundColor: stateColor,
                }}
              />
              <div className="flex-shrink-0 text-sm md:text-xs text-custom-text-300">
                {getProjectIdentifierById(issue?.project_id)}-{issue.sequence_id}
              </div>
              <Tooltip tooltipContent={issue.name} isMobile={isMobile}>
                <div className="truncate text-sm font-medium md:font-normal md:text-xs">{issue.name}</div>
              </Tooltip>
            </div>
            <div
              className={cn("flex-shrink-0 size-5", {
                "hidden group-hover/calendar-block:block": !isMobile,
                block: isMenuActive,
              })}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {quickActions({
                issue,
                parentRef: blockRef,
                customActionButton,
                placement,
              })}
            </div>
          </div>
        </>
      </ControlLink>
    );
  })
);

CalendarIssueBlock.displayName = "CalendarIssueBlock";
