/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Meetings are stored in UTC and shown in the timezone of the reader's profile, which may differ
 * from the one of the browser. "Local" below is "YYYY-MM-DDTHH:mm" in that timezone.
 */

const formatters = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (timeZone: string): Intl.DateTimeFormat => {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
};

export const toLocal = (iso: string | Date, timeZone: string): string => {
  const parts = Object.fromEntries(
    getFormatter(timeZone)
      .formatToParts(new Date(iso))
      .map(({ type, value }) => [type, value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

/** The moment a local time means, or undefined when it is incomplete. */
export const fromLocal = (local: string, timeZone: string): string | undefined => {
  const asUtc = Date.parse(`${local}:00Z`);
  if (Number.isNaN(asUtc)) return undefined;
  // The offset depends on the moment looked for; the second step settles it around clock changes.
  let moment = asUtc;
  for (let step = 0; step < 2; step++) {
    const offset = Date.parse(`${toLocal(new Date(moment), timeZone)}:00Z`) - moment;
    moment = asUtc - offset;
  }
  return new Date(moment).toISOString();
};

export const localDate = (iso: string, timeZone: string): string => toLocal(iso, timeZone).slice(0, 10);

export const localTime = (iso: string, timeZone: string): string => toLocal(iso, timeZone).slice(11);

/** Every local day a meeting touches; one that ends at midnight does not touch the next day. */
export const meetingDays = (meeting: { start_at: string; end_at: string }, timeZone: string): string[] => {
  const last = localDate(new Date(Date.parse(meeting.end_at) - 1).toISOString(), timeZone);
  const days = [];
  let day = localDate(meeting.start_at, timeZone);
  while (day <= last) {
    days.push(day);
    day = new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  }
  return days;
};

/** The next full hour, for an hour. */
export const defaultMeetingTime = (now = Date.now()): { start_at: string; end_at: string } => {
  const start = Math.ceil((now + 1) / 3_600_000) * 3_600_000;
  return { start_at: new Date(start).toISOString(), end_at: new Date(start + 3_600_000).toISOString() };
};

export const formatMeetingTime = (
  meeting: { start_at: string; end_at: string },
  timeZone: string,
  locale?: string
): string => {
  const options = { timeZone, hourCycle: "h23", hour: "2-digit", minute: "2-digit" } as const;
  const withDate = { ...options, day: "numeric", month: "short", year: "numeric" } as const;
  const sameDay = localDate(meeting.start_at, timeZone) === localDate(meeting.end_at, timeZone);
  const start = new Date(meeting.start_at).toLocaleString(locale, withDate);
  return `${start} – ${new Date(meeting.end_at).toLocaleString(locale, sameDay ? options : withDate)}`;
};

export const isMeetingTimeValid = (meeting: { start_at?: string; end_at?: string } | null | undefined): boolean =>
  !!meeting?.start_at && !!meeting.end_at && Date.parse(meeting.start_at) < Date.parse(meeting.end_at);

/** "start/end" as the history keeps it. */
export const formatStoredTime = (value: string, timeZone: string, locale?: string): string => {
  const [start_at, end_at] = value.split("/");
  if (!isMeetingTimeValid({ start_at, end_at })) return value;
  return formatMeetingTime({ start_at, end_at }, timeZone, locale);
};
