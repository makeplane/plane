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
import type { FieldPath, FieldValues } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
import { ChevronRightIcon } from "@plane/propel/icons";
// plane imports
import type { IIssueType } from "@plane/types";
import type { TProjectBlueprintDetails } from "@plane/utils";
import { cn } from "@plane/utils";
// hooks
import { ProjectDropdownBase } from "@/components/dropdowns/project/base";
import { getNestedError } from "@/helpers/react-hook-form.helper";
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// plane web imports
import { IssueTypeDropdown } from "@/components/work-item-types/dropdowns/issue-type";
import { COMMON_BUTTON_CLASS_NAME, COMMON_ERROR_CLASS_NAME } from "@/components/templates/settings/common/helpers";
import { useIssueTypes } from "@/plane-web/hooks/store";

type TUseMobxData = {
  usePropsForAdditionalData: false;
};

type TUsePropsData = {
  getWorkItemTypes: (projectId: string, activeOnly: boolean) => Record<string, IIssueType>;
  isWorkItemTypeEnabled?: boolean;
  isWorkItemTypeInitializing?: boolean;
  usePropsForAdditionalData: true;
};

type TSelectionDropdownProps<T extends FieldValues> = {
  allowProjectSelection?: boolean;
  fieldPaths: {
    projectId: FieldPath<T>;
    issueTypeId: FieldPath<T>;
  };
  getProjectById: (projectId: string | undefined | null) => TProjectBlueprintDetails | undefined;
  handleProjectChange?: (projectId: string) => void;
  projectId: string | undefined | null;
  projectIds?: string[];
  workspaceSlug: string;
} & (TUseMobxData | TUsePropsData);

export const SelectionDropdown = observer(function SelectionDropdown<T extends FieldValues>(
  props: TSelectionDropdownProps<T>
) {
  const {
    allowProjectSelection,
    fieldPaths,
    getProjectById,
    handleProjectChange,
    projectId,
    projectIds,
    workspaceSlug,
  } = props;
  // form context
  const {
    control,
    formState: { errors },
  } = useFormContext<T>();
  // context hooks
  const { allowedProjectIds } = useIssueModal();
  // store hooks
  const { isWorkItemTypeEnabledForProject, getProjectIssueTypes, loader: workItemTypeLoader } = useIssueTypes();
  // derived values
  const projectIdError = getNestedError(errors, fieldPaths.projectId);
  const issueTypeIdError = getNestedError(errors, fieldPaths.issueTypeId);
  const additionalProps = props.usePropsForAdditionalData
    ? {
        getWorkItemTypes: props.getWorkItemTypes,
        isWorkItemTypeEnabled: props.isWorkItemTypeEnabled,
        isWorkItemTypeInitializing: props.isWorkItemTypeInitializing,
      }
    : {
        getWorkItemTypes: getProjectIssueTypes,
        isWorkItemTypeEnabled: projectId ? isWorkItemTypeEnabledForProject(workspaceSlug, projectId) : false,
        isWorkItemTypeInitializing: workItemTypeLoader === "init-loader",
      };

  if (!allowProjectSelection && !additionalProps.isWorkItemTypeEnabled) return null;
  return (
    <div className="flex items-center gap-x-1 pb-2">
      {/* Project Select */}
      {allowProjectSelection && (
        <div className="space-y-1">
          <Controller
            control={control}
            name={fieldPaths.projectId}
            rules={{
              required: true,
            }}
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                <ProjectDropdownBase
                  value={value}
                  onChange={(projectId) => {
                    onChange(projectId);
                    handleProjectChange?.(projectId);
                  }}
                  multiple={false}
                  buttonVariant="border-with-text"
                  buttonClassName={cn(COMMON_BUTTON_CLASS_NAME, {
                    [COMMON_ERROR_CLASS_NAME]: Boolean(projectIdError),
                  })}
                  renderCondition={(projectId) => allowedProjectIds.includes(projectId)}
                  getProjectById={getProjectById}
                  disabled={!allowProjectSelection}
                  projectIds={projectIds || []}
                />
              </div>
            )}
          />
        </div>
      )}
      {/* Issue Type Select */}
      {projectId && additionalProps.isWorkItemTypeEnabled && (
        <>
          {allowProjectSelection && (
            <div className="flex items-center gap-2">
              <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0 text-tertiary" aria-hidden="true" />
            </div>
          )}
          <div className="space-y-1">
            <Controller
              control={control}
              name={fieldPaths.issueTypeId}
              rules={{
                required: true,
              }}
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <IssueTypeDropdown
                    buttonClassName={cn(COMMON_BUTTON_CLASS_NAME, {
                      [COMMON_ERROR_CLASS_NAME]: Boolean(issueTypeIdError),
                    })}
                    handleIssueTypeChange={(issueTypeId) => {
                      onChange(issueTypeId);
                    }}
                    issueTypeId={value}
                    projectId={projectId}
                    variant="sm"
                    {...additionalProps}
                  />
                </div>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
});
