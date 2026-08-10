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
import type { TGroupedIssues, TPaginationData } from "@plane/types";
import { cn } from "@plane/utils";
import { highlightIssueOnDrop } from "@/components/issues/issue-layouts/utils";
import type { TRenderQuickActions } from "../list/list-view-types";
import { CalendarIssueBlocks } from "./issue-blocks";

type Props = {
  groupedIssueIds: TGroupedIssues;
  quickActions: TRenderQuickActions;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  readOnly?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
};

export const CalendarUnscheduledStrip = observer(function CalendarUnscheduledStrip(props: Props) {
  const {
    groupedIssueIds,
    quickActions,
    loadMoreIssues,
    getPaginationData,
    getGroupIssueCount,
    readOnly,
    canEditProperties,
    isEpic,
  } = props;
  const { t } = useTranslation();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const issueIds = groupedIssueIds?.None;

  useEffect(() => {
    const element = stripRef.current;
    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        getData: () => ({ date: "None" }),
        onDragEnter: () => setIsDraggingOver(true),
        onDragLeave: () => setIsDraggingOver(false),
        onDrop: ({ source }) => {
          setIsDraggingOver(false);
          highlightIssueOnDrop(source?.element?.id, false);
        },
      })
    );
  }, []);

  if (!issueIds?.length) return null;

  return (
    <div className="border-t border-subtle-1 px-4 py-3">
      <p className="mb-2 text-11 font-medium text-tertiary">{t("issue.layouts.calendar.unscheduled")}</p>
      <div
        ref={stripRef}
        className={cn("rounded-sm border border-dashed border-subtle-1 p-2", {
          "bg-layer-transparent-hover": isDraggingOver,
        })}
      >
        <CalendarIssueBlocks
          issueIdList={issueIds}
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
