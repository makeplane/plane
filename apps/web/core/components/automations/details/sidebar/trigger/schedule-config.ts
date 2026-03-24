/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { ETriggerNodeHandlerName } from "@plane/types";
import type { TAutomationTriggerNodeConfig } from "@plane/types";

export type TScheduleFrequency = "daily" | "weekly" | "monthly";

export type TFixedScheduleConfig = {
  frequency: TScheduleFrequency;
  days: string[];
  dayOfMonth: number;
  hour12: number;
  minute: number;
  period: "AM" | "PM";
  timezone: string;
};

const SCHEDULE_CONFIG_KEYS = ["method", "frequency", "days", "hour", "minute", "timezone", "day"] as const;

/** Browser timezone when profile has no `user_timezone` yet. */
export const getBrowserFallbackTimezone = () =>
  typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";

export function getDefaultScheduleTimezone(userProfileTimezone?: string | null): string {
  const trimmed = userProfileTimezone?.trim();
  if (trimmed) return trimmed;
  return getBrowserFallbackTimezone();
}

export function createDefaultFixedScheduleConfig(userProfileTimezone?: string | null): TFixedScheduleConfig {
  return {
    frequency: "weekly",
    days: ["sun"],
    /** 0 = not chosen yet (required before save when frequency is monthly) */
    dayOfMonth: 1,
    hour12: 10,
    minute: 0,
    period: "AM",
    timezone: getDefaultScheduleTimezone(userProfileTimezone),
  };
}

/** i18n key for inline validation, or null when the schedule is complete enough to save. */
export function getFixedScheduleValidationErrorKey(config: TFixedScheduleConfig): string | null {
  if (config.frequency === "weekly" && config.days.length === 0) {
    return "automations.trigger.schedule.validation_weekly_day_required";
  }
  if (
    config.frequency === "monthly" &&
    (!Number.isFinite(config.dayOfMonth) || config.dayOfMonth < 1 || config.dayOfMonth > 31)
  ) {
    return "automations.trigger.schedule.validation_monthly_date_required";
  }
  return null;
}

export function isFixedScheduleConfigComplete(config: TFixedScheduleConfig): boolean {
  return getFixedScheduleValidationErrorKey(config) === null;
}

export function to24Hour(hour12: number, period: "AM" | "PM"): number {
  if (period === "AM") {
    if (hour12 === 12) return 0;
    return hour12;
  }
  if (hour12 === 12) return 12;
  return hour12 + 12;
}

export function from24Hour(hour24: number): { hour12: number; period: "AM" | "PM" } {
  const period = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, period };
}

export function fixedScheduleToTriggerConfig(config: TFixedScheduleConfig): TAutomationTriggerNodeConfig {
  const hour24 = to24Hour(config.hour12, config.period);
  const base: Record<string, unknown> = {
    method: "fixed",
    frequency: config.frequency,
    hour: hour24,
    minute: config.minute,
    timezone: config.timezone,
  };
  if (config.frequency === "weekly") {
    const days = config.days.length > 0 ? [...new Set(config.days)] : [];
    base.days = days;
  } else if (config.frequency === "monthly" && config.dayOfMonth >= 1 && config.dayOfMonth <= 31) {
    base.day = config.dayOfMonth;
  }
  return base;
}

export function triggerConfigToFixedSchedule(
  config: TAutomationTriggerNodeConfig | undefined,
  userProfileTimezone?: string | null
): TFixedScheduleConfig {
  if (!config || typeof config !== "object") {
    return createDefaultFixedScheduleConfig(userProfileTimezone);
  }
  const c = config as Record<string, unknown>;

  const rawFreq = c.frequency;
  const frequency: TScheduleFrequency =
    rawFreq === "daily" || rawFreq === "weekly" || rawFreq === "monthly" ? rawFreq : "weekly";

  let hour24 = 10;
  if (typeof c.hour === "number" && c.hour >= 0 && c.hour <= 23) {
    hour24 = c.hour;
  }
  const { hour12, period } = from24Hour(hour24);

  const minute = typeof c.minute === "number" && c.minute >= 0 && c.minute <= 59 ? c.minute : 0;

  let days: string[] = [];
  if (frequency === "weekly" && Array.isArray(c.days) && c.days.length > 0) {
    days = c.days as string[];
  }

  let dayOfMonth = 0;
  if (frequency === "monthly") {
    if (typeof c.day === "number" && Number.isFinite(c.day)) {
      const d = Math.round(c.day);
      if (d >= 1 && d <= 31) dayOfMonth = d;
    }
  } else if (typeof c.day === "number" && Number.isFinite(c.day)) {
    const d = Math.round(c.day);
    if (d >= 1 && d <= 31) dayOfMonth = d;
  }

  const tz = c.timezone;
  const timezone = typeof tz === "string" && tz ? tz : getDefaultScheduleTimezone(userProfileTimezone);

  return {
    frequency,
    days,
    dayOfMonth,
    hour12,
    minute,
    period,
    timezone,
  };
}

/** Strips schedule keys so other trigger handlers are not polluted. */
export function stripScheduleFieldsFromConfig(
  config: TAutomationTriggerNodeConfig | undefined
): TAutomationTriggerNodeConfig {
  if (!config || typeof config !== "object") return {};
  const next = { ...(config as Record<string, unknown>) };
  for (const key of SCHEDULE_CONFIG_KEYS) {
    delete next[key];
  }
  return next;
}

export type TFixedScheduleMainContentTranslate = (key: string, params?: Record<string, unknown>) => string;

/**
 * Human-readable summary for the automation trigger main content (fixed / time-based schedule only).
 */
export function getFixedScheduleMainContentSummary(
  trigger: { handler_name: string; config: TAutomationTriggerNodeConfig } | null | undefined,
  profileTimezone: string | null | undefined,
  t: TFixedScheduleMainContentTranslate
): string | null {
  if (!trigger || trigger.handler_name !== ETriggerNodeHandlerName.FIXED_SCHEDULE) return null;
  const c = triggerConfigToFixedSchedule(trigger.config, profileTimezone);
  const periodLabel = t(c.period === "AM" ? "automations.trigger.schedule.am" : "automations.trigger.schedule.pm");
  const time = `${c.hour12}:${String(c.minute).padStart(2, "0")} ${periodLabel}`;
  const formatDay = (d: string) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
  if (c.frequency === "daily") {
    return t("automations.trigger.schedule.main_content_schedule_summary_daily", { time, timezone: c.timezone });
  }
  if (c.frequency === "weekly") {
    const days = c.days.length > 0 ? c.days.map(formatDay).join(", ") : "—";
    return t("automations.trigger.schedule.main_content_schedule_summary_weekly", {
      days,
      time,
      timezone: c.timezone,
    });
  }
  const day = c.dayOfMonth >= 1 && c.dayOfMonth <= 31 ? String(c.dayOfMonth) : "—";
  return t("automations.trigger.schedule.main_content_schedule_summary_monthly", {
    day,
    time,
    timezone: c.timezone,
  });
}
