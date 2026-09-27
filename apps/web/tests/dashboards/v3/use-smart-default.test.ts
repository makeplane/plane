/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// Shared mock factory: the second test needs a different role per call, and
// `vi.doMock` does not hoist and would leak state once the user module is
// already imported, so we route the user hook through a mutable factory.
const useUserMock = vi.fn();
vi.mock("@/hooks/store/user", () => ({
  useUser: () => useUserMock(),
}));

vi.mock("@/hooks/store/use-workspace", () => ({
  useWorkspace: () => ({ currentWorkspace: { id: "ws-1", slug: "acme" } }),
}));

import { useDashboardSmartDefault } from "@/components/dashboards/v3/use-smart-default";
import { dashboardPreferencesStore } from "@/store/dashboard-preferences.store";

describe("useDashboardSmartDefault", () => {
  beforeEach(() => {
    useUserMock.mockReturnValue({ data: { id: "user-1", role: 15 } });
    dashboardPreferencesStore.setIdentity("ws-1", "user-1");
    dashboardPreferencesStore.reset();
  });

  test("MEMBER + no persisted scope → personal + assignees=[me]", () => {
    renderHook(() => useDashboardSmartDefault());
    expect(dashboardPreferencesStore.getViewMode()).toBe("personal");
    expect(dashboardPreferencesStore.getGlobalScope().filters.assignees).toEqual(["user-1"]);
  });

  test("ADMIN + no persisted scope → team + no assignee filter", () => {
    useUserMock.mockReturnValue({ data: { id: "user-1", role: 20 } });
    renderHook(() => useDashboardSmartDefault());
    expect(dashboardPreferencesStore.getViewMode()).toBe("team");
    expect(dashboardPreferencesStore.getGlobalScope().filters.assignees).toBeUndefined();
  });

  test("persisted scope exists → hook does not overwrite", () => {
    dashboardPreferencesStore.setViewMode("team");
    dashboardPreferencesStore.setGlobalScope({ filters: { assignees: ["user-99"] } });
    renderHook(() => useDashboardSmartDefault());
    expect(dashboardPreferencesStore.getGlobalScope().filters.assignees).toEqual(["user-99"]);
  });
});
