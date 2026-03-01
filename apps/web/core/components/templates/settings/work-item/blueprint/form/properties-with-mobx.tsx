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
import type { FieldValues } from "react-hook-form";
import { useFormContext } from "react-hook-form";
// plane imports
import { EWorkItemTypeEntity } from "@plane/types";
// hooks
import { useLabel } from "@/hooks/store/use-label";
// plane web imports
import { WorkItemCustomProperties } from "@/components/issues/issue-modal/properties/custom/root";
import { DefaultWorkItemBlueprintProperties } from "@/components/templates/settings/work-item/blueprint/form/default-properties";
import { SelectionDropdown } from "@/components/templates/settings/work-item/blueprint/form/selection-dropdown";
import { WorkItemBlueprintDetails } from "@/components/templates/settings/work-item/blueprint/form/work-item-details";
// local imports
import type { TWorkItemBlueprintPropertiesWithMobxProps } from "./common";

/**
 * This component is used to render the properties of a work item blueprint with MobX integration.
 * Requires Issue Modal context to be available in the parent component.
 */
export const WorkItemBlueprintPropertiesWithMobx = observer(function WorkItemBlueprintPropertiesWithMobx<
  T extends FieldValues,
>(props: TWorkItemBlueprintPropertiesWithMobxProps<T>) {
  const { fieldPaths, projectId, shouldLoadDefaultValues = false } = props;
  // form state
  const { watch } = useFormContext<T>();
  // store hooks
  const { createLabel } = useLabel();

  return (
    <div className="space-y-2">
      {/* Project and Issue Type Selection */}
      <SelectionDropdown<T> {...props} usePropsForAdditionalData={false} />
      {/* Work Item Details */}
      <div className="flex flex-col gap-y-4 w-full">
        <WorkItemBlueprintDetails<T> {...props} usePropsForAdditionalData={false} />
      </div>
      {/* Additional Properties */}
      {projectId && (
        <div className="space-y-3">
          <WorkItemCustomProperties
            {...props}
            entityType={EWorkItemTypeEntity.WORK_ITEM}
            issueId={undefined}
            issueTypeId={watch(fieldPaths.issueTypeId)}
            projectId={projectId}
            shouldLoadDefaultValues={shouldLoadDefaultValues}
          />
        </div>
      )}
      {/* Default Properties */}
      <DefaultWorkItemBlueprintProperties<T>
        {...props}
        createLabel={projectId ? createLabel.bind(createLabel, props.workspaceSlug, projectId) : undefined}
        usePropsForAdditionalData={false}
      />
    </div>
  );
});
