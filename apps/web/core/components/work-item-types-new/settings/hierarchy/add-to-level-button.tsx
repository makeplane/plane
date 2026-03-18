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

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { AddIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// plane web imports
import { useWorkspaceWorkItemTypes } from "@/plane-web/hooks/store/work-item-types/use-workspace-work-item-types";
// local imports
import { AddWorkItemTypeHierarchyLevelModal } from "./add-level-modal";

type Props = {
  disabled?: boolean;
  iconContent?: React.ReactNode;
  label?: string;
  levelToAddTo?: number;
};

export const WorkItemTypeHierarchyAddToLevelButton = observer(function WorkItemTypeHierarchyAddToLevelButton({
  disabled = false,
  iconContent,
  label,
  levelToAddTo,
}: Props) {
  // states
  const [isAddLevelModalOpen, setIsAddLevelModalOpen] = useState(false);
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getWorkItemTypesByWorkspaceSlugGroupedByLevel } = useWorkspaceWorkItemTypes();
  const workItemTypesByLevel = workspaceSlug ? getWorkItemTypesByWorkspaceSlugGroupedByLevel(workspaceSlug) : new Map();
  const maxLevel = Math.max(...workItemTypesByLevel.keys());
  // translation
  const { t } = useTranslation();

  return (
    <>
      <AddWorkItemTypeHierarchyLevelModal
        handleClose={() => setIsAddLevelModalOpen(false)}
        isOpen={isAddLevelModalOpen}
        levelToAddTo={levelToAddTo ?? maxLevel + 1}
      />
      <button
        type="button"
        className={cn(
          "w-full flex items-center gap-3 bg-layer-1 border border-subtle p-3 rounded-lg transition-colors",
          {
            "group hover:bg-layer-1-hover cursor-pointer": !disabled,
          }
        )}
        onClick={() => setIsAddLevelModalOpen(true)}
        disabled={disabled}
      >
        <span className="grid place-items-center size-8 rounded-md bg-layer-2 group-hover:bg-layer-2-hover border border-subtle-1">
          {iconContent || <AddIcon className="size-4 text-tertiary" />}
        </span>
        <span className="text-body-sm-medium text-secondary">
          {label || t("work_item_type_hierarchy.levels.add_level_button")}
        </span>
      </button>
    </>
  );
});
