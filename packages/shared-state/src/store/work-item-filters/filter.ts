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

import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import type { TExpressionOptions } from "@plane/constants";
import type {
  AdvancedFilterType,
  TExternalFilter,
  TWorkItemFilterExpression,
  TWorkItemFilterProperty,
  TWorkItemFiltersViewOptions,
} from "@plane/types";
// local imports
import type { InitializePQLFilterInstanceParams } from "../pql/filter";
import { PQLFilterInstance } from "../pql/filter";
import { FilterInstance } from "../rich-filters/filter";
import { workItemFiltersAdapter } from "./adapter";

export type WorkItemFilterInstanceInitParams<E extends TExternalFilter> = {
  richFilters?: {
    expressionOptions?: TExpressionOptions<E>;
    initialExpression?: TWorkItemFilterExpression;
    onExpressionChange?: (expression: TWorkItemFilterExpression) => void;
  };
  showOnMount?: boolean;
  pql?: InitializePQLFilterInstanceParams;
  viewOptions?: TWorkItemFiltersViewOptions<E>;
  lastUsedFilterType: AdvancedFilterType;
  updateLastUsedFilterTypeCallback: (filterType: AdvancedFilterType) => Promise<void>;
};

export interface IWorkItemFilterInstance {
  // observables
  lastUsedFilterType: AdvancedFilterType;
  viewOptions: TWorkItemFiltersViewOptions<TWorkItemFilterExpression> | undefined;
  isFiltersRowVisible: boolean;
  // actions
  updateLastUsedFilterType: (filterType: AdvancedFilterType) => Promise<void>;
  clearFilters: () => Promise<void>;
  saveView: () => Promise<void>;
  updateView: () => Promise<void>;
  toggleFiltersRowVisibility: (isVisible?: boolean) => void;
  // helpers
  canClearFilters: boolean;
  canSaveView: boolean;
  canUpdateView: boolean;
  // instances
  richFiltersInstance: FilterInstance<TWorkItemFilterProperty, TWorkItemFilterExpression> | undefined;
  pqlFiltersInstance: PQLFilterInstance | undefined;
}

export class WorkItemFilterInstance implements IWorkItemFilterInstance {
  // observables
  lastUsedFilterType: IWorkItemFilterInstance["lastUsedFilterType"] = "rich_filters";
  viewOptions: IWorkItemFilterInstance["viewOptions"];
  isFiltersRowVisible: IWorkItemFilterInstance["isFiltersRowVisible"] = false;
  // instances
  richFiltersInstance: IWorkItemFilterInstance["richFiltersInstance"];
  pqlFiltersInstance: IWorkItemFilterInstance["pqlFiltersInstance"];
  // callbacks
  private updateLastUsedFilterTypeCallback: WorkItemFilterInstanceInitParams<TWorkItemFilterExpression>["updateLastUsedFilterTypeCallback"];

  constructor(params: WorkItemFilterInstanceInitParams<TWorkItemFilterExpression>) {
    if (params.richFilters) {
      this.richFiltersInstance = new FilterInstance<TWorkItemFilterProperty, TWorkItemFilterExpression>({
        adapter: workItemFiltersAdapter,
        initialExpression: params.richFilters.initialExpression,
        onExpressionChange: params.richFilters.onExpressionChange,
        options: {
          expression: { ...params.richFilters.expressionOptions, ...params.viewOptions },
          visibility: params.showOnMount
            ? { autoSetVisibility: false, isVisibleOnMount: true }
            : { autoSetVisibility: true },
        },
      });
    }
    if (params.pql) {
      this.pqlFiltersInstance = new PQLFilterInstance({
        ...params.pql,
        viewOptions: params.viewOptions as TWorkItemFiltersViewOptions<TExternalFilter>,
      });
    }
    this.lastUsedFilterType = params.lastUsedFilterType;
    this.updateLastUsedFilterTypeCallback = params.updateLastUsedFilterTypeCallback;
    this.viewOptions = params.viewOptions;
    this.isFiltersRowVisible =
      !!params.showOnMount ||
      (params.lastUsedFilterType === "rich_filters"
        ? !!this.richFiltersInstance?.hasActiveFilters
        : params.pql?.initialValue.stripped.trim() !== "");

    makeObservable<WorkItemFilterInstance, "activeFilterInstance">(this, {
      // observables
      lastUsedFilterType: observable.ref,
      viewOptions: observable.ref,
      isFiltersRowVisible: observable.ref,
      // computed
      activeFilterInstance: computed,
      canClearFilters: computed,
      canSaveView: computed,
      canUpdateView: computed,
      // actions
      updateLastUsedFilterType: action,
      clearFilters: action,
      saveView: action,
      updateView: action,
      toggleFiltersRowVisibility: action,
    });
  }

  private get activeFilterInstance() {
    if (this.lastUsedFilterType === "rich_filters") {
      return this.richFiltersInstance;
    } else if (this.lastUsedFilterType === "pql_filters") {
      return this.pqlFiltersInstance;
    }
    return null;
  }

  get canClearFilters() {
    return !!this.activeFilterInstance?.canClearFilters;
  }

  get canSaveView() {
    return !!this.activeFilterInstance?.canSaveView;
  }

  get canUpdateView() {
    return !!this.activeFilterInstance?.canUpdateView;
  }

  updateLastUsedFilterType: IWorkItemFilterInstance["updateLastUsedFilterType"] = async (filterType) => {
    const currentFilterType = this.lastUsedFilterType;
    if (filterType === currentFilterType) return;
    try {
      runInAction(() => {
        this.lastUsedFilterType = filterType;
      });
      await this.updateLastUsedFilterTypeCallback(filterType);
    } catch (error) {
      // Revert to previous filter type on error
      runInAction(() => {
        this.lastUsedFilterType = currentFilterType;
      });
      throw error;
    }
  };

  clearFilters: IWorkItemFilterInstance["clearFilters"] = async () => {
    if (this.lastUsedFilterType === "rich_filters") {
      await this.richFiltersInstance?.clearFilters();
    }
  };

  saveView: IWorkItemFilterInstance["saveView"] = async () => {
    await this.activeFilterInstance?.saveView();
  };

  updateView: IWorkItemFilterInstance["updateView"] = async () => {
    await this.activeFilterInstance?.updateView();
  };

  toggleFiltersRowVisibility: IWorkItemFilterInstance["toggleFiltersRowVisibility"] = (isVisible) => {
    runInAction(() => {
      if (isVisible === undefined) {
        this.isFiltersRowVisible = !this.isFiltersRowVisible;
      } else {
        this.isFiltersRowVisible = isVisible;
      }
    });
  };
}
