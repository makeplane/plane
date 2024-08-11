"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Control, Controller } from "react-hook-form";
import { ChevronRight } from "lucide-react";
// types
import { TIssue } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store";
// plane web components
import { IssueTypeDropdown } from "@/plane-web/components/issue-types/dropdowns";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store";

type TIssueTypeSelectProps = {
  control: Control<TIssue>;
  projectId: string;
  disabled?: boolean;
};

export const IssueTypeSelect: React.FC<TIssueTypeSelectProps> = observer((props) => {
  const { control, projectId, disabled = false } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const isIssueTypeDisplayEnabled = useFlag(workspaceSlug?.toString(), "ISSUE_TYPE_DISPLAY");
  const projectDetails = getProjectById(projectId);

  return (
    <>
      {isIssueTypeDisplayEnabled && projectDetails?.is_issue_type_enabled && (
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
