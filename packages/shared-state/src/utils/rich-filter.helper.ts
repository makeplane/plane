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

// plane imports
import type { TBuildFilterExpressionParams, TExternalFilter, TFilterProperty, TFilterValue } from "@plane/types";
import { LOGICAL_OPERATOR } from "@plane/types";
import { getOperatorForPayload } from "@plane/utils";
// local imports
import { FilterInstance } from "../store/rich-filters/filter";

/**
 * Builds a temporary filter expression from conditions.
 * @param params.conditions - The conditions for building the filter expression.
 * @param params.adapter - The adapter for building the filter expression.
 * @returns The temporary filter expression.
 */
export const buildTempFilterExpressionFromConditions = <
  P extends TFilterProperty,
  V extends TFilterValue,
  E extends TExternalFilter,
>(
  params: TBuildFilterExpressionParams<P, V, E>
): E | undefined => {
  const { conditions, adapter, initialExpression } = params;
  let tempExpression: E | undefined = undefined;
  const tempFilterInstance = new FilterInstance<P, E>({
    initialExpression,
    adapter,
    onExpressionChange: (expression) => {
      tempExpression = expression;
    },
  });
  for (const condition of conditions) {
    const { operator, isNegation } = getOperatorForPayload(condition.operator);
    tempFilterInstance.addCondition(
      LOGICAL_OPERATOR.AND,
      {
        property: condition.property,
        operator,
        value: condition.value,
      },
      isNegation
    );
  }
  return tempExpression;
};
