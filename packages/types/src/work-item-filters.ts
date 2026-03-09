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

// local imports
import type { TExternalFilter } from "./rich-filters";
import type { AdvancedFilterType, PQLFilterValue } from "./view-props";

export type WorkItemFilerViewCallbackArguments<E extends TExternalFilter> =
  | {
      type: Extract<AdvancedFilterType, "rich_filters">;
      expression: E;
    }
  | {
      type: Extract<AdvancedFilterType, "pql_filters">;
      value: PQLFilterValue;
    };

export type TWorkItemFiltersSaveViewOptions<E extends TExternalFilter> = {
  label?: string;
  onViewSave: (args: WorkItemFilerViewCallbackArguments<E>) => void | Promise<void>;
  isDisabled?: boolean;
};

export type TWorkItemFiltersUpdateViewOptions<E extends TExternalFilter> = {
  label?: string;
  hasAdditionalChanges?: boolean;
  onViewUpdate: (args: WorkItemFilerViewCallbackArguments<E>) => void | Promise<void>;
  isDisabled?: boolean;
};

export type TWorkItemFiltersViewOptions<E extends TExternalFilter> = {
  saveViewOptions?: TWorkItemFiltersSaveViewOptions<E>;
  updateViewOptions?: TWorkItemFiltersUpdateViewOptions<E>;
};
