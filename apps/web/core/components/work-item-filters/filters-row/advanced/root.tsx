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

import { useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import type { PQLEditorHandle } from "@plane/editor";
import { Tabs } from "@plane/propel/tabs";
import type { AdvancedFilterType, TWorkItemFilterExpression, TWorkItemFilterProperty } from "@plane/types";
import { cn } from "@plane/utils";
// components
import type { TFiltersRowProps } from "@/components/rich-filters/filters-row";
// local imports
import type { TSharedWorkItemFiltersHOCChildrenProps } from "../../filters-hoc/shared";
import { FiltersRowPQLSection } from "../pql";
import { WorkItemFiltersTransparentRow } from "../transparent";
import { WorkItemAdvancedFiltersRowViewControls } from "./view-controls";

type TWorkItemAdvancedFiltersRowProps = Omit<
  TFiltersRowProps<TWorkItemFilterProperty, TWorkItemFilterExpression>,
  "filter"
> &
  TSharedWorkItemFiltersHOCChildrenProps;

export const WorkItemAdvancedFiltersRow = observer(function WorkItemAdvancedFiltersRow({
  filter,
  ...rest
}: TWorkItemAdvancedFiltersRowProps) {
  // refs
  const pqlEditorRef = useRef<PQLEditorHandle>(null);
  // derived values
  const selectedType = filter?.lastUsedFilterType || "rich_filters";

  const handleUpdateLastUsedFilter = (value: AdvancedFilterType) => {
    void filter?.updateLastUsedFilterType(value);
  };

  if (!filter || !filter.richFiltersInstance || !filter.pqlFiltersInstance) return null;

  return (
    <div
      className={cn("p-2", {
        "p-0": rest.variant === "modal",
      })}
    >
      <Tabs
        value={selectedType}
        onValueChange={(value: AdvancedFilterType) => {
          if (value === "pql_filters") {
            pqlEditorRef.current?.focus();
          }
          handleUpdateLastUsedFilter(value);
        }}
      >
        <div className="bg-layer-1 rounded-md py-2 px-3 flex gap-3">
          <div className="flex items-center shrink-0">
            <Tabs.List>
              <Tabs.Trigger value="rich_filters">Basic</Tabs.Trigger>
              <Tabs.Trigger value="pql_filters">PQL</Tabs.Trigger>
            </Tabs.List>
          </div>
          <div className="grow flex items-start gap-3">
            <div className="grow">
              <Tabs.Content value="rich_filters">
                <div className="py-1 px-2">
                  <WorkItemFiltersTransparentRow {...rest} filter={filter?.richFiltersInstance} />
                </div>
              </Tabs.Content>
              <Tabs.Content value="pql_filters">
                <FiltersRowPQLSection
                  disableSubmit={rest.variant === "modal"}
                  layoutFilters={filter}
                  pqlEditorRef={pqlEditorRef}
                />
              </Tabs.Content>
            </div>
            <div className="shrink-0 py-1 flex items-center">
              <WorkItemAdvancedFiltersRowViewControls filter={filter} pqlEditorRef={pqlEditorRef} />
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
});
