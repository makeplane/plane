/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { SortAscendingOutline, SortDescendingOutline } from "@makeplane/propel/icons";
// plane imports
import { VIEW_SORT_BY_OPTIONS, VIEW_SORTING_KEY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button as ButtonElement } from "@makeplane/propel/elements/button";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@makeplane/propel/components/menu";
import type { TViewFiltersSortBy, TViewFiltersSortKey } from "@plane/types";

type Props = {
  onChange: (value: { key?: TViewFiltersSortKey; order?: TViewFiltersSortBy }) => void;
  sortBy: TViewFiltersSortBy;
  sortKey: TViewFiltersSortKey;
  isMobile?: boolean;
};

export function ViewOrderByDropdown(props: Props) {
  const { onChange, sortBy, sortKey, isMobile = false } = props;
  const { t } = useTranslation();

  const orderByDetails = VIEW_SORTING_KEY_OPTIONS.find((option) => sortKey === option.key);
  const isDescending = sortBy === "desc";

  const icon = (
    <>{!isDescending ? <SortAscendingOutline className="size-3" /> : <SortDescendingOutline className="size-3" />}</>
  );

  const buttonContent = (
    <>
      {!isMobile && icon}
      <span className="shrink-0"> {orderByDetails?.i18n_label && t(orderByDetails?.i18n_label)}</span>
    </>
  );

  return (
    <Menu>
      <div className="flex w-full justify-center">
        {/* propel: `getButtonStyling` has no counterpart, so the desktop trigger borrows the styled
            button element and Base UI grafts the menu behavior onto it. */}
        <MenuTrigger
          render={
            isMobile ? (
              <button type="button" className="flex w-full items-center gap-2 text-13 text-secondary" />
            ) : (
              <ButtonElement variant="secondary" size="md" stretch="auto" />
            )
          }
        >
          {buttonContent}
        </MenuTrigger>
      </div>
      <MenuContent side="bottom" align="end">
        {VIEW_SORTING_KEY_OPTIONS.map((option) => (
          <MenuItem
            key={option.key}
            label={t(option.i18n_label)}
            selected={sortKey === option.key}
            onClick={() =>
              onChange({
                key: option.key as TViewFiltersSortKey,
              })
            }
          />
        ))}
        <MenuSeparator />
        {VIEW_SORT_BY_OPTIONS.map((option) => {
          const isSelected = (option.key === "asc" && !isDescending) || (option.key === "desc" && isDescending);
          return (
            <MenuItem
              key={option.key}
              label={t(option.i18n_label)}
              selected={isSelected}
              onClick={() => {
                if (!isSelected)
                  onChange({
                    order: option.key as TViewFiltersSortBy,
                  });
              }}
            />
          );
        })}
      </MenuContent>
    </Menu>
  );
}
