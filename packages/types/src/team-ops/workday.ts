/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TFileInfo = { id: string; name: string; content_type: string; size: number };

/** One finished stretch of work on a work item. */
export type TWorkSession = {
  id: string;
  user: string;
  project: string;
  issue: string | null;
  /** `KEY-12` */
  work_item: string | null;
  work_item_name: string | null;
  started_at: string;
  finished_at: string;
  duration_seconds: number;
  summary: string;
  document_text: string;
  /** The person confirmed that there is no document for this work. */
  no_document: boolean;
  needs_attention: boolean;
  attention_message: string;
  files: TFileInfo[];
};

export type TFinishWorkPayload = {
  summary: string;
  document_text: string;
  no_document: boolean;
  attention_message: string;
  attention_teams: string[];
  files: File[];
};

export type TFinishWorkResponse = { session: TWorkSession; capped: boolean };

/** Time spent on a work item in a period. */
export type TWorkTask = { issue: string; name: string; key: string; seconds: number };
export type TWorkTasks = { results: TWorkTask[]; total_seconds: number };

export type THubPerson = { id: string; display_name: string; avatar_url: string | null };

export type THubChannel = {
  id: string;
  kind: "TEAM" | "PROJECT";
  name: string;
  team: string | null;
  project: string | null;
  unread: number;
};

export type THubChannelDetail = THubChannel & { members: THubPerson[] };

export type THubChannelList = { results: THubChannel[]; unread_mentions: number };

export type THubMessage = {
  id: string;
  channel: string;
  author: THubPerson;
  body: string;
  parent: string | null;
  kind: "MESSAGE" | "ATTENTION";
  session: string | null;
  created_at: string;
  edited_at: string | null;
  is_deleted: boolean;
  mentions: THubPerson[];
  mentions_me: boolean;
  attachments: TFileInfo[];
};

export type THubMessagePayload = {
  body: string;
  parent?: string | null;
  users: string[];
  teams: string[];
  files: File[];
};

export type THubMention = {
  id: string;
  channel: string;
  message: string;
  author: THubPerson;
  body: string;
  kind: "MESSAGE" | "ATTENTION";
  via_team: string | null;
  created_at: string;
  read: boolean;
};

export type TTeamflowStatus = "pending" | "delivered";

export type TTeamflowRow = {
  message: string;
  channel: string;
  from_team: { id: string; name: string } | null;
  to_team: { id: string; name: string };
  author: { id: string; display_name: string };
  kind: "MESSAGE" | "ATTENTION";
  summary: string;
  work_item: string | null;
  files: TFileInfo[];
  status: TTeamflowStatus;
  created_at: string;
};

export type TTeamflowEdge = { from: string; to: string; pending: number; delivered: number };

export type TTeamflow = {
  results: TTeamflowRow[];
  nodes: { id: string; name: string }[];
  edges: TTeamflowEdge[];
};

export type TTeamflowParams = { team?: string; status?: TTeamflowStatus; from?: string; to?: string };
