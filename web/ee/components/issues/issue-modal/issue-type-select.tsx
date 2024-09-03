"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Control, Controller } from "react-hook-form";
import { ChevronRight } from "lucide-react";
// types
import { TIssue } from "@plane/types";
// plane web components
import { IssueTypeDropdown } from "@/plane-web/components/issue-types/dropdowns";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

type TIssueTypeSelectProps = {
  control: Control<TIssue>;
  projectId: string | null;
  disabled?: boolean;
  handleFormChange: () => void;
};

export const IssueTypeSelect: React.FC<TIssueTypeSelectProps> = observer((props) => {
  const { control, projectId, disabled = false, handleFormChange } = props;
  // router
  const { workspaceSlug } = useParams();
  // plane web store hooks
  const { isIssueTypeEnabledForProject } = useIssueTypes();
  // derived values
  const isIssueTypeDisplayEnabled =
    !!projectId && isIssueTypeEnabledForProject(workspaceSlug?.toString(), projectId, "ISSUE_TYPE_DISPLAY");

  return (
    <>
      {isIssueTypeDisplayEnabled && (
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
                    disabled={disabled}
                    handleIssueTypeChange={(issueTypeId) => {
                      onChange(issueTypeId);
                      handleFormChange();
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
