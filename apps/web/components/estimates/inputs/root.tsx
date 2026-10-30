/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TEstimateSystemKeys } from "@plane/types";
import { EEstimateSystem } from "@plane/types";
// local imports
import { EstimateNumberInput } from "./number-input";
import { EstimateTextInput } from "./text-input";

type TEstimateInputRootProps = {
  estimateType: TEstimateSystemKeys;
  handleEstimateInputValue: (value: string) => void;
  value?: string;
  size?: "lg" | "xl";
};

export function EstimateInputRoot(props: TEstimateInputRootProps) {
  const { estimateType, handleEstimateInputValue, value, size } = props;

  switch (estimateType) {
    case EEstimateSystem.POINTS:
      return (
        <EstimateNumberInput
          size={size}
          value={value ? parseFloat(value) : undefined}
          handleEstimateInputValue={handleEstimateInputValue}
        />
      );
    case EEstimateSystem.CATEGORIES:
      return <EstimateTextInput size={size} value={value} handleEstimateInputValue={handleEstimateInputValue} />;
    case EEstimateSystem.TIME:
      return <></>;
    default:
      return null;
  }
}
