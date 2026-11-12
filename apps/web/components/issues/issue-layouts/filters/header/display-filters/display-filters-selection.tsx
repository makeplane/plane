/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { MenuSeparator } from "@makeplane/propel/components/menu";
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  ILayoutDisplayFiltersOptions,
  TIssueGroupByOptions,
} from "@plane/types";
// components
import {
  FilterDisplayProperties,
  FilterExtraOptions,
  FilterGroupBy,
  FilterOrderBy,
  FilterSubGroupBy,
} from "@/components/issues/issue-layouts/filters";

type Props = {
  displayFilters: IIssueDisplayFilterOptions | undefined;
  displayProperties: IIssueDisplayProperties;
  handleDisplayFiltersUpdate: (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => void;
  handleDisplayPropertiesUpdate: (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => void;
  layoutDisplayFiltersOptions: ILayoutDisplayFiltersOptions | undefined;
  ignoreGroupedFilters?: Partial<TIssueGroupByOptions>[];
  cycleViewDisabled?: boolean;
  moduleViewDisabled?: boolean;
  isEpic?: boolean;
};

export const DisplayFiltersSelection = observer(function DisplayFiltersSelection(props: Props) {
  const {
    displayFilters,
    displayProperties,
    handleDisplayFiltersUpdate,
    handleDisplayPropertiesUpdate,
    layoutDisplayFiltersOptions,
    ignoreGroupedFilters = [],
    cycleViewDisabled = false,
    moduleViewDisabled = false,
    isEpic = false,
  } = props;

  const isDisplayFilterEnabled = (displayFilter: keyof IIssueDisplayFilterOptions) =>
    Object.keys(layoutDisplayFiltersOptions?.display_filters ?? {}).includes(displayFilter);

  const computedIgnoreGroupedFilters: Partial<TIssueGroupByOptions>[] = [];
  if (cycleViewDisabled) {
    ignoreGroupedFilters.push("cycle");
  }
  if (moduleViewDisabled) {
    ignoreGroupedFilters.push("module");
  }

  // the menu has three sections; a separator only shows with a section on both sides of it
  const showDisplayProperties =
    !!layoutDisplayFiltersOptions?.display_properties && layoutDisplayFiltersOptions.display_properties.length > 0;
  const showGroupBy = isDisplayFilterEnabled("group_by");
  const showSubGroupBy =
    isDisplayFilterEnabled("sub_group_by") && displayFilters?.group_by !== null && displayFilters?.layout === "kanban";
  const showOrderBy =
    isDisplayFilterEnabled("order_by") && !isEmpty(layoutDisplayFiltersOptions?.display_filters?.order_by);
  const showDisplayFilters = showGroupBy || showSubGroupBy || showOrderBy;
  const showExtraOptions = !!layoutDisplayFiltersOptions?.extra_options.access;

  return (
    <>
      {/* display properties */}
      {showDisplayProperties && (
        <FilterDisplayProperties
          displayProperties={displayProperties}
          displayPropertiesToRender={layoutDisplayFiltersOptions.display_properties}
          handleUpdate={handleDisplayPropertiesUpdate}
          cycleViewDisabled={cycleViewDisabled}
          moduleViewDisabled={moduleViewDisabled}
          isEpic={isEpic}
        />
      )}

      {showDisplayProperties && (showDisplayFilters || showExtraOptions) && <MenuSeparator />}

      {/* group by */}
      {showGroupBy && (
        <FilterGroupBy
          displayFilters={displayFilters}
          groupByOptions={layoutDisplayFiltersOptions?.display_filters.group_by ?? []}
          handleUpdate={(val) =>
            handleDisplayFiltersUpdate({
              group_by: val,
            })
          }
          ignoreGroupedFilters={[...ignoreGroupedFilters, ...computedIgnoreGroupedFilters]}
        />
      )}

      {/* sub-group by */}
      {showSubGroupBy && (
        <FilterSubGroupBy
          displayFilters={displayFilters}
          handleUpdate={(val) =>
            handleDisplayFiltersUpdate({
              sub_group_by: val,
            })
          }
          subGroupByOptions={layoutDisplayFiltersOptions?.display_filters.sub_group_by ?? []}
          ignoreGroupedFilters={[...ignoreGroupedFilters, ...computedIgnoreGroupedFilters]}
        />
      )}

      {/* order by */}
      {showOrderBy && (
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

      {showDisplayFilters && showExtraOptions && <MenuSeparator />}

      {/* Options */}
      {showExtraOptions && (
        <FilterExtraOptions
          selectedExtraOptions={{
            show_empty_groups: displayFilters?.show_empty_groups ?? true,
            sub_issue: displayFilters?.sub_issue ?? true,
          }}
          handleUpdate={(key, val) =>
            handleDisplayFiltersUpdate({
              [key]: val,
            })
          }
          enabledExtraOptions={layoutDisplayFiltersOptions?.extra_options.values}
        />
      )}
    </>
  );
});
