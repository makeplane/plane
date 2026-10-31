/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "react-router";
import { mutate } from "swr";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { PlayOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import { formatClock, formatDuration, getWeekRange, toDateKey } from "@plane/services";
import type { TFinishWorkPayload } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useUser, useUserProfile } from "@/hooks/store/user";
import { useTimeTracking } from "@/hooks/team-ops/use-time-tracking";
import { useCalendarSettings, useOpsTeams } from "@/hooks/team-ops/use-work-calendar";
import { useWorkday } from "@/hooks/team-ops/use-workday";
// components
import { MyCalendarRoot } from "../calendar/my-calendar-root";
import { getErrorMessage } from "../calendar/error-message";
import { MyReportsRoot } from "../reports/my-reports-root";
import { TimeTrackingRoot } from "../time/time-tracking-root";
import { useElapsedSeconds } from "../time/timer-card";
// local imports
import { FinishWorkPanel } from "./finish-work-panel";
import { ProjectTaskPicker } from "./project-task-picker";
import type { TPickedTask } from "./project-task-picker";
import { SessionsList } from "./sessions-list";
import { TimeByTask } from "./time-by-task";

type Props = { workspaceSlug: string };

const TABS = [
  { key: "today", label: "Today" },
  { key: "plan", label: "Plan" },
  { key: "reports", label: "Reports" },
  { key: "log", label: "Time log" },
  { key: "team", label: "Team" },
] as const;
type TTab = (typeof TABS)[number]["key"];

const Stat = ({ label, value, tone }: { label: string; value: string; tone?: "warn" }) => (
  <div className="flex min-w-32 flex-1 flex-col rounded-lg border border-subtle bg-surface-1 px-4 py-3">
    <span className="text-caption-sm-regular text-tertiary">{label}</span>
    <span className={cn("text-h4-medium tabular-nums", tone === "warn" ? "text-warning-primary" : "text-primary")}>
      {value}
    </span>
  </div>
);

function TeamLinks({ workspaceSlug }: Props) {
  const { permissions } = useCalendarSettings(workspaceSlug);
  const base = `/${workspaceSlug}/team-ops`;
  const links = [
    ...(permissions?.can_view_team
      ? [
          { href: `${base}/calendar/team/`, title: "Team calendar", text: "Who works where, day by day." },
          { href: `${base}/reports/board/`, title: "Report board", text: "Who has handed in their reports." },
        ]
      : []),
    { href: `${base}/dashboard/`, title: "Dashboard", text: "Time, plans and reports of the team in numbers." },
    { href: `${base}/leave/`, title: "Leave", text: "Ask for leave and decide on requests." },
    ...(permissions?.can_manage
      ? [{ href: `${base}/calendar/settings/`, title: "Calendar settings", text: "Work days, holidays and teams." }]
      : []),
  ];
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="flex h-full flex-col gap-0.5 rounded-lg border border-subtle bg-surface-1 p-4 hover:bg-layer-1"
          >
            <span className="text-body-md-medium text-primary">{link.title}</span>
            <span className="text-body-sm-regular text-secondary">{link.text}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const TodayView = observer(function TodayView({ workspaceSlug }: Props) {
  // states
  const [task, setTask] = useState<TPickedTask | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  // hooks
  const { data: currentUser } = useUser();
  const { data: userProfile } = useUserProfile();
  const { teams } = useOpsTeams(workspaceSlug);
  const today = toDateKey(new Date());
  const week = useMemo(
    () => getWeekRange(new Date(), userProfile?.start_of_the_week ?? 1),
    [userProfile?.start_of_the_week]
  );
  const { timer, startTimer } = useTimeTracking({
    workspaceSlug,
    userId: currentUser?.id,
    from: week.from,
    to: week.to,
  });
  const weekly = useWorkday(workspaceSlug, currentUser?.id, week.from, week.to);
  const daily = useWorkday(workspaceSlug, currentUser?.id, today, today);
  const elapsed = useElapsedSeconds(timer ?? null);

  const todaySessions = (weekly.sessions ?? []).filter((session) => toDateKey(new Date(session.finished_at)) === today);
  const attentionCount = (weekly.sessions ?? []).filter((session) => session.needs_attention).length;
  const withoutDocument = (weekly.sessions ?? []).filter((session) => session.no_document).length;

  const start = async () => {
    if (!task) return;
    setIsStarting(true);
    try {
      await startTimer({ issue: task.id, note: "" });
      setTask(null);
    } catch (error) {
      setToast({ type: "error", title: "Could not start", message: getErrorMessage(error) });
    } finally {
      setIsStarting(false);
    }
  };

  const finish = async (payload: TFinishWorkPayload) => {
    try {
      const { capped } = await daily.finishWork(payload);
      // The timer, the day's report, the dashboard and the Hub all change when work is finished.
      await mutate((key) => typeof key === "string" && key.startsWith("TEAM_OPS_"));
      setIsFinishing(false);
      setToast({
        type: "success",
        title: "Work finished",
        message: capped ? "The timer ran for more than a day, so one day was logged." : "It is in today's report.",
      });
    } catch (error) {
      setToast({ type: "error", title: "Could not finish", message: getErrorMessage(error) });
    }
  };

  const running = timer
    ? timer.issue_detail
      ? `${timer.issue_detail.project_identifier}-${timer.issue_detail.sequence_id} ${timer.issue_detail.name}`
      : "No work item"
    : "";

  return (
    <div className="flex flex-col gap-6">
      {timer ? (
        isFinishing ? (
          <FinishWorkPanel
            title={running}
            elapsedLabel={formatClock(elapsed)}
            teams={teams ?? []}
            onFinish={finish}
            onCancel={() => setIsFinishing(false)}
          />
        ) : (
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-accent-strong bg-surface-1 p-5">
            <div className="min-w-0">
              <p className="text-caption-sm-regular text-tertiary">Working on</p>
              <p className="truncate text-body-md-medium text-primary">{running}</p>
              <p className="font-mono text-32 font-semibold text-primary tabular-nums">{formatClock(elapsed)}</p>
            </div>
            {timer.issue_detail ? (
              <Button
                variant="primary"
                size="lg"
                stretch="auto"
                label="Finish work"
                onClick={() => setIsFinishing(true)}
              />
            ) : (
              <p className="max-w-64 text-body-xs-regular text-tertiary">
                This timer has no work item. Stop it in the Time log tab, then start again from a task.
              </p>
            )}
          </section>
        )
      ) : (
        <section className="flex flex-col gap-4 rounded-lg border border-subtle bg-surface-1 p-5">
          <div>
            <h2 className="text-h5-medium text-primary">What are you working on?</h2>
            <p className="text-body-sm-regular text-secondary">Choose the project, then the task, then start.</p>
          </div>
          <ProjectTaskPicker workspaceSlug={workspaceSlug} value={task} onChange={setTask} disabled={isStarting} />
          <div>
            <Button
              variant="primary"
              size="lg"
              stretch="auto"
              icon={<Icon icon={PlayOutline} />}
              label="Start timer"
              disabled={!task}
              loading={isStarting}
              onClick={start}
            />
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Stat label="Today" value={formatDuration(daily.tasks?.total_seconds ?? 0, "en-US")} />
        <Stat label="This week" value={formatDuration(weekly.tasks?.total_seconds ?? 0, "en-US")} />
        <Stat label="Finished this week" value={String((weekly.sessions ?? []).length)} />
        <Stat label="Needs attention" value={String(attentionCount)} tone={attentionCount > 0 ? "warn" : undefined} />
        <Stat label="Confirmed without a document" value={String(withoutDocument)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TimeByTask title="Time by task, today" tasks={daily.tasks} />
        <TimeByTask title="Time by task, this week" tasks={weekly.tasks} />
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-body-md-medium text-primary">Finished today</h3>
        <SessionsList sessions={todaySessions} />
      </section>
    </div>
  );
});

/** One page for the working day: do the work, plan it, report on it, and see how time was spent. */
export const WorkdayRoot = observer(function WorkdayRoot({ workspaceSlug }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const tab: TTab = TABS.some((item) => item.key === requested) ? (requested as TTab) : "today";

  return (
    <div className="flex w-full flex-col">
      <nav aria-label="Workday" className="mx-auto flex w-full max-w-5xl gap-1 border-b border-subtle px-6 pt-4">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-current={tab === item.key ? "page" : undefined}
            onClick={() => setSearchParams(item.key === "today" ? {} : { tab: item.key })}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-body-sm-medium transition-colors",
              tab === item.key
                ? "border-accent-strong text-primary"
                : "border-transparent text-tertiary hover:text-secondary"
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {tab === "today" ? (
        <div className="mx-auto w-full max-w-5xl p-6">
          <TodayView workspaceSlug={workspaceSlug} />
        </div>
      ) : null}
      {tab === "plan" ? <MyCalendarRoot workspaceSlug={workspaceSlug} /> : null}
      {tab === "reports" ? <MyReportsRoot workspaceSlug={workspaceSlug} /> : null}
      {tab === "log" ? <TimeTrackingRoot workspaceSlug={workspaceSlug} /> : null}
      {tab === "team" ? (
        <div className="mx-auto w-full max-w-5xl p-6">
          <TeamLinks workspaceSlug={workspaceSlug} />
        </div>
      ) : null}
    </div>
  );
});
