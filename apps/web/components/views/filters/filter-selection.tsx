/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { MenuCheckboxItem, MenuSeparator } from "@makeplane/propel/components/menu";
import type { TViewFilterProps, TViewFilters } from "@plane/types";
import { EViewAccess } from "@plane/types";
// components
import { FilterCreatedDate } from "@/components/common/filters/created-at";
import { FilterCreatedBy } from "@/components/common/filters/created-by";

type Props = {
  filters: TViewFilters;
  handleFiltersUpdate: <T extends keyof TViewFilters>(filterKey: T, filterValue: TViewFilters[T]) => void;
  memberIds?: string[] | undefined;
};

export const ViewFiltersSelection = observer(function ViewFiltersSelection(props: Props) {
  const { filters, handleFiltersUpdate, memberIds } = props;

  // handles filter update
  const handleFilters = (key: keyof TViewFilterProps, value: boolean | string | EViewAccess | string[]) => {
    const currValues = (filters.filters?.[key] ?? []) as (string | EViewAccess)[];

    if (typeof currValues === "boolean" && typeof value === "boolean") return;

    if (Array.isArray(currValues)) {
      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (!currValues.includes(val)) currValues.push(val);
          else currValues.splice(currValues.indexOf(val), 1);
        });
      } else if (typeof value !== "boolean") {
        if (currValues?.includes(value)) currValues.splice(currValues.indexOf(value), 1);
        else currValues.push(value);
      }
    }

    handleFiltersUpdate("filters", {
      ...filters.filters,
      [key]: currValues,
    });
  };

  return (
    <>
      <MenuCheckboxItem
        label="Favorites"
        checked={!!filters.filters?.favorites}
        onCheckedChange={(checked) =>
          handleFiltersUpdate("filters", {
            ...filters.filters,
            favorites: checked,
          })
        }
      />

      <MenuSeparator />

      {/* created date */}
      <FilterCreatedDate
        appliedFilters={filters.filters?.created_at ?? null}
        handleUpdate={(val: string | string[]) => handleFilters("created_at", val)}
      />

      {/* created by */}
      <FilterCreatedBy
        appliedFilters={filters.filters?.owned_by ?? null}
        handleUpdate={(val) => handleFilters("owned_by", val)}
        memberIds={memberIds}
      />
    </>
  );
});
