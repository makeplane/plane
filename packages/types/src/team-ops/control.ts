/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TFlow, THubPerson, TTeamflowRow, TTeamStatusRow } from "./workday";

export type TControlPeriod = {
  seconds: number;
  onsite_seconds: number;
  remote_seconds: number;
  sessions: number;
  tasks: number;
  without_document: number;
  attention: number;
  break_seconds: number;
  frozen_seconds: number;
  freezes: number;
};

/** One person: what they are doing now and their work in the period. */
export type TControlRow = TTeamStatusRow & {
  period: TControlPeriod;
  /** Working days from today to the end of the week without a plan. */
  unplanned_days: number;
};

export type TControlTotals = {
  seconds: number;
  onsite_seconds: number;
  remote_seconds: number;
  sessions: number;
  break_seconds: number;
  frozen_seconds: number;
  freezes: number;
  unplanned_people: number;
  working_now: number;
};

export type TControlTeam = { from: string; to: string; results: TControlRow[]; totals: TControlTotals };

export type TControlParams = { from: string; to: string; team?: string; user?: string };

export type TInterruptionRow = {
  kind: "BREAK" | "FREEZE";
  user: Pick<THubPerson, "id" | "display_name">;
  work_item: string | null;
  started_at: string;
  ended_at: string | null;
  seconds: number;
};

export type THubOverviewChannel = {
  id: string;
  kind: "TEAM" | "PROJECT" | "GENERAL" | "NEWS";
  name: string;
  members: number;
  messages: number;
  last_at: string | null;
  today: number;
  is_locked: boolean;
};

export type THubOverview = {
  channels: THubOverviewChannel[];
  private_conversations: number;
  docs: number;
  files: number;
  file_bytes: number;
  secrets: number;
  secret_publishers: number;
};

export type TFlowOverviewItem = TFlow & {
  percent: number | null;
  current_stage: string | null;
  finished: boolean;
  pending_stages: number;
  people_without_tasks: string[];
};

export type TFlowOverview = {
  flows: TFlowOverviewItem[];
  stale_handoffs: TTeamflowRow[];
  stale_after_hours: number;
};
