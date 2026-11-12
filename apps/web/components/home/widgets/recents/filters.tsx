/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { Pill } from "@makeplane/propel/components/pill";
import { ChevronDownOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import type { TRecentActivityFilterKeys } from "@plane/types";
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

  const title = activeFilter ? filters?.find((filter) => filter.name === activeFilter)?.i18n_key : "";
  return (
    <div className={cn("flex w-fit justify-center text-secondary", className)}>
      <Menu>
        <MenuTrigger
          render={
            <Pill
              size="sm"
              variant="outline"
              render={<button type="button" className="!text-body-xs-medium" />}
              label={t(title || "")}
              endIcon={<ChevronDownOutline className="size-3.5" />}
            />
          }
        />
        <MenuContent side="bottom" align="start">
          {filters?.map((filter) => (
            <MenuItem
              key={filter.name}
              label={t(filter.i18n_key)}
              onClick={() => {
                setActiveFilter(filter.name);
              }}
            />
          ))}
        </MenuContent>
      </Menu>
    </div>
  );
});
