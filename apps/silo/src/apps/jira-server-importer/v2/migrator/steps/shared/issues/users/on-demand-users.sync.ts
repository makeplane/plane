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

import { logger } from "@plane/logger";
import type { PlaneUser } from "@plane/sdk";
import { withCache } from "@/apps/jira-server-importer/v2/helpers/cache";
import type { IStorageService, TJobContext } from "@/apps/jira-server-importer/v2/types";
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { protect } from "@/lib";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogEntityType, EExecutionLogLevel } from "@/lib/execution-log/types";
import { getAPIClient } from "@/services/client";
import type { TProjectMemberBulkCreatePayload } from "@/services/member/member.service";
import { Store } from "@/worker/base";
import type { TExtractedUser } from "../extractors/associated-users.extractor";

type TSyncAssociatedUsersInput = {
  jobContext: TJobContext;
  storage: IStorageService;
  extractedUsers: TExtractedUser[];
};

const LOG_TAG = "OnDemandUsersSync";

/**
 * Plugin: Creates any Jira users referenced by the currently-processed issue batch that
 * are not yet present in Plane, and appends `EJiraStep.USERS` mappings so that downstream
 * lookups (assignee / reporter / subscriber / worklog / custom user fields) resolve.
 *
 * Invoked from within the issues step, after extraction and before mapping load. It is a
 * self-contained, side-effecting helper — surrounding flow is unchanged. Users without an
 * email are skipped (cannot dedupe against Plane or create without one). Cache backing
 * `existingUsers` is invalidated after creation so the next batch sees the new users.
 *
 * `storeMapping` is an upsert (see StorageService.storeMapping — NX=false), so appending
 * new mappings is safe and merges with previously stored entries.
 */
export const syncAssociatedUsers = async (input: TSyncAssociatedUsersInput): Promise<void> => {
  const { jobContext, storage, extractedUsers } = input;
  const { job, planeClient } = jobContext;

  if (extractedUsers.length === 0) {
    logger.info(`[${job.id}] [${LOG_TAG}] No extracted users — skipping sync`);
    return;
  }

  // 1. Filter: email is required for dedup + creation
  const candidates = extractedUsers.filter((user) => !!user.email);
  const skippedNoEmail = extractedUsers.length - candidates.length;

  if (skippedNoEmail > 0) {
    logger.warn(`[${job.id}] [${LOG_TAG}] Skipped ${skippedNoEmail} users without email`, {
      total: extractedUsers.length,
      skippedNoEmail,
    });
  }

  if (candidates.length === 0) {
    logger.info(`[${job.id}] [${LOG_TAG}] No candidates with email — skipping sync`);
    return;
  }

  // 2. Fetch existing Plane users (cached — shares key with users step)
  const existingUsers = await withCache(
    EJiraStep.USERS,
    job,
    async () => await protect(planeClient.users.list.bind(planeClient.users), job.workspace_slug, job.project_id)
  );

  // 3. Dedupe against existing by email
  const existingEmails = new Set(existingUsers.map((u) => u.email));
  const usersToCreate = candidates.filter((user) => !existingEmails.has(user.email as string));

  logger.info(`[${job.id}] [${LOG_TAG}] Dedup summary`, {
    extracted: extractedUsers.length,
    candidates: candidates.length,
    existing: existingUsers.length,
    toCreate: usersToCreate.length,
  });

  // 4. Create missing users via silo bulk endpoint. Endpoint handles seat budget —
  //    users beyond the workspace's available seat count come back deactivated.
  let createdUsers: PlaneUser[] = [];
  let erroredCount = 0;
  if (usersToCreate.length > 0) {
    const payload: TProjectMemberBulkCreatePayload[] = usersToCreate.map((user) => ({
      email: user.email as string,
      display_name: user.display_name ?? (user.email as string),
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      role: user.role ?? 15,
      // Disabled/deleted Jira accounts → deactivated Plane users (no seat, no login).
      // When unknown (string-only sources), omit the flag and let the server-side seat
      // guard decide activation.
      ...(user.is_active === false ? { is_active: false } : {}),
    }));

    try {
      const client = getAPIClient();
      const response = await client.member.bulkCreateProjectMembers(job.workspace_slug, job.project_id, payload);
      // Cast to PlaneUser shape — response fields are a compatible subset (id, email,
      // display_name, first_name, last_name). Downstream `mappings` build only reads
      // `email`, `display_name`, `id`.
      createdUsers = response.created as unknown as PlaneUser[];
      erroredCount = response.errored.length;

      for (const errored of response.errored) {
        executionLog.collect(job.id, {
          entity_type: EExecutionLogEntityType.USER,
          phase: "CREATE_USER",
          level: EExecutionLogLevel.ERROR,
          entity_external_id: errored.payload.email,
          error: { message: errored.error },
        });
      }
    } catch (error) {
      logger.error(`[${job.id}] [${LOG_TAG}] Bulk member create failed`, { error });
      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.USER,
        phase: "SYNC_ASSOCIATED_USERS",
        level: EExecutionLogLevel.ERROR,
        error: { message: String(error) },
      });
      // Re-throw so the issues step surfaces the failure rather than silently proceeding
      // with missing user mappings.
      throw error;
    }

    executionLog.collect(job.id, {
      entity_type: EExecutionLogEntityType.USER,
      phase: "SYNC_ASSOCIATED_USERS",
      level: EExecutionLogLevel.INFO,
      metrics: {
        pulled: extractedUsers.length,
        imported: createdUsers.length,
      },
      additional_data: {
        skippedNoEmail,
        existing: existingUsers.length,
        toCreate: usersToCreate.length,
        errored: erroredCount,
      },
    });

    // Invalidate `existingUsers` cache so subsequent batches refetch and see the new rows
    await invalidateExistingUsersCache(job.id, job.workspace_slug, job.project_id);
  }

  // 5. Store mappings (email + displayName + Jira account keys → planeId). Upsert semantics.
  //
  // Account keys come from the extractor (`user.name` on Jira Server, `user.accountId` on
  // Jira Cloud) and let the downstream migrator resolve changelog assignee activities where
  // `item.from` / `item.to` are emitted as account keys rather than emails.
  const emailToAccountKeys = new Map<string, string[]>();
  for (const user of extractedUsers) {
    if (!user.email || !user.accountKeys || user.accountKeys.length === 0) continue;
    const bucket = emailToAccountKeys.get(user.email) ?? [];
    emailToAccountKeys.set(user.email, Array.from(new Set([...bucket, ...user.accountKeys])));
  }

  const allKnownUsers = [...existingUsers, ...createdUsers];
  const mappings = allKnownUsers
    .filter((user) => user.email && user.id)
    .flatMap((user) => {
      const email = user.email;
      const displayName = user.display_name;
      const accountKeys = email ? (emailToAccountKeys.get(email) ?? []) : [];
      return [
        ...(email ? [{ externalId: email, planeId: user.id }] : []),
        ...(displayName ? [{ externalId: displayName, planeId: user.id }] : []),
        ...accountKeys.map((key) => ({ externalId: key, planeId: user.id })),
      ];
    });

  if (mappings.length > 0) {
    await storage.storeMapping(job.id, EJiraStep.USERS, mappings);
    logger.info(`[${job.id}] [${LOG_TAG}] Stored ${mappings.length} user mappings`);
  }
};

/**
 * Delete the Redis entry used by `withCache` for existing Plane users so the next batch
 * observes freshly-created users. Key shape must match `withCache` exactly.
 */
const invalidateExistingUsersCache = async (jobId: string, workspaceSlug: string, projectId: string): Promise<void> => {
  try {
    const store = Store.getInstance();
    const cacheKey = `JiraServerImporter:cache:${jobId}:${workspaceSlug}:${projectId}:${EJiraStep.USERS}`;
    await store.del(cacheKey);
    logger.info(`[${jobId}] [${LOG_TAG}] Invalidated existing users cache`, { cacheKey });
  } catch (error) {
    logger.warn(`[${jobId}] [${LOG_TAG}] Failed to invalidate existing users cache`, { error });
  }
};
