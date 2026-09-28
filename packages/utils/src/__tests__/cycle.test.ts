import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { orderCycles } from "../../dist/index.js";

describe("orderCycles", () => {
  it("returns empty array for empty input", () => {
    assert.deepEqual(orderCycles([], false), []);
    assert.deepEqual(orderCycles([], true), []);
  });

  it("filters out status values not in current, upcoming, draft", () => {
    const cycles: any[] = [
      { id: "1", name: "Cycle 1", status: "completed" },
      { id: "2", name: "Cycle 2", status: "current" },
      { id: "3", name: "Cycle 3", status: "archived" },
      { id: "4", name: "Cycle 4", status: "upcoming", start_date: "2023-01-01" },
    ];
    const result = orderCycles(cycles, false);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, "2");
    assert.equal(result[1].id, "4");
  });

  it("sorts by manual sort_order when sortByManual is true", () => {
    const cycles: any[] = [
      { id: "1", name: "Cycle B", status: "current", sort_order: 20 },
      { id: "2", name: "Cycle A", status: "draft", sort_order: 10 },
      { id: "3", name: "Cycle C", status: "upcoming", sort_order: 15 },
    ];
    const result = orderCycles(cycles, true);
    assert.deepEqual(
      result.map((c) => c.id),
      ["2", "3", "1"]
    );
  });

  it("sorts by status order then upcoming start_date or name when sortByManual is false", () => {
    const cycles: any[] = [
      { id: "1", name: "Draft B", status: "draft" },
      { id: "2", name: "Draft A", status: "draft" },
      { id: "3", name: "Upcoming Late", status: "upcoming", start_date: "2023-05-01" },
      { id: "4", name: "Upcoming Early", status: "upcoming", start_date: "2023-01-01" },
      { id: "5", name: "Current 1", status: "current" },
    ];
    const result = orderCycles(cycles, false);
    assert.deepEqual(
      result.map((c) => c.id),
      ["5", "4", "3", "2", "1"]
    );
  });
});
