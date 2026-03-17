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
import { JiraSprintExtractor } from "../../../shared/issues/extractors/sprint.extractor";
import { buildExternalId } from "@/apps/jira-server-importer/v2/helpers/job";

export class JiraCloudSprintExtractor extends JiraSprintExtractor {
  constructor(projectId: string, resourceId: string) {
    super(projectId, resourceId);
  }

  public extract(issue: IJiraIssue): string[] {
    /* We go through the issue fields and find the custom field that matches
     * the definition of a sprint, which should be an array of objects, and
     * each object should contain boardId, name, startDate, endDate, and state
     */

    const isSprintField = (
      value: any
    ): value is { boardId: string; id: string; name: string; startDate: string; endDate: string; state: string }[] =>
      Array.isArray(value) &&
      value.length > 0 &&
      value[0].boardId &&
      value[0].id &&
      value[0].name &&
      value[0].startDate &&
      value[0].endDate &&
      value[0].state;

    for (const [fieldKey, fieldValue] of Object.entries(issue.fields)) {
      if (!fieldKey.startsWith("customfield_")) continue;
      if (isSprintField(fieldValue)) {
        // Handle both array and non-array cases
        const sprints = fieldValue;
        return sprints.map((s: any) => buildExternalId(this.projectId, this.resourceId, s.id.toString()));
      }
    }

    return [];
  }
}
