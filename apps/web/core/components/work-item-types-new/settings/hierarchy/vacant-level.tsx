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
import { Badge } from "@plane/propel/badge";
import { useTranslation } from "@plane/i18n";
import { AddIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// plane web imports
import { useWorkItemType } from "@/plane-web/hooks/store/work-item-types/use-work-item-type";
// local imports
import { handleWorkItemHierarchyDrop, isWorkItemHierarchyDragData } from "./drag-helpers";
import { WorkItemTypeHierarchyLevelQuickActions } from "./level-quick-actions";

type Props = {
  defaultLevel: number;
  disabled?: boolean;
  hideQuickActions?: boolean;
  iconContent?: React.ReactNode;
  label?: string;
  level: number;
};

export const WorkItemTypeHierarchyVacantLevel = observer(function WorkItemTypeHierarchyVacantLevel({
  defaultLevel,
  disabled = false,
  hideQuickActions = false,
  iconContent,
  label,
  level,
}: Props) {
  // refs
  const divRef = useRef<HTMLDivElement | null>(null);
  // states
  const [isDragOver, setIsDragOver] = useState(false);
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getWorkItemType } = useWorkItemType();
  // translation
  const { t } = useTranslation();

  const isDropEnabled = !disabled;

  useEffect(() => {
    const element = divRef.current;
    if (!element || !isDropEnabled) return;

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
          const workItemType = getWorkItemType(data.workItemTypeId);
          if (!workItemType) return;
          handleWorkItemHierarchyDrop(workItemType, level, t);
        },
      })
    );
  }, [isDropEnabled, level, getWorkItemType, workspaceSlug, t]);

  return (
    <div
      ref={divRef}
      className={cn(
        "w-full flex items-center justify-between gap-2 bg-layer-1 border border-subtle p-3 rounded-lg transition-colors",
        {
          "group hover:bg-layer-1-hover": !disabled,
          "border-accent-strong bg-layer-1-hover": isDragOver,
        }
      )}
    >
      <div className="flex items-center gap-3 truncate">
        <span
          className={cn(
            "grid place-items-center size-8 rounded-md bg-layer-2 border border-subtle-1 transition-colors",
            {
              "group-hover:bg-layer-2-hover": !disabled,
              "bg-layer-2-hover": isDragOver,
            }
          )}
        >
          {iconContent || <AddIcon className="size-4 text-tertiary" />}
        </span>
        <span className="text-body-sm-medium text-secondary">
          {label || t("work_item_type_hierarchy.levels.max_level_placeholder")}
        </span>
      </div>
      <div className="shrink-0 flex items-center gap-2 py-1">
        {level === defaultLevel && (
          <Badge size="sm" variant="neutral">
            {t("common.default")}
          </Badge>
        )}
        {!hideQuickActions && <WorkItemTypeHierarchyLevelQuickActions defaultLevel={defaultLevel} level={level} />}
      </div>
    </div>
  );
});
