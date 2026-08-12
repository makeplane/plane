/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { useOutsideClickDetector } from "@plane/hooks";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue } from "@plane/types";
import { ControlLink } from "@plane/ui";
import { cn, generateWorkItemLink } from "@plane/utils";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
import type { TRenderQuickActions } from "../list/list-view-types";
import { HIGHLIGHT_CLASS } from "../utils";
import type { CalendarStoreType } from "./base-calendar-root";
import { createCalendarDragPreviewHandler } from "./drag-preview";
import {
  buildPlannedAtForDrop,
  CALENDAR_ISSUE_DRAG_TYPE,
  formatHourLabel,
  formatPlannedDurationLabel,
  HOURS_MIN_DURATION_MINUTES,
  HOURS_ROW_HEIGHT,
  HOURS_WORKDAY_END,
  HOURS_WORKDAY_START,
  snapHourDelta,
} from "./utils";

type ResizeDirection = "top" | "bottom";

type HandleResizePlan = (
  issueId: string,
  data: { planned_at?: string | null; planned_duration_minutes?: number }
) => Promise<void>;

type Props = {
  issue: TIssue;
  dateString: string;
  startHour: number;
  endHour: number;
  durationMinutes: number;
  columnIndex: number;
  columnCount: number;
  quickActions: TRenderQuickActions;
  readOnly?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
  showDueDateBadge?: boolean;
  showProjectBadge?: boolean;
  pointerEventsDisabled?: boolean;
  handleResizePlan: HandleResizePlan;
};

const MIN_SPAN_HOURS = HOURS_MIN_DURATION_MINUTES / 60;

export const HoursIssueBlock = observer(function HoursIssueBlock(props: Props) {
  const {
    issue,
    dateString,
    startHour,
    endHour,
    columnIndex,
    columnCount,
    quickActions,
    readOnly = false,
    canEditProperties,
    isEpic = false,
    showDueDateBadge = false,
    showProjectBadge = false,
    pointerEventsDisabled = false,
    handleResizePlan,
  } = props;

  const cardRef = useRef<HTMLAnchorElement | null>(null);
  const blockRef = useRef<HTMLDivElement | null>(null);
  const menuActionRef = useRef<HTMLDivElement | null>(null);
  const grabOffsetRef = useRef({ x: 8, y: 8 });

  const [isDragging, setIsDragging] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [resizePreview, setResizePreview] = useState<{ startHour: number; endHour: number } | null>(null);

  const { workspaceSlug } = useParams();
  const { getProjectStates } = useProjectState();
  const { getIsIssuePeeked } = useIssueDetail();
  const { handleRedirection } = useIssuePeekOverviewRedirection(isEpic);
  const { isMobile } = usePlatformOS();
  const storeType = useIssueStoreType() as CalendarStoreType;
  const { issuesFilter } = useIssues(storeType);
  const { getProjectById, getProjectIdentifierById } = useProject();
  const projectName = showProjectBadge ? getProjectById(issue.project_id)?.name : undefined;

  const canEdit = !readOnly && canEditProperties(issue.project_id ?? undefined);
  const canDrag = canEdit;

  const displayStartHour = resizePreview?.startHour ?? startHour;
  const displayEndHour = resizePreview?.endHour ?? endHour;
  const displayDurationMinutes = Math.round((displayEndHour - displayStartHour) * 60);
  const top = (displayStartHour - HOURS_WORKDAY_START) * HOURS_ROW_HEIGHT;
  const height = Math.max(MIN_SPAN_HOURS, displayEndHour - displayStartHour) * HOURS_ROW_HEIGHT;
  const widthPercent = 100 / Math.max(columnCount, 1);
  const leftPercent = columnIndex * widthPercent;

  const stateColor = getProjectStates(issue.project_id)?.find((state) => state?.id == issue.state_id)?.color || "";
  const projectIdentifier = getProjectIdentifierById(issue.project_id);

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString(),
    projectId: issue.project_id,
    issueId: issue.id,
    projectIdentifier,
    sequenceId: issue.sequence_id,
    isEpic,
    isArchived: !!issue.archived_at,
  });

  useEffect(() => {
    const element = cardRef.current;
    if (!element || !issue.id) return;

    return combine(
      draggable({
        element,
        dragHandle: element,
        canDrag: () => canDrag && !resizePreview,
        getInitialData: ({ input, element: dragElement }) => {
          const rect = dragElement.getBoundingClientRect();
          grabOffsetRef.current = {
            x: input.clientX - rect.left,
            y: input.clientY - rect.top,
          };
          return {
            id: issue.id,
            date: dateString,
            type: CALENDAR_ISSUE_DRAG_TYPE,
            grabOffsetY: grabOffsetRef.current.y,
            grabOffsetX: grabOffsetRef.current.x,
            durationMinutes: displayDurationMinutes,
            issueName: issue.name,
          };
        },
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
        onGenerateDragPreview: showDueDateBadge
          ? createCalendarDragPreviewHandler(() => ({
              title: issue.name,
              subtitle: `${formatHourLabel(displayStartHour)} – ${formatHourLabel(displayEndHour)}`,
              grabOffsetX: grabOffsetRef.current.x,
              grabOffsetY: grabOffsetRef.current.y,
              blockHeight: height,
              blockWidth: blockRef.current?.getBoundingClientRect().width ?? 160,
            }))
          : undefined,
      })
    );
  }, [
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps -- rebind when card node mounts (kanban pattern)
    cardRef?.current,
    issue.id,
    issue.name,
    dateString,
    canDrag,
    resizePreview,
    showDueDateBadge,
    displayStartHour,
    displayEndHour,
    displayDurationMinutes,
  ]);

  useOutsideClickDetector(cardRef, () => {
    cardRef.current?.classList?.remove(HIGHLIGHT_CLASS);
  });
  useOutsideClickDetector(menuActionRef, () => setIsMenuActive(false));

  const handleIssuePeekOverview = (peekIssue: TIssue) =>
    handleRedirection(workspaceSlug?.toString(), peekIssue, isMobile);

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, direction: ResizeDirection) => {
    if (!canEdit || e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const originY = e.clientY;
    const originStart = startHour;
    const originEnd = endHour;
    let latestStart = originStart;
    let latestEnd = originEnd;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaHours = snapHourDelta(moveEvent.clientY - originY);

      if (direction === "bottom") {
        const maxEnd = HOURS_WORKDAY_END + 1;
        latestEnd = Math.min(Math.max(originEnd + deltaHours, originStart + MIN_SPAN_HOURS), maxEnd);
        latestStart = originStart;
      } else {
        const minStart = HOURS_WORKDAY_START;
        const maxStart = originEnd - MIN_SPAN_HOURS;
        latestStart = Math.min(Math.max(originStart + deltaHours, minStart), maxStart);
        latestEnd = originEnd;
      }

      setResizePreview({ startHour: latestStart, endHour: latestEnd });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      const nextDuration = Math.max((latestEnd - latestStart) * 60, HOURS_MIN_DURATION_MINUTES);
      const didChange = latestStart !== startHour || latestEnd !== endHour;

      setResizePreview(null);
      if (!didChange) return;

      const payload =
        direction === "top"
          ? {
              planned_at: buildPlannedAtForDrop(dateString, null, latestStart),
              planned_duration_minutes: nextDuration,
            }
          : {
              planned_at: issue.planned_at,
              planned_duration_minutes: nextDuration,
            };

      void handleResizePlan(issue.id, payload);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const customActionButton = (
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
    menuActionRef.current.getBoundingClientRect().bottom < window.innerHeight - 220;

  const placement = isMenuActionRefAboveScreenBottom ? "bottom-end" : "top-end";

  return (
    <div
      role="presentation"
      className={cn("absolute px-0.5", {
        "pointer-events-none": pointerEventsDisabled,
        "pointer-events-auto": !pointerEventsDisabled,
        "z-[5]": isDragging && showDueDateBadge,
        "z-[2]": !isDragging || !showDueDateBadge,
      })}
      style={{
        top,
        height,
        left: `calc(${leftPercent}% + 1px)`,
        width: `calc(${widthPercent}% - 2px)`,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onDragStart={() => {
        if (canDrag) return;
        setToast({
          type: TOAST_TYPE.WARNING,
          title: "Cannot move work item",
          message: "You are not allowed to reschedule this work item",
        });
      }}
    >
      <div
        ref={blockRef}
        className={cn(
          "group/hours-block relative flex h-full w-full flex-col overflow-hidden rounded-sm border border-subtle bg-surface-1",
          {
            "bg-surface-2 shadow-raised-200": isDragging || !!resizePreview,
            invisible: isDragging && showDueDateBadge && !resizePreview,
            "border-accent-strong": getIsIssuePeeked(issue.id),
            "cursor-grab active:cursor-grabbing": canDrag && !resizePreview,
          }
        )}
      >
        {canEdit && (
          <div
            role="presentation"
            className="absolute inset-x-0 top-0 z-[3] h-2 cursor-row-resize"
            onMouseDown={(e) => handleResizeStart(e, "top")}
          >
            <div className="bg-tertiary mx-auto mt-0.5 h-0.5 w-8 rounded-full opacity-0 transition-opacity group-hover/hours-block:opacity-100" />
          </div>
        )}

        <ControlLink
          id={`issue-${issue.id}`}
          href={workItemLink}
          onClick={() => handleIssuePeekOverview(issue)}
          className="block min-h-0 flex-1 overflow-hidden text-13 text-primary"
          disabled={!!issue.tempId || isMobile}
          draggable={false}
          ref={cardRef}
        >
          <div className="flex h-full items-start gap-1.5 px-1.5 py-1">
            <span
              className="mt-0.5 h-[calc(100%-4px)] w-0.5 flex-shrink-0 rounded-sm"
              style={{ backgroundColor: stateColor }}
            />
            <div className="min-w-0 flex-1">
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
              <div className="truncate text-11 font-medium">{issue.name}</div>
              <div className="mt-0.5 truncate text-9 text-tertiary">
                {formatHourLabel(displayStartHour)} – {formatHourLabel(displayEndHour)}
                {" · "}
                {formatPlannedDurationLabel(Math.round((displayEndHour - displayStartHour) * 60))}
              </div>
              {(showDueDateBadge || showProjectBadge) && (issue.target_date || projectName) && (
                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                  {showDueDateBadge && issue.target_date && (
                    <span className="inline-flex rounded-sm bg-layer-2 px-1 py-0.5 text-9 text-tertiary">
                      {issue.target_date}
                    </span>
                  )}
                  {projectName && (
                    <span className="inline-flex max-w-24 truncate rounded-sm bg-layer-2 px-1 py-0.5 text-9 text-tertiary">
                      {projectName}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div
              role="presentation"
              className={cn("size-5 flex-shrink-0", {
                "invisible group-hover/hours-block:visible": !isMobile,
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
        </ControlLink>

        {canEdit && (
          <div
            role="presentation"
            className="absolute inset-x-0 bottom-0 z-[3] h-2 cursor-row-resize"
            onMouseDown={(e) => handleResizeStart(e, "bottom")}
          >
            <div className="bg-tertiary mx-auto mb-0.5 h-0.5 w-8 rounded-full opacity-0 transition-opacity group-hover/hours-block:opacity-100" />
          </div>
        )}
      </div>
    </div>
  );
});
