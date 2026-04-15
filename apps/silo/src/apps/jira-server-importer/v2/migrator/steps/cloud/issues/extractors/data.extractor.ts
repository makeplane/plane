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

import type { JiraConfig as JiraCloudConfig } from "@plane/etl/jira";
import type { JiraConfig, JiraV2Service } from "@plane/etl/jira-server";
import type { TImportJob } from "@plane/types";
import { createJiraClient } from "@/apps/jira-importer/helpers/migration-helpers";
import type { TKnownFieldMapping } from "@/apps/jira-server-importer/v2/types";
import { getJobCredentials } from "@/helpers/job";
import { JiraIssueDataExtractor } from "../../../shared/issues/extractors/data.extractor";
import type { JiraIssueLinkExtractor } from "../../../shared/issues/extractors/issue-link.extractor";
import type { JiraSprintExtractor } from "../../../shared/issues/extractors/sprint.extractor";
import { JiraCloudIssueLinkExtractor } from "./issue-link.extractor";
import { JiraCloudSprintExtractor } from "./sprint.extractor";

export class JiraCloudDataExtractor extends JiraIssueDataExtractor {
  protected getSprintExtractor(projectId: string, resourceId: string): JiraSprintExtractor {
    return new JiraCloudSprintExtractor(projectId, resourceId);
  }

  protected async getLinkExtractor(
    _sourceClient: JiraV2Service,
    projectId: string,
    resourceId: string,
    knownCustomFieldMapping: TKnownFieldMapping[],
    epicsAsWorkItems: boolean,
    jiraProjectKey: string,
    job: TImportJob<JiraConfig>
  ): Promise<JiraIssueLinkExtractor> {
    const credentials = await getJobCredentials(job);
    const client = createJiraClient(job as unknown as TImportJob<JiraCloudConfig>, credentials);
    return new JiraCloudIssueLinkExtractor(
      client,
      projectId,
      resourceId,
      knownCustomFieldMapping,
      epicsAsWorkItems,
      jiraProjectKey
    );
  }
}
