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

import type { Worklog } from "jira.js/out/version2/models/index.js";
import { pullAllWorklogsForIssue } from "@plane/etl/jira-server";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import type { IJiraIssue, JiraV2Service } from "@plane/etl/jira-server";
import type { TWorklog } from "@plane/sdk";

/**
 * Responsibility: Extract worklogs from Jira issues, handling pagination and transformation.
 */
export class JiraWorklogExtractor {
  private transformWorklog = (worklog: Worklog) => ({
    description: worklog.comment ?? "",
    duration: worklog.timeSpentSeconds ? worklog.timeSpentSeconds / 60 : 0,
    logged_by: worklog.author?.emailAddress || worklog.author?.displayName,
    created_at: worklog.created,
    updated_at: worklog.updated,
  });

  public async extract(jobId: string, client: JiraV2Service, issue: IJiraIssue): Promise<Partial<TWorklog>[]> {
    const totalWorklogCount = issue.fields.worklog.total;
    const pulledWorklogsCount = issue.fields?.worklog?.worklogs?.length || 0;

    let worklogs: Worklog[] = [];

    if (totalWorklogCount > pulledWorklogsCount) {
      worklogs = await pullAllWorklogsForIssue(issue, client);
    } else {
      worklogs = (issue.fields?.worklog?.worklogs || []).map((worklog, index) => {
        const comment =
          typeof worklog.comment === "string"
            ? worklog.comment
            : issue.renderedFields?.worklog?.worklogs?.[index]?.comment;
        return { ...worklog, comment } as Worklog;
      });
    }

    executionLog.collect(jobId, {
      entity_type: EExecutionLogEntityType.WORK_LOG,
      phase: "PULL_ALL_WORKLOG",
      level: EExecutionLogLevel.INFO,
      related_entity: issue.id,
      metrics: {
        pulled: totalWorklogCount,
      },
    });

    return worklogs.map(this.transformWorklog);
  }
}
