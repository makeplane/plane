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

import type { ASTNode, ValueNode } from "@plane/editor";
import type { TSetExpr, TSetExprCond } from "./set-expr-types";
import { unresolvedCond } from "./set-expr-types";

const stringValue = (node: ValueNode): string | undefined => {
  if (node.kind !== "string") return undefined;
  return node.value;
};

const stringValues = (nodes: ValueNode[]): string[] | undefined => {
  const values: string[] = [];
  for (const n of nodes) {
    const v = stringValue(n);
    if (v === undefined) return undefined;
    values.push(v);
  }
  return values;
};

const normalizeCond = (field: string, op: TSetExprCond["op"], values: string[]): TSetExprCond => ({
  kind: "cond",
  field,
  op,
  values,
});

export const pqlAstToSetExpr = (node: ASTNode | null): TSetExpr => {
  if (!node) return unresolvedCond();

  switch (node.kind) {
    case "group":
      return pqlAstToSetExpr(node.body);
    case "and":
      return { kind: "and", children: [pqlAstToSetExpr(node.left), pqlAstToSetExpr(node.right)] };
    case "or":
      return { kind: "or", children: [pqlAstToSetExpr(node.left), pqlAstToSetExpr(node.right)] };
    case "not":
      return { kind: "not", child: pqlAstToSetExpr(node.operand) };
    case "comparison": {
      const field = node.field;
      if (node.op !== "=" && node.op !== "!=") return unresolvedCond();
      const v = stringValue(node.value);
      if (v === undefined) return unresolvedCond();
      return normalizeCond(field, node.op, [v]);
    }
    case "in": {
      const field = node.field;

      if (!Array.isArray(node.values)) return unresolvedCond();
      const values = stringValues(node.values);
      if (!values) return unresolvedCond();

      return normalizeCond(field, node.negated ? "NOT_IN" : "IN", values);
    }
    default:
      return unresolvedCond();
  }
};
