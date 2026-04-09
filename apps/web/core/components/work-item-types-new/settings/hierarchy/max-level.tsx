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
import type { TValidateLevelChangeResponse } from "@plane/types";
import { cn } from "@plane/utils";
// plane web imports
import { useWorkItemType } from "@/plane-web/hooks/store/work-item-types/use-work-item-type";
// local imports
import { handleWorkItemHierarchyDrop, isWorkItemHierarchyDragData } from "./drag-helpers";
import { useWorkItemTypeHierarchyDndProcessing } from "./hierarchy-dnd-processing-context";
import { ValidationChangeErrorModal } from "./validation-change-error-modal";

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
  const [isValidationChangeErrorModalOpen, setIsValidationChangeErrorModalOpen] = useState(false);
  const [validationChangeErrorData, setValidationChangeErrorData] = useState<TValidateLevelChangeResponse | null>(null);
  const [droppedWorkItemTypeId, setDroppedWorkItemTypeId] = useState<string | null>(null);
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getWorkItemType } = useWorkItemType();
  const { isProcessing, setProcessing } = useWorkItemTypeHierarchyDndProcessing();
  // translation
  const { t } = useTranslation();

  const isDropEnabled = !disabled && !isProcessing;

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
        onDrop: async ({ source }) => {
          setIsDragOver(false);
          if (!workspaceSlug) return;
          const data = source.data;
          if (!isWorkItemHierarchyDragData(data)) return;
          if (data.sourceLevel === level) return;
          const workItemType = getWorkItemType(data.workItemTypeId);
          if (!workItemType) return;
          await handleWorkItemHierarchyDrop({
            onProcessingChange: setProcessing,
            onValidationError: (validationErrorData) => {
              setIsValidationChangeErrorModalOpen(true);
              setValidationChangeErrorData(validationErrorData);
              setDroppedWorkItemTypeId(data.workItemTypeId);
            },
            t,
            targetLevel: level,
            workItemType,
            workspaceSlug,
          });
        },
      })
    );
  }, [isDropEnabled, level, getWorkItemType, setProcessing, workspaceSlug, t]);

  return (
    <>
      {droppedWorkItemTypeId && (
        <ValidationChangeErrorModal
          data={validationChangeErrorData}
          isOpen={isValidationChangeErrorModalOpen}
          onClose={() => {
            setIsValidationChangeErrorModalOpen(false);
            setTimeout(() => {
              setValidationChangeErrorData(null);
              setDroppedWorkItemTypeId(null);
            }, 350);
          }}
          workItemTypeId={droppedWorkItemTypeId}
          level={level}
          workspaceSlug={workspaceSlug}
        />
      )}
      <div
        ref={divRef}
        className={cn(
          "w-full bg-layer-2 border border-dashed border-strong-1 px-3 py-4.5 rounded-lg text-center transition-colors",
          {
            "border-accent-strong bg-layer-2-hover": isDragOver,
          }
        )}
      >
        <p className="text-body-xs-regular text-tertiary">
          {t("work_item_type_hierarchy.levels.max_level_placeholder")}
        </p>
      </div>
    </>
  );
});
