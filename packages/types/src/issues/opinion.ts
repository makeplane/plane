/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TOpinionSentiment = "approve" | "neutral" | "reject";

export type TIssueOpinion = {
  id: string;
  activity: string; // FK → IssueActivity.id
  actor: string; // User.id
  sentiment: TOpinionSentiment;
  content: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
};

export type TIssueOpinionCreate = {
  sentiment: TOpinionSentiment;
  content?: string;
};

/** Map: activityId → TIssueOpinion (1-to-1 per user) */
export type TIssueOpinionByActivityMap = {
  [activityId: string]: TIssueOpinion | undefined;
};
