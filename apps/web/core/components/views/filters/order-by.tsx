/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { SortAscendingOutline, SortDescendingOutline, TickOutline } from "@makeplane/propel/icons";
// plane imports
import { VIEW_SORT_BY_OPTIONS, VIEW_SORTING_KEY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/elements/button";
import type { TViewFiltersSortBy, TViewFiltersSortKey } from "@plane/types";
import { CustomMenu } from "@plane/blocks/dropdowns";

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
    <CustomMenu
      customButton={
        isMobile ? (
          <span className="flex w-full items-center gap-2 text-13 text-secondary">{buttonContent}</span>
        ) : (
          <Button variant="secondary" size="md" stretch="auto" render={<span />}>
            {buttonContent}
          </Button>
        )
      }
      placement="bottom-end"
      className="flex w-full justify-center"
      maxHeight="lg"
      closeOnSelect
    >
      {VIEW_SORTING_KEY_OPTIONS.map((option) => (
        <CustomMenu.MenuItem
          key={option.key}
          className="flex items-center justify-between gap-2"
          onClick={() =>
            onChange({
              key: option.key as TViewFiltersSortKey,
            })
          }
        >
          {t(option.i18n_label)}
          {sortKey === option.key && <TickOutline className="h-3 w-3" />}
        </CustomMenu.MenuItem>
      ))}
      <hr className="my-2 border-subtle" />
      {VIEW_SORT_BY_OPTIONS.map((option) => {
        const isSelected = (option.key === "asc" && !isDescending) || (option.key === "desc" && isDescending);
        return (
          <CustomMenu.MenuItem
            key={option.key}
            className="flex items-center justify-between gap-2"
            onClick={() => {
              if (!isSelected)
                onChange({
                  order: option.key as TViewFiltersSortBy,
                });
            }}
          >
            {t(option.i18n_label)}
            {isSelected && <TickOutline className="h-3 w-3" />}
          </CustomMenu.MenuItem>
        );
      })}
    </CustomMenu>
  );
}
