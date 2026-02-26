/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
// plane imports
import type { TEstimateSystemKeys } from "@plane/types";
import { EEstimateSystem } from "@plane/types";
// plane web imports
import { EstimateTimeInput } from "@/plane-web/components/estimates/inputs";
// local imports
import { EstimateNumberInput } from "./number-input";
import { EstimateTextInput } from "./text-input";

type TEstimateInputRootProps = {
  estimateType: TEstimateSystemKeys;
  handleEstimateInputValue: (value: string) => void;
  value?: string;
};

export function EstimateInputRoot(props: TEstimateInputRootProps) {
  const { estimateType, handleEstimateInputValue, value } = props;

  switch (estimateType) {
    case EEstimateSystem.POINTS:
      return (
        <EstimateNumberInput
          value={value ? parseFloat(value) : undefined}
          handleEstimateInputValue={handleEstimateInputValue}
        />
      );
    case EEstimateSystem.CATEGORIES:
      return <EstimateTextInput value={value} handleEstimateInputValue={handleEstimateInputValue} />;
    case EEstimateSystem.TIME:
      return (
        <EstimateTimeInput
          value={value ? parseInt(value) : undefined}
          handleEstimateInputValue={handleEstimateInputValue}
        />
      );
    default:
      return null;
  }
}
