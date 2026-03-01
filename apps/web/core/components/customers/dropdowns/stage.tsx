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

import type { FC } from "react";
import React, { useMemo } from "react";
import { CUSTOMER_STAGES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TCustomerStage } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";

type TProps = {
  value: TCustomerStage | undefined;
  onChange: (value: TCustomerStage) => void;
  tabIndex?: number;
  buttonClassName?: string;
  chevronClassName?: string;
  className?: string;
  maxHeight?: "sm" | "rg" | "md" | "lg" | undefined;
  disabled: boolean;
};

export function StageDropDown(props: TProps) {
  const { value, onChange, maxHeight, tabIndex, buttonClassName, chevronClassName, className, disabled } = props;

  const { t } = useTranslation();

  // formatted options
  const stageDropDownOptions = useMemo(
    () =>
      CUSTOMER_STAGES.map((stage) => ({
        value: stage.value,
        query: t(stage.i18n_name),
        content: <p className="text-13">{t(stage.i18n_name)}</p>,
      })),
    [t]
  );

  const labelContent = useMemo(
    () => stageDropDownOptions.find((stage) => stage.value === value),
    [stageDropDownOptions, value]
  );

  return (
    <CustomSearchSelect
      options={stageDropDownOptions}
      value={value}
      label={
        <div className="truncate">
          <span className="text-13 text-secondary">
            {labelContent ? (
              labelContent.content
            ) : (
              <span className="text-placeholder">{t("customers.properties.default.stage.placeholder")}</span>
            )}
          </span>
        </div>
      }
      maxHeight={maxHeight}
      tabIndex={tabIndex}
      onChange={onChange}
      className={className}
      buttonClassName={buttonClassName}
      chevronClassName={chevronClassName}
      disabled={disabled}
    />
  );
}
