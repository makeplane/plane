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

import type { TJobContext } from "@/apps/jira-server-importer/v2/types";
import { JiraStatesStep } from "../../shared";
import type { JiraConfig } from "@plane/etl/jira";
import { createJiraClient } from "@/apps/jira-importer/helpers/migration-helpers";
import { getJobCredentials } from "@/helpers/job";
import type { StatusDetails } from "jira.js/out/version3/models";

/**
 * @overview
 * Jira Cloud specific implementation for the states migration step.
 * Overrides the `pull` method to handle the differences in Jira Cloud's project status API.
 */
export class JiraCloudStatesStep extends JiraStatesStep {
  /**
   * Fetches project statuses for Jira Cloud.
   * Jira Cloud returns a hierarchical structure (issue types -> statuses),
   * which this method flattens into a unique list of StatusDetails.
   * @param jobContext - The current job context.
   * @returns A promise resolving to a unique array of Jira StatusDetails.
   */
  protected async pull(jobContext: TJobContext): Promise<StatusDetails[]> {
    const { job } = jobContext;
    const credentials = await getJobCredentials(job);
    const client = createJiraClient(job, credentials);

    const jobConfig = job.config as JiraConfig;
    const jiraProjectId = jobConfig.project.id;

    if (!jiraProjectId) {
      throw new Error(`[${job.id}] Assertion Failed Jira project ID is required`);
    }

    const jiraStates = await client.getProjectStatuses(jiraProjectId);
    const allStatuses = jiraStates.flatMap((item) => item.statuses);
    return Array.from(new Map(allStatuses.map((status) => [status.id, status])).values());
  }
}
