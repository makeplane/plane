/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArrowDownWideNarrow } from "lucide-react";
// workspaces imports
import { PROJECT_ORDER_BY_OPTIONS } from "@workspaces/constants";
import { useTranslation } from "@workspaces/i18n";
import { getButtonStyling } from "@workspaces/propel/button";
import { CheckIcon } from "@workspaces/propel/icons";
import type { TProjectOrderByOptions } from "@workspaces/types";
import { CustomMenu } from "@workspaces/ui";

type Props = {
  onChange: (value: TProjectOrderByOptions) => void;
  value: TProjectOrderByOptions | undefined;
  isMobile?: boolean;
};

const DISABLED_ORDERING_OPTIONS = new Set(["sort_order"]);

export function ProjectOrderByDropdown(props: Props) {
  const { onChange, value, isMobile = false } = props;
  const { t } = useTranslation();

  const orderByDetails = PROJECT_ORDER_BY_OPTIONS.find((option) => value?.includes(option.key));

  const isDescending = value?.[0] === "-";
  const isOrderingDisabled = !!value && DISABLED_ORDERING_OPTIONS.has(value);

  return (
    <CustomMenu
      className={`${isMobile ? "flex w-full justify-center" : ""}`}
      customButton={
        <>
          {isMobile ? (
            <div className={getButtonStyling("secondary", "lg")}>
              <ArrowDownWideNarrow className="size-3.5 shrink-0" strokeWidth={2} />
              {orderByDetails && t(orderByDetails?.i18n_label)}
            </div>
          ) : (
            <div className={getButtonStyling("secondary", "lg")}>
              <ArrowDownWideNarrow className="size-3.5 shrink-0" strokeWidth={2} />
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
