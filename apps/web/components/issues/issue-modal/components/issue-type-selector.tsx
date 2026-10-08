/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
// plane imports
import type { SelectVariant } from "@plane/blocks/select";
import type { TIssue } from "@plane/types";
// components
import { IssueTypeDropdown } from "@/components/dropdowns/issue-type";

type TIssueTypeSelectorProps = {
  control: Control<TIssue>;
  /** Project whose active work item types are offered. */
  projectId: string | null;
  disabled?: boolean;
  variant?: SelectVariant;
  placeholder?: string;
  /** Tab order of the trigger, for forms that sequence focus explicitly (`ETabIndices`). */
  tabIndex?: number;
  handleFormChange?: () => void;
};

/**
 * Form binding for {@link IssueTypeDropdown}: reads the `type_id` form value through a `Controller`
 * and writes the chosen id back, optionally signalling the host form that it changed.
 */
export const IssueTypeSelector = observer(function IssueTypeSelector(props: TIssueTypeSelectorProps) {
  const { control, projectId, disabled, variant = "pill-md", placeholder, tabIndex, handleFormChange } = props;
  // router
  const { workspaceSlug } = useParams();

  if (!projectId || !workspaceSlug) return null;

  return (
    <Controller
      control={control}
      name="type_id"
      render={({ field: { value, onChange } }) => (
        <IssueTypeDropdown
          value={value}
          onChange={(typeId) => {
            onChange(typeId);
            handleFormChange?.();
          }}
          projectId={projectId}
          workspaceSlug={workspaceSlug.toString()}
          disabled={disabled}
          variant={variant}
          placeholder={placeholder}
          tabIndex={tabIndex}
          testId="create-work-item-type-select"
        />
      )}
    />
  );
});
