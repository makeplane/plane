/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import { MODULE_ORDER_BY_OPTIONS } from "@workspaces/constants";
import { useTranslation } from "@workspaces/i18n";
import { getButtonStyling } from "@workspaces/propel/button";
import { CheckIcon, ChevronDownIcon } from "@workspaces/propel/icons";
import type { TModuleOrderByOptions } from "@workspaces/types";
// ui
import { CustomMenu } from "@workspaces/ui";
// helpers
import { cn } from "@workspaces/utils";
// types
// constants

type Props = {
  onChange: (value: TModuleOrderByOptions) => void;
  value: TModuleOrderByOptions | undefined;
};

export function ModuleOrderByDropdown(props: Props) {
  const { onChange, value } = props;
  // hooks
  const { t } = useTranslation();

  const orderByDetails = MODULE_ORDER_BY_OPTIONS.find((option) => value?.includes(option.key));

  const isDescending = value?.[0] === "-";
  const isManual = value?.includes("sort_order");

  return (
    <CustomMenu
      customButton={
        <div className={cn(getButtonStyling("secondary", "lg"), "px-2 text-tertiary")}>
          {!isDescending ? <ArrowUpWideNarrow className="size-3" /> : <ArrowDownWideNarrow className="size-3" />}
          {orderByDetails && t(orderByDetails?.i18n_label)}
          <ChevronDownIcon className="size-3" strokeWidth={2} />
        </div>
      }
      placement="bottom-end"
      maxHeight="lg"
      closeOnSelect
    >
      {MODULE_ORDER_BY_OPTIONS.map((option) => (
        <CustomMenu.MenuItem
          key={option.key}
          className="flex items-center justify-between gap-2"
          onClick={() => {
            if (isDescending && !isManual) onChange(`-${option.key}` as TModuleOrderByOptions);
            else onChange(option.key);
          }}
        >
          {t(option.i18n_label)}
          {value?.includes(option.key) && <CheckIcon className="h-3 w-3" />}
        </CustomMenu.MenuItem>
      ))}
      {!isManual && (
        <>
          <hr className="my-2 border-subtle" />
          <CustomMenu.MenuItem
            className="flex items-center justify-between gap-2"
            onClick={() => {
              if (isDescending) onChange(value.slice(1) as TModuleOrderByOptions);
            }}
          >
            Ascending
            {!isDescending && <CheckIcon className="h-3 w-3" />}
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem
            className="flex items-center justify-between gap-2"
            onClick={() => {
              if (!isDescending) onChange(`-${value}` as TModuleOrderByOptions);
            }}
          >
            Descending
            {isDescending && <CheckIcon className="h-3 w-3" />}
          </CustomMenu.MenuItem>
        </>
      )}
    </CustomMenu>
  );
}
