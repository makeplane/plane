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

import { cloneDeep } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import type { PQLFilterValue, TExternalFilter, TWorkItemFiltersViewOptions } from "@plane/types";

export type InitializePQLFilterInstanceParams = {
  initialValue: PQLFilterValue;
  onValueChange?: (newValue: PQLFilterValue) => void;
  onSubmit?: (value: PQLFilterValue) => Promise<void>;
  viewOptions?: TWorkItemFiltersViewOptions<TExternalFilter>;
};

export interface IPQLFilterInstance {
  initialValue: PQLFilterValue;
  value: PQLFilterValue;
  // helpers
  canClearFilters: boolean;
  canSaveView: boolean;
  canUpdateView: boolean;
  // actions
  updateValue: (newValue: PQLFilterValue) => void;
  handleSubmit?: (value: PQLFilterValue) => Promise<void>;
  saveView: () => Promise<void>;
  updateView: () => Promise<void>;
}

export class PQLFilterInstance implements IPQLFilterInstance {
  initialValue: IPQLFilterInstance["initialValue"];
  value: IPQLFilterInstance["value"];
  private viewOptions: InitializePQLFilterInstanceParams["viewOptions"];
  private onSubmit: InitializePQLFilterInstanceParams["onSubmit"];
  private onValueChange: InitializePQLFilterInstanceParams["onValueChange"];

  constructor(params: InitializePQLFilterInstanceParams) {
    this.initialValue = cloneDeep(params.initialValue);
    this.value = cloneDeep(params.initialValue);
    this.viewOptions = params.viewOptions;
    this.onSubmit = params.onSubmit;
    this.onValueChange = params.onValueChange;

    makeObservable(this, {
      // observables
      initialValue: observable,
      value: observable,
      // computed
      hasChanges: computed,
      canClearFilters: computed,
      canSaveView: computed,
      canUpdateView: computed,
      // actions
      updateValue: action,
      handleSubmit: action,
      saveView: action,
      updateView: action,
    });
  }

  get hasChanges() {
    return this.value.stripped.toLowerCase().trim() !== this.initialValue.stripped.toLowerCase().trim();
  }

  get canClearFilters(): IPQLFilterInstance["canClearFilters"] {
    return this.value.stripped.trim() !== "";
  }

  get canSaveView(): IPQLFilterInstance["canSaveView"] {
    return (
      this.value.stripped.trim() !== "" &&
      !!this.viewOptions?.saveViewOptions &&
      !this.viewOptions?.saveViewOptions?.isDisabled
    );
  }

  get canUpdateView(): IPQLFilterInstance["canUpdateView"] {
    return (
      !!this.viewOptions?.updateViewOptions &&
      (this.hasChanges || !!this.viewOptions?.updateViewOptions?.hasAdditionalChanges) &&
      !this.viewOptions?.updateViewOptions?.isDisabled
    );
  }

  updateValue: IPQLFilterInstance["updateValue"] = (newValue) => {
    runInAction(() => {
      this.value = newValue;
    });
    this.onValueChange?.(newValue);
  };

  handleSubmit: IPQLFilterInstance["handleSubmit"] = async (value) => {
    const initialValueBeforeSubmit = cloneDeep(this.initialValue);
    const valueBeforeSubmit = cloneDeep(this.value);
    try {
      runInAction(() => {
        this.value = value;
        this.initialValue = value;
      });
      await this.onSubmit?.(value);
    } catch (error) {
      runInAction(() => {
        this.value = valueBeforeSubmit;
        this.initialValue = initialValueBeforeSubmit;
      });
      console.error("Error in PQLFilterInstance handleSubmit:", error);
      throw error;
    }
  };

  saveView: IPQLFilterInstance["saveView"] = async () => {
    await this.viewOptions?.saveViewOptions?.onViewSave({
      type: "pql_filters",
      value: this.value,
    });
  };

  updateView: IPQLFilterInstance["updateView"] = async () => {
    await this.viewOptions?.updateViewOptions?.onViewUpdate({
      type: "pql_filters",
      value: this.value,
    });
  };
}
