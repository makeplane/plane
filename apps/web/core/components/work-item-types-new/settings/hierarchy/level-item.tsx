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

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Pill, EPillSize, EPillVariant, ERadius } from "@plane/propel/pill";
import type { BaseWorkItemTypeInstanceSchema } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { IssueTypeLogo } from "@/components/work-item-types/common/issue-type-logo";
// local imports
import { WorkItemTypeHierarchyLevelQuickActions } from "./level-quick-actions";
import { WorkItemTypeHierarchyAddToLevelButton } from "./add-to-level-button";

type Props = {
  canAddLevel: boolean;
  level: number;
  workItemTypes: BaseWorkItemTypeInstanceSchema[];
};

export const WorkItemTypeHierarchyLevelItem = observer(function WorkItemTypeHierarchyLevelItem({
  canAddLevel,
  level,
  workItemTypes,
}: Props) {
  // derived values
  const isEmptyLevel = level > 0 && workItemTypes.length === 0;
  // translation
  const { t } = useTranslation();

  if (isEmptyLevel) {
    return (
      <WorkItemTypeHierarchyAddToLevelButton
        disabled={!canAddLevel}
        iconContent={<span className="text-caption-md-medium text-secondary">{level}</span>}
        label={
          canAddLevel
            ? t("work_item_type_hierarchy.levels.empty_level_placeholder", { level })
            : t("work_item_type_hierarchy.levels.empty_level_unauthorized")
        }
        levelToAddTo={level}
      />
    );
  }

  return (
    <div className="bg-layer-2 border border-subtle p-3 rounded-lg flex items-center justify-between gap-2 truncate">
      <div className="flex gap-2 truncate">
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
        <div className="flex flex-col gap-y-2 py-1">
          {level === 0 && (
            <span className="shrink-0 text-body-xs-regular text-secondary">
              {t("work_item_type_hierarchy.levels.zero_level_description")}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {workItemTypes.map((workItemType) => (
              <Pill
                key={workItemType.id}
                size={EPillSize.MD}
                variant={EPillVariant.DEFAULT}
                radius={ERadius.SQUARE}
                className="border-subtle-1 text-tertiary gap-1.5"
              >
                <IssueTypeLogo
                  icon_props={workItemType?.logo_props?.icon}
                  size="xs"
                  isDefault={workItemType?.is_default}
                />
                <span className="text-caption-md-regular">{workItemType.name}</span>
              </Pill>
            ))}
          </div>
        </div>
      </div>
      {!isEmptyLevel && level > 0 && (
        <WorkItemTypeHierarchyLevelQuickActions level={level} workItemTypes={workItemTypes} />
      )}
    </div>
  );
});
