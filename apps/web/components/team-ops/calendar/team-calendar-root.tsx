/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Dialog, DialogContent } from "@makeplane/propel/components/dialog";
import { SelectField } from "@makeplane/propel/components/select-field";
import { ChevronLeftOutline, ChevronRightOutline } from "@makeplane/propel/icons";
import {
  CALENDAR_KINDS,
  PLAN_NOTICE,
  getMonthGrid,
  isEditableDate,
  parseDateKey,
  shiftMonths,
  toDateKey,
} from "@plane/services";
import type { TKindCounts } from "@plane/services";
import type { TCalendarDayPayload, TCalendarKind, TTeamDayFilters, TTeamDayRow } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserProfile } from "@/hooks/store/user";
import {
  saveDayForUser,
  useCalendarSettings,
  useOpsTeams,
  useTeamCalendar,
  useTeamDay,
} from "@/hooks/team-ops/use-work-calendar";
// local imports
import { EditPersonDayDialog } from "./edit-person-day-dialog";
import { TeamDayTable } from "./team-day-table";
import { TeamMonthGrid } from "./team-month-grid";
import { TeamSidePanel } from "./team-side-panel";
import { DAY_KIND_META } from "./work-mode";

type Props = {
  workspaceSlug: string;
};

const ALL = "all";
const monthFormat = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const emptyTotals = (): TKindCounts => ({ ONSITE: 0, REMOTE: 0, OFF: 0, LEAVE: 0, HOLIDAY: 0, UNPLANNED: 0 });

export const TeamCalendarRoot = observer(function TeamCalendarRoot({ workspaceSlug }: Props) {
  // states
  const [reference, setReference] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [teamId, setTeamId] = useState(ALL);
  const [projectId, setProjectId] = useState(ALL);
  const [mode, setMode] = useState(ALL);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [editingRow, setEditingRow] = useState<TTeamDayRow | null>(null);
  // refs
  const detailRef = useRef<HTMLDivElement>(null);
  // hooks
  const { data: userProfile } = useUserProfile();
  const { permissions } = useCalendarSettings(workspaceSlug);
  const { teams } = useOpsTeams(workspaceSlug);
  const { joinedProjectIds, getPartialProjectById } = useProject();

  const weekStart = userProfile?.start_of_the_week ?? 1;
  const grid = useMemo(() => getMonthGrid(reference, weekStart), [reference, weekStart]);
  const canView = permissions?.can_view_team ?? false;

  const filters: TTeamDayFilters = useMemo(
    () => ({
      team: teamId === ALL ? undefined : teamId,
      project: projectId === ALL ? undefined : projectId,
      mode: mode === ALL ? undefined : (mode as TCalendarKind),
      user: userId,
    }),
    [teamId, projectId, mode, userId]
  );
  const {
    team,
    error,
    isLoading,
    refresh: refreshTeam,
  } = useTeamCalendar({
    workspaceSlug,
    enabled: canView,
    from: grid.from,
    to: grid.to,
    filters,
  });
  const {
    day: dayDetail,
    isLoading: isDayLoading,
    refresh: refreshDay,
  } = useTeamDay(workspaceSlug, canView, selected, filters);

  // Changing other people's plans is up to the policy; the server checks it again on every save.
  const canEditSelected =
    !!permissions?.can_edit_others && !!selected && isEditableDate(selected, permissions.earliest_editable_date);

  const handleSaveOther = async (payload: TCalendarDayPayload) => {
    if (!editingRow || !selected) return;
    await saveDayForUser(workspaceSlug, editingRow.user, selected, payload);
    await Promise.all([refreshTeam(), refreshDay()]);
  };

  const dayMap = useMemo(() => Object.fromEntries((team?.days ?? []).map((day) => [day.date, day])), [team]);
  const monthDays = useMemo(
    () => (team?.days ?? []).filter((day) => parseDateKey(day.date).getMonth() === grid.month),
    [team, grid.month]
  );
  // Totals for the month on screen, not for the padding days of the neighbouring months.
  const monthTotals = useMemo(() => {
    const totals = emptyTotals();
    for (const day of monthDays) for (const kind of CALENDAR_KINDS) totals[kind] += day.counts[kind];
    return totals;
  }, [monthDays]);

  // When the detail sits below the grid (narrow screens) a selected day would otherwise open out of sight.
  useEffect(() => {
    if (selected) detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  const today = toDateKey(new Date());
  const teamOptions = [
    { value: ALL, label: "All teams" },
    ...(teams ?? []).map((item) => ({ value: item.id, label: item.name })),
  ];
  const projectOptions = [
    { value: ALL, label: "All projects" },
    ...joinedProjectIds.map((id) => ({ value: id, label: getPartialProjectById(id)?.name ?? id })),
  ];
  const modeOptions = [
    { value: ALL, label: "All plans" },
    ...CALENDAR_KINDS.map((kind) => ({ value: kind, label: DAY_KIND_META[kind].label })),
  ];

  if (!permissions) return null;
  if (!canView) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <p className="rounded-lg border border-dashed border-subtle p-4 text-body-sm-regular text-tertiary">
          The team calendar is only open to the people your workspace admins chose. Ask an admin if you need it.
        </p>
      </div>
    );
  }

  const move = (direction: -1 | 1) => {
    setSelected(null);
    setReference((current) => shiftMonths(current, direction));
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-6">
      <p className="text-caption-sm-regular text-tertiary">{PLAN_NOTICE}</p>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-1">
          <IconButton
            icon={<Icon icon={ChevronLeftOutline} />}
            variant="ghost"
            size="sm"
            aria-label="Previous month"
            onClick={() => move(-1)}
          />
          <h2 className="min-w-44 text-center text-body-sm-medium text-primary">{monthFormat.format(reference)}</h2>
          <IconButton
            icon={<Icon icon={ChevronRightOutline} />}
            variant="ghost"
            size="sm"
            aria-label="Next month"
            onClick={() => move(1)}
          />
          <Button
            variant="ghost"
            size="sm"
            stretch="auto"
            label="Today"
            onClick={() => {
              setSelected(null);
              setReference(new Date());
            }}
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-44 [&_button]:min-w-0">
            <SelectField
              size="lg"
              label="Team"
              options={teamOptions}
              value={teamId}
              onValueChange={(value) => setTeamId(value ?? ALL)}
            />
          </div>
          <div className="w-44 [&_button]:min-w-0">
            <SelectField
              size="lg"
              label="Project"
              options={projectOptions}
              value={projectId}
              onValueChange={(value) => setProjectId(value ?? ALL)}
            />
          </div>
          <div className="w-40 [&_button]:min-w-0">
            <SelectField
              size="lg"
              label="Plan"
              options={modeOptions}
              value={mode}
              onValueChange={(value) => setMode(value ?? ALL)}
            />
          </div>
          {userId ? (
            <Button
              variant="secondary"
              size="sm"
              stretch="auto"
              label="Show everyone"
              onClick={() => setUserId(undefined)}
            />
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-body-sm-medium text-danger-primary">
          The team calendar could not be loaded. Reload the page to try again.
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <div aria-busy={isLoading} className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <TeamMonthGrid grid={grid} days={dayMap} today={today} selected={selected} onSelect={setSelected} />
          </div>
          <div ref={detailRef}>
            {selected ? (
              <TeamDayTable
                workspaceSlug={workspaceSlug}
                day={dayDetail}
                isLoading={isDayLoading}
                onEdit={canEditSelected ? setEditingRow : undefined}
              />
            ) : (
              <p className="rounded-lg border border-dashed border-subtle p-4 text-body-sm-regular text-tertiary">
                Select a day to see everyone&rsquo;s plan next to the time they logged.
              </p>
            )}
          </div>
        </div>
        <aside>
          <TeamSidePanel
            days={monthDays}
            totals={monthTotals}
            userIds={team?.users ?? []}
            selectedUserId={userId}
            onSelectUser={setUserId}
          />
        </aside>
      </div>

      <Dialog open={!!editingRow} disablePointerDismissal onOpenChange={(open) => !open && setEditingRow(null)}>
        <DialogContent size="md">
          {editingRow && selected ? (
            <EditPersonDayDialog
              key={`${editingRow.user}_${selected}`}
              workspaceSlug={workspaceSlug}
              date={selected}
              row={editingRow}
              onSave={handleSaveOther}
              onClose={() => setEditingRow(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
});
