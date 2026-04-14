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

import type { TSetExpr, TSetExprCond } from "./set-expr-types";

const intersectInto = (target: Set<string>, other: Set<string>): Set<string> => {
  for (const value of target) {
    if (!other.has(value)) target.delete(value);
  }
  return target;
};

const unionInto = (target: Set<string>, other: Set<string>): Set<string> => {
  for (const value of other) target.add(value);
  return target;
};

const complement = (universe: Set<string>, subset: Set<string>): Set<string> => {
  const out = new Set<string>();
  for (const value of universe) {
    if (!subset.has(value)) out.add(value);
  }
  return out;
};

export const evaluateSetExpr = (
  expr: TSetExpr,
  universe: Set<string>,
  resolveCond: (cond: TSetExprCond, universe: Set<string>) => Set<string>
): Set<string> => {
  switch (expr.kind) {
    case "cond":
      return resolveCond(expr, universe);
    case "not":
      return complement(universe, evaluateSetExpr(expr.child, universe, resolveCond));
    case "and": {
      // Intersection identity is universe.
      const out = new Set<string>(universe);
      for (const child of expr.children) {
        intersectInto(out, evaluateSetExpr(child, universe, resolveCond));
        if (out.size === 0) return out;
      }
      return out;
    }
    case "or": {
      // Union identity is empty.
      const out = new Set<string>();
      for (const child of expr.children) {
        unionInto(out, evaluateSetExpr(child, universe, resolveCond));
        if (out.size === universe.size) return out;
      }
      return out;
    }
  }
};
