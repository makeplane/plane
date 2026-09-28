/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { useTranslation } from "@plane/i18n";
import { Button as ButtonElement } from "@makeplane/propel/elements/button";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@makeplane/propel/components/menu";
// types
import type { TPageFiltersSortBy, TPageFiltersSortKey } from "@plane/types";
import { SortDescendingOutline, SortAscendingOutline } from "@makeplane/propel/icons";

type Props = {
  onChange: (value: { key?: TPageFiltersSortKey; order?: TPageFiltersSortBy }) => void;
  sortBy: TPageFiltersSortBy;
  sortKey: TPageFiltersSortKey;
};

const PAGE_SORTING_KEY_OPTIONS: {
  key: TPageFiltersSortKey;
  label: string;
}[] = [
  { key: "name", label: "Name" },
  { key: "created_at", label: "Date created" },
  { key: "updated_at", label: "Date modified" },
];

export function PageOrderByDropdown(props: Props) {
  const { onChange, sortBy, sortKey } = props;
  // plane hooks
  const { t } = useTranslation();

  const orderByDetails = PAGE_SORTING_KEY_OPTIONS.find((option) => sortKey === option.key);
  const isDescending = sortBy === "desc";

  return (
    <Menu>
      {/* propel: `getButtonStyling` has no counterpart, so the trigger borrows the styled button
          element and Base UI grafts the menu behavior onto it. */}
      <MenuTrigger render={<ButtonElement variant="secondary" size="md" stretch="auto" />}>
        {!isDescending ? <SortAscendingOutline className="size-3" /> : <SortDescendingOutline className="size-3" />}
        {orderByDetails?.label}
      </MenuTrigger>
      <MenuContent side="bottom" align="end">
        {PAGE_SORTING_KEY_OPTIONS.map((option) => (
          <MenuItem
            key={option.key}
            label={option.label}
            selected={sortKey === option.key}
            onClick={() =>
              onChange({
                key: option.key,
              })
            }
          />
        ))}
        <MenuSeparator />
        <MenuItem
          label={t("common.sort.asc")}
          selected={!isDescending}
          onClick={() => {
            if (isDescending)
              onChange({
                order: "asc",
              });
          }}
        />
        <MenuItem
          label={t("common.sort.desc")}
          selected={isDescending}
          onClick={() => {
            if (!isDescending)
              onChange({
                order: "desc",
              });
          }}
        />
      </MenuContent>
    </Menu>
  );
}
