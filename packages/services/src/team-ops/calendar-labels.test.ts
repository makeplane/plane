/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCalendarAudit, TCalendarDay } from "@plane/types";
import { describe, expect, it } from "vitest";
import { buildOptimisticDay, getPlannedSeconds, summarizeAuditChange } from "./calendar-labels";

const baseDay: TCalendarDay = {
  date: "2027-01-04",
  mode: null,
  source: "NONE",
  planned_start_time: null,
  planned_end_time: null,
  planned_seconds: 0,
  description: "",
  leave_type: null,
  holiday: "New Year",
  is_working_day: false,
  is_unplanned: false,
  entry: null,
};

const audit = (overrides: Partial<TCalendarAudit>): TCalendarAudit => ({
  id: "a1",
  subject_user: "u1",
  work_date: "2027-01-04",
  entity: "ENTRY",
  action: "CREATE",
  old_value: null,
  new_value: null,
  changed_by: "u2",
  created_at: "2027-01-03T10:00:00Z",
  ...overrides,
});

describe("getPlannedSeconds", () => {
  it("measures the window in seconds", () => {
    expect(getPlannedSeconds("09:00", "17:30")).toBe(8.5 * 3600);
  });

  it("is zero without both times or when they are out of order", () => {
    expect(getPlannedSeconds(null, "17:00")).toBe(0);
    expect(getPlannedSeconds("09:00", undefined)).toBe(0);
    expect(getPlannedSeconds("17:00", "09:00")).toBe(0);
  });
});

describe("buildOptimisticDay", () => {
  it("shows the saved plan as a day set by hand and keeps what the server owns", () => {
    const day = buildOptimisticDay(baseDay, {
      work_mode: "REMOTE",
      planned_start_time: "10:00",
      planned_end_time: "18:00",
      description: "  Planning  ",
    });

    expect(day).toMatchObject({
      mode: "REMOTE",
      source: "MANUAL",
      planned_seconds: 8 * 3600,
      description: "Planning",
      leave_type: null,
      holiday: "New Year",
      is_working_day: false,
      is_unplanned: false,
    });
  });

  it("defaults a leave day to the other type and drops the leave type from other modes", () => {
    expect(buildOptimisticDay(baseDay, { work_mode: "LEAVE" }).leave_type).toBe("OTHER");
    expect(buildOptimisticDay(baseDay, { work_mode: "LEAVE", leave_type: "SICK" }).leave_type).toBe("SICK");
    expect(buildOptimisticDay(baseDay, { work_mode: "OFF", leave_type: "SICK" }).leave_type).toBeNull();
  });

  it("clears what the payload leaves out", () => {
    const filled = { ...baseDay, planned_start_time: "09:00", planned_end_time: "17:00", description: "x" };

    const day = buildOptimisticDay(filled, { work_mode: "OFF" });

    expect(day.planned_start_time).toBeNull();
    expect(day.description).toBe("");
    expect(day.planned_seconds).toBe(0);
  });
});

describe("summarizeAuditChange", () => {
  it("describes entry creations, changes and removals", () => {
    expect(
      summarizeAuditChange(
        audit({ new_value: { work_mode: "ONSITE", planned_start_time: "09:00", planned_end_time: "17:00" } })
      )
    ).toBe("Set to Onsite 09:00 – 17:00");

    expect(
      summarizeAuditChange(
        audit({
          action: "UPDATE",
          old_value: { work_mode: "ONSITE", planned_start_time: "09:00", planned_end_time: "17:00" },
          new_value: { work_mode: "REMOTE" },
        })
      )
    ).toBe("Changed from Onsite 09:00 – 17:00 to Remote");

    expect(summarizeAuditChange(audit({ action: "DELETE", old_value: { work_mode: "OFF" } }))).toBe("Removed Day off");
    expect(
      summarizeAuditChange(
        audit({ action: "DELETE", old_value: { work_mode: "OFF" }, new_value: { work_mode: "REMOTE" } })
      )
    ).toBe("Removed Day off, back to Remote from the weekly plan");
  });

  it("describes the other kinds of change", () => {
    expect(summarizeAuditChange(audit({ entity: "TEMPLATE", action: "CREATE" }))).toBe("Created the weekly plan");
    expect(summarizeAuditChange(audit({ entity: "TEMPLATE", action: "UPDATE" }))).toBe("Changed the weekly plan");
    expect(summarizeAuditChange(audit({ entity: "TEMPLATE", action: "DELETE" }))).toBe("Removed the weekly plan");
    expect(summarizeAuditChange(audit({ entity: "HOLIDAY", action: "CREATE" }))).toBe("Added a holiday");
    expect(summarizeAuditChange(audit({ entity: "HOLIDAY", action: "DELETE" }))).toBe("Removed a holiday");
    expect(summarizeAuditChange(audit({ entity: "SETTINGS", action: "UPDATE" }))).toBe("Changed the calendar settings");
    expect(summarizeAuditChange(audit({ entity: "TEAM", action: "CREATE" }))).toBe("Created a team");
  });
});
