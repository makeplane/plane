/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { Controller, useFormContext } from "react-hook-form";
import type { TIssue } from "@plane/types";
import { FrequencyDropdown } from "@/plane-web/components/dropdowns/frequency";
import { useIssueFormValidation } from "@/hooks/store/use-issue-form-validation";

export type TWorkItemModalAdditionalPropertiesProps = {
  isDraft?: boolean;
  projectId: string | null;
  workItemId: string | undefined;
  workspaceSlug: string;
};

export function WorkItemModalAdditionalProperties(props: TWorkItemModalAdditionalPropertiesProps) {
  const { projectId } = props;
  const { t } = useTranslation();
  const {
    control,
    formState: { errors },
  } = useFormContext<TIssue>();
  const { getFieldRules } = useIssueFormValidation();

  if (!projectId) return null;

  return (
    <Controller
      control={control}
      name="frequency"
      rules={getFieldRules({ required: t("frequency_is_required") })}
      render={({ field: { value, onChange } }) => (
        <div className={cn("h-7 rounded-sm", errors.frequency && "outline outline-1 outline-danger-strong")}>
          <FrequencyDropdown value={value} onChange={onChange} buttonVariant="border-with-text" />
        </div>
      )}
    />
  );
}
