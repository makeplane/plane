/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import type { TIssue } from "@plane/types";
import { getFilteredWorkItems } from "./base-issues-utils";

// These date filters do not need the app store or issue grouping.
vi.mock("@/lib/store-context", () => ({ store: {} }));
vi.mock("./base-issues.store", () => ({}));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("sub-work-item date filters", () => {
  it.each(["start_date", "target_date"] as const)("filters %s on local calendar days west of UTC", (key) => {
    vi.stubEnv("TZ", "America/New_York");
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 11, 12));
    expect(new Date().getTimezoneOffset()).toBe(300);

    const issues = [
      { id: "before", [key]: "2026-11-17" },
      { id: "boundary", [key]: "2026-11-18" },
      { id: "after", [key]: "2026-11-19" },
    ] as TIssue[];

    expect(getFilteredWorkItems(issues, { [key]: ["1_weeks;after;fromnow"] }).map((issue) => issue.id)).toEqual([
      "boundary",
      "after",
    ]);
    expect(getFilteredWorkItems(issues, { [key]: ["1_weeks;before;fromnow"] }).map((issue) => issue.id)).toEqual([
      "before",
      "boundary",
    ]);
  });
});
