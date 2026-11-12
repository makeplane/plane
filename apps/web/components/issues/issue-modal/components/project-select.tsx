/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
// plane imports
import { ETabIndices } from "@plane/constants";
// types
import type { TIssue } from "@plane/types";
import { getTabIndex } from "@plane/utils";
// components
import { ProjectSelect } from "@/components/dropdowns/project/project-select";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TIssueProjectSelectProps = {
  control: Control<TIssue>;
  disabled?: boolean;
  handleFormChange: () => void;
};

export const IssueProjectSelect = observer(function IssueProjectSelect(props: TIssueProjectSelectProps) {
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
        <ProjectSelect
          value={value}
          onChange={(projectId) => {
            if (!projectId) return;
            onChange(projectId);
            handleFormChange();
          }}
          multiple={false}
          variant="pill-md"
          filterOption={(id) => allowedProjectIds.includes(id)}
          tabIndex={getIndex("project_id")}
          disabled={disabled}
        />
      )}
    />
  );
});
