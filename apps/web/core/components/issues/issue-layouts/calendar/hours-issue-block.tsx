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
import {
  buildPlannedAtForDrop,
  CALENDAR_ISSUE_DRAG_TYPE,
  HOURS_MIN_DURATION_MINUTES,
  HOURS_ROW_HEIGHT,
  HOURS_WORKDAY_END,
  HOURS_WORKDAY_START,
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
  pointerEventsDisabled?: boolean;
  handleResizePlan: HandleResizePlan;
};

const formatHourLabel = (hour: number) => `${hour.toString().padStart(2, "0")}:00`;

export const HoursIssueBlock = observer(function HoursIssueBlock(props: Props) {
  const {
    issue,
    dateString,
    startHour,
    endHour,
    durationMinutes,
    columnIndex,
    columnCount,
    quickActions,
    readOnly = false,
    canEditProperties,
    isEpic = false,
    showDueDateBadge = false,
    pointerEventsDisabled = false,
    handleResizePlan,
  } = props;

  const cardRef = useRef<HTMLAnchorElement | null>(null);
  const blockRef = useRef<HTMLDivElement | null>(null);
  const menuActionRef = useRef<HTMLDivElement | null>(null);

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
  const { getProjectIdentifierById } = useProject();

  const canEdit = !readOnly && canEditProperties(issue.project_id ?? undefined);
  const canDrag = canEdit;

  const displayStartHour = resizePreview?.startHour ?? startHour;
  const displayEndHour = resizePreview?.endHour ?? endHour;
  const top = (displayStartHour - HOURS_WORKDAY_START) * HOURS_ROW_HEIGHT;
  const height = Math.max(1, displayEndHour - displayStartHour) * HOURS_ROW_HEIGHT;
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
        getInitialData: () => ({ id: issue.id, date: dateString, type: CALENDAR_ISSUE_DRAG_TYPE }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      })
    );
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [cardRef?.current, issue.id, dateString, canDrag, resizePreview]);

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
      const deltaHours = Math.round((moveEvent.clientY - originY) / HOURS_ROW_HEIGHT);

      if (direction === "bottom") {
        const maxEnd = HOURS_WORKDAY_END + 1;
        latestEnd = Math.min(Math.max(originEnd + deltaHours, originStart + 1), maxEnd);
        latestStart = originStart;
      } else {
        const minStart = HOURS_WORKDAY_START;
        const maxStart = originEnd - 1;
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
      className={cn("absolute z-[2] px-0.5", {
        "pointer-events-none": pointerEventsDisabled,
        "pointer-events-auto": !pointerEventsDisabled,
      })}
      style={{
        top,
        height,
        left: `calc(${leftPercent}% + 1px)`,
        width: `calc(${widthPercent}% - 2px)`,
      }}
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
            "border-accent-strong bg-surface-2 shadow-raised-200": isDragging || !!resizePreview,
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
              <div className="flex items-center gap-1 truncate">
                {issue.project_id && (
                  <IssueIdentifier
                    issueId={issue.id}
                    projectId={issue.project_id}
                    size="xs"
                    variant="tertiary"
                    displayProperties={issuesFilter?.issueFilters?.displayProperties}
                  />
                )}
                <div className="truncate text-11 font-medium">{issue.name}</div>
              </div>
              {(resizePreview || durationMinutes > HOURS_MIN_DURATION_MINUTES) && (
                <div className="mt-0.5 text-9 text-tertiary">
                  {formatHourLabel(displayStartHour)} – {formatHourLabel(displayEndHour)}
                </div>
              )}
              {showDueDateBadge && issue.target_date && (
                <span className="mt-0.5 inline-flex rounded-sm bg-layer-2 px-1 py-0.5 text-9 text-tertiary">
                  {issue.target_date}
                </span>
              )}
            </div>
            <div
              role="presentation"
              className={cn("size-5 flex-shrink-0", {
                "hidden group-hover/hours-block:block": !isMobile,
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
