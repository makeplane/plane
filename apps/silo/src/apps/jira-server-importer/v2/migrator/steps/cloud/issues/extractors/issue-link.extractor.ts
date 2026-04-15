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

import type { JiraService } from "@plane/etl/jira";
import type { JiraV2Service } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import { isAxiosError } from "axios";
import type { TKnownFieldMapping } from "@/apps/jira-server-importer/v2/types";
import { JiraIssueLinkExtractor } from "../../../shared/issues/extractors/issue-link.extractor";

export class JiraCloudIssueLinkExtractor extends JiraIssueLinkExtractor {
  private readonly jiraCloudClient: JiraService;

  constructor(
    jiraCloudClient: JiraService,
    projectId: string,
    resourceId: string,
    knownCustomFieldMapping: TKnownFieldMapping[],
    epicsAsWorkItems: boolean,
    jiraProjectKey: string
  ) {
    super(
      jiraCloudClient as unknown as JiraV2Service,
      projectId,
      resourceId,
      knownCustomFieldMapping,
      epicsAsWorkItems,
      jiraProjectKey
    );
    this.jiraCloudClient = jiraCloudClient;
  }

  protected async resolveIssueId(issueKeyToResolve: string, issueKey: string): Promise<string | undefined> {
    if (this.issueKeyCache.has(issueKeyToResolve)) {
      return this.issueKeyCache.get(issueKeyToResolve);
    }

    try {
      const searchResult = await this.jiraCloudClient.getProjectIssues(
        issueKeyToResolve.split("-").slice(0, -1).join("-"),
        undefined,
        undefined,
        `KEY = ${issueKeyToResolve}`
      );

      if (searchResult?.issues?.length) {
        const id = searchResult.issues[0].id;
        this.issueKeyCache.set(issueKeyToResolve, id);
        return id;
      }

      logger.warn(
        `Could not resolve issue key ${issueKeyToResolve} for issue ${issueKey}: No issues found matching that key.`
      );
    } catch (error) {
      if (isAxiosError(error)) {
        logger.warn(`Error resolving issue key ${issueKeyToResolve} for issue ${issueKey}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        logger.error(`Unexpected error resolving issue key ${issueKeyToResolve} for issue ${issueKey}`, error);
      }
    }

    return undefined;
  }
}
