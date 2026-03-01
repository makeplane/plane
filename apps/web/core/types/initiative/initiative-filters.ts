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

import type {
  CORE_OPERATORS,
  LOGICAL_OPERATOR,
  TFilterExpression,
  TFilterValue,
  TInitiativeDisplayFilters,
} from "@plane/types";

export type TInitiativeStoredFilters = {
  display_filters?: TInitiativeDisplayFilters;
  filters?: TExternalInitiativeFilterExpression;
};

// initiative rich filters

export type TInitiativeFilterKeys = "lead" | "start_date" | "end_date" | "state" | "label_id";

export type TExternalInitiativeFilterOperator =
  | typeof CORE_OPERATORS.EXACT
  | typeof CORE_OPERATORS.RANGE
  | typeof CORE_OPERATORS.IN;

export const EXTERNAL_INITIATIVE_FILTER_OPERATOR_SEPARATOR = "__";

export type TExternalInitiativeFilterExpression = TExternalInitiativeFilterExpressionData;
export type TExternalInitiativeFilterAndGroup = {
  [LOGICAL_OPERATOR.AND]: TExternalInitiativeFilterExpression[];
};

export type TExternalInitiativeFilterOrGroup = {
  [LOGICAL_OPERATOR.OR]: TExternalInitiativeFilterExpression[];
};

export type TExternalInitiativeFilterNotGroup = {
  [LOGICAL_OPERATOR.NOT]: TExternalInitiativeFilterExpression;
};

export type TExternalInitiativeFilterGroup =
  | TExternalInitiativeFilterAndGroup
  | TExternalInitiativeFilterOrGroup
  | TExternalInitiativeFilterNotGroup;

export type TExternalInitiativeFilterExpressionData =
  | {
      [key in TInitiativeFilterKeys]?: TFilterValue;
    }
  | TExternalInitiativeFilterGroup;

export type TInternalInitiativeFilterExpression = TFilterExpression<TInitiativeFilterKeys>;

// User Properties

export type TInitiativeUserProperties = {
  rich_filters?: TExternalInitiativeFilterExpression;
  display_filters?: TInitiativeDisplayFilters;
};
