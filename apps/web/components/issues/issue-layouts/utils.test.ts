/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it, vi } from "vitest";
import type { IState, TIssue, TIssueGroupByOptions } from "@plane/types";
import type { GroupDropLocation, IssueUpdates } from "./utils";
import { getDefaultStateForGroup, handleGroupDragDrop } from "./utils";

const SOURCE_ISSUE_ID = "issue-1";
const PROJECT_ID = "project-1";
const RESOLVED_STATE_ID = "state-started";

const buildIssue = (overrides: Partial<TIssue> = {}): TIssue =>
  ({
    id: SOURCE_ISSUE_ID,
    project_id: PROJECT_ID,
    state_id: "state-backlog",
    state__group: "backlog",
    priority: "low",
    ...overrides,
  }) as TIssue;

const buildSource = (overrides: Partial<GroupDropLocation> = {}): GroupDropLocation => ({
  columnId: "col-backlog",
  groupId: "backlog",
  id: SOURCE_ISSUE_ID,
  ...overrides,
});

const buildDestination = (overrides: Partial<GroupDropLocation> = {}): GroupDropLocation => ({
  columnId: "col-started",
  groupId: "started",
  id: undefined,
  ...overrides,
});

type RunOptions = {
  source?: GroupDropLocation;
  destination?: GroupDropLocation;
  issue?: TIssue;
  groupBy?: TIssueGroupByOptions;
  subGroupBy?: TIssueGroupByOptions;
  destinationIssueIds?: string[];
  getStateIdForStateGroup?: (projectId: string, stateGroup: string) => string | undefined;
};

const runHandleGroupDragDrop = async (options: RunOptions = {}) => {
  const {
    source = buildSource(),
    destination = buildDestination(),
    issue = buildIssue(),
    groupBy = "state_detail.group",
    subGroupBy = undefined,
    destinationIssueIds = [],
    getStateIdForStateGroup = vi.fn(() => RESOLVED_STATE_ID),
  } = options;

  const getIssueById = vi.fn((_issueId: string) => issue);
  const getIssueIds = vi.fn((_groupId?: string, _subGroupId?: string) => destinationIssueIds);
  const updateIssueOnDrop = vi.fn(
    (_projectId: string, _issueId: string, _data: Partial<TIssue>, _issueUpdates: IssueUpdates) => undefined
  );

  let error: unknown;
  try {
    await handleGroupDragDrop(
      source,
      destination,
      getIssueById,
      getIssueIds,
      updateIssueOnDrop,
      groupBy,
      subGroupBy,
      false,
      getStateIdForStateGroup
    );
  } catch (e) {
    error = e;
  }

  return { error, getIssueById, getIssueIds, updateIssueOnDrop, getStateIdForStateGroup };
};

describe("handleGroupDragDrop with state groups", () => {
  it("resolves a concrete state id when dropping into a state-group column", async () => {
    const { error, updateIssueOnDrop, getStateIdForStateGroup } = await runHandleGroupDragDrop();

    expect(error).toBeUndefined();
    expect(getStateIdForStateGroup).toHaveBeenCalledWith(PROJECT_ID, "started");
    expect(updateIssueOnDrop).toHaveBeenCalledTimes(1);
    expect(updateIssueOnDrop).toHaveBeenCalledWith(
      PROJECT_ID,
      SOURCE_ISSUE_ID,
      expect.objectContaining({
        id: SOURCE_ISSUE_ID,
        project_id: PROJECT_ID,
        state_id: RESOLVED_STATE_ID,
        state__group: "started",
      }),
      expect.objectContaining({ state__group: { ADD: ["started"], REMOVE: ["backlog"] } })
    );
  });

  it("throws and skips the update when no state resolves in the destination state group", async () => {
    const { error, updateIssueOnDrop, getStateIdForStateGroup } = await runHandleGroupDragDrop({
      getStateIdForStateGroup: vi.fn(() => undefined),
    });

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Could not find a state in the destination state group");
    expect(getStateIdForStateGroup).toHaveBeenCalledWith(PROJECT_ID, "started");
    expect(updateIssueOnDrop).not.toHaveBeenCalled();
  });

  it("throws and skips the update when the dragged issue has no project", async () => {
    const { error, updateIssueOnDrop, getStateIdForStateGroup } = await runHandleGroupDragDrop({
      issue: buildIssue({ project_id: "" }),
    });

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Could not find a state in the destination state group");
    // without a project there is nothing to resolve against
    expect(getStateIdForStateGroup).not.toHaveBeenCalled();
    expect(updateIssueOnDrop).not.toHaveBeenCalled();
  });

  it("keeps the legacy groupBy key mapping for non-state groups", async () => {
    const { error, updateIssueOnDrop, getStateIdForStateGroup } = await runHandleGroupDragDrop({
      groupBy: "priority",
      source: buildSource({ groupId: "low", columnId: "col-low" }),
      destination: buildDestination({ groupId: "urgent", columnId: "col-urgent" }),
    });

    expect(error).toBeUndefined();
    expect(getStateIdForStateGroup).not.toHaveBeenCalled();
    expect(updateIssueOnDrop).toHaveBeenCalledTimes(1);
    expect(updateIssueOnDrop).toHaveBeenCalledWith(
      PROJECT_ID,
      SOURCE_ISSUE_ID,
      expect.objectContaining({ priority: "urgent" }),
      expect.objectContaining({ priority: { ADD: ["urgent"], REMOVE: ["low"] } })
    );
  });

  it("sets the group value to null when dropping on the None column", async () => {
    const { error, updateIssueOnDrop } = await runHandleGroupDragDrop({
      groupBy: "priority",
      source: buildSource({ groupId: "low", columnId: "col-low" }),
      destination: buildDestination({ groupId: "None", columnId: "col-none" }),
    });

    expect(error).toBeUndefined();
    expect(updateIssueOnDrop).toHaveBeenCalledTimes(1);
    expect(updateIssueOnDrop).toHaveBeenCalledWith(
      PROJECT_ID,
      SOURCE_ISSUE_ID,
      expect.objectContaining({ priority: null }),
      expect.objectContaining({ priority: { ADD: [], REMOVE: ["low"] } })
    );
  });
});

describe("handleGroupDragDrop sub-group handling", () => {
  it("updates project_id when the project sub-group changes", async () => {
    const { error, updateIssueOnDrop } = await runHandleGroupDragDrop({
      subGroupBy: "project",
      source: buildSource({ groupId: "backlog", subGroupId: "project-old" }),
      destination: buildDestination({ groupId: "backlog", subGroupId: "project-new" }),
      issue: buildIssue({ project_id: "project-old" }),
    });

    expect(error).toBeUndefined();
    expect(updateIssueOnDrop).toHaveBeenCalledTimes(1);
    expect(updateIssueOnDrop).toHaveBeenCalledWith(
      "project-old",
      SOURCE_ISSUE_ID,
      expect.objectContaining({ project_id: "project-new" }),
      expect.objectContaining({ project_id: { ADD: ["project-new"], REMOVE: ["project-old"] } })
    );
  });

  it("returns early without touching any callback when a sub-group id is missing", async () => {
    const { error, getIssueById, getIssueIds, updateIssueOnDrop } = await runHandleGroupDragDrop({
      subGroupBy: "project",
      source: buildSource({ groupId: "backlog", subGroupId: undefined }),
      destination: buildDestination({ groupId: "backlog", subGroupId: "project-new" }),
    });

    expect(error).toBeUndefined();
    expect(getIssueById).not.toHaveBeenCalled();
    expect(getIssueIds).not.toHaveBeenCalled();
    expect(updateIssueOnDrop).not.toHaveBeenCalled();
  });
});

describe("getDefaultStateForGroup", () => {
  const buildState = (overrides: Partial<IState>): IState =>
    ({
      id: "state-1",
      name: "State 1",
      color: "#000000",
      group: "started",
      default: false,
      description: "",
      project_id: PROJECT_ID,
      sequence: 1,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      ...overrides,
    }) as IState;

  it("prefers the default state of the group over the other states", () => {
    const states = [
      buildState({ id: "s-started-1", group: "started" }),
      buildState({ id: "s-started-default", group: "started", default: true }),
      buildState({ id: "s-backlog", group: "backlog", default: true }),
    ];

    expect(getDefaultStateForGroup(states, "started")?.id).toBe("s-started-default");
  });

  it("falls back to the first state of the group when none is default", () => {
    const states = [
      buildState({ id: "s-started-1", group: "started" }),
      buildState({ id: "s-started-2", group: "started" }),
      buildState({ id: "s-backlog", group: "backlog" }),
    ];

    expect(getDefaultStateForGroup(states, "started")?.id).toBe("s-started-1");
  });

  it("returns undefined when the project has no state in the group", () => {
    const states = [buildState({ id: "s-backlog", group: "backlog", default: true })];

    expect(getDefaultStateForGroup(states, "started")).toBeUndefined();
  });

  it("returns undefined when the project has no states at all", () => {
    expect(getDefaultStateForGroup([], "started")).toBeUndefined();
  });

  it("returns undefined when the project is not in the cache", () => {
    expect(getDefaultStateForGroup(undefined, "started")).toBeUndefined();
  });
});
