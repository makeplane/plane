/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
import type { TRecentActivityFilterKeys } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";

export type TFiltersDropdown = {
  className?: string;
  activeFilter: TRecentActivityFilterKeys;
  setActiveFilter: (filter: TRecentActivityFilterKeys) => void;
  filters: { name: TRecentActivityFilterKeys; icon?: React.ReactNode; i18n_key: string }[];
};

export const FiltersDropdown = observer(function FiltersDropdown(props: TFiltersDropdown) {
  const { className, activeFilter, setActiveFilter, filters } = props;
  const { t } = useTranslation();

  function DropdownOptions() {
    return filters?.map((filter) => (
      <CustomMenu.MenuItem
        key={filter.name}
        className="flex items-center gap-2 truncate text-secondary"
        onClick={() => {
          setActiveFilter(filter.name);
        }}
      >
        <div className="truncate text-11 font-medium capitalize">{t(filter.i18n_key)}</div>
      </CustomMenu.MenuItem>
    ));
  }

  const title = activeFilter ? filters?.find((filter) => filter.name === activeFilter)?.i18n_key : "";
  return (
    <CustomMenu
      maxHeight={"md"}
      className={cn("flex w-fit justify-center text-11 text-secondary", className)}
      placement="bottom-start"
      customButton={
        <button className="flex gap-1 rounded-sm border border-subtle px-2 py-1 capitalize hover:bg-layer-transparent-hover">
          <span className="my-auto text-13 font-medium">{t(title || "")}</span>
          <ChevronDownIcon className={cn("my-auto size-3 text-tertiary duration-300 hover:text-secondary")} />
        </button>
      }
      customButtonClassName="flex justify-center"
      closeOnSelect
    >
      <DropdownOptions />
    </CustomMenu>
  );
});
