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

import type { E_IMPORTER_KEYS, TIssuePropertyValuesPayload } from "@plane/etl/core";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import type { IJiraIssue, JiraConfig, JiraIssueField, JiraV2Service } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import type { ExIssueComment, ExIssueProperty, ExIssuePropertyOption, TWorklog } from "@plane/sdk";
import type { TImportJob } from "@plane/types";
import { getTransformedIssuePropertyValuesV2 } from "@/apps/jira-server-importer/migrator/transformers";
import { buildExternalId, extractJobData } from "@/apps/jira-server-importer/v2/helpers/job";
import type {
  TIssueRelationsData,
  TIssuesAssociationsData,
  TIssueTypesData,
  TKnownFieldMapping,
} from "@/apps/jira-server-importer/v2/types";
import { JiraCommentExtractor } from "./comment.extractor";
import { JiraComponentExtractor } from "./component.extractor";
import { JiraIssueLinkExtractor } from "./issue-link.extractor";
import { JiraSprintExtractor } from "./sprint.extractor";
import { JiraWorklogExtractor } from "./worklog.extractor";

export type TExtractionProps = {
  job: TImportJob<JiraConfig>;
  sourceClient: JiraV2Service;
  source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA;
  issues: IJiraIssue[];
  propertyData: {
    issueTypes: TIssueTypesData;
    planeIssueProperties: ExIssueProperty[];
    planeIssuePropertiesOptions: ExIssuePropertyOption[];
  };
  additionalData: {
    rawFields: JiraIssueField[];
    knownCustomFieldMapping: TKnownFieldMapping[];
  };
};

export type TUnifiedExtractionResult = {
  issues: IJiraIssue[];
  comments: Partial<ExIssueComment>[];
  propertyValues: TIssuePropertyValuesPayload;
  associations: TIssuesAssociationsData;
  relations: TIssueRelationsData[];
};

/**
 * Orchestrator: Jira Issue Data Extractor
 * Responsibility: Run all extractors and provide unified data for the issue step
 */
export class JiraIssueDataExtractor {
  public async extractAll(props: TExtractionProps): Promise<TUnifiedExtractionResult> {
    const { job, sourceClient, source, issues, propertyData, additionalData } = props;
    const { projectId, resourceId } = extractJobData(job);

    // 1. Instantiate sub-extractors
    const commentExtractor = this.getCommentExtractor(resourceId, projectId, source);
    const sprintExtractor = this.getSprintExtractor(projectId, resourceId);
    const componentExtractor = this.getComponentExtractor(projectId, resourceId);
    const worklogExtractor = this.getWorklogExtractor();
    const linkExtractor = this.getLinkExtractor(
      sourceClient,
      projectId,
      resourceId,
      additionalData.knownCustomFieldMapping
    );

    // 2. Batch Extraction: Comments
    const comments = await commentExtractor.extract(job.id, sourceClient, issues);

    // 3. Transformation: Property Values
    const propertyValues = getTransformedIssuePropertyValuesV2(
      job,
      issues,
      additionalData.rawFields,
      propertyData.planeIssueProperties,
      propertyData.issueTypes
    );

    // 4. Per-Issue Extraction: Associations & Relations
    const cycles = new Map<string, string[]>();
    const modules = new Map<string, string[]>();
    const worklogs = new Map<string, Partial<TWorklog>[]>();
    const relations: TIssueRelationsData[] = [];

    let totalCycleAssociations = 0;
    let totalModuleAssociations = 0;
    let totalWorklogs = 0;

    for (const issue of issues) {
      const issueExternalId = buildExternalId(projectId, resourceId, issue.id);

      // Associations
      const sprintExternalIds = sprintExtractor.extract(issue);
      const componentExternalIds = componentExtractor.extract(issue);
      const issueWorklogs = await worklogExtractor.extract(job.id, sourceClient, issue);

      cycles.set(issueExternalId, sprintExternalIds);
      modules.set(issueExternalId, componentExternalIds);
      worklogs.set(issueExternalId, issueWorklogs);

      totalCycleAssociations += sprintExternalIds.length;
      totalModuleAssociations += componentExternalIds.length;
      totalWorklogs += issueWorklogs.length;

      // Relations
      const relationships = await linkExtractor.extract(issue);
      if (
        relationships.parent ||
        relationships.blocking.length > 0 ||
        relationships.is_blocked_by.length > 0 ||
        relationships.relates_to.length > 0 ||
        relationships.duplicate_of
      ) {
        relations.push({
          external_id: issueExternalId,
          relationships,
        });
      }
    }

    // 5. Metrics Collection
    this.collectMetrics({
      job,
      issues,
      comments,
      propertyValues,
      relations,
      totalCycleAssociations,
      totalModuleAssociations,
      totalWorklogs,
      cycles,
      modules,
      worklogs,
    });

    return {
      issues,
      comments,
      propertyValues,
      associations: { cycles, modules, worklogs },
      relations,
    };
  }

  // --- Protected getter methods for sub-extractors ---

  protected getCommentExtractor(
    resourceId: string,
    projectId: string,
    source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA
  ): JiraCommentExtractor {
    return new JiraCommentExtractor(resourceId, projectId, source);
  }

  protected getSprintExtractor(projectId: string, resourceId: string): JiraSprintExtractor {
    return new JiraSprintExtractor(projectId, resourceId);
  }

  protected getComponentExtractor(projectId: string, resourceId: string): JiraComponentExtractor {
    return new JiraComponentExtractor(projectId, resourceId);
  }

  protected getWorklogExtractor(): JiraWorklogExtractor {
    return new JiraWorklogExtractor();
  }

  protected getLinkExtractor(
    sourceClient: JiraV2Service,
    projectId: string,
    resourceId: string,
    knownCustomFieldMapping: TKnownFieldMapping[]
  ): JiraIssueLinkExtractor {
    return new JiraIssueLinkExtractor(sourceClient, projectId, resourceId, knownCustomFieldMapping);
  }

  private collectMetrics(props: {
    job: TImportJob<JiraConfig>;
    issues: IJiraIssue[];
    comments: Partial<ExIssueComment>[];
    propertyValues: TIssuePropertyValuesPayload;
    relations: TIssueRelationsData[];
    totalCycleAssociations: number;
    totalModuleAssociations: number;
    totalWorklogs: number;
    cycles: Map<string, string[]>;
    modules: Map<string, string[]>;
    worklogs: Map<string, Partial<TWorklog>[]>;
  }) {
    const { job, issues, comments, propertyValues, relations } = props;

    // Property Values Metrics
    const totalPropertyValues = Object.values(propertyValues).reduce(
      (sum, vals) => sum + (Array.isArray(vals) ? vals.length : 0),
      0
    );

    executionLog.collect(job.id, {
      entity_type: EExecutionLogEntityType.ISSUE_PROPERTY_VALUE,
      phase: "PROCESS_ISSUES_PROPERTY_VALUE",
      level: EExecutionLogLevel.INFO,
      ignore_summarization: true,
      metrics: { pulled: totalPropertyValues },
      additional_data: {
        processedIssues: issues.length,
        extractedComments: comments.length,
        issuesWithPropertyValues: Object.keys(propertyValues).length,
        totalPropertyValues,
      },
    });

    // Relations Metrics
    const relationshipCounts = {
      parent: 0,
      blocking: 0,
      blocked_by: 0,
      relates_to: 0,
      duplicate_of: 0,
    };

    relations.forEach((rel) => {
      if (rel.relationships.parent) relationshipCounts.parent++;
      relationshipCounts.blocking += rel.relationships.blocking.length;
      relationshipCounts.blocked_by += rel.relationships.is_blocked_by.length;
      relationshipCounts.relates_to += rel.relationships.relates_to.length;
      if (rel.relationships.duplicate_of) relationshipCounts.duplicate_of++;
    });

    executionLog.collect(job.report_id, {
      entity_type: EExecutionLogEntityType.WORK_ITEM_RELATIONS,
      phase: "EXTRACT_RELATIONS",
      ignore_summarization: true,
      level: EExecutionLogLevel.INFO,
      metrics: { pulled: relations.length },
      additional_data: {
        issuesWithRelations: relations.length,
        relationshipCounts,
      },
    });

    // Associations Metrics
    executionLog.collect(job.report_id, {
      entity_type: EExecutionLogEntityType.WORK_ITEM,
      phase: "EXTRACT_ASSOCIATIONS",
      ignore_summarization: true,
      level: EExecutionLogLevel.INFO,
      additional_data: {
        issuesWithCycles: Array.from(props.cycles.values()).filter((c) => c.length > 0).length,
        issuesWithModules: Array.from(props.modules.values()).filter((m) => m.length > 0).length,
        issuesWithWorklogs: Array.from(props.worklogs.values()).filter((w) => w.length > 0).length,
        totalCycleAssociations: props.totalCycleAssociations,
        totalModuleAssociations: props.totalModuleAssociations,
        totalWorklogs: props.totalWorklogs,
      },
    });

    logger.info(`[${job.id}] [JiraIssueDataExtractor] Extraction completed`, {
      issues: issues.length,
      comments: comments.length,
      relations: relations.length,
    });
  }
}
