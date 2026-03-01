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

import { pullUsers } from "@plane/etl/jira";
import type { JiraV2Service, PaginatedResult, ImportedJiraUser } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import type { TJobContext } from "../../../../types";
import { JiraUsersStep } from "../../shared/entities";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { extractErrorMetadata } from "@/helpers/errors";

export class JiraCloudUserStep extends JiraUsersStep {
  /*
   * For jira cloud, we don't have access to user emails, hence
   * we take a csv in order to import the users, and we use a different
   * pull function, hence we need to overwrite this.
   */
  protected async pull(
    jobContext: TJobContext,
    _client: JiraV2Service,
    _startAt: number,
    _jobId: string
  ): Promise<PaginatedResult<ImportedJiraUser>> {
    const { job } = jobContext;

    try {
      if (!job.config.users) {
        logger.error(`[${job.id}] [${this.name}] No users found in config`, { jobId: job.id });

        executionLog.collect(job.id, {
          entity_type: EExecutionLogEntityType.USER,
          phase: "PULL_USERS",
          level: EExecutionLogLevel.ERROR,
          additional_data: {
            error: "No users CSV found in config",
          },
        });

        return {
          items: [],
          hasMore: false,
          total: 0,
          startAt: 0,
          maxResults: 0,
        };
      }

      const users = pullUsers(job.config.users);
      const items = users.map((user) => ({
        avatarUrl: "",
        user_id: user.user_id,
        email: user.email,
        full_name: "",
        user_name: user.user_name,
        added_to_org: user.added_to_org,
        org_role: user.org_role,
        user_status: "Active",
      }));

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.USER,
        phase: "PULL_USERS",
        level: EExecutionLogLevel.INFO,
        metrics: {
          pulled: items.length,
          total: items.length,
        },
      });

      return {
        items,
        hasMore: false,
        total: items.length,
        startAt: 0,
        maxResults: items.length,
      };
    } catch (error) {
      logger.error(`[${job.id}][${this.name}] Unable to pull users from CSV`, error);

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.USER,
        phase: "PULL_USERS",
        level: EExecutionLogLevel.ERROR,
        is_fatal: true,
        error: extractErrorMetadata(error),
      });

      throw error;
    }
  }
}
