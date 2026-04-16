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
import { cn } from "@plane/utils";
// local imports
import { isWorkItemHierarchyDragData } from "./drag-helpers";
import { useWorkItemTypeHierarchyLocalState } from "./hierarchy-local-state-context";

type WorkItemTypeHierarchyMaxLevelProps = {
  disabled?: boolean;
  level: number;
};

export const WorkItemTypeHierarchyMaxLevel = observer(function WorkItemTypeHierarchyMaxLevel({
  disabled = false,
  level,
}: WorkItemTypeHierarchyMaxLevelProps) {
  // refs
  const divRef = useRef<HTMLDivElement | null>(null);
  // states
  const [isDragOver, setIsDragOver] = useState(false);
  // params
  const { workspaceSlug } = useParams();
  const { applyHierarchyDrop } = useWorkItemTypeHierarchyLocalState();
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
          applyHierarchyDrop({
            workItemTypeId: data.workItemTypeId,
            sourceLevel: data.sourceLevel,
            targetLevel: level,
          });
        },
      })
    );
  }, [applyHierarchyDrop, isDropEnabled, level, workspaceSlug]);

  return (
    <div
      ref={divRef}
      className={cn(
        "w-full bg-layer-2 border border-dashed border-strong-1 px-3 py-4.5 rounded-lg text-center transition-colors",
        {
          "border-accent-strong bg-layer-2-hover": isDragOver,
        }
      )}
    >
      <p className="text-body-xs-regular text-tertiary">{t("work_item_type_hierarchy.levels.max_level_placeholder")}</p>
    </div>
  );
});
