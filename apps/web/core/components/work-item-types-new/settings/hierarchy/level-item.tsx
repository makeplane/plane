/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Badge } from "@plane/propel/badge";
import type { BaseWorkItemTypeInstanceSchema } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { isWorkItemHierarchyDragData } from "./drag-helpers";
import { useWorkItemTypeHierarchyLocalState } from "./hierarchy-local-state-context";
import { WorkItemTypeHierarchyLevelItemType } from "./level-item-type";
import { WorkItemTypeHierarchyLevelQuickActions } from "./level-quick-actions";

type WorkItemTypeHierarchyLevelItemProps = {
  defaultLevel: number;
  level: number;
  workItemTypes: BaseWorkItemTypeInstanceSchema[];
};

export const WorkItemTypeHierarchyLevelItem = observer(function WorkItemTypeHierarchyLevelItem({
  defaultLevel,
  level,
  workItemTypes,
}: WorkItemTypeHierarchyLevelItemProps) {
  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  // states
  const [isDragOver, setIsDragOver] = useState(false);
  // params
  const { workspaceSlug } = useParams();
  const { applyHierarchyDrop } = useWorkItemTypeHierarchyLocalState();
  const { t } = useTranslation();
  // derived values
  const isEmptyLevel = workItemTypes.length === 0;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        canDrop: ({ source }) => {
          const data = source.data;
          return isWorkItemHierarchyDragData(data) && data.sourceLevel !== level;
        },
        onDragEnter: () => setIsDragOver(true),
        onDragLeave: () => setIsDragOver(false),
        onDrop: ({ source }) => {
          setIsDragOver(false);
          if (!workspaceSlug) return;
          const data = source.data;
          if (!isWorkItemHierarchyDragData(data)) return;
          if (data.sourceLevel === level) return;
          applyHierarchyDrop({
            workItemTypeId: data.workItemTypeId,
            sourceLevel: data.sourceLevel,
            targetLevel: level,
          });
        },
      })
    );
  }, [applyHierarchyDrop, level, workspaceSlug]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-layer-2 border border-subtle p-3 rounded-lg flex items-start justify-between gap-2 truncate transition-colors",
        {
          "border-accent-strong bg-layer-2-hover": isDragOver,
        }
      )}
    >
      <div className="flex gap-2">
        <span
          className={cn(
            "shrink-0 size-8 bg-layer-3 rounded-md text-caption-md-medium text-secondary grid place-items-center",
            {
              "text-placeholder": level === 0,
            }
          )}
        >
          {level}
        </span>
        {isEmptyLevel ? (
          <p className="text-body-xs-regular text-tertiary py-1.5">
            {t("work_item_type_hierarchy.levels.empty_level_placeholder", { level })}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {workItemTypes.map((workItemType) => (
              <WorkItemTypeHierarchyLevelItemType key={workItemType.id} level={level} workItemType={workItemType} />
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2 py-1">
        {level === defaultLevel && (
          <Badge size="sm" variant="neutral">
            {t("common.default")}
          </Badge>
        )}
        <WorkItemTypeHierarchyLevelQuickActions defaultLevel={defaultLevel} level={level} />
      </div>
    </div>
  );
});
