/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkCalendarService } from "./work-calendar.service";

const SLUG = "acme";
const BASE = "/api/workspaces/acme/team-ops";

describe("WorkCalendarService", () => {
  let service: WorkCalendarService;

  beforeEach(() => {
    service = new WorkCalendarService("http://api.test");
  });

  it("reads the policy and the caller's rights", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { settings: {}, permissions: {} } } as never);

    await expect(service.getSettings(SLUG)).resolves.toEqual({ settings: {}, permissions: {} });

    expect(get).toHaveBeenCalledWith(`${BASE}/calendar/settings/`);
  });

  it("updates the policy with a PUT", async () => {
    const put = vi.spyOn(service, "put").mockResolvedValue({ data: { settings: {} } } as never);

    await service.updateSettings(SLUG, { member_edit_past_days: 3 });

    expect(put).toHaveBeenCalledWith(`${BASE}/calendar/settings/`, { member_edit_past_days: 3 });
  });

  it("manages holidays", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: [] } as never);
    const post = vi.spyOn(service, "post").mockResolvedValue({ data: { id: "h1" } } as never);
    const del = vi.spyOn(service, "delete").mockResolvedValue({ data: undefined } as never);

    await service.listHolidays(SLUG, { from: "2027-01-01", to: "2027-12-31" });
    await service.createHoliday(SLUG, { date: "2027-01-01", name: "New Year" });
    await expect(service.deleteHoliday(SLUG, "h1")).resolves.toBeUndefined();

    expect(get).toHaveBeenCalledWith(`${BASE}/calendar/holidays/`, {
      params: { from: "2027-01-01", to: "2027-12-31" },
    });
    expect(post).toHaveBeenCalledWith(`${BASE}/calendar/holidays/`, { date: "2027-01-01", name: "New Year" });
    expect(del).toHaveBeenCalledWith(`${BASE}/calendar/holidays/h1/`);
  });

  it("manages teams", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: [{ id: "t1" }] } as never);
    const post = vi.spyOn(service, "post").mockResolvedValue({ data: { id: "t1" } } as never);
    const patch = vi.spyOn(service, "patch").mockResolvedValue({ data: { id: "t1" } } as never);
    const del = vi.spyOn(service, "delete").mockResolvedValue({ data: undefined } as never);

    await expect(service.listTeams(SLUG)).resolves.toEqual([{ id: "t1" }]);
    await service.createTeam(SLUG, { name: "Platform", members: [{ user: "u1", role: "LEAD" }] });
    await service.updateTeam(SLUG, "t1", { name: "Infra" });
    await service.deleteTeam(SLUG, "t1");

    expect(get).toHaveBeenCalledWith(`${BASE}/teams/`);
    expect(post).toHaveBeenCalledWith(`${BASE}/teams/`, { name: "Platform", members: [{ user: "u1", role: "LEAD" }] });
    expect(patch).toHaveBeenCalledWith(`${BASE}/teams/t1/`, { name: "Infra" });
    expect(del).toHaveBeenCalledWith(`${BASE}/teams/t1/`);
  });

  it("asks for a range of days, optionally for another person", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { days: [] } } as never);

    await service.getDays(SLUG, { from: "2027-01-04", to: "2027-01-10", user: "u2" });

    expect(get).toHaveBeenCalledWith(`${BASE}/calendar/entries/`, {
      params: { from: "2027-01-04", to: "2027-01-10", user: "u2" },
    });
  });

  it("saves a day on its date url", async () => {
    const put = vi.spyOn(service, "put").mockResolvedValue({ data: { date: "2027-01-04" } } as never);

    await expect(service.saveDay(SLUG, "2027-01-04", { work_mode: "REMOTE" })).resolves.toEqual({
      date: "2027-01-04",
    });

    expect(put).toHaveBeenCalledWith(`${BASE}/calendar/entries/2027-01-04/`, { work_mode: "REMOTE" });
  });

  it("resets a day, naming the person only when given", async () => {
    const del = vi.spyOn(service, "delete").mockResolvedValue({ data: { mode: null } } as never);

    await service.resetDay(SLUG, "2027-01-04");
    await service.resetDay(SLUG, "2027-01-04", "u2");

    expect(del).toHaveBeenNthCalledWith(1, `${BASE}/calendar/entries/2027-01-04/`, undefined, { params: {} });
    expect(del).toHaveBeenNthCalledWith(2, `${BASE}/calendar/entries/2027-01-04/`, undefined, {
      params: { user: "u2" },
    });
  });

  it("applies one plan to many days", async () => {
    const post = vi
      .spyOn(service, "post")
      .mockResolvedValue({ data: { created: 2, updated: 0, unchanged: 0, skipped_dates: [] } } as never);

    const result = await service.applyToDays(SLUG, { work_mode: "OFF", dates: ["2027-01-04", "2027-01-05"] });

    expect(result.created).toBe(2);
    expect(post).toHaveBeenCalledWith(`${BASE}/calendar/entries/bulk/`, {
      work_mode: "OFF",
      dates: ["2027-01-04", "2027-01-05"],
    });
  });

  it("reads the team view and one day of it with the filters", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { days: [], rows: [] } } as never);

    await service.getTeamCalendar(SLUG, { from: "2027-01-01", to: "2027-01-31", team: "t1", mode: "REMOTE" });
    await service.getTeamDay(SLUG, "2027-01-04", { project: "p1" });
    await service.getTeamDay(SLUG, "2027-01-04");

    expect(get).toHaveBeenNthCalledWith(1, `${BASE}/calendar/team/`, {
      params: { from: "2027-01-01", to: "2027-01-31", team: "t1", mode: "REMOTE" },
    });
    expect(get).toHaveBeenNthCalledWith(2, `${BASE}/calendar/team/day/2027-01-04/`, { params: { project: "p1" } });
    expect(get).toHaveBeenNthCalledWith(3, `${BASE}/calendar/team/day/2027-01-04/`, { params: undefined });
  });

  it("reads the reports and exports them as a csv blob", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { people: [] } } as never);
    const params = { from: "2027-01-01", to: "2027-01-31", team: "t1" };

    await service.getPlanSummary(SLUG, params);
    await service.getPlannedVsLogged(SLUG, params);
    get.mockResolvedValueOnce({ data: new Blob(["a"]) } as never);
    await expect(service.exportReport(SLUG, "plan-summary", params)).resolves.toBeInstanceOf(Blob);

    expect(get).toHaveBeenNthCalledWith(1, `${BASE}/calendar/reports/plan-summary/`, { params });
    expect(get).toHaveBeenNthCalledWith(2, `${BASE}/calendar/reports/planned-vs-logged/`, { params });
    expect(get).toHaveBeenNthCalledWith(
      3,
      `${BASE}/calendar/reports/plan-summary/`,
      { params: { ...params, export: "csv" } },
      { responseType: "blob" }
    );
  });

  it("reads and replaces the weekly plan", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { days: [] } } as never);
    const put = vi.spyOn(service, "put").mockResolvedValue({ data: { days: [] } } as never);

    await service.getWeeklyPlan(SLUG);
    await service.getWeeklyPlan(SLUG, "u2");
    await service.saveWeeklyPlan(SLUG, { days: [] });

    expect(get).toHaveBeenNthCalledWith(1, `${BASE}/calendar/template/`, { params: {} });
    expect(get).toHaveBeenNthCalledWith(2, `${BASE}/calendar/template/`, { params: { user: "u2" } });
    expect(put).toHaveBeenCalledWith(`${BASE}/calendar/template/`, { days: [] });
  });

  it("lists the change history with filters", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { results: [] } } as never);

    await service.listAudit(SLUG, { user: "u1", from: "2027-01-01", to: "2027-01-31", entity: "ENTRY" });

    expect(get).toHaveBeenCalledWith(`${BASE}/calendar/audit/`, {
      params: { user: "u1", from: "2027-01-01", to: "2027-01-31", entity: "ENTRY" },
    });
  });

  it("rethrows the server's error body", async () => {
    vi.spyOn(service, "put").mockRejectedValue({ response: { data: { error: "no" } } });

    await expect(service.saveDay(SLUG, "2027-01-04", { work_mode: "OFF" })).rejects.toEqual({ error: "no" });
  });
});
