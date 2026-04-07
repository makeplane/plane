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
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EPillSize, EPillVariant, ERadius, Pill } from "@plane/propel/pill";
import { Tooltip } from "@plane/propel/tooltip";
import type { BaseWorkItemTypeInstanceSchema } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { IssueTypeLogo } from "@/components/work-item-types/common/issue-type-logo";
// local imports
import { getWorkItemHierarchyDragData } from "./drag-helpers";

type Props = {
  level: number;
  workItemType: BaseWorkItemTypeInstanceSchema;
};

export const WorkItemTypeDraggablePill = observer(function WorkItemTypeDraggablePill({ level, workItemType }: Props) {
  // refs
  const pillRef = useRef<HTMLDivElement | null>(null);
  // states
  const [isDragging, setIsDragging] = useState(false);
  // translation
  const { t } = useTranslation();

  useEffect(() => {
    const element = pillRef.current;
    if (!element) return;

    return combine(
      draggable({
        element,
        getInitialData: () => getWorkItemHierarchyDragData(workItemType.id, level),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      })
    );
  }, [level, workItemType.id]);

  return (
    <Tooltip tooltipContent={t("work_item_type_hierarchy.levels.drag_tooltip")}>
      <div ref={pillRef} className="cursor-grab active:cursor-grabbing">
        <Pill
          size={EPillSize.MD}
          variant={EPillVariant.DEFAULT}
          radius={ERadius.SQUARE}
          className={cn("bg-layer-2 hover:bg-layer-2-hover gap-1.5 h-8 select-none", {
            "bg-layer-2-hover": isDragging,
          })}
        >
          <IssueTypeLogo icon_props={workItemType?.logo_props?.icon} size="xs" />
          <span className="text-caption-md-regular">{workItemType.name}</span>
        </Pill>
      </div>
    </Tooltip>
  );
});
