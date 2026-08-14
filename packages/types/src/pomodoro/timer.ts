/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IUserLite } from "../users";
import type {
  TIssueActivityIssueDetail,
  TIssueActivityProjectDetail,
  TIssueActivityUserDetail,
} from "../issues/activity/base";

export type TPomodoroTimerStatus = "running" | "paused" | "completed" | "discarded";

export type TPomodoroSettings = {
  /** focus session length in minutes */
  focus_minutes: number;
  /** short break length in minutes */
  short_break_minutes: number;
  /** long break length in minutes */
  long_break_minutes: number;
  /** number of focus sessions before a long break */
  sessions_before_long_break: number;
  /** automatically move to a break once a focus session completes */
  auto_start_break: boolean;
  /** automatically start the next focus session once a break completes */
  auto_start_focus: boolean;
  /** automatically create a time log when a focus session completes */
  auto_create_time_log: boolean;
  /** show a browser notification when a focus or break ends */
  browser_notifications: boolean;
  /** Discord incoming webhook URL for phase-end messages */
  discord_webhook_url: string;
};

export const DEFAULT_POMODORO_SETTINGS: TPomodoroSettings = {
  focus_minutes: 25,
  short_break_minutes: 5,
  long_break_minutes: 15,
  sessions_before_long_break: 4,
  auto_start_break: true,
  auto_start_focus: true,
  auto_create_time_log: true,
  browser_notifications: false,
  discord_webhook_url: "",
};

export type TPomodoroTimer = {
  id: string;
  workspace: string;
  project: string;
  project_detail: TIssueActivityProjectDetail;
  issue: string;
  issue_detail: TIssueActivityIssueDetail;
  /** whose timer this is */
  started_by: string;
  started_by_detail: TIssueActivityUserDetail | IUserLite;
  /** start of the current running segment (server time) */
  started_at: string;
  duration_minutes: number;
  /** accumulated focus time already spent (seconds) */
  paused_seconds: number;
  status: TPomodoroTimerStatus;
  description: string;
  /** 1-indexed session number within the run leading up to a long break */
  session_index: number;
  created_at: string;
  updated_at: string;
};

export type TStartPomodoroPayload = {
  issue_id: string;
  duration_minutes?: number;
  description?: string;
};

export type TCompletePomodoroResponse = {
  time_log: {
    id: string;
    issue: string;
    duration_minutes: number;
    logged_by: string;
    description: string;
    logged_date: string;
  } | null;
  timer: TPomodoroTimer;
};
