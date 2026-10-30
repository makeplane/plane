/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { MenuSeparator } from "@makeplane/propel/components/menu";
import { PreferencesOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// plane imports
import type { IIssueDisplayFilterOptions, ILayoutDisplayFiltersOptions, IIssueDisplayProperties } from "@plane/types";
import { cn } from "@plane/utils";
// components
import {
  FilterDisplayProperties,
  FilterGroupBy,
  FilterOrderBy,
  FiltersDropdown,
} from "@/components/issues/issue-layouts/filters";
import { isDisplayFiltersApplied } from "@/components/issues/issue-layouts/utils";
type TSubIssueDisplayFiltersProps = {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFiltersUpdate: (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => void;
  handleDisplayPropertiesUpdate: (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => void;
  layoutDisplayFiltersOptions: ILayoutDisplayFiltersOptions | undefined;
  isEpic?: boolean;
};

export const SubIssueDisplayFilters = observer(function SubIssueDisplayFilters(props: TSubIssueDisplayFiltersProps) {
  const {
    isEpic = false,
    displayProperties,
    layoutDisplayFiltersOptions,
    handleDisplayPropertiesUpdate,
    handleDisplayFiltersUpdate,
    displayFilters,
  } = props;
  // plane hooks
  const { t } = useTranslation();

  const isFilterApplied = useMemo(
    () => isDisplayFiltersApplied({ displayProperties, displayFilters }),
    [displayProperties, displayFilters]
  );

  return (
    <>
      {layoutDisplayFiltersOptions?.display_filters && layoutDisplayFiltersOptions?.display_properties.length > 0 && (
        <FiltersDropdown
          title={t("common.display")}
          placement="bottom-end"
          menuButton={
            <div
              className={cn(
                "relative rounded-sm p-1 transition-all duration-200",
                isFilterApplied && "bg-accent-primary/20"
              )}
            >
              {isFilterApplied && (
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent-primary" />
              )}
              <PreferencesOutline className="h-3.5 w-3.5 text-primary" />
            </div>
          }
        >
          {/* display properties */}
          <FilterDisplayProperties
            displayProperties={displayProperties}
            displayPropertiesToRender={layoutDisplayFiltersOptions.display_properties}
            handleUpdate={handleDisplayPropertiesUpdate}
            isEpic={isEpic}
          />

          <MenuSeparator />

          {/* group by */}
          <FilterGroupBy
            displayFilters={displayFilters}
            groupByOptions={layoutDisplayFiltersOptions?.display_filters.group_by ?? []}
            handleUpdate={(val) =>
              handleDisplayFiltersUpdate({
                group_by: val,
              })
            }
            ignoreGroupedFilters={[]}
          />

          {/* order by */}
          {!isEmpty(layoutDisplayFiltersOptions?.display_filters?.order_by) && (
            <FilterOrderBy
              selectedOrderBy={displayFilters?.order_by}
              handleUpdate={(val) =>
                handleDisplayFiltersUpdate({
                  order_by: val,
                })
              }
              orderByOptions={layoutDisplayFiltersOptions?.display_filters.order_by ?? []}
            />
          )}
        </FiltersDropdown>
      )}
    </>
  );
});
