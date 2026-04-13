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

import type { GitlabMergeRequestEvent, MergeRequestEvent } from "@plane/etl/gitlab";
import { env } from "@/env";
import crypto from "crypto";

// Implement this function to verify the GitLab webhook token
export function verifyGitlabToken(token: string | string[] | undefined): boolean {
  // Add your token verification logic here
  // For example, compare it with a stored secret token
  const secretToken = env.WEBHOOK_SECRET;
  return token === secretToken;
}

export function classifyMergeRequestEvent(event: GitlabMergeRequestEvent): MergeRequestEvent | undefined {
  const { object_attributes, changes } = event;

  // Helper function to check if reviewers were added
  const reviewersAdded = (): boolean => {
    if (!changes.reviewers) return false;
    const prevReviewers = changes.reviewers.previous || [];
    const currReviewers = changes.reviewers.current || [];
    return currReviewers.length > prevReviewers.length;
  };

  // 1. Check if the PR is work in progress
  if (object_attributes.work_in_progress) {
    return "DRAFT_MR_OPENED";
  }

  // 2. Check if review was requested
  if (reviewersAdded()) {
    return "MR_REVIEW_REQUESTED";
  }

  // 3. Check if the PR is approved and ready for merge
  if (object_attributes.merge_status === "can_be_merged" && object_attributes.state === "opened") {
    return "MR_READY_FOR_MERGE";
  }

  // 4. Check the final state of the PR
  switch (object_attributes.state) {
    case "merged":
      return "MR_MERGED";
    case "closed":
      return "MR_CLOSED";
    case "opened":
      return "MR_OPENED";
    default:
      return undefined;
  }
}

/**
 *
 * @param workspaceId
 * @returns workspace webhook secret
 */

export function getWorkspaceWebhookSecret(workspaceId: string, gitlabClientSecret: string) {
  try {
    // Combine the strings with a delimiter (e.g., ":")
    const combined = `${workspaceId}:${gitlabClientSecret}`;

    // Hash the combined string using SHA-256
    const hash = crypto.createHash("sha256").update(combined).digest("hex");

    // Return the first 32 characters of the hash
    return hash.slice(0, 32);
  } catch (error) {
    console.error("error getWorkspaceWebhookSecret", error);
    return "";
  }
}

/**
 *
 * @param workspaceId
 * @param webhookSecret
 * @returns boolean
 */
export function verifyGitlabWebhookSecret(workspaceId: string, webhookSecret: string, gitlabClientSecret: string) {
  try {
    const webhookHash = getWorkspaceWebhookSecret(workspaceId, gitlabClientSecret);
    if (!webhookHash) return false;
    return webhookHash === webhookSecret;
  } catch (error) {
    console.error("error verifyGitlabWebhookSecret", error);
    return false;
  }
}
