/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { mutate } from "swr";
import { setToast } from "@plane/blocks/toast";
import { formatDuration, formatHm, getWeekRange, toDateKey } from "@plane/services";
import type { TFinishWorkPayload, TOpsNotification, TDayMode, TWorkPlace } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useUser, useUserProfile } from "@/hooks/store/user";
import { useCalendarSettings, useOpsTeams } from "@/hooks/team-ops/use-work-calendar";
import { useOpsNotifications, useTeamStatus, useWorkday, useWorkdayState } from "@/hooks/team-ops/use-workday";
// components
import { useHubPeople } from "@/hooks/team-ops/use-hub";
import { MyCalendarRoot } from "../calendar/my-calendar-root";
import { getErrorMessage } from "../calendar/error-message";
import { MyReportsRoot } from "../reports/my-reports-root";
// local imports
import { ContributionGraph } from "./contribution-graph";
import { DayModeChip, DayStart } from "./day-start";
import { FinishWorkPanel } from "./finish-work-panel";
import { NowCard } from "./now-card";
import type { TPickedTask } from "./project-task-picker";
import { SessionsList } from "./sessions-list";
import { TeamNow } from "./team-now";
import { TimeByTask } from "./time-by-task";
import { WeekChart } from "./week-chart";
import { WeekPlan } from "./week-plan";

type Props = { workspaceSlug: string };

const Stat = ({ label, value, tone }: { label: string; value: string; tone?: "warn" }) => (
  <div className="flex min-w-32 flex-1 flex-col rounded-lg border border-subtle bg-surface-1 px-4 py-3">
    <span className="text-caption-sm-regular text-tertiary">{label}</span>
    <span className={cn("text-h4-medium tabular-nums", tone === "warn" ? "text-warning-primary" : "text-primary")}>
      {value}
    </span>
  </div>
);

const dateFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long" });
const clock = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" });

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-subtle bg-surface-1">
      <summary className="flex cursor-pointer items-baseline justify-between gap-2 px-4 py-3">
        <span className="text-body-md-medium text-primary">{title}</span>
        <span className="text-caption-sm-regular text-tertiary">{hint}</span>
      </summary>
      <div className="border-t border-subtle">{children}</div>
    </details>
  );
}

function Alerts({ items, onRead }: { items: TOpsNotification[]; onRead: (id?: string) => Promise<void> }) {
  if (items.length === 0) return null;
  return (
    <section
      aria-label="Alerts"
      className="flex flex-col gap-2 rounded-lg border border-warning-strong bg-warning-subtle p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-body-md-medium text-primary">New for you</h3>
        <button
          type="button"
          className="text-body-xs-medium text-accent-primary hover:underline"
          onClick={() => onRead()}
        >
          Mark all read
        </button>
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.slice(0, 5).map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-body-sm-medium text-primary">{item.title}</p>
              {item.body ? <p className="line-clamp-2 text-body-xs-regular text-secondary">{item.body}</p> : null}
            </div>
            <button
              type="button"
              className="shrink-0 text-caption-sm-regular text-tertiary hover:text-primary"
              onClick={() => onRead(item.id)}
            >
              Dismiss
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The whole working day in one place: start the day, work, rest, report, plan, and (for managers) watch the team. */
export const WorkdayRoot = observer(function WorkdayRoot({ workspaceSlug }: Props) {
  // states
  const [isFinishing, setIsFinishing] = useState(false);
  // hooks
  const { data: currentUser } = useUser();
  const { data: userProfile } = useUserProfile();
  const { teams } = useOpsTeams(workspaceSlug);
  const { people } = useHubPeople(workspaceSlug);
  const { permissions } = useCalendarSettings(workspaceSlug);
  const day = useWorkdayState(workspaceSlug);
  const { rows: teamRows } = useTeamStatus(workspaceSlug, permissions?.can_view_team ?? false);
  const { notifications, markRead } = useOpsNotifications(workspaceSlug);
  const today = toDateKey(new Date());
  // Weeks run Saturday to Friday; the server says which one this is.
  const week = useMemo(
    () =>
      day.state?.week
        ? { from: day.state.week.start, to: day.state.week.end }
        : getWeekRange(new Date(), userProfile?.start_of_the_week ?? 1),
    [day.state?.week, userProfile?.start_of_the_week]
  );
  const weekly = useWorkday(workspaceSlug, currentUser?.id, week.from, week.to);
  const daily = useWorkday(workspaceSlug, currentUser?.id, today, today);

  const state = day.state;
  const timer = state?.timer ?? null;
  const mode = state?.day?.mode;
  const totals = state?.totals;
  const todaySessions = (weekly.sessions ?? []).filter((session) => toDateKey(new Date(session.finished_at)) === today);
  const attentionCount = (weekly.sessions ?? []).filter((session) => session.needs_attention).length;
  const unread = (notifications ?? []).filter((item) => !item.read);

  const fail = (title: string) => (error: unknown) =>
    setToast({ type: "error", title, message: getErrorMessage(error) });
  const everything = () => mutate((key) => typeof key === "string" && key.startsWith("TEAM_OPS_"));

  const choose = (next: TDayMode) => day.setDayMode(next).catch(fail("Could not save"));
  const start = async (task: TPickedTask, place?: TWorkPlace) => {
    await day.startWork(task.id, place).catch(fail("Could not start"));
  };
  const rest = async (action: "start" | "end") => {
    await day.setBreak(action).catch(fail("Could not change the pause"));
  };
  const checkIn = async () => {
    await day.checkIn().catch(fail("Could not confirm"));
  };
  const finish = async (payload: TFinishWorkPayload) => {
    try {
      const { capped } = await daily.finishWork(payload);
      await everything();
      setIsFinishing(false);
      setToast({
        type: "success",
        title: "Work finished",
        message: capped ? "The timer ran for more than a day, so one day was logged." : "It is in today's report.",
      });
    } catch (error) {
      fail("Could not finish")(error);
    }
  };

  // Today's story: what was finished, and the breaks and freezes in between, in time order.
  const timeline = [
    ...todaySessions.map((session) => ({ at: session.started_at, kind: "work" as const, session })),
    ...(totals?.interruptions ?? []).map((item) => ({ at: item.started_at, kind: item.kind, item })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  const running = timer ? `${timer.work_item ?? ""} ${timer.work_item_name ?? ""}`.trim() : "";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h4-medium text-primary">Workday</h1>
          <p className="text-body-sm-regular text-secondary">{dateFormat.format(new Date())}</p>
        </div>
        {mode ? <DayModeChip mode={mode} onChange={choose} /> : null}
      </header>

      <Alerts items={unread} onRead={markRead} />

      {day.isLoading ? <p className="text-body-sm-regular text-tertiary">Loading your day...</p> : null}

      {state && !mode ? <DayStart onChoose={choose} /> : null}

      {state?.week && currentUser ? (
        <WeekPlan
          workspaceSlug={workspaceSlug}
          userId={currentUser.id}
          week={state.week}
          onChanged={async () => {
            await day.refresh();
            await everything();
          }}
        />
      ) : null}

      {mode && timer && isFinishing ? (
        <FinishWorkPanel
          title={running}
          elapsedLabel={formatDuration(timer.worked_seconds, "en-US")}
          teams={teams ?? []}
          people={(people ?? []).filter((person) => person.id !== currentUser?.id)}
          onFinish={finish}
          onCancel={() => setIsFinishing(false)}
        />
      ) : null}

      {mode && !(timer && isFinishing) ? (
        <NowCard
          workspaceSlug={workspaceSlug}
          mode={mode}
          timer={timer}
          onStart={start}
          onBreak={rest}
          onCheckIn={checkIn}
          onFinish={() => setIsFinishing(true)}
        />
      ) : null}

      {mode ? (
        <>
          <div className="flex flex-wrap gap-3">
            <Stat label="Worked today" value={formatHm(daily.tasks?.total_seconds ?? 0)} />
            {mode === "HYBRID" || (totals?.onsite_seconds ?? 0) > 0 || (totals?.remote_seconds ?? 0) > 0 ? (
              <>
                <Stat label="Onsite" value={formatHm(totals?.onsite_seconds ?? 0)} />
                <Stat label="Remote" value={formatHm(totals?.remote_seconds ?? 0)} />
              </>
            ) : null}
            <Stat label="Rest pauses" value={formatHm(totals?.break_seconds ?? 0)} />
            <Stat
              label="Frozen"
              value={formatHm(totals?.frozen_seconds ?? 0)}
              tone={(totals?.frozen_seconds ?? 0) > 0 ? "warn" : undefined}
            />
            <Stat label="This week" value={formatHm(weekly.tasks?.total_seconds ?? 0)} />
            <Stat
              label="Needs attention"
              value={String(attentionCount)}
              tone={attentionCount > 0 ? "warn" : undefined}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TimeByTask title="Time by task, today" tasks={daily.tasks} />
            <TimeByTask title="Time by task, this week" tasks={weekly.tasks} />
          </div>

          {state?.week ? <WeekChart weekStart={state.week.start} sessions={weekly.sessions ?? []} /> : null}
          <ContributionGraph workspaceSlug={workspaceSlug} />

          <section className="flex flex-col gap-2">
            <h3 className="text-body-md-medium text-primary">Today</h3>
            {timeline.length === 0 ? (
              <p className="text-body-sm-regular text-tertiary">Nothing yet today.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {timeline.map((entry) =>
                  entry.kind === "work" ? (
                    <li key={entry.session.id}>
                      <SessionsList sessions={[entry.session]} />
                    </li>
                  ) : (
                    <li
                      key={entry.at}
                      className={cn(
                        "rounded-md border px-4 py-2 text-body-xs-regular",
                        entry.kind === "FREEZE"
                          ? "border-danger-strong bg-danger-subtle text-danger-primary"
                          : "border-subtle bg-layer-1 text-secondary"
                      )}
                    >
                      {entry.kind === "FREEZE" ? "Frozen" : "Rest pause"} ·{" "}
                      {clock.format(new Date(entry.item.started_at))}
                      {entry.item.ended_at ? `–${clock.format(new Date(entry.item.ended_at))}` : " – now"} ·{" "}
                      {formatHm(entry.item.seconds)}
                    </li>
                  )
                )}
              </ul>
            )}
          </section>
        </>
      ) : null}

      {teamRows && teamRows.length > 0 ? <TeamNow rows={teamRows} /> : null}

      {permissions?.can_view_team ? (
        <nav aria-label="Manage the team" className="flex flex-wrap gap-x-5 gap-y-1 text-body-sm-medium">
          <Link className="text-accent-primary hover:underline" href={`/${workspaceSlug}/team-ops/calendar/team/`}>
            Team calendar
          </Link>
          <Link className="text-accent-primary hover:underline" href={`/${workspaceSlug}/team-ops/reports/board/`}>
            Report board
          </Link>
          {permissions.can_manage ? (
            <Link
              className="text-accent-primary hover:underline"
              href={`/${workspaceSlug}/team-ops/calendar/settings/`}
            >
              Calendar settings
            </Link>
          ) : null}
        </nav>
      ) : null}

      <div className="flex flex-col gap-3">
        <Section title="My plan" hint="Calendar: where you work each day">
          <MyCalendarRoot workspaceSlug={workspaceSlug} />
        </Section>
        <Section title="My reports" hint="Daily and weekly">
          <MyReportsRoot workspaceSlug={workspaceSlug} />
        </Section>
      </div>
    </div>
  );
});
