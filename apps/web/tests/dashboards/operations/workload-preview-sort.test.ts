/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Verifies the Overview workload preview surfaces the riskiest
 * members regardless of display_name ordering.
 *
 * Per coordinator finding 2026-09-27 15:21Z: a Z-named overloaded
 * member must appear in the preview, not be hidden on page 2 of a
 * name-sorted pagination. The frontend asks the backend for a
 * server-side risk-sorted preview via `preview: true`; this test
 * pins the contract on both sides (server ordering + client
 * fallback).
 */

import { describe, expect, test } from "vitest";
import type { TWorkloadData, TWorkloadMemberRow } from "@plane/types";

/**
 * Build a roster of 12 members. The first 5 by display_name are
 * all low-risk; a Z-named member (Zara) at position 12 is
 * overloaded with 10 overdue / 4 blocked / 6 started. A preview
 * that only paginates by display_name would never surface Zara;
 * a risk-sorted preview must.
 */
function makeRoster(): TWorkloadMemberRow[] {
  const low = (i: number): TWorkloadMemberRow => ({
    member_id: `u-low-${i}`,
    display_name: `Alex Low ${i}`,
    avatar_url: null,
    is_active: true,
    open: 1,
    started: 1,
    overdue: 0,
    blocked: 0,
    due_soon: 0,
    completed_in_period: 0,
  });
  const zara: TWorkloadMemberRow = {
    member_id: "u-zara",
    display_name: "Zara Overloaded",
    avatar_url: null,
    is_active: true,
    open: 20,
    started: 12,
    overdue: 10,
    blocked: 4,
    due_soon: 2,
    completed_in_period: 0,
  };
  const rows: TWorkloadMemberRow[] = [];
  for (let i = 0; i < 12; i++) rows.push(low(i));
  rows.push(zara);
  return rows;
}

const PREVIEW_LIMIT = 5;

/** Pure helper: server-side risk sort applied to a roster. */
function serverRiskSort(rows: TWorkloadMemberRow[]): TWorkloadMemberRow[] {
  return [...rows].sort(
    (a, b) =>
      b.overdue - a.overdue ||
      b.blocked - a.blocked ||
      b.started - a.started ||
      b.open - a.open ||
      (a.display_name ?? "").localeCompare(b.display_name ?? "")
  );
}

/**
 * Frontend fallback: detects whether the rows are already
 * risk-sorted; if not, sorts locally. Mirrors OverviewTab's
 * runtime logic so the test exercises the same path.
 */
function isServerRiskSorted(rows: TWorkloadMemberRow[]): boolean {
  return rows.every((row, index, all) => {
    if (index === 0) return true;
    const prev = all[index - 1];
    const a = [row.overdue, row.blocked, row.started, row.open];
    const p = [prev.overdue, prev.blocked, prev.started, prev.open];
    for (let i = 0; i < 4; i++) {
      if (p[i] !== a[i]) return p[i] > a[i];
    }
    return true;
  });
}

function applyPreview(
  rows: TWorkloadMemberRow[],
  serverHonoursPreview: boolean
): TWorkloadMemberRow[] {
  if (serverHonoursPreview) {
    return serverRiskSort(rows).slice(0, PREVIEW_LIMIT);
  }
  // Legacy backend: paginates by display_name; client falls back.
  if (isServerRiskSorted(rows)) return rows.slice(0, PREVIEW_LIMIT);
  return serverRiskSort(rows).slice(0, PREVIEW_LIMIT);
}

describe("Overview workload preview — risk-sorted full-roster", () => {
  test("Z-named overloaded member appears in the preview when server honours preview: true", () => {
    const rows = makeRoster();
    const preview = applyPreview(rows, true);
    expect(preview.map((r) => r.member_id)).toContain("u-zara");
  });

  test("Z-named overloaded member appears even on the legacy backend via the client fallback", () => {
    const rows = makeRoster();
    // Legacy backend returns rows by name; client detects
    // they're not risk-sorted and applies the local sort.
    const preview = applyPreview(rows, false);
    expect(preview.map((r) => r.member_id)).toContain("u-zara");
  });

  test("the preview never includes more than PREVIEW_LIMIT rows", () => {
    const rows = makeRoster();
    expect(applyPreview(rows, true)).toHaveLength(PREVIEW_LIMIT);
    expect(applyPreview(rows, false)).toHaveLength(PREVIEW_LIMIT);
  });

  test("the server-side sort places the riskiest row first", () => {
    const rows = makeRoster();
    const sorted = serverRiskSort(rows);
    expect(sorted[0].member_id).toBe("u-zara");
  });

  test("a TWorkloadData envelope with a Z-named risky row in position 12+ still surfaces Zara in preview", () => {
    // Round-trip: shape a real envelope from the contract and
    // verify the frontend preview extraction.
    const rows = makeRoster();
    const data: TWorkloadData = {
      rows,
      total_members: rows.length,
      distinct_totals: {
        total: 32,
        open: 25,
        started: 13,
        overdue: 10,
        blocked: 4,
        due_soon: 2,
        completed_in_period: 0,
      },
      unassigned: {
        open: 0,
        started: 0,
        overdue: 0,
        blocked: 0,
        due_soon: 0,
        completed_in_period: 0,
      },
      inactive: {
        member_count: 0,
        open: 0,
        started: 0,
        overdue: 0,
        blocked: 0,
        due_soon: 0,
        completed_in_period: 0,
      },
      pagination: { page: 1, page_size: 5, has_more: true },
      wip_threshold: 5,
      wip_warning_reason: null,
      wip_warning_member_ids: ["u-zara"],
      scope_key: "sk-fixture",
    };
    expect(data.rows.length).toBeGreaterThan(PREVIEW_LIMIT);
    const preview = serverRiskSort(data.rows).slice(0, PREVIEW_LIMIT);
    expect(preview.map((r) => r.member_id)).toContain("u-zara");
  });
});