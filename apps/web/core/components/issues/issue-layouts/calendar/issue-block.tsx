"use client";

/* eslint-disable react/display-name */
import { useState, useRef, forwardRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// types
import { PriorityIcon, priorityBlockClasses } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { TIssue } from "@plane/types";
// ui
import { ControlLink, Avatar } from "@plane/ui";
import { cn, generateWorkItemLink } from "@plane/utils";
// helpers
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
// local components
import { TRenderQuickActions } from "../list/list-view-types";
import { CalendarStoreType } from "./base-calendar-root";

type Props = {
  issue: TIssue;
  quickActions: TRenderQuickActions;
  isDragging?: boolean;
  isEpic?: boolean;
};

export const CalendarIssueBlock = observer(
  forwardRef<HTMLAnchorElement, Props>((props, ref) => {
    const { issue, quickActions, isDragging = false, isEpic = false } = props;
    // states
    const [isMenuActive, setIsMenuActive] = useState(false);
    // refs
    const blockRef = useRef(null);
    const menuActionRef = useRef<HTMLDivElement | null>(null);
    // hooks
    const { workspaceSlug } = useParams();
    const { getProjectStates } = useProjectState();
    const { getIsIssuePeeked } = useIssueDetail();
    const { handleRedirection } = useIssuePeekOverviewRedirection(isEpic);
    const { isMobile } = usePlatformOS();
    const { labelMap } = useLabel();
    const { getUserDetails } = useMember();
    const storeType = useIssueStoreType() as CalendarStoreType;
    const { issuesFilter } = useIssues(storeType);
    const { getProjectIdentifierById } = useProject();

    const stateColor =
      getProjectStates(issue?.project_id)?.find((state) => state?.id == issue?.state_id)?.color || "";
    const projectIdentifier = getProjectIdentifierById(issue?.project_id);
    const priority = issue?.priority || "none";
    const assignees = issue?.assignee_ids?.map((id) => getUserDetails(id)).filter(Boolean) || [];
    const labels = issue?.label_ids?.map((id) => labelMap[id]).filter(Boolean) || [];

    // handlers
    const handleIssuePeekOverview = (issue: TIssue) =>
      handleRedirection(workspaceSlug.toString(), issue, isMobile);

    useOutsideClickDetector(menuActionRef, () => setIsMenuActive(false));

    const customActionButton = (
      <div
        ref={menuActionRef}
        className={`w-full cursor-pointer rounded p-1 text-custom-sidebar-text-400 hover:bg-custom-background-80 ${isMenuActive ? "bg-custom-background-80 text-custom-text-100" : "text-custom-text-200"
          }`}
        onClick={() => setIsMenuActive(!isMenuActive)}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </div>
    );

    const isMenuActionRefAboveScreenBottom =
      menuActionRef?.current &&
      menuActionRef?.current?.getBoundingClientRect().bottom < window.innerHeight - 220;

    const placement = isMenuActionRefAboveScreenBottom ? "bottom-end" : "top-end";

    const workItemLink = generateWorkItemLink({
      workspaceSlug: workspaceSlug?.toString(),
      projectId: issue?.project_id,
      issueId: issue?.id,
      projectIdentifier,
      sequenceId: issue?.sequence_id,
      isEpic,
      isArchived: !!issue?.archived_at,
    });

    return (
      <ControlLink
        id={`issue-${issue.id}`}
        href={workItemLink}
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
            className={cn(
              "group/calendar-block flex flex-col w-full gap-2 rounded md:px-2 px-4 py-2 min-h-[60px] md:min-h-[70px]",
              priorityBlockClasses[priority],
              {
                "bg-custom-background-90 shadow-custom-shadow-rg border-custom-primary-100": isDragging,
                "hover:bg-opacity-80 transition-all duration-200": !isDragging,
                "border-2 border-custom-primary-70 hover:border-custom-primary-70": getIsIssuePeeked(issue.id),
              }
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PriorityIcon priority={priority} size={12} />
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: stateColor }}
                />
                {issue.project_id && (
                  <IssueIdentifier
                    issueId={issue.id}
                    projectId={issue.project_id}
                    textContainerClassName="text-xs text-custom-text-400"
                    displayProperties={issuesFilter?.issueFilters?.displayProperties}
                  />
                )}
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

            <div className="flex-1">
              <Tooltip tooltipContent={issue.name} isMobile={isMobile}>
                <div className="text-sm font-medium md:font-normal md:text-xs text-custom-text-100 line-clamp-2">
                  {issue.name}
                </div>
              </Tooltip>
            </div>

            <div className="flex items-center justify-between gap-2 mt-1">
              <div className="flex items-center gap-1 flex-wrap">
                {labels.slice(0, 2).map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium truncate max-w-20"
                    style={{
                      backgroundColor: `${label.color}20`,
                      color: label.color,
                      borderColor: `${label.color}40`,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
                {labels.length > 2 && (
                  <span className="text-xs text-custom-text-300">
                    +{labels.length - 2}
                  </span>
                )}
              </div>

              <div className="flex items-center -space-x-1">
                {assignees.slice(0, 3).map((assignee) => (
                  <Tooltip
                    key={assignee?.id}
                    tooltipContent={assignee?.display_name || assignee?.first_name}
                    isMobile={isMobile}
                  >
                    <Avatar
                      src={assignee?.avatar_url}
                      name={assignee?.display_name || assignee?.first_name}
                      size="sm"
                    />
                  </Tooltip>
                ))}
                {assignees.length > 3 && (
                  <div className="flex items-center justify-center bg-custom-background-80 text-custom-text-200 rounded-full ring-2 ring-white text-xs font-medium">
                    +{assignees.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      </ControlLink>
    );
  })
);

CalendarIssueBlock.displayName = "CalendarIssueBlock";
