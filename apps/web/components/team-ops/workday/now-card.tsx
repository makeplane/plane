/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { PlayOutline } from "@makeplane/propel/icons";
import { checkInPhase, formatClock } from "@plane/services";
import type { TDayMode, TWorkPlace, TWorkdayTimer } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { ProjectTaskPicker } from "./project-task-picker";
import type { TPickedTask } from "./project-task-picker";

type Props = {
  workspaceSlug: string;
  mode: TDayMode;
  timer: TWorkdayTimer | null;
  onStart: (task: TPickedTask, place?: TWorkPlace) => Promise<void>;
  onBreak: (action: "start" | "end") => Promise<void>;
  onCheckIn: () => Promise<void>;
  onFinish: () => void;
};

/** Seconds since the timer data was read, so the clock moves between refreshes without trusting the computer's time. */
const useSecondsSince = (stamp: unknown) => {
  const readAt = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    readAt.current = Date.now();
    setNow(Date.now());
  }, [stamp]);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  return Math.max(0, Math.floor((now - readAt.current) / 1000));
};

const PLACES: { value: TWorkPlace; label: string }[] = [
  { value: "ONSITE", label: "Onsite" },
  { value: "REMOTE", label: "Remote" },
];

const placeLabel = (place: string) => (place === "ONSITE" ? "Onsite" : place === "REMOTE" ? "Remote" : "");

/** The heart of the page: start a task, work on it, rest, answer "still working?", and finish. */
export function NowCard({ workspaceSlug, mode, timer, onStart, onBreak, onCheckIn, onFinish }: Props) {
  // states
  const [task, setTask] = useState<TPickedTask | null>(null);
  const [place, setPlace] = useState<TWorkPlace | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const sinceRead = useSecondsSince(timer?.server_time);

  const run = async (action: () => Promise<void>) => {
    setIsBusy(true);
    try {
      await action();
    } finally {
      setIsBusy(false);
    }
  };

  if (!timer) {
    // Every task has a place. It starts as today's answer; choosing the other one makes the day hybrid by itself.
    const chosen: TWorkPlace | null = place ?? (mode === "ONSITE" || mode === "REMOTE" ? mode : null);
    return (
      <section className="flex flex-col gap-4 rounded-lg border border-subtle bg-surface-1 p-5">
        <div>
          <h2 className="text-h5-medium text-primary">What are you working on?</h2>
          <p className="text-body-sm-regular text-secondary">Choose the project, then the task, then start.</p>
        </div>
        <ProjectTaskPicker workspaceSlug={workspaceSlug} value={task} onChange={setTask} disabled={isBusy} />
        {
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="mb-1 text-body-xs-medium text-secondary">
              3. Where do you work on this task? (a different place than today's answer makes it a hybrid day)
            </legend>
            {PLACES.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={chosen === item.value}
                onClick={() => setPlace(item.value)}
                className={cn(
                  "rounded-md border px-4 py-2 text-body-sm-medium",
                  chosen === item.value
                    ? "border-accent-strong bg-accent-subtle text-accent-primary"
                    : "border-subtle text-secondary hover:bg-layer-1"
                )}
              >
                {item.label}
              </button>
            ))}
          </fieldset>
        }
        <div>
          <Button
            variant="primary"
            size="lg"
            stretch="auto"
            icon={<Icon icon={PlayOutline} />}
            label="Start timer"
            disabled={!task || !chosen}
            loading={isBusy}
            onClick={() => run(() => onStart(task!, chosen ?? undefined)).then(() => setTask(null))}
          />
        </div>
      </section>
    );
  }

  const running = timer.state === "RUNNING";
  const worked = timer.worked_seconds + (running ? sinceRead : 0);
  const phase = running
    ? checkInPhase(timer.check_in_due_at, timer.check_in_grace_seconds, timer.server_time, sinceRead)
    : ({ phase: "none" } as const);
  const heading = `${timer.work_item ?? ""} ${timer.work_item_name ?? ""}`.trim();

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-lg border p-5",
        timer.state === "FROZEN" ? "border-danger-strong bg-danger-subtle" : "border-accent-strong bg-surface-1"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-caption-sm-regular text-tertiary">
            {timer.state === "BREAK" ? "On a break from" : timer.state === "FROZEN" ? "Frozen on" : "Working on"}
            {timer.project ? ` · ${timer.project}` : ""}
            {timer.location ? ` · ${placeLabel(timer.location)}` : ""}
          </p>
          <p className="truncate text-body-md-medium text-primary">{heading || "No work item"}</p>
          <p
            className={cn("font-mono text-32 font-semibold tabular-nums", running ? "text-primary" : "text-tertiary")}
            aria-label="Time worked"
          >
            {formatClock(worked)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {running ? (
            <Button
              variant="secondary"
              size="lg"
              stretch="auto"
              label="Rest pause"
              loading={isBusy}
              onClick={() => run(() => onBreak("start"))}
            />
          ) : null}
          {timer.state === "BREAK" ? (
            <Button
              variant="primary"
              size="lg"
              stretch="auto"
              label="Back to work"
              loading={isBusy}
              onClick={() => run(() => onBreak("end"))}
            />
          ) : null}
          {timer.state === "FROZEN" ? (
            <Button
              variant="primary"
              size="lg"
              stretch="auto"
              label="I am back"
              loading={isBusy}
              onClick={() => run(onCheckIn)}
            />
          ) : null}
          {timer.state !== "BREAK" && timer.issue ? (
            <Button variant="primary" size="lg" stretch="auto" label="Finish work" onClick={onFinish} />
          ) : null}
        </div>
      </div>

      {timer.state === "BREAK" ? (
        <p className="text-body-sm-regular text-secondary">The timer is paused. Time on a break is not counted.</p>
      ) : null}

      {timer.state === "FROZEN" ? (
        <p role="alert" className="text-body-sm-medium text-danger-primary">
          The check-in was not answered, so the time stopped counting
          {timer.paused_at
            ? ` at ${new Date(timer.paused_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
            : ""}
          . Your manager was told. Press "I am back" and the time counts again from now.
        </p>
      ) : null}

      {phase.phase === "due" ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning-strong bg-warning-subtle p-3"
        >
          <p className="text-body-sm-medium text-primary">
            Are you still working? Answer within {Math.floor(phase.secondsLeft / 60)}:
            {String(phase.secondsLeft % 60).padStart(2, "0")} or the time stops counting.
          </p>
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label="Yes, still working"
            loading={isBusy}
            onClick={() => run(onCheckIn)}
          />
        </div>
      ) : null}
      {phase.phase === "waiting" ? (
        <p className="text-caption-sm-regular text-tertiary">
          Next check-in in {Math.ceil(phase.secondsToDue / 60)} min.
        </p>
      ) : null}
    </section>
  );
}
