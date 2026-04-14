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
  SingleOrArray,
  TFilterExpression,
  TFilterProperty,
  TFilterValue,
  TSupportedOperators,
} from "@plane/types";
import { isAndGroupNode, isConditionNode, isNotGroupNode, isOrGroupNode } from "@plane/utils";
import type { TSetExpr, TSetExprCond } from "./set-expr-types";
import { unresolvedCond } from "./set-expr-types";

const normalizeValues = (value: SingleOrArray<TFilterValue>): string[] => {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter((v) => v.length > 0);
  const s = String(value ?? "");
  return s.length > 0 ? [s] : [];
};

const normalizeOperator = (op: TSupportedOperators): TSetExprCond["op"] => {
  if (op === "exact") return "=";
  if (op === "in") return "IN";
  return "UNRESOLVED";
};

export const richFiltersToSetExpr = <P extends TFilterProperty>(node: TFilterExpression<P>): TSetExpr => {
  if (isConditionNode(node)) {
    const field = String(node.property);
    if (field !== "workflow_id" && field !== "state_id" && field !== "state_group") return unresolvedCond();

    const op = normalizeOperator(node.operator);
    if (op === "UNRESOLVED") return unresolvedCond();

    return {
      kind: "cond",
      field,
      op,
      values: normalizeValues(node.value),
    };
  }

  if (isNotGroupNode(node)) {
    return { kind: "not", child: richFiltersToSetExpr(node.child) };
  }

  if (isAndGroupNode(node)) {
    return { kind: "and", children: node.children.map((child) => richFiltersToSetExpr(child)) };
  }

  if (isOrGroupNode(node)) {
    return { kind: "or", children: node.children.map((child) => richFiltersToSetExpr(child)) };
  }

  return unresolvedCond();
};
