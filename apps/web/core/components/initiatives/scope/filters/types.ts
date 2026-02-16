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

import type { FilterInstance } from "@plane/shared-state";
import type {
  TWorkItemFilterExpression,
  TWorkItemFilterProperty,
  TFilterExpression,
  TFilterValue,
  LOGICAL_OPERATOR,
} from "@plane/types";

// Epic scope filter types (reusing work item filter types)
export type TInitiativeScopeEpicFilterKeys = TWorkItemFilterProperty;
export type TInitiativeScopeEpicFilterExpression = TWorkItemFilterExpression;
export type IInitiativeScopeEpicFilterInstance = FilterInstance<
  TInitiativeScopeEpicFilterKeys,
  TInitiativeScopeEpicFilterExpression
>;

// Project scope filter types
export type TInitiativeScopeProjectFilterKeys = "lead" | "start_date" | "target_date" | "state_id" | "priority";

export type TExternalProjectFilterExpression = TExternalProjectFilterExpressionData;

export type TExternalProjectFilterAndGroup = {
  [LOGICAL_OPERATOR.AND]: TExternalProjectFilterExpression[];
};

export type TExternalProjectFilterOrGroup = {
  [LOGICAL_OPERATOR.OR]: TExternalProjectFilterExpression[];
};

export type TExternalProjectFilterNotGroup = {
  [LOGICAL_OPERATOR.NOT]: TExternalProjectFilterExpression;
};

export type TExternalProjectFilterGroup =
  | TExternalProjectFilterAndGroup
  | TExternalProjectFilterOrGroup
  | TExternalProjectFilterNotGroup;

export type TExternalProjectFilterExpressionData =
  | {
      [key in TInitiativeScopeProjectFilterKeys]?: TFilterValue;
    }
  | TExternalProjectFilterGroup;

export type TInternalProjectFilterExpression = TFilterExpression<TInitiativeScopeProjectFilterKeys>;

export type IInitiativeScopeProjectFilterInstance = FilterInstance<
  TInitiativeScopeProjectFilterKeys,
  TExternalProjectFilterExpression
>;
