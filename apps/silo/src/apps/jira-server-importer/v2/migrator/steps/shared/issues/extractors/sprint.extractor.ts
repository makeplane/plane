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

import type { IJiraIssue } from "@plane/etl/jira-server";
import { buildExternalId } from "@/apps/jira-server-importer/v2/helpers/job";
import { detectSprintFieldId, parseJiraServerSprint } from "@/apps/jira-server-importer/v2/helpers/sprints";

/**
 * Responsibility: Extract sprint associations from a Jira issue.
 */
export class JiraSprintExtractor {
  constructor(
    protected readonly projectId: string,
    protected readonly resourceId: string
  ) {}

  public extract(issue: IJiraIssue): string[] {
    const sprintFieldKey = detectSprintFieldId(issue);
    const sprintFieldValue = sprintFieldKey ? issue.fields[sprintFieldKey] : null;
    const sprintObjects = sprintFieldValue
      ? Array.isArray(sprintFieldValue)
        ? sprintFieldValue.map((s) => parseJiraServerSprint(s))
        : [parseJiraServerSprint(sprintFieldValue)]
      : null;

    return sprintObjects
      ? sprintObjects
          .map((s) => (s ? buildExternalId(this.projectId, this.resourceId, s.id.toString()) : null))
          .filter((s) => s !== null)
      : [];
  }
}
