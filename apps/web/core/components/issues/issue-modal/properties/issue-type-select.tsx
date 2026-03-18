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
import { WorkItemTypeChangeConfirmationModal } from "./work-item-type-change-confirmation-modal";

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
  workItemId?: string; // If set, this is an update (existing issue) - used for confirmation modal
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
    workItemId,
  } = props;
  // state for confirmation modal
  const [pendingTypeChange, setPendingTypeChange] = useState<{
    newTypeId: string | null;
    onChange: (value: string | null) => void;
  } | null>(null);
  // router
  const { workspaceSlug } = useParams();
  // plane web store hooks
  const { loader: workItemTypeLoader, getProjectIssueTypes, isWorkItemTypeEnabledForProject } = useIssueTypes();
  // context hooks
  const { workItemTemplateId, setWorkItemTemplateId } = useIssueModal();
  const { reset } = useFormContext<TIssue>();
  // derived values
  const isWorkItemTypeEnabled = !!projectId && isWorkItemTypeEnabledForProject(workspaceSlug?.toString(), projectId);

  const applyTypeChange = (newValue: string | null, onChange: (value: string | null) => void) => {
    onChange(newValue);
    if (workItemTemplateId) {
      reset({
        ...DEFAULT_WORK_ITEM_FORM_VALUES,
        project_id: projectId,
        type_id: newValue,
      });
      editorRef?.current?.clearEditor();
      setWorkItemTemplateId(null);
    }
    handleFormChange?.();
  };

  const handleConfirmTypeChange = () => {
    if (pendingTypeChange) {
      applyTypeChange(pendingTypeChange.newTypeId, pendingTypeChange.onChange);
      setPendingTypeChange(null);
    }
  };

  const handleCancelTypeChange = () => {
    setPendingTypeChange(null);
  };

  return (
    <>
      {isWorkItemTypeEnabled && (
        <>
          {renderChevron && (
            <div className="flex items-center gap-2">
              <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-tertiary" aria-hidden="true" />
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
                    allWorkItemTypes={Object.values(getProjectIssueTypes(projectId, true))}
                    handleChange={(workItemTypeId) => {
                      // If it's not set as required, then allow issue type to be null (unset issue type)
                      const newTypeId = !isRequired && value === workItemTypeId ? null : workItemTypeId;

                      // Show confirmation modal for existing issues when type is changing
                      // Only show if: existing issue (has ID), currently has a type, and type is actually changing
                      if (workItemId && value && newTypeId !== value) {
                        setPendingTypeChange({ newTypeId, onChange });
                        return;
                      }

                      // For new issues or when setting type for first time, change immediately
                      applyTypeChange(newTypeId, onChange);
                    }}
                    isInitializing={workItemTypeLoader === "init-loader"}
                    selectedWorkItemTypeId={value?.toString() || null}
                    placeholder={placeholder}
                    variant={variant}
                  />
                )}
              </div>
            )}
          />
        </>
      )}
      {/* Confirmation modal for type change */}
      <WorkItemTypeChangeConfirmationModal
        isOpen={!!pendingTypeChange}
        onClose={handleCancelTypeChange}
        onConfirm={handleConfirmTypeChange}
      />
    </>
  );
});
