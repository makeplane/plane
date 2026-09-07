/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import useSWR from "swr";
// workspaces imports
import { setToast, TOAST_TYPE } from "@workspaces/propel/toast";
// services
import attendanceService, {
  type TAttendanceCoordinates,
  type TAttendanceError,
  type TAttendanceStatus,
} from "@/services/attendance.service";
// local imports
import { ATTENDANCE_STRINGS } from "./constants";
import { GeolocationError, getCurrentPosition } from "./get-position";

/**
 * One SWR key for every attendance control on the page.
 *
 * The navbar button and the home-page card both read it, so they show the same
 * state and a punch from either updates both without a second request.
 */
export const ATTENDANCE_STATUS_KEY = "ATTENDANCE_STATUS";

/** `2026-09-01T03:15:00Z` in the employee's own zone, as `9:00 AM`. */
export const formatTime = (iso: string, timeZone?: string): string => {
  const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  try {
    return new Intl.DateTimeFormat(undefined, { ...options, timeZone }).format(new Date(iso));
  } catch {
    // An unrecognised zone from the payload must not take the navbar down.
    return new Intl.DateTimeFormat(undefined, options).format(new Date(iso));
  }
};

/** Odoo's fractional hours (`5.1`) as `5h 06m`. */
export const formatHours = (hours: number): string => {
  const minutes = Math.max(0, Math.round(hours * 60));
  const wholeHours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return wholeHours > 0 ? `${wholeHours}h ${String(remainder).padStart(2, "0")}m` : `${remainder}m`;
};

export type TAttendanceControl = {
  /** False when attendance is off, unreachable, or the first read is in flight. */
  isVisible: boolean;
  status: TAttendanceStatus | undefined;
  isCheckedIn: boolean;
  /** The account has no matching Odoo employee. The control still renders and explains itself. */
  isNotLinked: boolean;
  isBusy: boolean;
  isLocating: boolean;
  /** "Check in", or "Check out · Checked in at 9:00 AM · 5h 06m today". */
  detailLabel: string;
  /** The short label a button face can hold. */
  actionLabel: string;
  onPunch: () => Promise<void>;
};

/**
 * The whole attendance control, minus its appearance.
 *
 * Both the navbar icon and the home-page card render this; keeping the
 * geolocation rules, the conflict handling and the toasts here is what stops
 * the two drifting apart.
 */
export const useAttendanceControl = (): TAttendanceControl => {
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: status,
    error,
    isLoading,
    mutate,
  } = useSWR<TAttendanceStatus, TAttendanceError>(ATTENDANCE_STATUS_KEY, () => attendanceService.getStatus(), {
    // A 503 means Odoo is unreachable; retrying on a timer would just queue up
    // more requests against something already known to be down.
    shouldRetryOnError: false,
  });

  const isNotLinked = error?.code === "not_linked";
  const isCheckedIn = Boolean(status?.checked_in);
  const isBusy = isLocating || isSubmitting;

  // Nothing while the first read is in flight, and nothing when attendance is
  // switched off or unreachable: an attendance outage must never be visible in
  // the rest of the workspace.
  const isVisible = !isLoading && (isNotLinked || (!error && Boolean(status?.available)));

  const onPunch = async () => {
    // Guards the double-click, and the ten seconds a location fix can take.
    if (isBusy) return;

    // A provisioning defect, not an empty state. Say what the fix is rather
    // than doing nothing quietly.
    if (isNotLinked) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: ATTENDANCE_STRINGS.notLinkedTitle,
        message: error?.error ?? "",
      });
      return;
    }

    try {
      let next: TAttendanceStatus;

      if (isCheckedIn) {
        // Best effort on the way out: blocking a check-out on a permission
        // prompt would strand an open session with Odoo still counting hours.
        const coordinates = await getCurrentPosition().catch(() => undefined);
        setIsSubmitting(true);
        next = await attendanceService.checkOut(coordinates);
      } else {
        setIsLocating(true);
        let coordinates: TAttendanceCoordinates;
        try {
          coordinates = await getCurrentPosition();
        } finally {
          setIsLocating(false);
        }
        setIsSubmitting(true);
        next = await attendanceService.checkIn(coordinates);
      }

      // The write returns the status after it, so there is no follow-up read.
      await mutate(next, { revalidate: false });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: isCheckedIn ? ATTENDANCE_STRINGS.checkedOutToast : ATTENDANCE_STRINGS.checkedInToast,
      });
    } catch (submitError) {
      if (submitError instanceof GeolocationError) {
        setToast({ type: TOAST_TYPE.ERROR, title: ATTENDANCE_STRINGS.failedTitle, message: submitError.message });
        return;
      }

      const failure = submitError as TAttendanceError | undefined;

      // Two tabs can race, so a conflict is an ordinary outcome: re-read the
      // truth from Odoo rather than showing the user something alarming.
      if (failure?.code === "already_checked_in" || failure?.code === "not_checked_in") {
        await mutate();
        return;
      }

      setToast({
        type: TOAST_TYPE.ERROR,
        title: ATTENDANCE_STRINGS.failedTitle,
        message: failure?.error ?? (isCheckedIn ? ATTENDANCE_STRINGS.checkOutFailed : ATTENDANCE_STRINGS.checkInFailed),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionLabel = isNotLinked
    ? ATTENDANCE_STRINGS.checkIn
    : isLocating
      ? ATTENDANCE_STRINGS.locating
      : isCheckedIn
        ? ATTENDANCE_STRINGS.checkOut
        : ATTENDANCE_STRINGS.checkIn;

  const detailLabel = (() => {
    if (isNotLinked) return ATTENDANCE_STRINGS.notLinked(status?.employee?.work_email ?? "your account");
    if (isLocating) return ATTENDANCE_STRINGS.locating;
    if (!isCheckedIn) return ATTENDANCE_STRINGS.checkIn;

    // Checked in: this carries the detail an icon cannot.
    const parts: string[] = [ATTENDANCE_STRINGS.checkOut];
    if (status?.check_in) parts.push(ATTENDANCE_STRINGS.checkedInAt(formatTime(status.check_in, status.timezone)));
    if (typeof status?.worked_hours_today === "number") {
      parts.push(ATTENDANCE_STRINGS.todayTotal(formatHours(status.worked_hours_today)));
    }
    return parts.join(" · ");
  })();

  return {
    isVisible,
    status,
    isCheckedIn,
    isNotLinked,
    isBusy,
    isLocating,
    detailLabel,
    actionLabel,
    onPunch,
  };
};
