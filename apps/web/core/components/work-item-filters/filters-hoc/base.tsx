/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { v4 as uuidv4 } from "uuid";
// plane imports
import type { TSaveViewOptions, TUpdateViewOptions } from "@plane/constants";
import type { IWorkItemFilterInstance } from "@plane/shared-state";
import type { IIssueFilters, TWorkItemFilterExpression } from "@plane/types";
// store hooks
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
// plane web imports
import type { TWorkItemFiltersEntityProps } from "@/hooks/work-item-filters/use-work-item-filters-config";
import { useWorkItemFiltersConfig } from "@/hooks/work-item-filters/use-work-item-filters-config";
// local imports
import type { TSharedWorkItemFiltersHOCProps, TSharedWorkItemFiltersProps } from "./shared";

type TAdditionalWorkItemFiltersProps = {
  saveViewOptions?: TSaveViewOptions<TWorkItemFilterExpression>;
  updateViewOptions?: TUpdateViewOptions<TWorkItemFilterExpression>;
} & TWorkItemFiltersEntityProps;

type TWorkItemFiltersHOCProps = TSharedWorkItemFiltersHOCProps & TAdditionalWorkItemFiltersProps;

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

type TWorkItemFilterProps = TSharedWorkItemFiltersProps &
  TAdditionalWorkItemFiltersProps & {
    initialWorkItemFilters: IIssueFilters;
    children: React.ReactNode | ((props: { filter: IWorkItemFilterInstance | undefined }) => React.ReactNode);
  };

const WorkItemFilterRoot = observer(function WorkItemFilterRoot(props: TWorkItemFilterProps) {
  const {
    children,
    entityType,
    entityId,
    filtersToShowByLayout,
    initialWorkItemFilters,
    isTemporary,
    saveViewOptions,
    updateFilters,
    updateViewOptions,
    showOnMount,
    ...entityConfigProps
  } = props;
  // store hooks
  const { getFilter, getOrCreateFilter, deleteFilter } = useWorkItemFilters();
  // derived values
  const workItemEntityID = useMemo(
    () => (isTemporary ? `TEMP-${entityId ?? uuidv4()}` : entityId),
    [isTemporary, entityId]
  );
  // memoize initial values to prevent re-computations when reference changes
  const initialUserFilters = useMemo(() => initialWorkItemFilters.richFilters, [initialWorkItemFilters]);
  const workItemFiltersConfig = useWorkItemFiltersConfig({
    allowedFilters: filtersToShowByLayout ? filtersToShowByLayout : [],
    ...entityConfigProps,
  });

  // Get or create the filter instance.
  // NOTE: `getOrCreateFilter` is a MobX `action` that mutates the shared filter store
  // (`this.filters.set(...)`). Calling it during render (e.g. from `useMemo`) mutates an
  // observable while React is rendering, which synchronously notifies other observer
  // components (like `WorkItemFiltersToggle`) and triggers the
  // "Cannot update a component while rendering a different component" warning.
  // To keep the mutation out of the render phase, the instance is created/updated inside
  // `useEffect` (post-commit) instead. `getFilter` (a read-only `computedFn`) is used to
  // seed the initial state so an already-existing instance is available immediately,
  // avoiding an unnecessary flash of `filter: undefined` on subsequent renders.
  const [workItemLayoutFilter, setWorkItemLayoutFilter] = useState<IWorkItemFilterInstance | undefined>(() =>
    getFilter(entityType, workItemEntityID)
  );

  useEffect(() => {
    const filter = getOrCreateFilter({
      entityType,
      entityId: workItemEntityID,
      initialExpression: initialUserFilters,
      onExpressionChange: updateFilters,
      expressionOptions: {
        saveViewOptions,
        updateViewOptions,
      },
      showOnMount,
    });
    setWorkItemLayoutFilter(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, workItemEntityID, saveViewOptions, updateViewOptions, updateFilters]);

  // delete filter instance when component unmounts
  useEffect(
    () => () => {
      deleteFilter(entityType, workItemEntityID);
    },
    [deleteFilter, entityType, workItemEntityID]
  );

  useEffect(() => {
    if (!workItemLayoutFilter) return;
    workItemLayoutFilter.configManager.setAreConfigsReady(workItemFiltersConfig.areAllConfigsInitialized);
    workItemLayoutFilter.configManager.registerAll(workItemFiltersConfig.configs);
  }, [workItemFiltersConfig.areAllConfigsInitialized, workItemFiltersConfig.configs, workItemLayoutFilter]);

  return <>{typeof children === "function" ? children({ filter: workItemLayoutFilter }) : children}</>;
});
