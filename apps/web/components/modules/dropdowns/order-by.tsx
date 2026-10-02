/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { MODULE_ORDER_BY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button as ButtonElement } from "@makeplane/propel/elements/button";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@makeplane/propel/components/menu";
import { ChevronDownOutline, SortDescendingOutline, SortAscendingOutline } from "@makeplane/propel/icons";
import type { TModuleOrderByOptions } from "@plane/types";

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
    <Menu>
      {/* propel: `getButtonStyling` has no counterpart, so the trigger borrows the styled button
          element and Base UI grafts the menu behavior onto it. */}
      <MenuTrigger render={<ButtonElement variant="secondary" size="md" stretch="auto" />}>
        {!isDescending ? <SortAscendingOutline className="size-3" /> : <SortDescendingOutline className="size-3" />}
        {orderByDetails && t(orderByDetails?.i18n_label)}
        <ChevronDownOutline className="size-3" />
      </MenuTrigger>
      <MenuContent side="bottom" align="end">
        {MODULE_ORDER_BY_OPTIONS.map((option) => (
          <MenuItem
            key={option.key}
            label={t(option.i18n_label)}
            selected={value?.includes(option.key) ?? false}
            onClick={() => {
              if (isDescending && !isManual) onChange(`-${option.key}` as TModuleOrderByOptions);
              else onChange(option.key);
            }}
          />
        ))}
        {!isManual && (
          <>
            <MenuSeparator />
            <MenuItem
              label={t("common.sort.asc")}
              selected={!isDescending}
              onClick={() => {
                if (isDescending) onChange(value.slice(1) as TModuleOrderByOptions);
              }}
            />
            <MenuItem
              label={t("common.sort.desc")}
              selected={isDescending ?? false}
              onClick={() => {
                if (!isDescending) onChange(`-${value}` as TModuleOrderByOptions);
              }}
            />
          </>
        )}
      </MenuContent>
    </Menu>
  );
}
