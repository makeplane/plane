/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useRef, forwardRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import type { TIssue } from "@plane/types";
import { ControlLink } from "@plane/ui";
import { cn, generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
// components
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// local components
import type { TRenderQuickActions } from "../list/list-view-types";
import type { CalendarStoreType } from "./base-calendar-root";
import { formatHourLabel, formatPlannedDurationLabel, getIssuePlanBounds } from "./utils";

type Props = {
  issue: TIssue;
  quickActions: TRenderQuickActions;
  isDragging?: boolean;
  isEpic?: boolean;
  showDueDateBadge?: boolean;
  showProjectBadge?: boolean;
  stackProjectBadge?: boolean;
};

export const CalendarIssueBlock = observer(
  forwardRef(function CalendarIssueBlock(props: Props, ref: React.ForwardedRef<HTMLAnchorElement>) {
    const {
      issue,
      quickActions,
      isDragging = false,
      isEpic = false,
      showDueDateBadge = false,
      showProjectBadge = false,
      stackProjectBadge = false,
    } = props;
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
    const storeType = useIssueStoreType() as CalendarStoreType;
    const { issuesFilter } = useIssues(storeType);
    const { getProjectById, getProjectIdentifierById } = useProject();

    const stateColor = getProjectStates(issue?.project_id)?.find((state) => state?.id == issue?.state_id)?.color || "";
    const projectIdentifier = getProjectIdentifierById(issue?.project_id);
    const projectName = showProjectBadge ? getProjectById(issue?.project_id)?.name : undefined;

    // Personal work-item plans (profile calendar only) carry a specific time slot — show the
    // same "start – end · duration" info here as the scheduled block on the hours grid, so an
    // item looks the same whether the calendar is in month/week or hours layout.
    const planBounds = showDueDateBadge
      ? getIssuePlanBounds(issue?.planned_at, issue?.planned_duration_minutes)
      : undefined;
    const timeLabel = planBounds
      ? `${formatHourLabel(planBounds.startHour)} – ${formatHourLabel(planBounds.endHour)} · ${formatPlannedDurationLabel(planBounds.durationMinutes)}`
      : undefined;
    // A time label needs its own line, so lay the block out the same way stacked (badge-row)
    // items already are, even when the caller didn't explicitly ask for stacking.
    const isStacked = stackProjectBadge || !!timeLabel;

    // handlers
    const handleIssuePeekOverview = (peekIssue: TIssue) =>
      handleRedirection(workspaceSlug?.toString(), peekIssue, isMobile);

    useOutsideClickDetector(menuActionRef, () => setIsMenuActive(false));

    const customActionButton = (
      // CustomMenu renders this inside its own <button>, which already carries the
      // interactive semantics and keyboard handling — this div is presentational.
      <div
        role="presentation"
        ref={menuActionRef}
        className={`w-full cursor-pointer rounded-sm p-1 text-placeholder hover:bg-layer-1 ${
          isMenuActive ? "bg-layer-1-active text-primary" : "text-secondary"
        }`}
        onClick={() => setIsMenuActive(!isMenuActive)}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </div>
    );

    const isMenuActionRefAboveScreenBottom =
      typeof window !== "undefined" &&
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

    // Match board/kanban: ControlLink is the Pragmatic drag element (via forwarded ref).
    // Do not wrap it in Popover.Button — that intercepts pointer events and breaks DnD.
    return (
      <ControlLink
        id={`issue-${issue.id}`}
        href={workItemLink}
        onClick={() => handleIssuePeekOverview(issue)}
        className="block w-full rounded-sm border-b border-subtle text-13 text-primary hover:border-subtle-1 md:border-[1px]"
        disabled={!!issue?.tempId || isMobile}
        draggable={false}
        ref={ref}
      >
        <>
          {issue?.tempId !== undefined && (
            <div className="absolute top-0 left-0 z-[99999] h-full w-full animate-pulse bg-surface-1/20" />
          )}

          <div
            ref={blockRef}
            className={cn(
              "group/calendar-block flex w-full items-center justify-between gap-1.5 rounded-sm px-4 py-1.5 md:px-1",
              isStacked ? "min-h-10 items-start py-2 md:min-h-8" : "h-10 md:h-8",
              {
                "bg-surface-2 shadow-raised-200": isDragging,
                "opacity-40": isDragging && showDueDateBadge,
                "bg-surface-1 hover:bg-surface-2": !isDragging,
                "border border-accent-strong hover:border-accent-strong": getIsIssuePeeked(issue.id),
              }
            )}
          >
            {isStacked ? (
              <div className="flex min-w-0 flex-1 items-start gap-1.5">
                <span
                  className="mt-1 h-3.5 w-0.5 flex-shrink-0 rounded-sm"
                  style={{
                    backgroundColor: stateColor,
                  }}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  {issue.project_id && (
                    <div>
                      <IssueIdentifier
                        issueId={issue.id}
                        projectId={issue.project_id}
                        size="xs"
                        variant="tertiary"
                        displayProperties={issuesFilter?.issueFilters?.displayProperties}
                      />
                    </div>
                  )}
                  <div className="max-w-[85%] min-w-0 text-13 font-medium text-wrap break-words md:text-11 md:font-regular">
                    {issue.name}
                  </div>
                  {timeLabel && <div className="truncate text-9 text-tertiary">{timeLabel}</div>}
                  {(projectName || (showDueDateBadge && issue.target_date)) && (
                    <div className="flex flex-wrap items-center gap-1">
                      {projectName && (
                        <span className="max-w-full truncate rounded-sm bg-layer-2 px-1 py-0.5 text-9 text-tertiary">
                          {projectName}
                        </span>
                      )}
                      {showDueDateBadge && issue.target_date && (
                        <span className="flex-shrink-0 rounded-sm bg-layer-2 px-1 py-0.5 text-9 text-tertiary">
                          {issue.target_date}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-w-0 flex-1 items-center gap-1.5 truncate">
                <span
                  className="h-full w-0.5 flex-shrink-0 rounded-sm"
                  style={{
                    backgroundColor: stateColor,
                  }}
                />
                {issue.project_id && (
                  <IssueIdentifier
                    issueId={issue.id}
                    projectId={issue.project_id}
                    size="xs"
                    variant="tertiary"
                    displayProperties={issuesFilter?.issueFilters?.displayProperties}
                  />
                )}
                <div className="truncate text-13 font-medium md:text-11 md:font-regular">{issue.name}</div>
                {projectName && (
                  <span className="max-w-20 flex-shrink-0 truncate rounded-sm bg-layer-2 px-1 py-0.5 text-9 text-tertiary">
                    {projectName}
                  </span>
                )}
                {showDueDateBadge && issue.target_date && (
                  <span className="flex-shrink-0 rounded-sm bg-layer-2 px-1 py-0.5 text-9 text-tertiary">
                    {issue.target_date}
                  </span>
                )}
              </div>
            )}
            {/* Wrapper exists only to stop clicks reaching the ControlLink; the
                quick-action menu inside carries its own interactive semantics. */}
            <div
              role="presentation"
              className={cn("size-5 flex-shrink-0", {
                "invisible group-hover/calendar-block:visible": !isMobile,
                visible: isMenuActive,
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
