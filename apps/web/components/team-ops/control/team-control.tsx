/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Badge } from "@makeplane/propel/components/badge";
import { Button } from "@makeplane/propel/components/button";
import { InputField } from "@makeplane/propel/components/input-field";
import { SelectField } from "@makeplane/propel/components/select-field";
import { setToast } from "@plane/blocks/toast";
import { WorkdayService, controlRange, formatHm, toDateKey } from "@plane/services";
import type { TControlPreset } from "@plane/services";
import type { TControlRow } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { controlService, useControlTeam, useInterruptions } from "@/hooks/team-ops/use-control";
import { useOpsTeams } from "@/hooks/team-ops/use-work-calendar";
// components
import { getErrorMessage } from "../calendar/error-message";
import { ContributionGraph } from "../workday/contribution-graph";
import { SessionsList } from "../workday/sessions-list";
import { TimeByTask } from "../workday/time-by-task";

const workdayService = new WorkdayService();

type Props = { workspaceSlug: string };

const PRESETS: { value: TControlPreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const STATE: Record<TControlRow["state"], { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  RUNNING: { label: "Working", variant: "success" },
  BREAK: { label: "On a break", variant: "warning" },
  FROZEN: { label: "Frozen", variant: "danger" },
  DONE: { label: "Finished", variant: "neutral" },
  IDLE: { label: "Not working", variant: "neutral" },
};

type SortKey = "name" | "worked" | "frozen" | "unplanned";

const clock = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const Tile = ({ label, value, tone }: { label: string; value: string; tone?: "warn" | "bad" }) => (
  <div className="flex min-w-32 flex-1 flex-col rounded-lg border border-subtle bg-surface-1 px-4 py-3">
    <span className="text-caption-sm-regular text-tertiary">{label}</span>
    <span
      className={cn(
        "text-h4-medium tabular-nums",
        tone === "bad" ? "text-danger-primary" : tone === "warn" ? "text-warning-primary" : "text-primary"
      )}
    >
      {value}
    </span>
  </div>
);

/** One person in detail: their year, their finished work, their time by task, and their pauses and freezes. */
function PersonDetail({
  workspaceSlug,
  row,
  from,
  to,
  onClose,
}: {
  workspaceSlug: string;
  row: TControlRow;
  from: string;
  to: string;
  onClose: () => void;
}) {
  const userId = row.user.id;
  const { data: sessions } = useSWR(`TEAM_OPS_CONTROL_SESSIONS_${workspaceSlug}_${userId}_${from}_${to}`, () =>
    workdayService.listSessions(workspaceSlug, { user: userId, from, to })
  );
  const { data: tasks } = useSWR(`TEAM_OPS_CONTROL_TASKS_${workspaceSlug}_${userId}_${from}_${to}`, () =>
    workdayService.listTasks(workspaceSlug, { user: userId, from, to })
  );
  const { interruptions } = useInterruptions(workspaceSlug, { from, to, user: userId }, true);

  return (
    <section
      aria-label={`Details of ${row.user.display_name}`}
      className="flex flex-col gap-4 rounded-lg border border-accent-strong bg-surface-1 p-4"
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-body-md-medium text-primary">{row.user.display_name}</h3>
        <button type="button" className="text-body-xs-medium text-accent-primary hover:underline" onClick={onClose}>
          Close
        </button>
      </header>
      <ContributionGraph workspaceSlug={workspaceSlug} userId={userId} />
      <div className="grid gap-4 lg:grid-cols-2">
        <TimeByTask title="Time by task" tasks={tasks} />
        <section className="flex flex-col gap-2 rounded-lg border border-subtle p-4">
          <h4 className="text-body-md-medium text-primary">Pauses and freezes</h4>
          {(interruptions ?? []).length === 0 ? (
            <p className="text-body-sm-regular text-tertiary">None in this period.</p>
          ) : (
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
              {(interruptions ?? []).map((item, index) => (
                <li
                  key={`${item.started_at}-${index}`}
                  className={cn(
                    "text-body-xs-regular",
                    item.kind === "FREEZE" ? "text-danger-primary" : "text-secondary"
                  )}
                >
                  {item.kind === "FREEZE" ? "Frozen" : "Rest pause"} · {clock.format(new Date(item.started_at))} ·{" "}
                  {formatHm(item.seconds)}
                  {item.work_item ? ` · ${item.work_item}` : ""}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <section className="flex flex-col gap-2">
        <h4 className="text-body-md-medium text-primary">Finished work</h4>
        <SessionsList sessions={sessions ?? []} showDay />
      </section>
    </section>
  );
}

/** Everyone's tasks and hours: who works now, where, for how long, who froze, who has not planned the week. */
export const TeamControl = observer(function TeamControl({ workspaceSlug }: Props) {
  // states
  const [preset, setPreset] = useState<TControlPreset>("week");
  const [teamId, setTeamId] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [selected, setSelected] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  // hooks
  const { teams } = useOpsTeams(workspaceSlug);
  const range = useMemo(() => controlRange(preset, toDateKey(new Date())), [preset]);
  const params = { ...range, team: teamId === "all" ? undefined : teamId };
  const { team, error, isLoading } = useControlTeam(workspaceSlug, params, true);
  const { interruptions: freezes } = useInterruptions(workspaceSlug, { ...params, kind: "FREEZE" }, true);

  const rows = useMemo(() => {
    const filtered = (team?.results ?? []).filter((row) =>
      row.user.display_name.toLowerCase().includes(search.trim().toLowerCase())
    );
    const order: Record<SortKey, (row: TControlRow) => number | string> = {
      name: (row) => row.user.display_name.toLowerCase(),
      worked: (row) => -row.period.seconds,
      frozen: (row) => -row.period.frozen_seconds,
      unplanned: (row) => -row.unplanned_days,
    };
    return [...filtered].sort((a, b) =>
      order[sort](a) < order[sort](b) ? -1 : order[sort](a) > order[sort](b) ? 1 : 0
    );
  }, [team, search, sort]);
  const open = rows.find((row) => row.user.id === selected) ?? null;

  const exportCsv = async () => {
    setIsExporting(true);
    try {
      const blob = await controlService.exportTeam(workspaceSlug, params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `team-control-${range.from}-${range.to}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (failure) {
      setToast({ type: "error", title: "Could not export", message: getErrorMessage(failure) });
    } finally {
      setIsExporting(false);
    }
  };

  const totals = team?.totals;
  const Head = ({ label, by }: { label: string; by?: SortKey }) => (
    <th scope="col" className="px-3 py-2 font-medium">
      {by ? (
        <button
          type="button"
          className={cn("hover:text-primary", sort === by && "text-primary")}
          onClick={() => setSort(by)}
        >
          {label}
          {sort === by ? " ↓" : ""}
        </button>
      ) : (
        label
      )}
    </th>
  );

  if (error) {
    return (
      <p role="alert" className="text-body-sm-regular text-danger-primary">
        {getErrorMessage(error)}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44 [&_button]:min-w-0">
          <SelectField
            size="lg"
            label="Period"
            options={PRESETS}
            value={preset}
            onValueChange={(value) => setPreset((value ?? "week") as TControlPreset)}
          />
        </div>
        <div className="w-44 [&_button]:min-w-0">
          <SelectField
            size="lg"
            label="Team"
            options={[
              { value: "all", label: "All teams" },
              ...(teams ?? []).map((item) => ({ value: item.id, label: item.name })),
            ]}
            value={teamId}
            onValueChange={(value) => setTeamId(value ?? "all")}
          />
        </div>
        <div className="min-w-48 flex-1">
          <InputField
            type="text"
            size="lg"
            orientation="vertical"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a person"
            aria-label="Find a person"
          />
        </div>
        <Button
          variant="secondary"
          size="md"
          stretch="auto"
          label="Export CSV"
          loading={isExporting}
          onClick={exportCsv}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Tile label="Working now" value={String(totals?.working_now ?? 0)} />
        <Tile label="Worked" value={formatHm(totals?.seconds ?? 0)} />
        <Tile label="Onsite" value={formatHm(totals?.onsite_seconds ?? 0)} />
        <Tile label="Remote" value={formatHm(totals?.remote_seconds ?? 0)} />
        <Tile
          label="Frozen"
          value={formatHm(totals?.frozen_seconds ?? 0)}
          tone={(totals?.freezes ?? 0) > 0 ? "bad" : undefined}
        />
        <Tile
          label="Week not planned"
          value={`${totals?.unplanned_people ?? 0} people`}
          tone={(totals?.unplanned_people ?? 0) > 0 ? "warn" : undefined}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-subtle bg-surface-1">
        <table className="w-full min-w-176 text-left text-body-sm-regular">
          <thead className="border-b border-subtle bg-layer-1 text-caption-sm-medium text-tertiary">
            <tr>
              <Head label="Person" by="name" />
              <Head label="Now" />
              <Head label="Worked" by="worked" />
              <Head label="Onsite / Remote" />
              <Head label="Tasks" />
              <Head label="Pauses" />
              <Head label="Frozen" by="frozen" />
              <Head label="Week plan" by="unplanned" />
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {rows.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-tertiary">
                  Nobody matches.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr
                key={row.user.id}
                className={cn("cursor-pointer hover:bg-layer-1", selected === row.user.id && "bg-accent-subtle")}
                onClick={() => setSelected(selected === row.user.id ? null : row.user.id)}
              >
                <td className="px-3 py-2 font-medium text-primary">
                  <button type="button" className="text-left" aria-expanded={selected === row.user.id}>
                    {row.user.display_name}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    <Badge variant={STATE[row.state].variant} size="sm" label={STATE[row.state].label} />
                    <span className="max-w-48 truncate text-caption-sm-regular text-tertiary">
                      {row.work_item ?? ""} {row.mode ? `· ${row.mode.toLowerCase()}` : ""}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 tabular-nums">{formatHm(row.period.seconds)}</td>
                <td className="px-3 py-2 text-secondary tabular-nums">
                  {formatHm(row.period.onsite_seconds)} / {formatHm(row.period.remote_seconds)}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {row.period.tasks}
                  <span className="text-tertiary"> · {row.period.sessions} done</span>
                </td>
                <td className="px-3 py-2 text-secondary tabular-nums">{formatHm(row.period.break_seconds)}</td>
                <td className={cn("px-3 py-2 tabular-nums", row.period.freezes > 0 && "text-danger-primary")}>
                  {row.period.freezes > 0 ? `${formatHm(row.period.frozen_seconds)} · ${row.period.freezes}×` : "—"}
                </td>
                <td className="px-3 py-2">
                  {row.unplanned_days > 0 ? (
                    <Badge variant="warning" size="sm" label={`${row.unplanned_days} day(s) missing`} />
                  ) : (
                    <span className="text-success-primary">Planned</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open ? (
        <PersonDetail
          workspaceSlug={workspaceSlug}
          row={open}
          from={range.from}
          to={range.to}
          onClose={() => setSelected(null)}
        />
      ) : null}

      <section aria-label="Freezes" className="flex flex-col gap-2 rounded-lg border border-subtle bg-surface-1 p-4">
        <h3 className="text-body-md-medium text-primary">Missed check-ins in this period</h3>
        {(freezes ?? []).length === 0 ? (
          <p className="text-body-sm-regular text-tertiary">Nobody missed a check-in.</p>
        ) : (
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {(freezes ?? []).map((item, index) => (
              <li key={`${item.started_at}-${index}`} className="text-body-sm-regular text-secondary">
                <span className="font-medium text-primary">{item.user.display_name}</span> ·{" "}
                {clock.format(new Date(item.started_at))} · frozen {formatHm(item.seconds)}
                {item.ended_at ? "" : " (still frozen)"}
                {item.work_item ? ` · ${item.work_item}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
});
