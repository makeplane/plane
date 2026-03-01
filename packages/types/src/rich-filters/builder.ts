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

import type { SingleOrArray } from "../utils";
import type { IFilterAdapter, TExternalFilter } from "./adapter";
import type { TFilterProperty, TFilterValue } from "./expression";
import type { TAllAvailableOperatorsForDisplay } from "./operators";

/**
 * Condition payload for building filter expressions.
 * @template P - Property key type
 * @template V - Value type
 */
export type TFilterConditionForBuild<P extends TFilterProperty, V extends TFilterValue> = {
  property: P;
  operator: TAllAvailableOperatorsForDisplay;
  value: SingleOrArray<V>;
};

/**
 * Parameters for building filter expressions from multiple conditions.
 * @template P - Property key type
 * @template V - Value type
 */
export type TBuildFilterExpressionParams<
  P extends TFilterProperty,
  V extends TFilterValue,
  E extends TExternalFilter,
> = {
  conditions: TFilterConditionForBuild<P, V>[];
  adapter: IFilterAdapter<P, E>;
  initialExpression?: E;
};
