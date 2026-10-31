/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { SelectField } from "@makeplane/propel/components/select-field";
import { CALENDAR_KINDS, formatDuration, getReportPeriods } from "@plane/services";
import type { TCalendarKind } from "@plane/types";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { DAY_KIND_META, DayKindDot } from "@/components/team-ops/calendar/work-mode";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUserProfile } from "@/hooks/store/user";
import { useCalendarSettings, useOpsTeams } from "@/hooks/team-ops/use-work-calendar";
import { useDashboard } from "@/hooks/team-ops/use-work-reports";

type Props = { workspaceSlug: string };

const ALL = "all";
const hours = (seconds: number) => (seconds > 0 ? formatDuration(seconds, "en-US") : "–");

function Card({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-subtle bg-surface-1 p-4">
      <p className="text-caption-sm-regular text-tertiary">{label}</p>
      <p className="text-h5-semibold text-primary tabular-nums">{value}</p>
      {hint ? <p className="text-caption-sm-regular text-tertiary">{hint}</p> : null}
    </div>
  );
}

/** One page for managers: where everyone is today, planned against logged time, reports and projects. */
export const DashboardRoot = observer(function DashboardRoot({ workspaceSlug }: Props) {
  const [periodKey, setPeriodKey] = useState("this-week");
  const [teamId, setTeamId] = useState(ALL);
  const { data: profile } = useUserProfile();
  const { permissions } = useCalendarSettings(workspaceSlug);
  const { teams } = useOpsTeams(workspaceSlug);
  const { getUserDetails } = useMember();

  const periods = useMemo(() => getReportPeriods(new Date(), profile?.start_of_the_week ?? 1), [profile]);
  const period = periods.find((item) => item.key === periodKey) ?? periods[0];
  const { dashboard, error } = useDashboard(workspaceSlug, permissions?.can_view_team ?? false, {
    from: period.from,
    to: period.to,
    team: teamId === ALL ? undefined : teamId,
  });

  if (!permissions) return null;
  if (!permissions.can_view_team) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <p className="rounded-lg border border-dashed border-subtle p-4 text-body-sm-regular text-tertiary">
          The dashboard is only open to the people your workspace admins chose. Ask an admin if you need it.
        </p>
      </div>
    );
  }

  const name = (id: string) => getUserDetails(id)?.display_name ?? "Unknown";
  const periodOptions = periods.map((item) => ({ value: item.key, label: item.label }));
  const teamOptions = [
    { value: ALL, label: "All teams" },
    ...(teams ?? []).map((item) => ({ value: item.id, label: item.name })),
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44 [&_button]:min-w-0">
          <SelectField
            size="lg"
            label="Period"
            options={periodOptions}
            value={period.key}
            onValueChange={(value) => setPeriodKey(value ?? "this-week")}
          />
        </div>
        <div className="w-44 [&_button]:min-w-0">
          <SelectField
            size="lg"
            label="Team"
            options={teamOptions}
            value={teamId}
            onValueChange={(value) => setTeamId(value ?? ALL)}
          />
        </div>
        <p className="pb-2 text-caption-sm-regular text-tertiary">
          Plans and reports are what people wrote. Logged time is from Time Tracking. None of it proves presence.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-body-sm-medium text-danger-primary">
          The dashboard could not be loaded. Reload the page to try again.
        </p>
      ) : null}

      {dashboard ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Card label="People" value={dashboard.people_count} />
            <Card label="Planned" value={hours(dashboard.time.planned_seconds)} />
            <Card label="Logged" value={hours(dashboard.time.logged_seconds)} hint="Time Tracking" />
            <Card
              label="Reports submitted"
              value={dashboard.reports.SUBMITTED}
              hint={`${dashboard.reports.DRAFT} drafts`}
            />
            <Card label="Reports missing" value={dashboard.reports.MISSING} />
          </div>

          <section aria-label="Today" className="rounded-lg border border-subtle bg-surface-1 p-4">
            <h2 className="mb-2 text-body-sm-medium text-primary">Today</h2>
            <ul className="grid gap-3 md:grid-cols-3">
              {CALENDAR_KINDS.filter((kind: TCalendarKind) => dashboard.today.counts[kind] > 0).map((kind) => (
                <li key={kind}>
                  <p className="flex items-center gap-2 text-body-xs-medium text-secondary">
                    <DayKindDot kind={kind} />
                    {DAY_KIND_META[kind].label} ({dashboard.today.counts[kind]})
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    <ButtonAvatars showTooltip={false} userIds={dashboard.today.users[kind].slice(0, 6)} size="xs" />
                    <span className="truncate text-caption-sm-regular text-tertiary">
                      {dashboard.today.users[kind].slice(0, 3).map(name).join(", ")}
                    </span>
                  </div>
                </li>
              ))}
              {CALENDAR_KINDS.every((kind) => dashboard.today.counts[kind] === 0) ? (
                <li className="text-body-sm-regular text-tertiary">Nothing is planned for today.</li>
              ) : null}
            </ul>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section aria-label="Plan" className="rounded-lg border border-subtle bg-surface-1 p-4">
              <h2 className="mb-2 text-body-sm-medium text-primary">Plan in this period (days)</h2>
              <ul className="flex flex-col gap-1.5">
                {CALENDAR_KINDS.map((kind) => (
                  <li key={kind} className="flex items-center justify-between text-body-sm-regular">
                    <span className="flex items-center gap-2 text-secondary">
                      <DayKindDot kind={kind} />
                      {DAY_KIND_META[kind].label}
                    </span>
                    <span className="text-primary tabular-nums">{dashboard.plan.counts[kind]}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="Projects" className="rounded-lg border border-subtle bg-surface-1 p-4">
              <h2 className="mb-2 text-body-sm-medium text-primary">Time logged by project</h2>
              {dashboard.projects.length === 0 ? (
                <p className="text-body-sm-regular text-tertiary">No time logged on work items in this period.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {dashboard.projects.map((project) => (
                    <li key={project.id} className="flex items-center justify-between text-body-sm-regular">
                      <span className="truncate text-primary">
                        <span className="text-tertiary">{project.identifier}</span> {project.name}
                      </span>
                      <span className="text-primary tabular-nums">{hours(project.seconds)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section aria-label="Workday" className="rounded-lg border border-subtle bg-surface-1 p-4">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-body-sm-medium text-primary">Finished work (Workday)</h2>
              <p className="text-body-xs-regular text-tertiary">
                {dashboard.workday.finished} finished · {hours(dashboard.workday.seconds)} ·{" "}
                {dashboard.workday.no_document} confirmed without a document · {dashboard.workday.needs_attention}{" "}
                needed attention
              </p>
            </div>
            {dashboard.workday.tasks.length === 0 ? (
              <p className="text-body-sm-regular text-tertiary">No work was finished in this period.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {dashboard.workday.tasks.map((task) => (
                  <li key={task.issue} className="flex items-center justify-between gap-2 text-body-sm-regular">
                    <span className="truncate text-primary">
                      <span className="text-tertiary">{task.key}</span> {task.name}
                    </span>
                    <span className="shrink-0 text-primary tabular-nums">
                      {hours(task.seconds)} · {task.sessions} session(s)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="overflow-x-auto rounded-lg border border-subtle bg-surface-1">
            <table className="w-full min-w-176 text-left">
              <thead className="border-b border-subtle bg-layer-1 text-caption-sm-medium text-tertiary">
                <tr>
                  {[
                    "Person",
                    "Planned",
                    "Logged",
                    "Planned, nothing logged",
                    "Logged with no plan",
                    "Not planned days",
                    "Reports missing",
                  ].map((c) => (
                    <th key={c} scope="col" className="px-3 py-2">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle text-body-sm-regular text-primary">
                {dashboard.people.map((person) => (
                  <tr key={person.user}>
                    <td className="px-3 py-2">{name(person.user)}</td>
                    <td className="px-3 py-2 tabular-nums">{hours(person.planned_seconds)}</td>
                    <td className="px-3 py-2 tabular-nums">{hours(person.logged_seconds)}</td>
                    <td className="px-3 py-2 tabular-nums">{person.flags.PLANNED_NOTHING_LOGGED || "–"}</td>
                    <td className="px-3 py-2 tabular-nums">{person.flags.LOGGED_NOT_PLANNED || "–"}</td>
                    <td className="px-3 py-2 tabular-nums">{person.plan_counts.UNPLANNED || "–"}</td>
                    <td className="px-3 py-2 tabular-nums">{person.missing_reports || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
});
