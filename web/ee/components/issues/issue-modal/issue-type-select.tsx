"use client";

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, FieldPath, useFormContext } from "react-hook-form";
import { ChevronRight } from "lucide-react";
// plane imports
import { DEFAULT_WORK_ITEM_FORM_VALUES } from "@plane/constants";
import { TIssue } from "@plane/types";
// ce imports
import { TIssueFields, TIssueTypeSelectProps } from "@/ce/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// plane web imports
import { IssueTypeDropdown, TIssueTypeOptionTooltip } from "@/plane-web/components/issue-types/dropdowns";
import { useIssueTypes } from "@/plane-web/hooks/store";

export const IssueTypeSelect = observer(<T extends Partial<TIssueFields>>(props: TIssueTypeSelectProps<T>) => {
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
    showMandatoryFieldInfo = false, // Show info about mandatory fields
    handleFormChange,
  } = props;
  // router
  const { workspaceSlug } = useParams();
  // plane web store hooks
  const { isWorkItemTypeEnabledForProject, getIssueTypeIdsWithMandatoryProperties } = useIssueTypes();
  // context hooks
  const { workItemTemplateId, setWorkItemTemplateId } = useIssueModal();
  const { reset } = useFormContext<TIssue>();
  // derived values
  const isWorkItemTypeEnabled = !!projectId && isWorkItemTypeEnabledForProject(workspaceSlug?.toString(), projectId);
  // Information for issue types with mandatory fields
  let optionTooltip: TIssueTypeOptionTooltip = {};
  if (showMandatoryFieldInfo) {
    // Get issue types with mandatory properties
    const issueTypeIdsWithMandatoryProperties = useMemo(() => {
      if (!projectId) return [];
      return getIssueTypeIdsWithMandatoryProperties(projectId);
    }, [getIssueTypeIdsWithMandatoryProperties, projectId]);
    // Create a map of information for issue types with mandatory field
    optionTooltip = useMemo(() => {
      if (issueTypeIdsWithMandatoryProperties.length === 0) return {};
      return issueTypeIdsWithMandatoryProperties.reduce((acc, issueTypeId) => {
        acc[issueTypeId] =
          "This work item type includes mandatory properties that will initially be blank when a work item is converted to this type.";
        return acc;
      }, {} as TIssueTypeOptionTooltip);
    }, [issueTypeIdsWithMandatoryProperties]);
  }

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
              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-300" aria-hidden="true" />
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
                    issueTypeId={value}
                    projectId={projectId}
                    disabled={disabled}
                    variant={variant}
                    placeholder={placeholder}
                    optionTooltip={optionTooltip}
                    handleIssueTypeChange={(issueTypeId) => {
                      // If it's not set as required, then allow issue type to be null (unset issue type)
                      const newValue = !isRequired && value === issueTypeId ? null : issueTypeId;
                      onChange(newValue);
                      handleIssueTypeChange(newValue);
                      handleFormChange?.();
                    }}
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
