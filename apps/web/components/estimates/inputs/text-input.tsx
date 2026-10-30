/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { InputField } from "@makeplane/propel/components/input-field";
type TEstimateTextInputProps = {
  value?: string;
  size?: "lg" | "xl";
  handleEstimateInputValue: (value: string) => void;
};

export function EstimateTextInput(props: TEstimateTextInputProps) {
  const { value, handleEstimateInputValue, size = "xl" } = props;

  // i18n
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <InputField
        size={size}
        orientation="vertical"
        value={value}
        onChange={(e) => handleEstimateInputValue(e.target.value)}
        placeholder={t("project_settings.estimates.create.enter_estimate_point")}
        aria-label={t("project_settings.estimates.create.enter_estimate_point")}
        autoFocus
        type="text"
      />
    </div>
  );
}
