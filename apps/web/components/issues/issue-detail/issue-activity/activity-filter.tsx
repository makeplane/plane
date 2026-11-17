/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { FilterOutline, SelectedFilterOutline } from "@makeplane/propel/icons";
// plane imports
import type { TActivityFilters, TActivityFilterOption } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuCheckboxItem, MenuContent, MenuTrigger } from "@makeplane/propel/components/menu";

type TActivityFilter = {
  selectedFilters: TActivityFilters[];
  filterOptions: TActivityFilterOption[];
};

export const ActivityFilter = observer(function ActivityFilter(props: TActivityFilter) {
  const { selectedFilters = [], filterOptions } = props;

  // hooks
  const { t } = useTranslation();
  // derived values
  const isFiltersApplied = selectedFilters.length < filterOptions.length;
  const FilterIcon = isFiltersApplied ? SelectedFilterOutline : FilterOutline;

  return (
    <div className="flex items-center">
      <Menu>
        <MenuTrigger
          render={
            <IconButton
              variant="tertiary"
              size="md"
              icon={
                <Icon
                  icon={
                    <FilterIcon className={cn({ "text-accent-primary [&_path]:fill-current": isFiltersApplied })} />
                  }
                />
              }
              aria-label={t("common.filters")}
              // Accent tint while any activity type is filtered out (Propel has no tinted variant).
              render={(buttonProps) => (
                <button
                  type="button"
                  {...buttonProps}
                  className={cn(buttonProps.className, {
                    "bg-accent-subtle text-accent-primary hover:bg-accent-subtle-hover active:bg-accent-subtle-active":
                      isFiltersApplied,
                  })}
                />
              )}
            />
          }
        />
        <MenuContent side="bottom" align="end">
          {filterOptions.map((item) => (
            <MenuCheckboxItem
              key={item.key}
              label={t(item.labelTranslationKey)}
              checked={item.isSelected}
              onCheckedChange={() => item.onClick()}
            />
          ))}
        </MenuContent>
      </Menu>
    </div>
  );
});
