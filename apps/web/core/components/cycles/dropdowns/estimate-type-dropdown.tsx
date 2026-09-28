/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import type { TCycleEstimateType } from "@plane/types";
import { EEstimateSystem } from "@plane/types";
import { Select } from "@plane/blocks/select";
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useCycle } from "@/hooks/store/use-cycle";
// local imports
import { cycleEstimateOptions } from "../analytics-sidebar/issue-progress";

type TProps = {
  value: TCycleEstimateType;
  onChange: (value: TCycleEstimateType) => Promise<void>;
  showDefault?: boolean;
  projectId: string;
  cycleId: string;
};

export const EstimateTypeDropdown = observer(function EstimateTypeDropdown(props: TProps) {
  const { value, onChange, projectId, cycleId, showDefault = false } = props;
  const { getIsPointsDataAvailable } = useCycle();
  const { areEstimateEnabledByProjectId, currentProjectEstimateType } = useProjectEstimates();
  const isCurrentProjectEstimateEnabled = Boolean(projectId && areEstimateEnabledByProjectId(projectId));
  return (getIsPointsDataAvailable(cycleId) || isCurrentProjectEstimateEnabled) &&
    currentProjectEstimateType !== EEstimateSystem.CATEGORIES ? (
    <div className="relative flex items-center gap-2">
      <Select<(typeof cycleEstimateOptions)[number]>
        getValues={() => cycleEstimateOptions}
        value={cycleEstimateOptions.find((v) => v.value === value) ?? null}
        onChange={(next) => void onChange(next as TCycleEstimateType)}
        getOptionValue={(option) => option.value}
        getOptionLabel={(option) => option.label}
        showSearch={false}
        pinSelected={false}
        placeholder="None"
      >
        <Select.Trigger variant="select-md" className="rounded-sm border-none bg-surface-2 text-13 font-medium">
          <Select.Value />
        </Select.Trigger>
      </Select>
    </div>
  ) : showDefault ? (
    <span className="capitalize">{cycleEstimateOptions.find((v) => v.value === value)?.label ?? value}</span>
  ) : null;
});
