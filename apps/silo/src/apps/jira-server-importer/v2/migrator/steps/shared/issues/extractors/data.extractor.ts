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
import type {
  IJiraIssue,
  JiraConfig,
  JiraIssueField,
  JiraV2Service,
  TTransformationMaps,
} from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import type { ExIssueActivity, ExIssueComment, ExIssueProperty, ExIssuePropertyOption, TWorklog } from "@plane/sdk";
import type { TImportJob } from "@plane/types";
import { getTransformedIssuePropertyValuesV2 } from "@/apps/jira-server-importer/migrator/transformers";
import { buildExternalId, extractJobData } from "@/apps/jira-server-importer/v2/helpers/job";
import type {
  TCrossProjectRelation,
  TIssueRelationsData,
  TIssuesAssociationsData,
  TIssueTypesData,
  TKnownFieldMapping,
  IStorageService,
} from "@/apps/jira-server-importer/v2/types";
import { JiraCommentExtractor } from "./comment.extractor";
import { JiraComponentExtractor } from "./component.extractor";
import { JiraIssueLinkExtractor } from "./issue-link.extractor";
import { JiraSprintExtractor } from "./sprint.extractor";
import { JiraWorklogExtractor } from "./worklog.extractor";
import { JiraSubscribersExtractor } from "./subscribers.extractor";
import { JiraIssueActivityExtractor } from "./issue-activity.extractor";
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";

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
  epicsAsWorkItems: boolean;
  storage: IStorageService;
};

export type TUnifiedExtractionResult = {
  issues: IJiraIssue[];
  comments: Partial<ExIssueComment>[];
  propertyValues: TIssuePropertyValuesPayload;
  associations: TIssuesAssociationsData;
  relations: TIssueRelationsData[];
  issueActivities: Partial<ExIssueActivity>[];
  crossProjectRelations: TCrossProjectRelation[];
};

/**
 * Orchestrator: Jira Issue Data Extractor
 * Responsibility: Run all extractors and provide unified data for the issue step
 */
export class JiraIssueDataExtractor {
  public async extractAll(props: TExtractionProps): Promise<TUnifiedExtractionResult> {
    const { job, sourceClient, source, issues, propertyData, additionalData, epicsAsWorkItems, storage } = props;
    const { projectId, resourceId } = extractJobData(job);
    const jiraProjectKey = job.config?.project?.key ?? "";

    // 1. Instantiate sub-extractors
    const commentExtractor = this.getCommentExtractor(resourceId, projectId, source);
    const sprintExtractor = this.getSprintExtractor(projectId, resourceId);
    const componentExtractor = this.getComponentExtractor(projectId, resourceId);
    const worklogExtractor = this.getWorklogExtractor();
    const linkExtractor = await this.getLinkExtractor(
      sourceClient,
      projectId,
      resourceId,
      additionalData.knownCustomFieldMapping,
      epicsAsWorkItems,
      jiraProjectKey,
      job
    );
    const subscribersExtractor = this.getSubscribersExtractor();

    const transformationMaps = await this.getIssueActivityTransformationMaps(job, storage);
    const issueActivityExtractor = this.getIssueActivityExtractor(projectId, resourceId, source, transformationMaps);

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
    const subscribers = new Map<string, string[]>();
    const relations: TIssueRelationsData[] = [];
    const allCrossProjectRelations: TCrossProjectRelation[] = [];

    let totalCycleAssociations = 0;
    let totalModuleAssociations = 0;
    let totalWorklogs = 0;

    for (const issue of issues) {
      const issueExternalId = buildExternalId(projectId, resourceId, issue.id);

      // Associations
      const sprintExternalIds = sprintExtractor.extract(issue);
      const componentExternalIds = componentExtractor.extract(issue);
      const issueWorklogs = await worklogExtractor.extract(job.id, sourceClient, issue);
      const issueSubscribers = await subscribersExtractor.extract(job.id, sourceClient, issue);

      cycles.set(issueExternalId, sprintExternalIds);
      modules.set(issueExternalId, componentExternalIds);
      worklogs.set(issueExternalId, issueWorklogs);
      subscribers.set(issueExternalId, issueSubscribers);

      totalCycleAssociations += sprintExternalIds.length;
      totalModuleAssociations += componentExternalIds.length;
      totalWorklogs += issueWorklogs.length;

      // Relations (now returns both same-project and cross-project)
      const { relationships, crossProjectRelations } = await linkExtractor.extract(issue);
      if (
        relationships.parent ||
        relationships.blocking.length > 0 ||
        relationships.is_blocked_by.length > 0 ||
        relationships.relates_to.length > 0 ||
        relationships.duplicate_of ||
        relationships.custom_relations.length > 0
      ) {
        relations.push({
          external_id: issueExternalId,
          relationships,
        });
      }

      if (crossProjectRelations.length > 0) {
        allCrossProjectRelations.push(...crossProjectRelations);
      }
    }

    // 5. Per-Issue Extraction: Issue Activities
    const issueActivities = issues.flatMap((issue) => issueActivityExtractor.extract(issue));

    // 6. Metrics Collection
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
      issueActivities,
      crossProjectRelationsCount: allCrossProjectRelations.length,
    });

    return {
      issues,
      comments,
      propertyValues,
      associations: { cycles, modules, worklogs, subscribers },
      relations,
      issueActivities,
      crossProjectRelations: allCrossProjectRelations,
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

  protected async getLinkExtractor(
    sourceClient: JiraV2Service,
    projectId: string,
    resourceId: string,
    knownCustomFieldMapping: TKnownFieldMapping[],
    epicsAsWorkItems: boolean,
    jiraProjectKey: string,
    _job: TImportJob<JiraConfig>
  ): Promise<JiraIssueLinkExtractor> {
    return new JiraIssueLinkExtractor(
      sourceClient,
      projectId,
      resourceId,
      knownCustomFieldMapping,
      epicsAsWorkItems,
      jiraProjectKey
    );
  }

  protected getIssueActivityExtractor(
    projectId: string,
    resourceId: string,
    source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA,
    transformationMaps: TTransformationMaps
  ): JiraIssueActivityExtractor {
    return new JiraIssueActivityExtractor(projectId, resourceId, source, transformationMaps);
  }

  protected getSubscribersExtractor(): JiraSubscribersExtractor {
    return new JiraSubscribersExtractor();
  }

  private async getIssueActivityTransformationMaps(
    job: TImportJob<JiraConfig>,
    storage: IStorageService
  ): Promise<TTransformationMaps> {
    const { projectId, resourceId } = extractJobData(job);
    const [userMap, issueTypeMap, cycleMap, moduleMap] = await Promise.all([
      storage.retrieveMapping(job.id, EJiraStep.USERS),
      storage.retrieveMapping(job.id, EJiraStep.ISSUE_TYPES),
      storage.retrieveMapping(job.id, EJiraStep.CYCLES),
      storage.retrieveMapping(job.id, EJiraStep.MODULES),
    ]);

    const priorityMap = new Map<string, string>();
    // external id -> plane priority map
    job.config.priority.forEach((priority) => {
      if (!priority.source_priority.id) return;
      priorityMap.set(buildExternalId(projectId, resourceId, priority.source_priority.id), priority.target_priority);
    });

    const stateMap = new Map<string, string>();
    // external id -> plane state id map
    job.config.state.forEach((state) => {
      if (!state.source_state.id) return;
      stateMap.set(buildExternalId(projectId, resourceId, state.source_state.id), state.target_state.id);
    });

    return {
      stateMap: stateMap,
      userMap: userMap,
      cycleMap: cycleMap,
      moduleMap: moduleMap,
      issueTypeMap: issueTypeMap,
      priorityMap: priorityMap,
      attachmentMap: new Map<string, string>(),
    };
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
    issueActivities: Partial<ExIssueActivity>[];
    crossProjectRelationsCount: number;
  }) {
    const { job, issues, comments, propertyValues, relations, issueActivities } = props;

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
        crossProjectRelations: props.crossProjectRelationsCount,
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
        issueActivities: props.issueActivities.length,
      },
    });

    logger.info(`[${job.id}] [JiraIssueDataExtractor] Extraction completed`, {
      issues: issues.length,
      comments: comments.length,
      issueActivities: issueActivities.length,
      relations: relations.length,
      crossProjectRelations: props.crossProjectRelationsCount,
    });
  }
}
