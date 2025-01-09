"use client";

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, FieldPath } from "react-hook-form";
import { ChevronRight } from "lucide-react";
// helpers
import { TIssueFields, TIssueTypeSelectProps } from "@/ce/components/issues";
import { cn } from "@/helpers/common.helper";
// plane web components
import { IssueTypeDropdown, TIssueTypeOptionTooltip } from "@/plane-web/components/issue-types/dropdowns";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

export const IssueTypeSelect = observer(<T extends Partial<TIssueFields>>(props: TIssueTypeSelectProps<T>) => {
  const {
    control,
    projectId,
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
  const { isIssueTypeEnabledForProject, getIssueTypeIdsWithMandatoryProperties } = useIssueTypes();
  // derived values
  const isIssueTypeDisplayEnabled =
    !!projectId && isIssueTypeEnabledForProject(workspaceSlug?.toString(), projectId, "ISSUE_TYPE_DISPLAY");
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
          "This issue type includes mandatory properties that will initially be blank when an issue is converted to this type.";
        return acc;
      }, {} as TIssueTypeOptionTooltip);
    }, [issueTypeIdsWithMandatoryProperties]);
  }

  return (
    <>
      {isIssueTypeDisplayEnabled && (
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
