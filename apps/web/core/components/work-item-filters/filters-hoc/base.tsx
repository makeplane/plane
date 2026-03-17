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

import { useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import { v4 as uuidv4 } from "uuid";
// plane imports
import type { IIssueFilters, TWorkItemFilterExpression, TWorkItemFiltersViewOptions } from "@plane/types";
// store hooks
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
// plane web imports
import type { TWorkItemFiltersEntityProps } from "@/plane-web/hooks/work-item-filters/use-work-item-filters-config";
import { useWorkItemFiltersConfig } from "@/plane-web/hooks/work-item-filters/use-work-item-filters-config";
// local imports
import type { TSharedWorkItemFiltersBaseHOCProps } from "./shared";

type TAdditionalWorkItemFiltersProps = {
  viewOptions?: TWorkItemFiltersViewOptions<TWorkItemFilterExpression>;
} & TWorkItemFiltersEntityProps;

type TWorkItemFiltersHOCProps = TSharedWorkItemFiltersBaseHOCProps & TAdditionalWorkItemFiltersProps;

export const WorkItemFiltersHOC = observer(function WorkItemFiltersHOC(props: TWorkItemFiltersHOCProps) {
  const { children, initialWorkItemFilters } = props;

  // Only initialize filter instance when initial work item filters are defined
  if (!initialWorkItemFilters)
    return <>{typeof children === "function" ? children({ filter: undefined }) : children}</>;

  return (
    <WorkItemFilterRoot {...props} initialWorkItemFilters={initialWorkItemFilters}>
      {children}
    </WorkItemFilterRoot>
  );
});

type TWorkItemFilterProps = TSharedWorkItemFiltersBaseHOCProps &
  TAdditionalWorkItemFiltersProps &
  Pick<TSharedWorkItemFiltersBaseHOCProps, "children" | "initialWorkItemFilters">;

const WorkItemFilterRoot = observer(function WorkItemFilterRoot(props: TWorkItemFilterProps) {
  const {
    children,
    entityType,
    entityId,
    filtersToShowByLayout,
    handlePQLChange,
    initialWorkItemFilters,
    isTemporary,
    updateFilters,
    showOnMount,
    viewOptions,
    ...entityConfigProps
  } = props;
  // store hooks
  const { getOrCreateFilter, deleteFilter } = useWorkItemFilters();
  // derived values
  const workItemEntityID = useMemo(
    () => (isTemporary ? `TEMP-${entityId ?? uuidv4()}` : entityId),
    [isTemporary, entityId]
  );
  // memoize initial values to prevent re-computations when reference changes
  const initialRichTextFilters = useMemo(() => initialWorkItemFilters?.richFilters, [initialWorkItemFilters]);
  const initialPqlFilters = useMemo(() => initialWorkItemFilters?.pqlFilters, [initialWorkItemFilters]);
  const lastUsedFilterType = useMemo(
    () => initialWorkItemFilters?.lastUsedFilterType || "rich_filters",
    [initialWorkItemFilters]
  );
  const workItemFiltersConfig = useWorkItemFiltersConfig({
    allowedFilters: filtersToShowByLayout ?? [],
    ...entityConfigProps,
  });
  // get or create filter instance
  const filterInstance = useMemo(
    () =>
      getOrCreateFilter({
        entityType,
        entityId: workItemEntityID,
        richFilters: {
          initialExpression: initialRichTextFilters,
          onExpressionChange: (expression) => updateFilters({ type: "rich_filters", expression }),
        },
        ...(initialPqlFilters
          ? {
              pql: {
                initialValue: initialPqlFilters,
                onSubmit: async (value) => {
                  await updateFilters({ type: "pql_filters", value });
                },
                onValueChange: handlePQLChange,
              },
            }
          : {}),
        showOnMount,
        viewOptions,
        lastUsedFilterType,
        updateLastUsedFilterTypeCallback: async (filterType) => {
          await updateFilters({ type: "last_used", value: filterType });
        },
      }),
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [entityType, workItemEntityID, updateFilters, viewOptions]
  );

  // delete filter instance when component unmounts
  useEffect(
    () => () => {
      deleteFilter(entityType, workItemEntityID);
    },
    [deleteFilter, entityType, workItemEntityID]
  );

  useEffect(() => {
    filterInstance.richFiltersInstance?.configManager.setAreConfigsReady(
      workItemFiltersConfig.areAllConfigsInitialized
    );
    filterInstance.richFiltersInstance?.configManager.registerAll(workItemFiltersConfig.configs);
  }, [
    workItemFiltersConfig.areAllConfigsInitialized,
    workItemFiltersConfig.configs,
    filterInstance.richFiltersInstance?.configManager,
  ]);

  return (
    <>
      {typeof children === "function"
        ? children({
            filter: filterInstance,
          })
        : children}
    </>
  );
});
