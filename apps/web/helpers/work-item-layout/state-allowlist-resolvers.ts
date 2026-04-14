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

import type { TSetExprCond } from "./set-expr-types";

type TWorkflowLike = {
  stateIds: string[];
};

type TResolverCtx = {
  getWorkflowById: (workflowId: string) => TWorkflowLike | undefined;
  stateIdsByGroup?: ReadonlyMap<string, ReadonlySet<string>>;
};

const unionOf = (sets: Array<Set<string>>): Set<string> => {
  const out = new Set<string>();
  sets.forEach((s) => {
    for (const v of s) out.add(v);
  });
  return out;
};

export const createStateIdResolver = (ctx: TResolverCtx) => {
  return (cond: TSetExprCond, universe: Set<string>): Set<string> => {
    if (cond.field === "__unresolved__" || cond.op === "UNRESOLVED") return universe;

    if (cond.field === "state" || cond.field === "state_id") {
      const set = new Set(cond.values);
      if (cond.op === "=" || cond.op === "IN") return set;
      if (cond.op === "!=" || cond.op === "NOT_IN") {
        const out = new Set<string>();
        for (const v of universe) if (!set.has(v)) out.add(v);
        return out;
      }
      return universe;
    }

    if (cond.field === "workflow" || cond.field === "workflow_id") {
      const workflowSets = cond.values
        .map((id) => ctx.getWorkflowById(id))
        .filter((w): w is TWorkflowLike => !!w)
        .map((w) => new Set(w.stateIds));

      const states = unionOf(workflowSets);
      if (cond.op === "=" || cond.op === "IN") return states;
      if (cond.op === "!=" || cond.op === "NOT_IN") {
        const out = new Set<string>();
        for (const v of universe) if (!states.has(v)) out.add(v);
        return out;
      }
      return universe;
    }

    if (cond.field === "stateGroup" || cond.field === "state_group") {
      if (!ctx.stateIdsByGroup) return universe;

      const groupSets = cond.values
        .map((key) => ctx.stateIdsByGroup?.get(key))
        .filter((s): s is ReadonlySet<string> => !!s)
        .map((s) => new Set<string>(s));

      const states = unionOf(groupSets);
      if (cond.op === "=" || cond.op === "IN") return states;
      if (cond.op === "!=" || cond.op === "NOT_IN") {
        const out = new Set<string>();
        for (const v of universe) if (!states.has(v)) out.add(v);
        return out;
      }
      return universe;
    }

    return universe;
  };
};
