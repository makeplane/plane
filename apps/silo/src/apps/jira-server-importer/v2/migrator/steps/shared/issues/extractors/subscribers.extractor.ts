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

import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import type { IJiraIssue, JiraV2Service } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import { isAxiosError } from "axios";

/**
 * Responsibility: Extract subscribers from Jira issues, handling pagination and transformation.
 */
export class JiraSubscribersExtractor {
  public async extract(jobId: string, jiraClient: JiraV2Service, issue: IJiraIssue): Promise<string[]> {
    const shouldPullWatchers = (issue.fields.watches?.watchCount ?? 0) > 0;

    if (shouldPullWatchers) {
      try {
        const watchers = await jiraClient.getIssueWatchers(issue.key);

        const subscribers = (watchers?.watchers || [])
          .map((watcher) => {
            return watcher.emailAddress || watcher.displayName;
          })
          .filter((subscriber) => subscriber !== undefined);

        const reporter = issue.fields.reporter?.emailAddress || issue.fields.reporter?.displayName;

        if (reporter && !subscribers.includes(reporter)) {
          subscribers.push(reporter);
        }

        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.SUBSCRIBERS,
          phase: "PULL_ALL_SUBSCRIBERS",
          level: EExecutionLogLevel.INFO,
          related_entity: issue.id,
          metrics: {
            pulled: subscribers.length,
          },
        });

        return subscribers;
      } catch (e) {
        if (isAxiosError(e)) {
          logger.error(`[${jobId}] Failed to get watchers for issue ${issue.key}`, e.response?.data);
        } else {
          logger.error(`[${jobId}] Failed to get watchers for issue ${issue.key}`, e);
        }

        return [];
      }
    }

    return [];
  }
}
