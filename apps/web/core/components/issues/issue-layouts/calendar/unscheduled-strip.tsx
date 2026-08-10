/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TGroupedIssues, TIssueMap, TPaginationData } from "@plane/types";
import { cn } from "@plane/utils";
import { highlightIssueOnDrop } from "@/components/issues/issue-layouts/utils";
import type { TRenderQuickActions } from "../list/list-view-types";
import { CalendarIssueBlocks } from "./issue-blocks";
import {
  CALENDAR_DAY_DROP_TYPE,
  CALENDAR_ISSUE_DRAG_TYPE,
  getCalendarDestinationFromDropPayload,
  getCalendarSourceFromDropPayload,
} from "./utils";

type Props = {
  groupedIssueIds: TGroupedIssues;
  issues?: TIssueMap;
  quickActions: TRenderQuickActions;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  readOnly?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
  handleDragAndDrop: (
    issueId: string | undefined,
    issueProjectId: string | undefined,
    sourceDate: string | undefined,
    destinationDate: string | undefined,
    destinationHour?: number
  ) => Promise<void>;
};

export const CalendarUnscheduledStrip = observer(function CalendarUnscheduledStrip(props: Props) {
  const {
    groupedIssueIds,
    issues,
    quickActions,
    loadMoreIssues,
    getPaginationData,
    getGroupIssueCount,
    readOnly,
    canEditProperties,
    isEpic,
    handleDragAndDrop,
  } = props;
  const { t } = useTranslation();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const issueIds = groupedIssueIds?.None;
  // Keep an editable empty shell so scheduled issues can be dropped back to unscheduled.
  const shouldRender = Boolean(issueIds?.length) || !readOnly;

  useEffect(() => {
    if (!shouldRender) return;

    const element = stripRef.current;
    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source?.data?.type === CALENDAR_ISSUE_DRAG_TYPE,
        getData: () => ({ date: "None", type: CALENDAR_DAY_DROP_TYPE }),
        onDragEnter: () => setIsDraggingOver(true),
        onDragLeave: () => setIsDraggingOver(false),
        onDrop: (payload) => {
          setIsDraggingOver(false);

          const source = getCalendarSourceFromDropPayload(payload);
          const destination = getCalendarDestinationFromDropPayload(payload);
          if (!source || !destination) return;

          void handleDragAndDrop(
            source.id,
            issues?.[source.id]?.project_id ?? undefined,
            source.date,
            destination.date
          );

          highlightIssueOnDrop(payload.source?.element?.id, false);
        },
      })
    );
  }, [handleDragAndDrop, issueIds?.length, issues, readOnly, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="border-t border-subtle-1 px-4 py-3">
      <p className="mb-2 text-11 font-medium text-tertiary">{t("issue.layouts.calendar.unscheduled")}</p>
      <div
        ref={stripRef}
        className={cn("rounded-sm border border-dashed border-subtle-1 p-2", {
          "bg-layer-transparent-hover": isDraggingOver,
          "min-h-10": !issueIds?.length,
        })}
      >
        <CalendarIssueBlocks
          issueIdList={issueIds ?? []}
          quickActions={quickActions}
          loadMoreIssues={() => loadMoreIssues("None")}
          getPaginationData={() => getPaginationData("None")}
          getGroupIssueCount={() => getGroupIssueCount("None")}
          isDragDisabled={readOnly}
          readOnly={readOnly}
          canEditProperties={canEditProperties}
          isEpic={isEpic}
          sourceDate="None"
        />
      </div>
    </div>
  );
});
