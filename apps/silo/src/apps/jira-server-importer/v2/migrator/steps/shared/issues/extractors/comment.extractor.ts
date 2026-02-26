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

import type { E_IMPORTER_KEYS } from "@plane/etl/core";
import { pullAllCommentsForIssue, transformComment } from "@plane/etl/jira-server";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import type { IJiraIssue, JiraV2Service } from "@plane/etl/jira-server";
import type { ExIssueComment } from "@plane/sdk";

/**
 * Responsibility: Extract comments from Jira issues, handling pagination and transformation.
 */
export class JiraCommentExtractor {
  constructor(
    private readonly resourceId: string,
    private readonly projectId: string,
    private readonly source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA
  ) {}

  public async extract(jobId: string, client: JiraV2Service, issues: IJiraIssue[]): Promise<Partial<ExIssueComment>[]> {
    const comments: Partial<ExIssueComment>[][] = [];

    for (const issue of issues) {
      const fieldsComments = issue.fields?.comment?.comments || [];
      const renderedComments = issue.renderedFields?.comment?.comments || [];
      const totalComments = issue.fields.comment?.total;

      const shouldFetchMoreComments = issue.fields.comment?.total > issue.fields.comment?.comments?.length;

      let issueComments: Partial<ExIssueComment>[] = [];

      if (shouldFetchMoreComments) {
        const allComments = await pullAllCommentsForIssue(issue, client);
        issueComments = allComments.map((comment) =>
          transformComment({ resourceId: this.resourceId, projectId: this.projectId, source: this.source }, comment)
        );
      } else {
        const renderedCommentsMap = new Map(renderedComments.map((rendered) => [rendered.id, rendered]));

        issueComments = fieldsComments.map((comment) => {
          const renderedComment = renderedCommentsMap.get(comment.id);
          // @ts-expect-error - body exists at runtime but not in type
          const body = renderedComment ? renderedComment.body : comment.body;

          const mergedComment = {
            ...comment,
            body: body,
            issue_id: issue.id,
          };

          return transformComment(
            { resourceId: this.resourceId, projectId: this.projectId, source: this.source },
            mergedComment
          );
        });
      }

      comments.push(issueComments);

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.WORK_ITEM_COMMENT,
        phase: "PULL_ALL_COMMENTS",
        level: EExecutionLogLevel.INFO,
        related_entity: issue.id,
        metrics: {
          pulled: totalComments,
        },
      });
    }

    return comments.flat();
  }
}
