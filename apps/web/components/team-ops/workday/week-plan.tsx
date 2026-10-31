/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { setToast } from "@plane/blocks/toast";
import type { TWeekDay, TWeekPlan } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { saveDayForUser } from "@/hooks/team-ops/use-work-calendar";
// local imports
import { getErrorMessage } from "../calendar/error-message";

type Props = {
  workspaceSlug: string;
  userId: string;
  week: TWeekPlan;
  /** Called after a day was saved, so the page asks the server again. */
  onChanged: () => Promise<unknown>;
};

const CHOICES = [
  { mode: "ONSITE", label: "Onsite" },
  { mode: "REMOTE", label: "Remote" },
  { mode: "OFF", label: "Off" },
] as const;

const MODE_LABEL: Record<string, string> = { ONSITE: "Onsite", REMOTE: "Remote", OFF: "Day off", LEAVE: "Leave" };

const dayName = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const dayDate = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" });
const parse = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

function DayTile({
  day,
  isToday,
  busy,
  onChoose,
}: {
  day: TWeekDay;
  isToday: boolean;
  busy: boolean;
  onChoose: (mode: "ONSITE" | "REMOTE" | "OFF") => void;
}) {
  const open = day.expected && !day.past && day.mode === null;
  const editable = !day.past && day.mode !== "LEAVE";
  return (
    <li
      className={cn(
        "flex min-w-24 flex-1 flex-col gap-1.5 rounded-lg border p-2",
        open ? "border-warning-strong bg-warning-subtle" : "border-subtle bg-surface-1",
        isToday && "ring-1 ring-accent-strong"
      )}
    >
      <div>
        <p className="text-body-xs-medium text-primary">{dayName.format(parse(day.date))}</p>
        <p className="text-caption-sm-regular text-tertiary">{dayDate.format(parse(day.date))}</p>
      </div>
      <p className="text-caption-sm-medium text-secondary">
        {day.mode ? MODE_LABEL[day.mode] : day.expected ? (day.past ? "—" : "Not planned") : "Not a work day"}
      </p>
      {editable ? (
        <div className="flex flex-wrap gap-1">
          {CHOICES.map((choice) => (
            <button
              key={choice.mode}
              type="button"
              disabled={busy}
              aria-pressed={day.mode === choice.mode}
              onClick={() => onChoose(choice.mode)}
              className={cn(
                "rounded px-1.5 py-0.5 text-caption-sm-medium",
                day.mode === choice.mode
                  ? "bg-accent-primary text-on-color"
                  : "bg-layer-1 text-secondary hover:bg-layer-2"
              )}
            >
              {choice.label}
            </button>
          ))}
        </div>
      ) : null}
    </li>
  );
}

/** Saturday to Friday: which days the person works and where. Required; your manager sees it in the team calendar. */
export function WeekPlan({ workspaceSlug, userId, week, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const today = week.days.find((day) => !day.past)?.date;

  const choose = async (day: TWeekDay, mode: "ONSITE" | "REMOTE" | "OFF") => {
    setBusy(true);
    try {
      await saveDayForUser(workspaceSlug, userId, day.date, { work_mode: mode });
      await onChanged();
    } catch (error) {
      setToast({ type: "error", title: "Could not save the plan", message: getErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-label="Plan your week"
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4",
        week.complete ? "border-subtle bg-surface-1" : "border-warning-strong bg-surface-1"
      )}
    >
      <div>
        <h2 className="text-body-md-medium text-primary">
          {week.complete ? "Your week" : "Plan your week to start working"}
        </h2>
        <p className="text-body-xs-regular text-secondary">
          {week.complete
            ? "Saturday to Friday. Change a day any time before it ends."
            : "Say which days you work, and where, for the rest of this week. It is required, and your manager sees it. You can do it on any day of the week."}
        </p>
      </div>
      <ol className="flex flex-wrap gap-2">
        {week.days.map((day) => (
          <DayTile
            key={day.date}
            day={day}
            isToday={day.date === today}
            busy={busy}
            onChoose={(mode) => void choose(day, mode)}
          />
        ))}
      </ol>
    </section>
  );
}
