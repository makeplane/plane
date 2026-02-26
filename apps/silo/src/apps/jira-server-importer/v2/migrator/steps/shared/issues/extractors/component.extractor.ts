/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { IJiraIssue } from "@plane/etl/jira-server";
import { buildExternalId } from "@/apps/jira-server-importer/v2/helpers/job";

/**
 * Responsibility: Extract component associations from a Jira issue.
 */
export class JiraComponentExtractor {
  constructor(
    private readonly projectId: string,
    private readonly resourceId: string
  ) {}

  public extract(issue: IJiraIssue): string[] {
    const components = issue.fields.components;
    if (!components) return [];

    return components
      .map((c) => (c.id ? buildExternalId(this.projectId, this.resourceId, c.id) : null))
      .filter((c) => c !== null) as string[];
  }
}
