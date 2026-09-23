/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sortable } from "./sortable";

type TDragData = Record<string | symbol, unknown>;
type TMonitorArgs = {
  canMonitor: (args: { source: { data: TDragData } }) => boolean;
  onDrop: (args: {
    source: { data: TDragData };
    location: { current: { dropTargets: { data: TDragData }[] } };
  }) => void;
};

// Records what `Sortable` and its `Draggable`s register on the element adapter, so the tests can drive the monitor.
const adapter = vi.hoisted(() => ({ monitors: [] as TMonitorArgs[], draggableCount: 0 }));

vi.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  monitorForElements: (args: TMonitorArgs) => {
    adapter.monitors.push(args);
    return () => undefined;
  },
  draggable: () => {
    adapter.draggableCount += 1;
    return () => undefined;
  },
  dropTargetForElements: () => () => undefined,
}));

type TItem = { key: string; label: string };

const items: TItem[] = [
  { key: "a", label: "A" },
  { key: "b", label: "B" },
  { key: "c", label: "C" },
];

const renderList = (onChange = vi.fn()) => {
  render(
    <Sortable
      data={items}
      id="list"
      keyExtractor={(item) => item.key}
      onChange={onChange}
      render={(item) => item.label}
    />
  );
  const monitor = adapter.monitors.at(-1);
  if (!monitor) throw new Error("Sortable registered no drop monitor");
  return { monitor, onChange };
};

describe("Sortable", () => {
  beforeEach(() => {
    adapter.monitors = [];
    adapter.draggableCount = 0;
  });

  it("registers one draggable per row and a drop monitor", () => {
    renderList();
    expect(adapter.draggableCount).toBe(items.length);
    expect(adapter.monitors.length).toBeGreaterThan(0);
  });

  it("only monitors drags that started in its own list", () => {
    const { monitor } = renderList();
    expect(monitor.canMonitor({ source: { data: { ...items[0], __uuid__: "list" } } })).toBe(true);
    expect(monitor.canMonitor({ source: { data: { ...items[0], __uuid__: "other-list" } } })).toBe(false);
    expect(monitor.canMonitor({ source: { data: { isExternal: true } } })).toBe(false);
  });

  it("moves the dragged row to the drop edge and reports the moved item", () => {
    const { monitor, onChange } = renderList();
    monitor.onDrop({
      source: { data: { ...items[0], __uuid__: "list" } },
      location: {
        current: { dropTargets: [{ data: { ...items[2], __uuid__: "list", [Symbol("closestEdge")]: "bottom" } }] },
      },
    });
    expect(onChange).toHaveBeenCalledWith([items[1], items[2], items[0]], items[0]);
  });

  it("does nothing when the row is dropped outside every target", () => {
    const { monitor, onChange } = renderList();
    monitor.onDrop({
      source: { data: { ...items[0], __uuid__: "list" } },
      location: { current: { dropTargets: [] } },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps its registrations across re-renders with fresh inline callbacks", () => {
    const renderWith = (onChange: (data: TItem[], movedItem?: TItem) => void) => (
      <Sortable
        data={items}
        id="list"
        keyExtractor={(item) => item.key}
        onChange={onChange}
        onExternalAdd={() => undefined}
        render={(item) => item.label}
      />
    );
    const firstOnChange = vi.fn();
    const { rerender } = render(renderWith(firstOnChange));
    const monitorCount = adapter.monitors.length;

    const latestOnChange = vi.fn();
    rerender(renderWith(latestOnChange));

    expect(adapter.draggableCount).toBe(items.length);
    expect(adapter.monitors.length).toBe(monitorCount);

    // The monitor registered on the first render still reaches the latest `onChange`.
    adapter.monitors.at(-1)?.onDrop({
      source: { data: { ...items[0], __uuid__: "list" } },
      location: {
        current: { dropTargets: [{ data: { ...items[1], __uuid__: "list", [Symbol("closestEdge")]: "bottom" } }] },
      },
    });
    expect(firstOnChange).not.toHaveBeenCalled();
    expect(latestOnChange).toHaveBeenCalledWith([items[1], items[0], items[2]], items[0]);
  });
});
