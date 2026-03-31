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

import cronstrue from "cronstrue";
import { ETriggerNodeHandlerName } from "@plane/types";
import type { TAutomationTriggerNodeConfig } from "@plane/types";
import { isRecord } from "@plane/utils";
import { getDefaultScheduleTimezone } from "./schedule-config";

// -- Types ------------------------------------------------------------------

export type TCronScheduleConfig = {
  cronExpression: string;
  timezone: string;
};

// -- Defaults ---------------------------------------------------------------

export function createDefaultCronScheduleConfig(userProfileTimezone?: string | null): TCronScheduleConfig {
  return {
    cronExpression: "",
    timezone: getDefaultScheduleTimezone(userProfileTimezone),
  };
}

// -- Validation -------------------------------------------------------------

/**
 * Returns an error message string if the expression is invalid, or null if valid.
 * Uses cronstrue which throws on invalid expressions.
 */
export function getCronValidationError(expression: string): string | null {
  if (!expression.trim()) return null; // empty = not yet typed, not an error
  try {
    cronstrue.toString(expression);
    return null;
  } catch {
    return "Invalid cron expression.";
  }
}

export function isCronScheduleConfigComplete(config: TCronScheduleConfig): boolean {
  if (!config.cronExpression.trim()) return false;
  if (!config.timezone) return false;
  return getCronValidationError(config.cronExpression) === null;
}

// -- Human-readable ---------------------------------------------------------

/**
 * Returns a human-readable description of the cron expression, or null if invalid/empty.
 */
export function getCronHumanReadable(expression: string): string | null {
  if (!expression.trim()) return null;
  try {
    return cronstrue.toString(expression, { use24HourTimeFormat: false });
  } catch {
    return null;
  }
}

// -- Config conversion ------------------------------------------------------

export function cronScheduleToTriggerConfig(config: TCronScheduleConfig): TAutomationTriggerNodeConfig {
  return {
    method: "cron",
    cron_expression: config.cronExpression,
    timezone: config.timezone,
  };
}

export function triggerConfigToCronSchedule(
  config: TAutomationTriggerNodeConfig | undefined,
  userProfileTimezone?: string | null
): TCronScheduleConfig {
  if (!isRecord(config)) return createDefaultCronScheduleConfig(userProfileTimezone);

  const cronExpression = typeof config.cron_expression === "string" ? config.cron_expression : "";
  const timezone =
    typeof config.timezone === "string" && config.timezone
      ? config.timezone
      : getDefaultScheduleTimezone(userProfileTimezone);

  return { cronExpression, timezone };
}

// -- Main content summary ---------------------------------------------------

export type TCronMainContentTranslate = (key: string, params?: Record<string, unknown>) => string;

export function getCronMainContentSummary(
  trigger: { handler_name: string; config: TAutomationTriggerNodeConfig } | null | undefined,
  profileTimezone: string | null | undefined,
  t: TCronMainContentTranslate
): string | null {
  if (!trigger || trigger.handler_name !== ETriggerNodeHandlerName.SCHEDULED) return null;
  if (!isRecord(trigger.config) || trigger.config.method !== "cron") return null;

  const c = triggerConfigToCronSchedule(trigger.config, profileTimezone);
  const description = getCronHumanReadable(c.cronExpression);
  if (!description) return null;

  return t("automations.trigger.schedule.main_content_cron_summary", {
    description,
    timezone: c.timezone,
  });
}
