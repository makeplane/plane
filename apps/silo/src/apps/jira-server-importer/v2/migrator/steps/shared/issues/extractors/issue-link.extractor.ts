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

import type { IJiraIssue, JiraV2Service } from "@plane/etl/jira-server";
import { buildExternalId } from "@/apps/jira-server-importer/v2/helpers/job";
import type { TIssueRelationsData, TKnownFieldMapping } from "@/apps/jira-server-importer/v2/types";
import { logger } from "@plane/logger";
import { isAxiosError } from "axios";
import { KNOWN_CUSTOM_FIELDS } from "@/apps/jira-server-importer/v2/helpers/constants";

export type TIssueRelationMapping = TIssueRelationsData["relationships"];

/**
 * POC: Jira Issue Link Extractor
 * Responsibility: Extract all relation mappings (Parent, Blocks, Relates, etc.) from a single Jira issue
 */
export class JiraIssueLinkExtractor {
  issueKeyCache: Map<string, string> = new Map();

  constructor(
    private readonly jiraClient: JiraV2Service,
    private readonly projectId: string,
    private readonly resourceId: string,
    private readonly knownCustomFieldMapping: TKnownFieldMapping[]
  ) {}

  /**
   * Extracts relations for a single issue
   * @param issue IJiraIssue
   * @returns TIssueRelationMapping
   */
  public async extract(issue: IJiraIssue): Promise<TIssueRelationMapping> {
    // 1. Initial categorization
    const blocking: string[] = [];
    const is_blocked_by: string[] = [];
    const relates_to: string[] = [];
    let duplicate_of: string | undefined = undefined;

    // 2. Parent extraction (Standard parent)
    let parent = issue.fields.parent?.id
      ? buildExternalId(this.projectId, this.resourceId, issue.fields.parent.id)
      : undefined;

    // 3. Epic Link handling (Nuanced)
    const epicField = this.knownCustomFieldMapping.find((f) => f.data.name === KNOWN_CUSTOM_FIELDS.EPIC_LINK);
    if (epicField && epicField.data.id) {
      const epicLinkKey = issue.fields[epicField.data.id as keyof typeof issue.fields] as string;

      if (epicLinkKey) {
        const epicId = await this.resolveEpicId(epicLinkKey, issue.key);

        if (epicId) {
          const epicExternalId = buildExternalId(this.projectId, this.resourceId, epicId);
          if (!parent) {
            parent = epicExternalId;
          } else {
            relates_to.push(epicExternalId);
          }
        }
      }
    }

    // 4. Issue Links extraction (Categorized or Catch-all)
    const issuelinks = issue.fields.issuelinks;

    if (issuelinks) {
      issuelinks.forEach((link) => {
        const linkTypeName = link.type?.name;

        if (linkTypeName === "Blocks") {
          if (link.outwardIssue?.id) {
            blocking.push(buildExternalId(this.projectId, this.resourceId, link.outwardIssue.id));
          }
          if (link.inwardIssue?.id) {
            is_blocked_by.push(buildExternalId(this.projectId, this.resourceId, link.inwardIssue.id));
          }
        } else if (linkTypeName === "Duplicate") {
          if (link.outwardIssue?.id) {
            duplicate_of = buildExternalId(this.projectId, this.resourceId, link.outwardIssue.id);
          }
        } else {
          // Catch-all: "Relates" and any unknown link types (e.g., "Idea")
          if (link.outwardIssue?.id) {
            relates_to.push(buildExternalId(this.projectId, this.resourceId, link.outwardIssue.id));
          }
          if (link.inwardIssue?.id) {
            relates_to.push(buildExternalId(this.projectId, this.resourceId, link.inwardIssue.id));
          }
        }
      });
    }

    return {
      parent,
      blocking,
      is_blocked_by,
      relates_to,
      duplicate_of: duplicate_of ?? "",
    };
  }

  /**
   * Resolves the internal Jira ID for an epic given its key (e.g., PROJ-123)
   * Uses a cache to avoid redundant API calls
   * @param epicLinkKey string
   * @param issueKey string (for logging purposes)
   * @returns Promise<string | undefined>
   */
  private async resolveEpicId(epicLinkKey: string, issueKey: string): Promise<string | undefined> {
    // 1. Check if the ID is already in our cache
    if (this.issueKeyCache.has(epicLinkKey)) {
      return this.issueKeyCache.get(epicLinkKey);
    }

    // 2. Not in cache, so fetch from Jira
    try {
      const epicSearchResult = await this.jiraClient.getProjectIssues(
        this.projectId,
        undefined,
        undefined,
        undefined,
        `KEY = ${epicLinkKey}`
      );

      if (epicSearchResult?.issues?.length) {
        const epicId = epicSearchResult.issues[0].id;
        this.issueKeyCache.set(epicLinkKey, epicId);
        return epicId;
      }

      logger.warn(
        `Could not resolve epic key ${epicLinkKey} for issue ${issueKey}: No issues found matching that key.`
      );
    } catch (error) {
      if (isAxiosError(error)) {
        logger.warn(`Error resolving epic key ${epicLinkKey} for issue ${issueKey}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        logger.error(`Unexpected error resolving epic key ${epicLinkKey} for issue ${issueKey}`, error);
      }
    }

    return undefined;
  }
}
