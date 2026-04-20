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

import type { Changelog } from "jira.js/out/version2/models/index.js";
import type { IJiraIssue, TTransformationMaps } from "@plane/etl/jira-server";
import type { ExIssueActivity } from "@plane/sdk";
import type { E_IMPORTER_KEYS } from "@plane/etl/core";
import { transformActivityItem } from "@plane/etl/jira-server";

/**
 * Responsibility: Extract and transform issue activities (changelog) from Jira issues.
 * Changelog histories are already present on IJiraIssue, so no additional API calls are needed.
 */
export class JiraIssueActivityExtractor {
  constructor(
    private readonly projectId: string,
    private readonly resourceId: string,
    private readonly source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA,
    private readonly transformationMaps: TTransformationMaps
  ) {}

  public extract(issue: IJiraIssue): Partial<ExIssueActivity>[] {
    const histories = issue.changelog?.histories ?? [];
    const results: Partial<ExIssueActivity>[] = [];

    for (const history of histories) {
      results.push(...this.transformActivity(issue.id, history));
    }

    const defaultIssueCreatedActivity: Partial<ExIssueActivity> = {
      issue: `${this.projectId}_${this.resourceId}_${issue.id}`,
      external_source: this.source,
      external_id: `${this.projectId}_${this.resourceId}_${issue.id}_created`,
      verb: "created",
      old_value: "",
      new_value: "",
      comment: "created the issue",
      actor: issue?.fields?.creator?.emailAddress || issue?.fields?.creator?.displayName,
      created_at: issue?.fields?.created,
    };

    return [defaultIssueCreatedActivity, ...results];
  }

  private transformActivity(jiraIssueId: string, history: Changelog): Partial<ExIssueActivity>[] {
    const baseFields = {
      issue: `${this.projectId}_${this.resourceId}_${jiraIssueId}`,
      external_source: this.source,
      actor: history.author?.emailAddress || history.author?.displayName,
      created_at: history.created,
    };

    const results: Partial<ExIssueActivity>[] = [];

    for (const item of history.items ?? []) {
      const mapped = transformActivityItem(item, this.resourceId, this.projectId, this.transformationMaps);
      if (!mapped) continue;

      mapped.forEach((activityItem) => {
        results.push({
          ...baseFields,
          ...activityItem,
          external_id: `${this.projectId}_${this.resourceId}_${jiraIssueId}_${history.id}_${activityItem.field}`,
        });
      });
    }

    return results;
  }
}
