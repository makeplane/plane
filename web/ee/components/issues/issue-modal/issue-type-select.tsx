"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { Control, Controller, UseFormSetValue } from "react-hook-form";
import { ChevronRight } from "lucide-react";
// types
import { TIssue } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store";
// plane web components
import { IssueTypeDropdown } from "@/plane-web/components/issue-types/dropdowns";
import { useIssueTypes } from "@/plane-web/hooks/store";

type TIssueTypeSelectProps = {
  control: Control<TIssue>;
  setValue: UseFormSetValue<TIssue>;
  data: Partial<TIssue> | undefined;
  issueTypeId: string | null;
  projectId: string;
};

export const IssueTypeSelect: React.FC<TIssueTypeSelectProps> = observer((props) => {
  const { control, setValue, data, issueTypeId, projectId } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { getProjectActiveIssueTypes, getProjectDefaultIssueType } = useIssueTypes();
  // derived values
  const projectDetails = getProjectById(projectId);
  const projectIssueTypes = getProjectActiveIssueTypes(projectId);
  const defaultIssueType = getProjectDefaultIssueType(projectId);

  // Update the issue type id when the project id changes
  useEffect(() => {
    // if data is present, set active type id to the type id of the issue
    if (data && data.type_id) {
      setValue("type_id", data.type_id, { shouldValidate: true });
      return;
    }

    // if issue type id is present, return
    if (issueTypeId) return;

    // if data is not present, set active type id to the default type id of the project
    if (projectId && projectIssueTypes) {
      if (defaultIssueType?.id) {
        setValue("type_id", defaultIssueType.id, { shouldValidate: true });
      } else {
        const issueTypeId = Object.keys(projectIssueTypes)[0];
        if (issueTypeId) setValue("type_id", issueTypeId, { shouldValidate: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, issueTypeId, projectId, projectIssueTypes, defaultIssueType]);

  return (
    <>
      {projectDetails?.is_issue_type_enabled && (
        <>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-300" aria-hidden="true" />
          </div>
          <Controller
            control={control}
            name="type_id"
            rules={{
              required: true,
            }}
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                {projectId && (
                  <IssueTypeDropdown
                    issueTypeId={value}
                    projectId={projectId}
                    handleIssueTypeChange={(issueTypeId) => {
                      onChange(issueTypeId);
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
