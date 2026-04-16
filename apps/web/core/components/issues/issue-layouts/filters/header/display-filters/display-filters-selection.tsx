/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { parsePQLOrderByAndLimit } from "@plane/editor";
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilters,
  ILayoutDisplayFiltersOptions,
  TIssueGroupByOptions,
} from "@plane/types";
import { cn } from "@plane/utils";
// components
import {
  FilterDisplayProperties,
  FilterExtraOptions,
  FilterGroupBy,
  FilterOrderBy,
  FilterSubGroupBy,
} from "@/components/issues/issue-layouts/filters";

type Props = {
  workItemFilters: Partial<IIssueFilters> | undefined;
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
    workItemFilters: issueFilters,
    handleDisplayFiltersUpdate,
    handleDisplayPropertiesUpdate,
    layoutDisplayFiltersOptions,
    ignoreGroupedFilters = [],
    cycleViewDisabled = false,
    moduleViewDisabled = false,
    isEpic = false,
  } = props;
  // derived values
  const { displayFilters, displayProperties } = issueFilters ?? {};

  const isDisplayFilterEnabled = (displayFilter: keyof IIssueDisplayFilterOptions) =>
    Object.keys(layoutDisplayFiltersOptions?.display_filters ?? {}).includes(displayFilter);

  const computedIgnoreGroupedFilters: Partial<TIssueGroupByOptions>[] = [];
  if (cycleViewDisabled) {
    ignoreGroupedFilters.push("cycle");
  }
  if (moduleViewDisabled) {
    ignoreGroupedFilters.push("module");
  }

  const isOrderByInPQL =
    issueFilters?.pqlFilters &&
    issueFilters?.lastUsedFilterType === "pql_filters" &&
    !!parsePQLOrderByAndLimit(issueFilters.pqlFilters.stripped ?? "").orderBy?.length;

  return (
    <div className="vertical-scrollbar scrollbar-sm relative h-full w-full divide-y divide-subtle-1 overflow-hidden overflow-y-auto px-2.5">
      {/* display properties */}
      {displayProperties &&
        layoutDisplayFiltersOptions?.display_properties &&
        layoutDisplayFiltersOptions.display_properties.length > 0 && (
          <div className="py-2">
            <FilterDisplayProperties
              displayProperties={displayProperties}
              displayPropertiesToRender={layoutDisplayFiltersOptions.display_properties}
              handleUpdate={handleDisplayPropertiesUpdate}
              cycleViewDisabled={cycleViewDisabled}
              moduleViewDisabled={moduleViewDisabled}
              isEpic={isEpic}
            />
          </div>
        )}

      {/* group by */}
      {isDisplayFilterEnabled("group_by") && (
        <div className="py-2">
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
        </div>
      )}

      {/* sub-group by */}
      {isDisplayFilterEnabled("sub_group_by") &&
        displayFilters?.group_by !== null &&
        displayFilters?.layout === "kanban" && (
          <div className="py-2">
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
          </div>
        )}

      {/* order by */}
      {isDisplayFilterEnabled("order_by") && !isEmpty(layoutDisplayFiltersOptions?.display_filters?.order_by) && (
        <div
          className={cn("relative py-2", {
            "pointer-events-none select-none": isOrderByInPQL,
          })}
        >
          {isOrderByInPQL && (
            <div className="absolute h-full w-[calc(100%+20px)] top-0 -left-2.5 bg-black/80 grid place-items-center text-body-xs-medium text-secondary z-10 px-2.5 text-center">
              Order by is overridden
              <br />
              by PQL filters
            </div>
          )}
          <FilterOrderBy
            selectedOrderBy={displayFilters?.order_by}
            handleUpdate={(val) =>
              handleDisplayFiltersUpdate({
                order_by: val,
              })
            }
            orderByOptions={layoutDisplayFiltersOptions?.display_filters.order_by ?? []}
          />
        </div>
      )}

      {/* Options */}
      {layoutDisplayFiltersOptions?.extra_options.access && (
        <div className="py-2">
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
        </div>
      )}
    </div>
  );
});
