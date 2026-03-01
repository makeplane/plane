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
import { DROPDOWN_ATTRIBUTES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TIssuePropertyTypeKeys } from "@plane/types";
// components
import { RadioInput } from "@/components/estimates/radio-select";

type TPropertyMultiSelectProps = {
  value: boolean | undefined;
  variant?: TIssuePropertyTypeKeys;
  isDisabled?: boolean;
  onChange: (value: boolean) => void;
};

export const PropertyMultiSelect = observer(function PropertyMultiSelect(props: TPropertyMultiSelectProps) {
  const { value, variant = "RELATION_ISSUE", isDisabled = false, onChange } = props;
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const MULTI_SELECT_ATTRIBUTES = DROPDOWN_ATTRIBUTES[variant] ?? [];

  const memberPickerAttributeOptions = MULTI_SELECT_ATTRIBUTES.map((attribute) => ({
    label: t(attribute.i18n_label),
    value: attribute.key,
    disabled: isDisabled,
  }));

  const getSelectedValue = () => {
    if (value === undefined) {
      return undefined;
    }
    return value ? "multi_select" : "single_select";
  };

  return (
    <RadioInput
      selected={getSelectedValue() ?? ""}
      options={memberPickerAttributeOptions}
      onChange={(value) => onChange(value === "multi_select")}
      className="z-10"
      buttonClassName="size-3!"
      fieldClassName="text-caption-sm-regular! gap-1!"
      wrapperClassName="gap-3!"
    />
  );
});
