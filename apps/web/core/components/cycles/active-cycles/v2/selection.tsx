/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import type { TCycleEstimateType, TCyclePlotType } from "@plane/types";
import { CustomSelect, Row } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { EstimateTypeDropdown } from "@/components/cycles/dropdowns";

type options = {
  value: string;
  label: string;
};
const cycleChartOptions: options[] = [
  { value: "burndown", label: "Burn-down" },
  { value: "burnup", label: "Build-up" },
];

export type TSelectionProps = {
  plotType: TCyclePlotType;
  estimateType: TCycleEstimateType;
  projectId: string;
  handlePlotChange: (value: TCyclePlotType | TCycleEstimateType) => Promise<void>;
  handleEstimateChange: (value: TCyclePlotType | TCycleEstimateType) => Promise<void>;
  className?: string;
  cycleId: string;
};
export type TDropdownProps = {
  value: string;
  onChange: (value: TCyclePlotType | TCycleEstimateType) => Promise<void>;
  options: any[];
};

function Dropdown({ value, onChange, options }: TDropdownProps) {
  return (
    <div className="relative flex items-center gap-2">
      <CustomSelect
        value={value}
        label={<span>{options.find((v) => v.value === value)?.label ?? "None"}</span>}
        onChange={onChange}
        maxHeight="lg"
        buttonClassName="bg-surface-2 border-none rounded text-13 font-medium "
      >
        {options.map((item) => (
          <CustomSelect.Option key={item.value} value={item.value}>
            {item.label}
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </div>
  );
}

const Selection = observer(function Selection(props: TSelectionProps) {
  const { plotType, estimateType, projectId, handlePlotChange, handleEstimateChange, className, cycleId } = props;
  return (
    <Row className={cn("h-[40px] mt-2 py-4 flex text-13 items-center gap-2 font-medium", className)}>
      <Dropdown value={plotType} onChange={handlePlotChange} options={cycleChartOptions} />
      <>
        <span className="text-tertiary">for</span>
        {
          <EstimateTypeDropdown
            value={estimateType}
            onChange={handleEstimateChange}
            projectId={projectId}
            cycleId={cycleId}
            showDefault
          />
        }
      </>
    </Row>
  );
});

export default Selection;
