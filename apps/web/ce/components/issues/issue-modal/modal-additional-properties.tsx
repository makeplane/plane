/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Controller, useFormContext } from "react-hook-form";
import type { TIssue } from "@plane/types";
import { FrequencyDropdown } from "@/plane-web/components/dropdowns/frequency";

export type TWorkItemModalAdditionalPropertiesProps = {
  isDraft?: boolean;
  projectId: string | null;
  workItemId: string | undefined;
  workspaceSlug: string;
};

export function WorkItemModalAdditionalProperties(props: TWorkItemModalAdditionalPropertiesProps) {
  const { projectId } = props;
  const { control } = useFormContext<TIssue>();

  if (!projectId) return null;

  return (
    <Controller
      control={control}
      name="frequency"
      render={({ field: { value, onChange } }) => (
        <FrequencyDropdown
          value={value}
          onChange={onChange}
          buttonVariant="border-with-text"
          className="grow"
          buttonContainerClassName="w-full text-left"
          buttonClassName="text-body-xs-regular"
        />
      )}
    />
  );
}
