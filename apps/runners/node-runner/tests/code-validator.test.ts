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

import { describe, it, expect } from "vitest";
import { validateCodeSecurity } from "../src/code-validator";

describe("validateCodeSecurity", () => {
  describe("TypeScript syntax support", () => {
    it("accepts function with type annotations", () => {
      const result = validateCodeSecurity(
        `export async function main(input: AutomationEventInput, variables: Record<string, string>) {\n  return { success: true, input };\n}`
      );
      expect(result.valid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it("accepts generic types", () => {
      const result = validateCodeSecurity(`const m: Map<string, number> = new Map();`);
      expect(result.valid).toBe(true);
    });

    it("accepts interface declarations", () => {
      const result = validateCodeSecurity(`interface Foo { bar: string; baz: number; }`);
      expect(result.valid).toBe(true);
    });

    it("accepts type aliases with unions", () => {
      const result = validateCodeSecurity(`type Result = { ok: true; value: string } | { ok: false; error: string };`);
      expect(result.valid).toBe(true);
    });

    it("accepts as const assertions", () => {
      const result = validateCodeSecurity(`const x = { a: 1 } as const;`);
      expect(result.valid).toBe(true);
    });

    it("accepts satisfies operator", () => {
      const result = validateCodeSecurity(`const config = {} satisfies Record<string, unknown>;`);
      expect(result.valid).toBe(true);
    });

    it("accepts enum declarations", () => {
      const result = validateCodeSecurity(`enum Status { Active, Inactive }`);
      expect(result.valid).toBe(true);
    });

    it("accepts non-null assertions", () => {
      const result = validateCodeSecurity(`const el = document.getElementById("app")!;`);
      expect(result.valid).toBe(true);
    });

    it("accepts 'as' type assertions", () => {
      const result = validateCodeSecurity(
        `export async function main(input: AutomationEventInput, variables: Record<string, string>) {\n  const id = input.event.entity_id as string;\n  const num = (input.event.payload.data.count as number) + 1;\n  return { id, num };\n}`
      );
      expect(result.valid).toBe(true);
    });

    it("accepts optional chaining and nullish coalescing", () => {
      const result = validateCodeSecurity(
        `export async function main(input: AutomationEventInput, variables: Record<string, string>) {\n  const name = input.event.payload?.data?.name ?? "unknown";\n  return { name };\n}`
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("blocked patterns", () => {
    it("blocks eval()", () => {
      const result = validateCodeSecurity(`eval("console.log('hi')");`);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("eval"))).toBe(true);
    });

    it("blocks Function constructor", () => {
      const result = validateCodeSecurity(`const fn = Function("return 1");`);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("Function"))).toBe(true);
    });

    it("blocks new Function()", () => {
      const result = validateCodeSecurity(`const fn = new Function("return 1");`);
      expect(result.valid).toBe(false);
    });

    it("blocks require()", () => {
      const result = validateCodeSecurity(`const fs = require("fs");`);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("require"))).toBe(true);
    });

    it("blocks process.exit()", () => {
      const result = validateCodeSecurity(`process.exit(1);`);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("process.exit"))).toBe(true);
    });

    it("blocks __proto__ access", () => {
      const result = validateCodeSecurity(`const p = obj.__proto__;`);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("__proto__"))).toBe(true);
    });

    it("blocks while(true)", () => {
      const result = validateCodeSecurity(`while(true) {}`);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("while(true)"))).toBe(true);
    });

    it("blocks for(;;)", () => {
      const result = validateCodeSecurity(`for(;;) {}`);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("for(;;)"))).toBe(true);
    });

    it("blocks setTimeout with string argument", () => {
      const result = validateCodeSecurity(`setTimeout("alert(1)", 100);`);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("setTimeout"))).toBe(true);
    });

    it("blocks prototype manipulation", () => {
      const result = validateCodeSecurity(`Object.prototype.bad = true;`);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("prototype"))).toBe(true);
    });
  });

  describe("safe patterns", () => {
    it("allows fetch calls", () => {
      const result = validateCodeSecurity(
        `export async function main(input: AutomationEventInput, variables: Record<string, string>) {\n  const res = await fetch("https://api.example.com/data");\n  return await res.json();\n}`
      );
      expect(result.valid).toBe(true);
    });

    it("allows Plane SDK usage", () => {
      const result = validateCodeSecurity(
        `export async function main(input: AutomationEventInput, variables: Record<string, string>) {\n  const item = await Plane.workItems.retrieve(workspaceSlug, "proj-1", "item-1");\n  await Plane.workItems.update(workspaceSlug, "proj-1", "item-1", { state: "done-state-id" });\n  return item;\n}`
      );
      expect(result.valid).toBe(true);
    });

    it("allows Functions library usage", () => {
      const result = validateCodeSecurity(
        `export async function main(input: AutomationEventInput, variables: Record<string, string>) {\n  const children = await Functions.getChildren({ projectId: "p1", workItemId: "w1" });\n  return children;\n}`
      );
      expect(result.valid).toBe(true);
    });

    it("allows setTimeout with function argument", () => {
      const result = validateCodeSecurity(
        `export async function main(input: AutomationEventInput, variables: Record<string, string>) {\n  await new Promise((resolve) => setTimeout(resolve, 100));\n  return { done: true };\n}`
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("real-world system scripts", () => {
    it("accepts the 'mark parent done' system script", () => {
      const code = `
export async function main(input: AutomationEventInput, variables: Record<string, string>) {
  var projectId = input.event.project_id;
  var workItemId = input.event.entity_id;

  var item = await Plane.workItems.retrieve(workspaceSlug, projectId, workItemId);
  if (!item.parent) return { skipped: true, reason: "No parent" };

  var statesResult = await Plane.states.list(workspaceSlug, projectId);
  var states = statesResult.results || statesResult;
  var stateGroupMap = {};
  for (var i = 0; i < states.length; i++) {
    stateGroupMap[states[i].id] = states[i].group;
  }

  if (stateGroupMap[item.state] !== "completed") {
    return { skipped: true, reason: "Current item not in completed state group" };
  }

  var siblings = await Functions.getSiblings({ projectId: projectId, workItemId: workItemId });

  var allDone = siblings.every(function (s) {
    return stateGroupMap[s.state_id] === "completed";
  });

  if (!allDone) {
    return { skipped: true, reason: "Not all siblings are completed" };
  }

  var completedState = states.find(function (s) {
    return s.group === "completed";
  });

  await Plane.workItems.update(workspaceSlug, projectId, item.parent, {
    state: completedState.id,
  });

  return { updated: true, parentId: item.parent, stateId: completedState.id };
}`;
      const result = validateCodeSecurity(code);
      expect(result.valid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it("accepts the 'create linked work item' system script", () => {
      const code = `
export async function main(input: AutomationEventInput, variables: Record<string, string>) {
  var sourceProjectId = variables.sourceProjectId;
  var sourceProjectStateName = variables.sourceProjectStateName;
  var destinationProjectId = variables.destinationProjectId;
  var projectId = input.event.project_id;
  var workItemId = input.event.entity_id;

  if (projectId !== sourceProjectId) {
    return { skipped: true, reason: "Not in source project" };
  }

  var statesResult = await Plane.states.list(workspaceSlug, sourceProjectId);
  var states = statesResult.results || statesResult;
  var targetState = states.find(function (s) {
    return s.name.toLowerCase() === sourceProjectStateName.toLowerCase();
  });
  if (!targetState) {
    return { skipped: true, reason: "State not found: " + sourceProjectStateName };
  }

  var item = await Plane.workItems.retrieve(workspaceSlug, sourceProjectId, workItemId);
  if (item.state !== targetState.id) {
    return { skipped: true, reason: "Work item not in target state" };
  }

  var newItem = await Plane.workItems.create(workspaceSlug, destinationProjectId, {
    name: item.name,
    description_html: item.description_html,
    priority: item.priority,
  });

  await Plane.workItems.relations.create(workspaceSlug, sourceProjectId, workItemId, {
    relation_type: "relates_to",
    issues: [newItem.id],
  });

  return { created: true, newWorkItemId: newItem.id, destinationProjectId: destinationProjectId };
}`;
      const result = validateCodeSecurity(code);
      expect(result.valid).toBe(true);
      expect(result.violations).toEqual([]);
    });
  });
});
