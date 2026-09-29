/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, test, vi } from "vitest";

import { WorkflowStore } from "@/store/workflow.store";

const makeStore = (toggle: { get: () => Promise<any>; set: (value: boolean) => Promise<any> }) => {
  const store = new WorkflowStore({ router: { projectId: "p-1" } } as any);
  store.workflowService.getWorkflowToggle = vi.fn(toggle.get);
  store.workflowService.setWorkflowToggle = vi.fn(toggle.set);
  return store;
};

describe("project-level workflow toggle — §7.1, §23.1", () => {
  test("an unread project is undefined, not a guessed default", () => {
    const store = makeStore({
      get: async () => ({ workflow_enabled: true }),
      set: async (workflow_enabled) => ({ workflow_enabled }),
    });

    expect(store.workflowEnabledMap["p-1"]).toBeUndefined();
    expect(store.workflowToggleFetchedMap["p-1"]).toBeFalsy();
  });

  test("reads the persisted value, including a disabled project", async () => {
    const store = makeStore({
      get: async () => ({ workflow_enabled: false }),
      set: async (workflow_enabled) => ({ workflow_enabled }),
    });

    expect(await store.fetchWorkflowToggle("acme", "p-1")).toBe(false);
    expect(store.workflowEnabledMap["p-1"]).toBe(false);
    expect(store.workflowToggleFetchedMap["p-1"]).toBe(true);
  });

  test("renders the value the server stored, not the value requested", async () => {
    // The endpoint is the only source of truth — a coerced body must win.
    const store = makeStore({
      get: async () => ({ workflow_enabled: false }),
      set: async () => ({ workflow_enabled: false }),
    });

    expect(await store.setWorkflowToggle("acme", "p-1", true)).toBe(false);
    expect(store.workflowEnabledMap["p-1"]).toBe(false);
  });

  test("a rejected write leaves the switch on its previous value", async () => {
    const store = makeStore({
      get: async () => ({ workflow_enabled: true }),
      set: async () => ({ workflow_enabled: true }),
    });
    await store.fetchWorkflowToggle("acme", "p-1");

    store.workflowService.setWorkflowToggle = vi.fn(async () => {
      throw { detail: "Project does not exist" };
    });

    await expect(store.setWorkflowToggle("acme", "p-1", false)).rejects.toMatchObject({
      detail: "Project does not exist",
    });
    expect(store.workflowEnabledMap["p-1"]).toBe(true);
  });

  test("keeps the switch scoped per project", async () => {
    const store = makeStore({
      get: async () => ({ workflow_enabled: false }),
      set: async (workflow_enabled) => ({ workflow_enabled }),
    });

    await store.fetchWorkflowToggle("acme", "p-1");

    expect(store.workflowEnabledMap["p-2"]).toBeUndefined();
  });
});
