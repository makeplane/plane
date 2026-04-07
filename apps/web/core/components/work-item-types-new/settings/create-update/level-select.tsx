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
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CustomSelect } from "@plane/ui";
// plane web imports
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useWorkspaceWorkItemTypes } from "@/plane-web/hooks/store/work-item-types/use-workspace-work-item-types";

type Props = {
  onChange: (value: number) => void;
  value: number | undefined;
};

export const WorkItemTypeCreateUpdateLevelSelect = observer(function WorkItemTypeCreateUpdateLevelSelect({
  onChange,
  value,
}: Props) {
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getActiveWorkItemTypesByWorkspaceSlugGroupedByLevel } = useWorkspaceWorkItemTypes();
  const { featuresByWorkspaceSlug } = useWorkspaceFeatures();
  // derived values
  const defaultLevel = workspaceSlug ? (featuresByWorkspaceSlug(workspaceSlug)?.work_item_type_default_level ?? 0) : 0;
  const allAvailableLevels = workspaceSlug
    ? Array.from(getActiveWorkItemTypesByWorkspaceSlugGroupedByLevel(workspaceSlug).keys())
    : [];
  let maxLevel = Math.max(...allAvailableLevels);
  maxLevel = Number.isFinite(maxLevel) ? maxLevel : 0;
  // translation
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-y-2">
      <p className="text-body-sm-medium text-primary">{t("work_item_type_hierarchy.work_item_type_modal.level")}</p>
      <CustomSelect
        buttonClassName="py-1.5 px-3 rounded-md"
        label={
          <span className="w-full flex items-center justify-between gap-2">
            <span className="shrink-0 text-body-sm-regular text-primary">{value ?? defaultLevel}</span>
            {value === defaultLevel && (
              <span className="text-body-xs-regular text-placeholder">{t("common.default")}</span>
            )}
          </span>
        }
        value={value ?? defaultLevel}
        onChange={onChange}
      >
        {[maxLevel + 1, ...allAvailableLevels].map((level) => (
          <CustomSelect.Option key={level} value={level}>
            <span className="w-full flex items-center justify-between gap-2">
              <span className="shrink-0">{level}</span>
              {level === defaultLevel && (
                <span className="text-caption-xs-regular text-placeholder">{t("common.default")}</span>
              )}
            </span>
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </div>
  );
});
