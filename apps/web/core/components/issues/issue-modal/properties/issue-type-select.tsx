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

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { Control, FieldPath } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { DEFAULT_WORK_ITEM_FORM_VALUES } from "@plane/constants";
import type { EditorRefApi } from "@plane/editor";
import { ChevronRightIcon } from "@plane/propel/icons";
import type { TBulkIssueProperties, TIssue } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// plane web imports
import { IssueTypeDropdown } from "@/components/work-item-types/dropdowns/issue-type";
import { useIssueTypes } from "@/plane-web/hooks/store";

export type TIssueFields = TIssue & TBulkIssueProperties;

export type TIssueTypeDropdownVariant = "xs" | "sm";

type TIssueTypeSelectProps<T extends Partial<TIssueFields>> = {
  control: Control<T>;
  projectId: string | null;
  editorRef?: React.MutableRefObject<EditorRefApi | null>;
  disabled?: boolean;
  variant?: TIssueTypeDropdownVariant;
  placeholder?: string;
  isRequired?: boolean;
  renderChevron?: boolean;
  dropDownContainerClassName?: string;
  showMandatoryFieldInfo?: boolean; // Show info about mandatory fields
  handleFormChange?: () => void;
};

export const IssueTypeSelect = observer(function IssueTypeSelect<T extends Partial<TIssueFields>>(
  props: TIssueTypeSelectProps<T>
) {
  const {
    control,
    projectId,
    editorRef,
    disabled = false,
    variant = "sm",
    placeholder,
    isRequired = true,
    renderChevron = false,
    dropDownContainerClassName,
    handleFormChange,
  } = props;
  // router
  const { workspaceSlug } = useParams();
  // plane web store hooks
  const { loader: workItemTypeLoader, getProjectIssueTypes, isWorkItemTypeEnabledForProject } = useIssueTypes();
  // context hooks
  const { workItemTemplateId, setWorkItemTemplateId } = useIssueModal();
  const { reset } = useFormContext<TIssue>();
  // derived values
  const isWorkItemTypeEnabled = !!projectId && isWorkItemTypeEnabledForProject(workspaceSlug?.toString(), projectId);

  const handleIssueTypeChange = (newValue: string | null) => {
    if (workItemTemplateId) {
      reset({
        ...DEFAULT_WORK_ITEM_FORM_VALUES,
        project_id: projectId,
        type_id: newValue,
      });
      editorRef?.current?.clearEditor();
      setWorkItemTemplateId(null);
    }
  };

  return (
    <>
      {isWorkItemTypeEnabled && (
        <>
          {renderChevron && (
            <div className="flex items-center gap-2">
              <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0 text-tertiary" aria-hidden="true" />
            </div>
          )}
          <Controller<T>
            control={control}
            name={"type_id" as FieldPath<T>}
            rules={{
              required: isRequired,
            }}
            render={({ field: { value, onChange } }) => (
              <div className={cn("h-7", dropDownContainerClassName)}>
                {projectId && (
                  <IssueTypeDropdown
                    disabled={disabled}
                    getWorkItemTypes={getProjectIssueTypes}
                    handleIssueTypeChange={(issueTypeId) => {
                      // If it's not set as required, then allow issue type to be null (unset issue type)
                      const newValue = !isRequired && value === issueTypeId ? null : issueTypeId;
                      onChange(newValue);
                      handleIssueTypeChange(newValue);
                      handleFormChange?.();
                    }}
                    isInitializing={workItemTypeLoader === "init-loader"}
                    issueTypeId={value?.toString() || null}
                    placeholder={placeholder}
                    projectId={projectId}
                    variant={variant}
                  />
                )}
              </div>
            )}
          />
        </>
      )}
    </>
  );
});
