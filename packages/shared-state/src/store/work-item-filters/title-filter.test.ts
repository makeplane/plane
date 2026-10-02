/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import type { TWorkItemFilterExpression, TWorkItemFilterProperty } from "@plane/types";
import { CORE_OPERATORS, CORE_TEXT_OPERATOR, LOGICAL_OPERATOR } from "@plane/types";
import { getTitleFilterConfig } from "@plane/utils";
import { FilterInstance } from "../rich-filters/filter";
import { workItemFiltersAdapter } from "./adapter";

function createFilter(initialExpression: TWorkItemFilterExpression = {}) {
  const changes: TWorkItemFilterExpression[] = [];
  const saved: TWorkItemFilterExpression[] = [];
  const filter = new FilterInstance({
    adapter: workItemFiltersAdapter,
    initialExpression,
    onExpressionChange: (expression) => changes.push(expression),
    options: {
      expression: {
        saveViewOptions: {
          onViewSave: (expression) => {
            saved.push(expression);
          },
        },
      },
    },
  });
  filter.configManager.registerAll([
    getTitleFilterConfig<TWorkItemFilterProperty>("name")({
      isEnabled: true,
      allowedOperators: new Set(Object.values(CORE_OPERATORS)),
    }),
  ]);
  filter.configManager.setAreConfigsReady(true);
  return { filter, changes, saved };
}

describe("Title rich filter", () => {
  it("keeps punctuation in a saved scalar title and restores it alongside existing filters", async () => {
    const { filter, changes, saved } = createFilter({ priority__in: "high,urgent" });
    const config = filter.configManager.getConfigByProperty("name");
    expect(config?.firstOperator).toBe(CORE_TEXT_OPERATOR.ICONTAINS);
    filter.addCondition(
      LOGICAL_OPERATOR.AND,
      { property: "name", operator: config!.firstOperator!, value: undefined },
      false
    );
    expect(changes).toEqual([]);
    const title = filter.findFirstConditionByPropertyAndOperator("name", CORE_TEXT_OPERATOR.ICONTAINS)!;
    filter.updateConditionValue(title.id, "Login, SSO & 50%_done");
    const expected = { and: [{ priority__in: "high,urgent" }, { name__icontains: "Login, SSO & 50%_done" }] };
    expect(changes).toEqual([expected]);
    await filter.saveView();
    expect(saved).toEqual([expected]);
    const restored = createFilter(JSON.parse(JSON.stringify(saved[0]))).filter;
    expect(restored.hasChanges).toBe(false);
    expect(restored.findFirstConditionByPropertyAndOperator("name", CORE_TEXT_OPERATOR.ICONTAINS)?.value).toBe(
      "Login, SSO & 50%_done"
    );
    expect(workItemFiltersAdapter.toExternal(restored.expression!)).toEqual(expected);
  });

  it("edits and removes the restored title without dropping the other AND conditions", () => {
    const { filter, changes } = createFilter({ and: [{ name__icontains: "login" }, { state_group__in: "started" }] });
    const title = filter.findFirstConditionByPropertyAndOperator("name", CORE_TEXT_OPERATOR.ICONTAINS)!;
    filter.updateConditionValue(title.id, "payment");
    expect(changes.at(-1)).toEqual({ and: [{ name__icontains: "payment" }, { state_group__in: "started" }] });
    filter.removeCondition(title.id);
    expect(changes.at(-1)).toEqual({ state_group__in: "started" });
    expect(filter.findFirstConditionByPropertyAndOperator("name", CORE_TEXT_OPERATOR.ICONTAINS)).toBeUndefined();
  });

  it("clears the final title condition when its committed value is empty", () => {
    const { filter, changes } = createFilter({ name__icontains: "login" });
    const title = filter.findFirstConditionByPropertyAndOperator("name", CORE_TEXT_OPERATOR.ICONTAINS)!;
    filter.updateConditionValue(title.id, null);
    expect(changes).toEqual([{}]);
    expect(filter.hasActiveFilters).toBe(false);
    expect(filter.canSaveView).toBe(false);
  });
});
