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
import { getKnownFieldIds } from "@/apps/jira-server-importer/v2/helpers/known-fields";
import type {
  TCrossProjectRelation,
  TCustomRelationData,
  TIssueRelationsData,
  TKnownFieldMapping,
} from "@/apps/jira-server-importer/v2/types";
import { logger } from "@plane/logger";
import { isAxiosError } from "axios";

export type TIssueRelationMapping = TIssueRelationsData["relationships"];

export type TIssueLinkExtractionResult = {
  relationships: TIssueRelationMapping;
  crossProjectRelations: TCrossProjectRelation[];
};

/**
 * Extracts the Jira project key from an issue key (e.g., "ALPHA-123" → "ALPHA")
 */
const getProjectKey = (issueKey: string): string => issueKey.split("-").slice(0, -1).join("-");

/**
 * Jira Issue Link Extractor
 * Extracts all relation mappings (Parent, Blocks, Relates, etc.) from a single Jira issue.
 * Detects cross-project links and returns them separately for WEC-based resolution.
 *
 * Cross-project relations use the convention:
 * - currentIssue = the issue being imported now
 * - otherIssue = the linked issue in a different Jira project
 * - relationType = relationship FROM current TO other
 */
export class JiraIssueLinkExtractor {
  issueKeyCache: Map<string, string> = new Map();

  constructor(
    protected readonly jiraClient: JiraV2Service,
    protected readonly projectId: string,
    protected readonly resourceId: string,
    protected readonly knownCustomFieldMapping: TKnownFieldMapping[],
    protected readonly epicsAsWorkItems: boolean,
    protected readonly jiraProjectKey: string
  ) {}

  /**
   * Extracts relations for a single issue, separating same-project and cross-project links
   */
  public async extract(issue: IJiraIssue): Promise<TIssueLinkExtractionResult> {
    const blocking: string[] = [];
    const is_blocked_by: string[] = [];
    const relates_to: string[] = [];
    let duplicate_of: string | undefined = undefined;
    const custom_relations: TCustomRelationData[] = [];
    const crossProjectRelations: TCrossProjectRelation[] = [];

    // Parent extraction (Standard parent)
    let parent = issue.fields.parent?.id
      ? buildExternalId(this.projectId, this.resourceId, issue.fields.parent.id)
      : undefined;

    // Check if parent is cross-project
    if (issue.fields.parent?.key) {
      const parentProjectKey = getProjectKey(issue.fields.parent.key);
      if (parentProjectKey !== this.jiraProjectKey) {
        // Cross-project parent: other issue is the parent of current issue
        parent = undefined;
        crossProjectRelations.push({
          currentIssueId: issue.id,
          currentIssueKey: issue.key,
          otherIssueId: issue.fields.parent.id,
          otherIssueKey: issue.fields.parent.key,
          otherProjectKey: parentProjectKey,
          relationType: "parent",
        });
      }
    }

    // 3. Epic Link handling (Nuanced)
    const epicFieldIds = getKnownFieldIds(this.knownCustomFieldMapping, "EPIC_LINK");
    for (const epicFieldId of epicFieldIds) {
      const epicLinkKey = issue.fields[epicFieldId as keyof typeof issue.fields] as string;

      if (epicLinkKey) {
        const epicProjectKey = getProjectKey(epicLinkKey);
        const isCrossProject = epicProjectKey !== this.jiraProjectKey;

        const epicId = await this.resolveIssueId(epicLinkKey, issue.key);

        if (epicId) {
          if (isCrossProject) {
            // Cross-project epic link → store as cross-project parent (or relates_to if parent already set)
            crossProjectRelations.push({
              currentIssueId: issue.id,
              currentIssueKey: issue.key,
              otherIssueId: epicId,
              otherIssueKey: epicLinkKey,
              otherProjectKey: epicProjectKey,
              relationType: parent ? "relates_to" : "parent",
            });
          } else {
            const epicExternalId = buildExternalId(this.projectId, this.resourceId, epicId);
            if (!parent) {
              parent = epicExternalId;
            } else {
              logger.warn(
                `[Jira] Issue ${issue.key} has both a standard parent and an Epic Link. Treating Epic Link as a relation.`,
                { parent, epicLinkKey }
              );
              relates_to.push(epicExternalId);
            }
          }
          break; // Found a value, skip other possible Epic Link fields
        }
      }
    }

    // 4. JPO Parent handling (Parent Link)
    const jpoParentFieldIds = getKnownFieldIds(this.knownCustomFieldMapping, "PARENT");
    for (const jpoParentFieldId of jpoParentFieldIds) {
      const jpoParentKey = issue.fields[jpoParentFieldId as keyof typeof issue.fields] as string;

      if (jpoParentKey) {
        const jpoParentProjectKey = getProjectKey(jpoParentKey);
        const isCrossProject = jpoParentProjectKey !== this.jiraProjectKey;

        const jpoParentId = await this.resolveIssueId(jpoParentKey, issue.key);

        if (jpoParentId) {
          if (isCrossProject) {
            crossProjectRelations.push({
              currentIssueId: issue.id,
              currentIssueKey: issue.key,
              otherIssueId: jpoParentId,
              otherIssueKey: jpoParentKey,
              otherProjectKey: jpoParentProjectKey,
              relationType: parent ? "relates_to" : "parent",
            });
          } else {
            const jpoParentExternalId = buildExternalId(this.projectId, this.resourceId, jpoParentId);
            if (!parent) {
              parent = jpoParentExternalId;
            } else {
              logger.warn(
                `[Jira] Issue ${issue.key} already has a parent (${parent}). Treating JPO parent (${jpoParentKey}) as a relation.`,
                { parent, jpoParentKey }
              );
              relates_to.push(jpoParentExternalId);
            }
          }
          break; // Found a value, skip other possible Parent Link fields
        }
      }
    }

    // Epic are not visible in UI if set parent
    const shouldNotSetParent = !this.epicsAsWorkItems && issue.fields.issuetype?.name === "Epic";

    if (shouldNotSetParent) {
      parent = undefined;
    }

    // 5. Issue Links extraction (Categorized or Catch-all)
    const issuelinks = issue.fields.issuelinks;

    if (issuelinks) {
      for (const link of issuelinks) {
        const linkTypeName = link.type?.name;
        const linkedIssue = link.outwardIssue || link.inwardIssue;

        if (!linkedIssue?.id || !linkedIssue?.key) continue;

        const linkedProjectKey = getProjectKey(linkedIssue.key);
        const isCrossProject = linkedProjectKey !== this.jiraProjectKey;

        if (isCrossProject) {
          this.extractCrossProjectLink(issue, link, linkedProjectKey, crossProjectRelations);
        } else {
          // Same-project: existing logic
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
            const linkType = link.type;
            if (linkType?.id && linkType?.name) {
              // Unmapped link type → extract as custom relation
              if (link.outwardIssue?.id) {
                custom_relations.push({
                  link_external_id: link.id ? buildExternalId(this.projectId, this.resourceId, link.id) : "",
                  linked_issue_external_id: buildExternalId(this.projectId, this.resourceId, link.outwardIssue.id),
                  link_type: {
                    id: linkType.id,
                    name: linkType.name,
                    outward: linkType.outward ?? linkType.name,
                    inward: linkType.inward ?? linkType.name,
                  },
                  current_is_outward: false,
                });
              }
              if (link.inwardIssue?.id) {
                custom_relations.push({
                  link_external_id: link.id ? buildExternalId(this.projectId, this.resourceId, link.id) : "",
                  linked_issue_external_id: buildExternalId(this.projectId, this.resourceId, link.inwardIssue.id),
                  link_type: {
                    id: linkType.id,
                    name: linkType.name,
                    outward: linkType.outward ?? linkType.name,
                    inward: linkType.inward ?? linkType.name,
                  },
                  current_is_outward: true,
                });
              }
            } else {
              // No link type info available, fall back to relates_to
              if (link.outwardIssue?.id) {
                relates_to.push(buildExternalId(this.projectId, this.resourceId, link.outwardIssue.id));
              }
              if (link.inwardIssue?.id) {
                relates_to.push(buildExternalId(this.projectId, this.resourceId, link.inwardIssue.id));
              }
            }
          }
        }
      }
    }

    return {
      relationships: {
        parent,
        blocking,
        is_blocked_by,
        relates_to,
        duplicate_of: duplicate_of ?? "",
        custom_relations,
      },
      crossProjectRelations,
    };
  }

  /**
   * Extracts a cross-project link with current/other convention.
   * relationType is FROM current issue's perspective.
   */
  private extractCrossProjectLink(
    currentIssue: IJiraIssue,
    link: any,
    otherProjectKey: string,
    crossProjectRelations: TCrossProjectRelation[]
  ): void {
    const linkTypeName = link.type?.name;

    if (linkTypeName === "Blocks") {
      if (link.outwardIssue?.id) {
        // Current issue blocks outward → current "blocks" other
        crossProjectRelations.push({
          currentIssueId: currentIssue.id,
          currentIssueKey: currentIssue.key,
          otherIssueId: link.outwardIssue.id,
          otherIssueKey: link.outwardIssue.key,
          otherProjectKey,
          relationType: "blocks",
        });
      }
      if (link.inwardIssue?.id) {
        // Inward issue blocks current → current is "blocked_by" other
        crossProjectRelations.push({
          currentIssueId: currentIssue.id,
          currentIssueKey: currentIssue.key,
          otherIssueId: link.inwardIssue.id,
          otherIssueKey: link.inwardIssue.key,
          otherProjectKey,
          relationType: "blocked_by",
        });
      }
    } else if (linkTypeName === "Duplicate") {
      const linkedIssue = link.outwardIssue || link.inwardIssue;
      if (linkedIssue?.id) {
        crossProjectRelations.push({
          currentIssueId: currentIssue.id,
          currentIssueKey: currentIssue.key,
          otherIssueId: linkedIssue.id,
          otherIssueKey: linkedIssue.key,
          otherProjectKey,
          relationType: "duplicate",
        });
      }
    } else {
      // Unmapped link type → custom relation (preserves Jira link type metadata)
      const linkType = link.type;
      if (linkType?.id && linkType?.name) {
        if (link.outwardIssue?.id) {
          crossProjectRelations.push({
            currentIssueId: currentIssue.id,
            currentIssueKey: currentIssue.key,
            otherIssueId: link.outwardIssue.id,
            otherIssueKey: link.outwardIssue.key,
            otherProjectKey,
            relationType: "custom",
            linkType: {
              id: linkType.id,
              name: linkType.name,
              outward: linkType.outward ?? linkType.name,
              inward: linkType.inward ?? linkType.name,
            },
            currentIsOutward: false,
            linkId: link.id,
          });
        }
        if (link.inwardIssue?.id) {
          crossProjectRelations.push({
            currentIssueId: currentIssue.id,
            currentIssueKey: currentIssue.key,
            otherIssueId: link.inwardIssue.id,
            otherIssueKey: link.inwardIssue.key,
            otherProjectKey,
            relationType: "custom",
            linkType: {
              id: linkType.id,
              name: linkType.name,
              outward: linkType.outward ?? linkType.name,
              inward: linkType.inward ?? linkType.name,
            },
            currentIsOutward: true,
            linkId: link.id,
          });
        }
      } else {
        // No link type info available, fall back to relates_to
        const linkedIssue = link.outwardIssue || link.inwardIssue;
        if (linkedIssue?.id) {
          crossProjectRelations.push({
            currentIssueId: currentIssue.id,
            currentIssueKey: currentIssue.key,
            otherIssueId: linkedIssue.id,
            otherIssueKey: linkedIssue.key,
            otherProjectKey,
            relationType: "relates_to",
          });
        }
      }
    }
  }

  /**
   * Resolves the internal Jira ID for an issue given its key (e.g., PROJ-123)
   * Uses a cache to avoid redundant API calls
   */
  protected async resolveIssueId(issueKeyToResolve: string, issueKey: string): Promise<string | undefined> {
    // 1. Check if the ID is already in our cache
    if (this.issueKeyCache.has(issueKeyToResolve)) {
      return this.issueKeyCache.get(issueKeyToResolve);
    }

    try {
      const searchResult = await this.jiraClient.getProjectIssues(
        this.projectId,
        undefined,
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
