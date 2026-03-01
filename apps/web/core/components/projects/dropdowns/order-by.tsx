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

import { ArrowDownWideNarrow } from "lucide-react";
// plane imports
import { PROJECT_ORDER_BY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/propel/button";
import { CheckIcon, ChevronDownIcon } from "@plane/propel/icons";
import type { TProjectOrderByOptions } from "@plane/types";
import { CustomMenu } from "@plane/ui";

type Props = {
  onChange: (value: TProjectOrderByOptions) => void;
  value: TProjectOrderByOptions | undefined;
  isMobile?: boolean;
};

const DISABLED_ORDERING_OPTIONS = ["sort_order"];

export function ProjectOrderByDropdown(props: Props) {
  const { onChange, value, isMobile = false } = props;
  const { t } = useTranslation();

  const orderByDetails = PROJECT_ORDER_BY_OPTIONS.find((option) => value?.includes(option.key));

  const isDescending = value?.[0] === "-";
  const isOrderingDisabled = !!value && DISABLED_ORDERING_OPTIONS.includes(value);

  return (
    <CustomMenu
      className={`${isMobile ? "flex w-full justify-center" : ""}`}
      customButton={
        <>
          {isMobile ? (
            <div className={getButtonStyling("secondary", "lg")}>
              <ArrowDownWideNarrow className="shrink-0 size-3.5" strokeWidth={2} />
              {orderByDetails && t(orderByDetails?.i18n_label)}
            </div>
          ) : (
            <div className={getButtonStyling("secondary", "lg")}>
              <ArrowDownWideNarrow className="shrink-0 size-3.5" strokeWidth={2} />
              {orderByDetails && t(orderByDetails?.i18n_label)}
            </div>
          )}
        </>
      }
      placement="bottom-end"
      closeOnSelect
    >
      {PROJECT_ORDER_BY_OPTIONS.map((option) => (
        <CustomMenu.MenuItem
          key={option.key}
          className="flex items-center justify-between gap-2"
          onClick={() => {
            if (isDescending)
              onChange(option.key == "sort_order" ? option.key : (`-${option.key}` as TProjectOrderByOptions));
            else onChange(option.key);
          }}
        >
          {option && t(option?.i18n_label)}
          {value?.includes(option.key) && <CheckIcon className="h-3 w-3" />}
        </CustomMenu.MenuItem>
      ))}
      <hr className="my-2 border-subtle" />
      <CustomMenu.MenuItem
        className="flex items-center justify-between gap-2"
        onClick={() => {
          if (isDescending) onChange(value.slice(1) as TProjectOrderByOptions);
        }}
        disabled={isOrderingDisabled}
      >
        Ascending
        {!isOrderingDisabled && !isDescending && <CheckIcon className="h-3 w-3" />}
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem
        className="flex items-center justify-between gap-2"
        onClick={() => {
          if (!isDescending) onChange(`-${value}` as TProjectOrderByOptions);
        }}
        disabled={isOrderingDisabled}
      >
        Descending
        {!isOrderingDisabled && isDescending && <CheckIcon className="h-3 w-3" />}
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
}
