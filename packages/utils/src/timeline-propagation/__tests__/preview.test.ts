/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TTimelinePropagationWorkItem } from "@plane/types";
import { describe, expect, it } from "vitest";

import {
  applyServerWorkItems,
  computeLoadedPreview,
  diffHiddenUpdate,
  type LoadedGraphEdge,
  type LoadedWorkItem,
} from "../preview";

describe("computeLoadedPreview (TEST-19 / FE-01 / FE-02)", () => {
  it("simple: rightward move pushes a single loaded successor", () => {
    const items_by_id: Record<string, LoadedWorkItem> = {
      "wi-A": { id: "wi-A", start_date: "2026-05-04", target_date: "2026-05-08" },
      "wi-B": { id: "wi-B", start_date: "2026-05-09", target_date: "2026-05-13" },
    };
    const edges: LoadedGraphEdge[] = [{ predecessor_id: "wi-A", successor_id: "wi-B" }];

    // Drag A 5 days right → A: May 9-13; B was adjacent (May 9), now violates → push to May 14-18 (duration preserved = 4 non-inclusive days).
    const preview = computeLoadedPreview(edges, items_by_id, {
      id: "wi-A",
      original_start_date: "2026-05-04",
      original_target_date: "2026-05-08",
      requested_start_date: "2026-05-09",
      requested_target_date: "2026-05-13",
    });

    expect(preview.get("wi-A")).toEqual({ start_date: "2026-05-09", target_date: "2026-05-13" });
    expect(preview.get("wi-B")).toEqual({ start_date: "2026-05-14", target_date: "2026-05-18" });
    expect(preview.size).toBe(2);
  });

  it("chain: transitive walk pushes A → B → C through the loaded subset", () => {
    const items_by_id: Record<string, LoadedWorkItem> = {
      "wi-A": { id: "wi-A", start_date: "2026-05-04", target_date: "2026-05-08" },
      "wi-B": { id: "wi-B", start_date: "2026-05-09", target_date: "2026-05-13" },
      "wi-C": { id: "wi-C", start_date: "2026-05-14", target_date: "2026-05-18" },
    };
    const edges: LoadedGraphEdge[] = [
      { predecessor_id: "wi-A", successor_id: "wi-B" },
      { predecessor_id: "wi-B", successor_id: "wi-C" },
    ];

    const preview = computeLoadedPreview(edges, items_by_id, {
      id: "wi-A",
      original_start_date: "2026-05-04",
      original_target_date: "2026-05-08",
      requested_start_date: "2026-05-09",
      requested_target_date: "2026-05-13",
    });

    expect(preview.get("wi-A")).toEqual({ start_date: "2026-05-09", target_date: "2026-05-13" });
    expect(preview.get("wi-B")).toEqual({ start_date: "2026-05-14", target_date: "2026-05-18" });
    expect(preview.get("wi-C")).toEqual({ start_date: "2026-05-19", target_date: "2026-05-23" });
    expect(preview.size).toBe(3);
  });

  it("branch: most-restrictive boundary wins when a successor has multiple loaded predecessors", () => {
    // wi-D has two loaded predecessors: wi-A (drags right) and wi-B (does not move).
    // Give wi-B a LATER target so it dominates the most-restrictive max.
    const items_by_id: Record<string, LoadedWorkItem> = {
      "wi-A": { id: "wi-A", start_date: "2026-05-04", target_date: "2026-05-08" },
      "wi-B": { id: "wi-B", start_date: "2026-05-10", target_date: "2026-05-15" },
      "wi-D": { id: "wi-D", start_date: "2026-05-09", target_date: "2026-05-15" },
    };
    const edges: LoadedGraphEdge[] = [
      { predecessor_id: "wi-A", successor_id: "wi-D" },
      { predecessor_id: "wi-B", successor_id: "wi-D" },
    ];

    // Drag A 5 days right (May 9-13). wi-D's new floor = max(A.new_target + 1, B.target + 1) = max(May 14, May 16) = May 16.
    const preview = computeLoadedPreview(edges, items_by_id, {
      id: "wi-A",
      original_start_date: "2026-05-04",
      original_target_date: "2026-05-08",
      requested_start_date: "2026-05-09",
      requested_target_date: "2026-05-13",
    });

    expect(preview.get("wi-A")).toEqual({ start_date: "2026-05-09", target_date: "2026-05-13" });
    // wi-D duration (non-inclusive diff) = 6 days; newTarget = May 16 + 6 = May 22.
    expect(preview.get("wi-D")).toEqual({ start_date: "2026-05-16", target_date: "2026-05-22" });
    expect(preview.size).toBe(2);
  });

  it("working-day duration: dragged and successor targets skip weekends", () => {
    const items_by_id: Record<string, LoadedWorkItem> = {
      "wi-A": {
        id: "wi-A",
        start_date: "2026-05-07",
        target_date: "2026-05-08",
        planned_duration_working_days: 2,
      },
      "wi-B": {
        id: "wi-B",
        start_date: "2026-05-11",
        target_date: "2026-05-12",
        planned_duration_working_days: 2,
      },
    };
    const edges: LoadedGraphEdge[] = [{ predecessor_id: "wi-A", successor_id: "wi-B" }];

    const preview = computeLoadedPreview(edges, items_by_id, {
      id: "wi-A",
      original_start_date: "2026-05-07",
      original_target_date: "2026-05-08",
      requested_start_date: "2026-05-08",
      requested_target_date: "2026-05-09",
    });

    expect(preview.get("wi-A")).toEqual({ start_date: "2026-05-08", target_date: "2026-05-11" });
    expect(preview.get("wi-B")).toEqual({ start_date: "2026-05-12", target_date: "2026-05-13" });
  });

  it("backward: duration-managed predecessor derives start via working days (Python parity)", () => {
    const items_by_id: Record<string, LoadedWorkItem> = {
      "wi-A": {
        id: "wi-A",
        start_date: "2026-05-07",
        target_date: "2026-05-08",
        planned_duration_working_days: 2,
      },
      "wi-B": { id: "wi-B", start_date: "2026-05-11", target_date: "2026-05-12" },
    };
    const edges: LoadedGraphEdge[] = [{ predecessor_id: "wi-A", successor_id: "wi-B" }];

    const preview = computeLoadedPreview(edges, items_by_id, {
      id: "wi-B",
      original_start_date: "2026-05-11",
      original_target_date: "2026-05-12",
      requested_start_date: "2026-05-08",
      requested_target_date: "2026-05-09",
    });

    // Mirrors test_duration_managed_predecessor_preserves_working_duration_when_pulled_left.
    expect(preview.get("wi-A")).toEqual({ start_date: "2026-05-06", target_date: "2026-05-07" });
  });

  it("backward: weekend required target snaps to Friday for duration-managed predecessor", () => {
    const items_by_id: Record<string, LoadedWorkItem> = {
      "wi-A": {
        id: "wi-A",
        start_date: "2026-01-12",
        target_date: "2026-01-16",
        planned_duration_working_days: 5,
      },
      "wi-B": { id: "wi-B", start_date: "2026-01-19", target_date: "2026-01-23" },
    };
    const edges: LoadedGraphEdge[] = [{ predecessor_id: "wi-A", successor_id: "wi-B" }];

    const preview = computeLoadedPreview(edges, items_by_id, {
      id: "wi-B",
      original_start_date: "2026-01-19",
      original_target_date: "2026-01-23",
      requested_start_date: "2026-01-12",
      requested_target_date: "2026-01-16",
    });

    // Mirrors test_backward_weekend_required_target_snaps_to_friday_for_duration_item:
    // candidate target Jan 11 (Sun) → Friday Jan 9; start = subtract 5 working days.
    expect(preview.get("wi-A")).toEqual({ start_date: "2026-01-05", target_date: "2026-01-09" });
  });

  it("dragged: weekend requested start derives target from next Monday", () => {
    const items_by_id: Record<string, LoadedWorkItem> = {
      "wi-A": {
        id: "wi-A",
        start_date: "2026-01-05",
        target_date: "2026-01-05",
        planned_duration_working_days: 1,
      },
    };

    const preview = computeLoadedPreview([], items_by_id, {
      id: "wi-A",
      original_start_date: "2026-01-05",
      original_target_date: "2026-01-05",
      requested_start_date: "2026-01-10", // Saturday
      requested_target_date: "2026-01-10",
    });

    expect(preview.get("wi-A")).toEqual({ start_date: "2026-01-10", target_date: "2026-01-12" });
  });

  it("incomplete loaded data: silently skips successors not in items_by_id (server is authoritative; D-04a)", () => {
    const items_by_id: Record<string, LoadedWorkItem> = {
      "wi-A": { id: "wi-A", start_date: "2026-05-04", target_date: "2026-05-08" },
      // wi-B is referenced by an edge but NOT in items_by_id → must be skipped silently.
    };
    const edges: LoadedGraphEdge[] = [{ predecessor_id: "wi-A", successor_id: "wi-B" }];

    const preview = computeLoadedPreview(edges, items_by_id, {
      id: "wi-A",
      original_start_date: "2026-05-04",
      original_target_date: "2026-05-08",
      requested_start_date: "2026-05-09",
      requested_target_date: "2026-05-13",
    });

    expect(preview.get("wi-A")).toEqual({ start_date: "2026-05-09", target_date: "2026-05-13" });
    expect(preview.has("wi-B")).toBe(false);
    expect(preview.size).toBe(1);
  });

  it("immutability (D-04c): inputs are not mutated", () => {
    const items_by_id: Record<string, LoadedWorkItem> = {
      "wi-A": { id: "wi-A", start_date: "2026-05-04", target_date: "2026-05-08" },
      "wi-B": { id: "wi-B", start_date: "2026-05-09", target_date: "2026-05-13" },
    };
    const edges: LoadedGraphEdge[] = [{ predecessor_id: "wi-A", successor_id: "wi-B" }];
    const itemsSnapshot = JSON.parse(JSON.stringify(items_by_id));
    const edgesSnapshot = JSON.parse(JSON.stringify(edges));

    computeLoadedPreview(edges, items_by_id, {
      id: "wi-A",
      original_start_date: "2026-05-04",
      original_target_date: "2026-05-08",
      requested_start_date: "2026-05-09",
      requested_target_date: "2026-05-13",
    });

    expect(items_by_id).toEqual(itemsSnapshot);
    expect(edges).toEqual(edgesSnapshot);
  });
});

describe("applyServerWorkItems (TEST-21 / FE-04)", () => {
  it("server work_items REPLACE existing dates+updated_at on every matched id", () => {
    const current = {
      "wi-A": {
        id: "wi-A",
        start_date: "2026-05-04",
        target_date: "2026-05-08",
        updated_at: "2026-05-04T00:00:00Z",
        name: "A",
      },
      "wi-B": {
        id: "wi-B",
        start_date: "2026-05-09",
        target_date: "2026-05-13",
        updated_at: "2026-05-04T00:00:00Z",
        name: "B",
      },
    };
    const server: TTimelinePropagationWorkItem[] = [
      { id: "wi-A", start_date: "2026-05-09", target_date: "2026-05-13", updated_at: "2026-05-04T12:00:00.000000Z" },
      { id: "wi-B", start_date: "2026-05-14", target_date: "2026-05-18", updated_at: "2026-05-04T12:00:00.000000Z" },
    ];

    const next = applyServerWorkItems(current, server);

    expect(next["wi-A"]).toEqual({
      id: "wi-A",
      start_date: "2026-05-09",
      target_date: "2026-05-13",
      updated_at: "2026-05-04T12:00:00.000000Z",
      name: "A",
    });
    expect(next["wi-B"]).toEqual({
      id: "wi-B",
      start_date: "2026-05-14",
      target_date: "2026-05-18",
      updated_at: "2026-05-04T12:00:00.000000Z",
      name: "B",
    });
  });

  it("server work_items not present in current map are NOT inserted (hidden updates surface via diffHiddenUpdate, D-05e)", () => {
    const current = {
      "wi-A": { id: "wi-A", start_date: "2026-05-04", target_date: "2026-05-08", updated_at: "2026-05-04T00:00:00Z" },
    };
    const server: TTimelinePropagationWorkItem[] = [
      { id: "wi-A", start_date: "2026-05-09", target_date: "2026-05-13", updated_at: "2026-05-04T12:00:00.000000Z" },
      { id: "wi-Z", start_date: "2026-05-20", target_date: "2026-05-25", updated_at: "2026-05-04T12:00:00.000000Z" },
    ];

    const next = applyServerWorkItems(current, server);

    expect(next["wi-A"].start_date).toBe("2026-05-09");
    expect(next["wi-Z"]).toBeUndefined();
    expect(Object.keys(next)).toEqual(["wi-A"]);
  });

  it("merges planned_duration_working_days only when the server row carries the key", () => {
    const current = {
      "wi-A": {
        id: "wi-A",
        start_date: "2026-05-04",
        target_date: "2026-05-08",
        planned_duration_working_days: 5,
        updated_at: "2026-05-04T00:00:00Z",
      },
    };

    const withKey = applyServerWorkItems(current, [
      {
        id: "wi-A",
        start_date: "2026-05-07",
        target_date: "2026-05-13",
        planned_duration_working_days: 4,
        updated_at: "2026-05-05T00:00:00Z",
      },
    ]);
    expect(withKey["wi-A"].planned_duration_working_days).toBe(4);

    const withoutKey = applyServerWorkItems(current, [
      {
        id: "wi-A",
        start_date: "2026-05-07",
        target_date: "2026-05-13",
        updated_at: "2026-05-05T00:00:00Z",
      },
    ]);
    expect(withoutKey["wi-A"].planned_duration_working_days).toBe(5);
    expect(withoutKey["wi-A"].start_date).toBe("2026-05-07");
  });

  it("immutability (D-04c): does not mutate the input current snapshot or server array", () => {
    const current = {
      "wi-A": { id: "wi-A", start_date: "2026-05-04", target_date: "2026-05-08", updated_at: "2026-05-04T00:00:00Z" },
    };
    const server: TTimelinePropagationWorkItem[] = [
      { id: "wi-A", start_date: "2026-05-09", target_date: "2026-05-13", updated_at: "2026-05-04T12:00:00.000000Z" },
    ];
    const currentSnapshot = JSON.parse(JSON.stringify(current));
    const serverSnapshot = JSON.parse(JSON.stringify(server));

    const next = applyServerWorkItems(current, server);

    expect(current).toEqual(currentSnapshot);
    expect(server).toEqual(serverSnapshot);
    // Returned value is a new object reference.
    expect(next).not.toBe(current);
    expect(next["wi-A"]).not.toBe(current["wi-A"]);
  });
});

describe("diffHiddenUpdate (TEST-22 / FE-06)", () => {
  it("counts server work_items not present in preview ids", () => {
    const server: TTimelinePropagationWorkItem[] = [
      { id: "wi-A", start_date: "2026-05-09", target_date: "2026-05-13", updated_at: "x" },
      { id: "wi-B", start_date: "2026-05-14", target_date: "2026-05-18", updated_at: "x" },
      { id: "wi-Z", start_date: "2026-05-20", target_date: "2026-05-25", updated_at: "x" },
    ];
    const previewIds = new Set<string>(["wi-A", "wi-B"]);

    expect(diffHiddenUpdate(server, previewIds)).toBe(1);
  });

  it("returns 0 when every server work_item is in the preview", () => {
    const server: TTimelinePropagationWorkItem[] = [
      { id: "wi-A", start_date: "2026-05-09", target_date: "2026-05-13", updated_at: "x" },
    ];
    const previewIds = new Set<string>(["wi-A", "wi-B"]);
    expect(diffHiddenUpdate(server, previewIds)).toBe(0);
  });

  it("returns server.length when preview is empty", () => {
    const server: TTimelinePropagationWorkItem[] = [
      { id: "wi-A", start_date: "2026-05-09", target_date: "2026-05-13", updated_at: "x" },
      { id: "wi-B", start_date: "2026-05-14", target_date: "2026-05-18", updated_at: "x" },
    ];
    expect(diffHiddenUpdate(server, new Set())).toBe(2);
  });
});
