/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Clock, LogIn, LogOut, TriangleAlert } from "lucide-react";
// workspaces imports
import { Button } from "@workspaces/propel/button";
import { cn } from "@workspaces/utils";
// local imports
import { ATTENDANCE_STRINGS } from "./constants";
import { formatHours, formatTime, useAttendanceControl } from "./use-attendance";

/**
 * The attendance control on the workspace home page.
 *
 * The navbar icon is easy to miss, and on a narrow phone the bar runs out of
 * room before it gets to it, so the same control also sits on the first screen
 * everyone lands on -- with a real label, which is the whole point of putting
 * it here.
 *
 * Both controls read one SWR key, so a punch from either updates the other
 * without a second request.
 */
export const AttendanceCheckInCard = observer(function AttendanceCheckInCard() {
  const { isVisible, status, isCheckedIn, isNotLinked, isBusy, isLocating, actionLabel, onPunch } =
    useAttendanceControl();

  if (!isVisible) return null;

  const Icon = isNotLinked ? TriangleAlert : isCheckedIn ? LogOut : LogIn;

  const since =
    isCheckedIn && status?.check_in
      ? ATTENDANCE_STRINGS.checkedInAt(formatTime(status.check_in, status.timezone))
      : null;
  const today =
    typeof status?.worked_hours_today === "number"
      ? ATTENDANCE_STRINGS.todayTotal(formatHours(status.worked_hours_today))
      : null;

  const title = isNotLinked
    ? ATTENDANCE_STRINGS.notLinkedTitle
    : isCheckedIn
      ? "You're checked in"
      : "You're not checked in";

  const detail = isNotLinked
    ? ATTENDANCE_STRINGS.notLinked(status?.employee?.work_email ?? "your account")
    : [since, today].filter(Boolean).join(" · ") || "Check in to start your day";

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-subtle bg-layer-1 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full",
            isNotLinked ? "bg-warning-subtle" : isCheckedIn ? "bg-success-subtle" : "bg-layer-3"
          )}
        >
          <Clock className="size-4 text-secondary" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-13 font-semibold text-primary">{title}</div>
          {/* Not truncated: the not-linked case is a sentence telling somebody
              how to get themselves unblocked, and cutting it off defeats it. */}
          <div className="text-11 text-tertiary">{detail}</div>
        </div>
      </div>

      <Button
        variant={isCheckedIn ? "secondary" : "primary"}
        size="lg"
        onClick={onPunch}
        loading={isBusy}
        prependIcon={<Icon />}
        className="w-full shrink-0 justify-center sm:w-auto"
      >
        {isLocating ? ATTENDANCE_STRINGS.locating : actionLabel}
      </Button>
    </div>
  );
});
