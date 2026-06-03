/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import { useTranslation } from "@plane/i18n";
type TEstimateNumberInputProps = {
  value?: number;
  handleEstimateInputValue: (value: string) => void;
};

export function EstimateNumberInput(props: TEstimateNumberInputProps) {
  const { value, handleEstimateInputValue } = props;

  // i18n
  const { t } = useTranslation();

  return (
    <input
      value={value}
      onChange={(e) => handleEstimateInputValue(e.target.value)}
      className="w-full border-none bg-transparent px-2 py-2 text-13 focus:border-0 focus:ring-0 focus:outline-none"
      placeholder={t("project_settings.estimates.create.enter_estimate_point")}
      autoFocus
      step="any"
    />
  );
}
