/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IState } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import type { GroupDropLocation } from "@/components/issues/issue-layouts/utils";
import { useGroupIssuesDragNDrop } from "./use-group-dragndrop";

const h = vi.hoisted(() => ({
  handleGroupDragDropMock: vi.fn(),
  getProjectStatesMock: vi.fn(),
  getIssueByIdMock: vi.fn(),
  getIssueIdsMock: vi.fn(),
  updateIssueMock: vi.fn(),
  addCycleToIssueMock: vi.fn(),
  removeCycleFromIssueMock: vi.fn(),
  changeModulesInIssueMock: vi.fn(),
}));

vi.mock("@/lib/store-context", () => ({ store: {} }));

vi.mock("next/navigation", () => ({ useParams: () => ({ workspaceSlug: "test-workspace" }) }));

vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

// The drag-drop orchestrator itself is covered by utils.test.ts; here it only acts as the seam
// through which the hook's state resolver is captured and exercised against project fixtures.
// Everything else, including the shared state-group resolver, is the real implementation.
vi.mock(import("@/components/issues/issue-layouts/utils"), async (importOriginal) => ({
  ...(await importOriginal()),
  handleGroupDragDrop: h.handleGroupDragDropMock,
}));

vi.mock("./store/use-issue-detail", () => ({
  useIssueDetail: () => ({ issue: { getIssueById: h.getIssueByIdMock } }),
}));

vi.mock("./store/use-issues", () => ({
  useIssues: () => ({
    issues: {
      getIssueIds: h.getIssueIdsMock,
      addCycleToIssue: h.addCycleToIssueMock,
      removeCycleFromIssue: h.removeCycleFromIssueMock,
      changeModulesInIssue: h.changeModulesInIssueMock,
    },
  }),
}));

vi.mock("./use-issues-actions", () => ({
  useIssuesActions: () => ({ updateIssue: h.updateIssueMock }),
}));

vi.mock("./store/use-project-state", () => ({
  useProjectState: () => ({ getProjectStates: h.getProjectStatesMock }),
}));

const PROJECT_ID = "project-1";

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

let statesFixture: IState[] | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  h.handleGroupDragDropMock.mockImplementation(() => Promise.resolve());
  h.getProjectStatesMock.mockImplementation(() => statesFixture);
  statesFixture = undefined;
});

// Runs a no-op drop through the hook and returns the state-group resolver the hook hands to the
// drag-drop handler (only wired when groupBy is "state_detail.group").
const captureStateResolver = async () => {
  const { result } = renderHook(() =>
    useGroupIssuesDragNDrop(EIssuesStoreType.GLOBAL, "sort_order", "state_detail.group")
  );

  const source: GroupDropLocation = { columnId: "col-a", groupId: "backlog", id: "issue-1" };
  const destination: GroupDropLocation = { columnId: "col-b", groupId: "started", id: undefined };

  await act(async () => {
    await result.current(source, destination);
  });

  expect(h.handleGroupDragDropMock).toHaveBeenCalledTimes(1);
  const resolver = h.handleGroupDragDropMock.mock.calls[0][8] as
    | ((projectId: string, stateGroup: string) => string | undefined)
    | undefined;
  expect(resolver).toBeTypeOf("function");
  return resolver as (projectId: string, stateGroup: string) => string | undefined;
};

describe("getStateIdForStateGroup", () => {
  it("prefers the default state of the destination group over other states", async () => {
    statesFixture = [
      buildState({ id: "s-backlog-default", group: "backlog", default: true }),
      buildState({ id: "s-started-1", group: "started", default: false }),
      buildState({ id: "s-started-2", group: "started", default: true }),
    ];
    const resolve = await captureStateResolver();

    expect(resolve(PROJECT_ID, "started")).toBe("s-started-2");
    expect(h.getProjectStatesMock).toHaveBeenCalledWith(PROJECT_ID);
  });

  it("falls back to the first state of the group when none is default", async () => {
    statesFixture = [
      buildState({ id: "s-started-1", group: "started", default: false }),
      buildState({ id: "s-started-2", group: "started", default: false }),
    ];
    const resolve = await captureStateResolver();

    expect(resolve(PROJECT_ID, "started")).toBe("s-started-1");
  });

  it("returns undefined when the project has states but none in the destination group", async () => {
    statesFixture = [buildState({ id: "s-backlog-1", group: "backlog", default: true })];
    const resolve = await captureStateResolver();

    expect(resolve(PROJECT_ID, "started")).toBeUndefined();
  });

  it("returns undefined when the project has no states at all", async () => {
    statesFixture = [];
    const resolve = await captureStateResolver();

    expect(resolve(PROJECT_ID, "started")).toBeUndefined();
  });

  it("returns undefined when the project is not in the cache", async () => {
    statesFixture = undefined;
    const resolve = await captureStateResolver();

    expect(resolve(PROJECT_ID, "started")).toBeUndefined();
  });
});
