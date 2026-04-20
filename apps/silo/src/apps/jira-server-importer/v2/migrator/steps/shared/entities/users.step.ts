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

import type { ImportedJiraUser, JiraConfig, JiraV2Service, PaginatedResult } from "@plane/etl/jira-server";
import { pullUsersV2, transformUser } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import type { Client as PlaneClient, PlaneUser } from "@plane/sdk";
import type { TImportJob } from "@plane/types";
import { withCache } from "@/apps/jira-server-importer/v2/helpers/cache";
import { createPaginationContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import type {
  IStep,
  IStorageService,
  TJobContext,
  TStepExecutionContext,
  TStepExecutionInput,
} from "@/apps/jira-server-importer/v2/types";
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { protect } from "@/lib";
import { extractErrorMetadata } from "@/helpers/errors";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import { getAPIClientInternal } from "@/services/client";
import type { TProjectMemberBulkCreatePayload } from "@/services/member";

/**
 * Handles the import of users from Jira Server to Plane.
 *
 * This step pulls all users from Jira Server in a paginated manner, transforms them
 * to the Plane format, and creates them in the target Plane workspace. It stores
 * mappings between Jira user emails and Plane user IDs for use by dependent steps.
 *
 * User avatars are also imported to Plane during this process.
 */
export class JiraUsersStep implements IStep {
  name = EJiraStep.USERS;
  dependencies = [];

  private readonly PAGE_SIZE = 100;

  constructor(private readonly source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA) {}

  /**
   * Check if user import should be skipped based on job configuration
   */
  private shouldPullUsers(): boolean {
    return this.source === E_IMPORTER_KEYS.JIRA;
  }

  /**
   * Executes the user import step with pagination support.
   *
   * Orchestrates the pull-transform-push pattern:
   * 1. Checks if user import should be skipped based on job configuration
   * 2. Pulls users from Jira Server (paginated)
   * 3. Transforms them to Plane format
   * 4. Creates new users in Plane (deduplicates against existing users)
   * 5. Stores email-to-ID mappings for dependent steps
   *
   * @param input - The step execution input containing job context, storage, and previous pagination state
   * @returns Execution context with pagination info (hasMore, startAt, counts)
   * @throws Error if the step execution fails at any stage
   */
  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext, storage, previousContext } = input;
    const { job, sourceClient } = jobContext;

    try {
      // Get pagination state
      const startAt = previousContext?.pageCtx.startAt ?? 0;
      const totalProcessed = previousContext?.pageCtx.totalProcessed ?? 0;

      logger.info(`[${job.id}] [${this.name}] Starting execution`, {
        jobId: job.id,
        startAt,
        totalProcessed,
      });

      const shouldPullUsers = this.shouldPullUsers();

      // Pull users from Jira Server (paginated)
      const pulledUsers = shouldPullUsers
        ? await this.pull(jobContext, sourceClient, startAt, job.id)
        : this.createMockPaginationPayload();

      // Transform users
      const transformedUsers = this.transform(pulledUsers.items);

      // Push to Plane (create only new users)
      const createdCount = await this.push(jobContext, transformedUsers, storage);

      return createPaginationContext({
        hasMore: pulledUsers.hasMore,
        startAt: startAt,
        pageSize: this.PAGE_SIZE,
        pulled: pulledUsers.items.length,
        pushed: createdCount,
        totalProcessed: totalProcessed + pulledUsers.items.length,
      });
    } catch (error) {
      logger.error(`[${job.id}] [${this.name}] Step failed`, {
        jobId: job.id,
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Pulls users from Jira Server API with pagination support.
   *
   * @param client - The Jira V2 service client for making API calls
   * @param startAt - The pagination offset (0-based index)
   * @param jobId - The import job ID for logging purposes
   * @returns Paginated result containing user items and hasMore flag
   */
  protected async pull(jobContext: TJobContext, client: JiraV2Service, startAt: number, jobId: string) {
    const { job } = jobContext;

    try {
      const result = await pullUsersV2({
        client,
        startAt,
        maxResults: this.PAGE_SIZE,
      });

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.USER,
        phase: "PULL_USERS",
        level: EExecutionLogLevel.INFO,
        metrics: {
          pulled: result.items.length,
          total: result.total,
        },
      });

      logger.info(`[${jobId}] [${this.name}] Pulled users`, {
        jobId,
        count: result.items.length,
        hasMore: result.hasMore,
        startAt,
      });

      return result;
    } catch (error) {
      logger.error(`[${job.id}][USERS] Unable to pull users from plane`, error);

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.USER,
        phase: "PLANE PULL USERS",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        is_fatal: true,
      });

      throw error;
    }
  }

  private createMockPaginationPayload(): PaginatedResult<any> {
    return {
      items: [],
      hasMore: false,
      total: 0,
      startAt: 0,
      maxResults: this.PAGE_SIZE,
    };
  }

  /**
   * Transforms Jira Server users to Plane user format.
   *
   * @param jiraUsers - Array of users imported from Jira Server
   * @returns Array of users in Plane format ready for creation
   */
  private transform(jiraUsers: ImportedJiraUser[]) {
    return jiraUsers.map((user) => transformUser(user));
  }

  /**
   * Pushes users to Plane, creating only new ones that don't already exist.
   *
   * Performs deduplication by comparing against existing Plane users via email.
   * After creating new users, stores mappings from email to Plane user ID
   * for use by dependent import steps (e.g., issue assignment).
   *
   * @param jobContext - The job context containing Plane client and job details
   * @param transformedUsers - Array of transformed users ready to be created
   * @param storage - Storage service for persisting email-to-ID mappings
   * @returns The number of users successfully created in Plane
   */
  private async push(
    jobContext: TJobContext,
    transformedUsers: Partial<PlaneUser>[],
    storage: IStorageService
  ): Promise<number> {
    const { planeClient, job } = jobContext;

    const existingUsers = await this.fetchExistingUsers(planeClient, job, transformedUsers);

    executionLog.collect(job.id, {
      entity_type: EExecutionLogEntityType.USER,
      level: EExecutionLogLevel.INFO,
      metrics: {
        already_existed: existingUsers.length,
      },
    });

    const usersToCreate = this.extractNewUsers(transformedUsers, existingUsers);

    logger.info(`[${job.id}] [${this.name}] User deduplication`, {
      jobId: job.id,
      pulled: transformedUsers.length,
      existing: existingUsers.length,
      toCreate: usersToCreate.length,
    });

    const createdUsers = await this.dispatchUserCreation(job.id, usersToCreate, job.workspace_slug, job.project_id);

    await this.dispatchStoreMappings(job.id, existingUsers, createdUsers, storage);

    return createdUsers.length;
  }

  /**
   * Fetches all existing users from Plane workspace.
   *
   * @param planeClient - The Plane SDK client
   * @param job - The import job containing workspace and project info
   * @returns Array of existing Plane users
   */
  private async fetchExistingUsers(
    planeClient: PlaneClient,
    job: TImportJob<JiraConfig>,
    transformedUsers: Partial<PlaneUser>[]
  ): Promise<PlaneUser[]> {
    try {
      const existingUsers = await withCache(
        this.name,
        job,
        async () => await protect(planeClient.users.list.bind(planeClient.users), job.workspace_slug, job.project_id)
      );

      /*
       * Say if a user already have an account in plane and he is just not part of the
       * workspace, in that case we're adding him to the workspace member, but we can't
       * expect to update him display name. Hence if we're mapping anything using the
       * display name, there will be a mismatch between the existing user display name
       * and imported user display name, and you'll never find the exact match.
       */
      return existingUsers.map((existingUser) => {
        const existingUserEmail = existingUser.email;
        const externalSourceUser = transformedUsers.find(
          (transformedUser) => transformedUser.email === existingUserEmail
        );

        if (externalSourceUser) {
          return {
            ...existingUser,
            display_name: externalSourceUser.display_name ?? existingUser.display_name,
          };
        } else {
          return existingUser;
        }
      });
    } catch (error) {
      logger.error(`[${job.id}] Unable to pull existing users from plane`, error);
      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.USER,
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
      });
      return [];
    }
  }

  /**
   * Extracts users that don't exist in Plane by comparing emails.
   *
   * @param transformedUsers - Users transformed from Jira format
   * @param existingUsers - Current users in Plane workspace
   * @returns Filtered array of users that need to be created
   */
  private extractNewUsers(transformedUsers: Partial<PlaneUser>[], existingUsers: PlaneUser[]): Partial<PlaneUser>[] {
    return transformedUsers.filter((user) => !existingUsers.find((existing) => existing.email === user.email));
  }

  /**
   * Dispatches user creation to Plane if there are users to create.
   *
   * @param jobId - The import job ID
   * @param usersToCreate - Array of users to create
   * @param planeClient - The Plane SDK client
   * @param credentials - Authentication credentials
   * @param workspaceSlug - Target workspace slug
   * @param projectId - Target project ID
   * @returns Array of successfully created users
   */
  private async dispatchUserCreation(
    jobId: string,
    usersToCreate: Partial<PlaneUser>[],
    workspaceSlug: string,
    projectId: string
  ): Promise<PlaneUser[]> {
    if (usersToCreate.length === 0) {
      return [];
    }

    const apiClient = getAPIClientInternal();
    const bulkResponse = await apiClient.member.bulkCreateProjectMembers(
      workspaceSlug,
      projectId,
      usersToCreate as TProjectMemberBulkCreatePayload[]
    );

    logger.info(`[${jobId}] [${this.name}] Bulk create response`, {
      jobId,
      usersToCreate: usersToCreate.length,
      created: bulkResponse.created.length,
      errored: bulkResponse.errored.length,
    });

    return bulkResponse.created as PlaneUser[];
  }

  /**
   * Dispatches storage of user mappings (email to Plane user ID).
   *
   * @param jobId - The import job ID
   * @param existingUsers - Users that already existed in Plane
   * @param createdUsers - Users that were newly created
   * @param storage - Storage service for persisting mappings
   */
  private async dispatchStoreMappings(
    jobId: string,
    existingUsers: PlaneUser[],
    createdUsers: PlaneUser[],
    storage: IStorageService
  ): Promise<void> {
    const allUsers = [...existingUsers, ...createdUsers];

    /*
     * In jira cloud, we don't have access to user emails, hence insead
     * of poluting the space with multiple mappings and if else conditions
     * we are using a merge of displayName and email, in case of transformation
     * if the email is not present, we can fallback to displayName, which can be
     * expected to be present in the mapping.
     */
    const mappings = allUsers
      .filter((user) => user.email && user.id)
      .flatMap((user) => {
        const displayName = user.display_name;
        const email = user.email;

        return [
          ...(email
            ? [
                {
                  externalId: email,
                  planeId: user.id,
                },
              ]
            : []),
          {
            externalId: displayName,
            planeId: user.id,
          },
        ];
      });

    await storage.storeMapping(jobId, this.name, mappings);
  }
}
