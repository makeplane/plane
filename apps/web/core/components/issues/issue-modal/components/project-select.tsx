"use client";

import React from "react";
import { observer } from "mobx-react";
import { Control, Controller } from "react-hook-form";
// plane imports
import { ETabIndices } from "@plane/constants";
// types
import { TIssue } from "@plane/types";
import { getTabIndex } from "@plane/utils";
// components
import { ProjectDropdown } from "@/components/dropdowns";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TIssueProjectSelectProps = {
  control: Control<TIssue>;
  disabled?: boolean;
  handleFormChange: () => void;
};

export const IssueProjectSelect: React.FC<TIssueProjectSelectProps> = observer((props) => {
  const { control, disabled = false, handleFormChange } = props;
  // store hooks
  const { isMobile } = usePlatformOS();
  // context hooks
  const { allowedProjectIds } = useIssueModal();

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  return (
    <Controller
      control={control}
      name="project_id"
      rules={{
        required: true,
      }}
      render={({ field: { value, onChange } }) => (
        <div className="h-7">
          <ProjectDropdown
            value={value}
            onChange={(projectId) => {
              onChange(projectId);
              handleFormChange();
            }}
            multiple={false}
            buttonVariant="border-with-text"
            renderCondition={(projectId) => allowedProjectIds.includes(projectId)}
            tabIndex={getIndex("project_id")}
            disabled={disabled}
          />
        </div>
      )}
    />
  );
});
