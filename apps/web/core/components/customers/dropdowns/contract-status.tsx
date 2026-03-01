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
import React from "react";
import { CUSTOMER_CONTRACT_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TCustomerContractStatus } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";

type TProps = {
  value: TCustomerContractStatus | undefined;
  onChange: (value: TCustomerContractStatus) => void;
  tabIndex?: number;
  className?: string;
  buttonClassName?: string;
  chevronClassName?: string;
  maxHeight?: "sm" | "rg" | "md" | "lg" | undefined;
  disabled: boolean;
};

export function ContractStatusDropDown(props: TProps) {
  const { value, onChange, maxHeight, tabIndex, buttonClassName, chevronClassName, className, disabled } = props;

  const { t } = useTranslation();

  // formatted options
  const customerContractStatusOptions = CUSTOMER_CONTRACT_STATUS.map((status) => ({
    value: status.value,
    query: t(status.i18n_name),
    content: (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
        <p className="text-13">{t(status.i18n_name)}</p>
      </div>
    ),
  }));

  const labelContent = customerContractStatusOptions.find((status) => status.value === value);

  return (
    <CustomSearchSelect
      options={customerContractStatusOptions}
      value={value}
      label={
        <div className="truncate">
          <span className="text-13 text-secondary">
            {labelContent ? (
              labelContent.content
            ) : (
              <span className="text-placeholder">{t("customers.properties.default.contract_status.placeholder")}</span>
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
