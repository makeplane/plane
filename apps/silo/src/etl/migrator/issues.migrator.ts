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

/* ----------------------------- Issue Creation Utilities ----------------------------- */
import type { HTMLElement } from "node-html-parser";
import { parse } from "node-html-parser";
import type { TIssuePropertyValuesPayload, TPropertyValuesPayload } from "@plane/etl/core";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import { logger } from "@plane/logger";
import type {
  AttachmentResponse,
  ExIssue,
  ExIssueActivity,
  ExIssueComment,
  ExIssueLabel,
  ExIssueProperty,
  ExIssuePropertyOption,
  ExIssuePropertyValue,
  ExIssueType,
  Client as PlaneClient,
  PlaneUser,
  TIssuePropertyRelationType,
  TIssuePropertyType,
  TIssuePropertyTypeKeys,
  TWorklog,
  UploadData,
} from "@plane/sdk";
import type { TWorkspaceCredential } from "@plane/types";
import type { TIssuesAssociationsData } from "@/apps/jira-server-importer/v2/types";
import { env } from "@/env";
import { wait } from "@/helpers/delay";
import { downloadFile, splitStringTillPart, uploadFile } from "@/helpers/utils";
import { AssertAPIErrorResponse, protect } from "@/lib";
import type { BulkIssuePayload } from "@/types";
import type { IssueCreatePayload, IssueWithParentPayload } from "./types";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { extractErrorMetadata } from "@/helpers/errors";
// A wrapper for better readability
export const createOrphanIssues = async (payload: IssueCreatePayload): Promise<ExIssue[]> =>
  await createIssues(payload);

// Attaches parent to the issues and creates them
export const createIssuesWithParent = async (payload: IssueWithParentPayload): Promise<ExIssue[]> => {
  const {
    jobId,
    meta,
    planeLabels,
    planeClient,
    workspaceSlug,
    projectId,
    issuesWithParent,
    createdOrphanIssues,
    planeIssueTypes,
    planeIssueProperties,
    planeIssuePropertiesOptions,
    planeIssuePropertyValues,
  } = payload;
  const issueProcessIndex = payload.issueProcessIndex;
  let result: ExIssue[] = [];

  for (const issue of issuesWithParent) {
    if (issue.parent) {
      const parentIssue = createdOrphanIssues.find((orphanIssue: ExIssue) => orphanIssue.external_id === issue.parent);
      if (parentIssue) {
        issue.parent = parentIssue.id;
      } else {
        // If the parent issue is not found, then try to find the issue from
        // external id and source from the api
        try {
          const parent = await protect(
            planeClient.issue.getIssueWithExternalId.bind(planeClient.issue),
            workspaceSlug,
            projectId,
            issue.parent,
            issue.external_source
          );
          issue.parent = parent.id;
        } catch (error) {
          logger.error("Error while fetching the parent issue", error);
          // Even if we're getting error while fetching the issue, we need to
          // skip attaching the parent from the issue
          issue.parent = null;
        }
      }
    }
  }

  try {
    result = await createIssues({
      jobId,
      meta,
      planeLabels,
      issueProcessIndex,
      planeClient,
      workspaceSlug,
      projectId,
      users: payload.users,
      issues: issuesWithParent,
      credentials: payload.credentials,
      planeIssueTypes,
      planeIssueProperties,
      planeIssuePropertiesOptions,
      planeIssuePropertyValues,
    });
  } catch (error) {
    logger.error("Error while creating issue at root", error);
  }

  return result;
};

type BulkIssueCreatePayload = IssueCreatePayload & {
  issueComments: ExIssueComment[];
  modules: { id: string; issues: string[] }[];
  cycles: { id: string; issues: string[] }[];
};

export const getAssociatedComments = async (
  jobId: string,
  credentials: TWorkspaceCredential,
  comments: Partial<ExIssueComment>[],
  users: PlaneUser[],
  issueId: string,
  planeClient: PlaneClient,
  workspaceSlug: string,
  stepName?: string
): Promise<ExIssueComment[]> => {
  const issueComments = comments.filter((comment) => comment !== undefined && comment.issue === issueId);

  const processedComments = await Promise.all(
    issueComments.map(async (comment: Partial<ExIssueComment>) => {
      try {
        // Process any attachments in the comment
        const [processedComment, assetIds] = await processCommentAttachments(
          jobId,
          credentials,
          comment,
          planeClient,
          workspaceSlug
        );

        const actor = users.find((user) => user.display_name === comment.actor);
        const createdBy = users.find((user) => user.display_name === comment.created_by);

        const finalComment = {
          ...processedComment,
          file_assets: assetIds,
          actor: actor?.id || null,
          created_by: createdBy?.id || null,
        };

        return finalComment;
      } catch (error) {
        logger.error(`[${jobId.slice(0, 7)}] Error processing comment for issue ${issueId}:`, error);

        return null;
      }
    })
  );

  return processedComments.filter(Boolean) as ExIssueComment[];
};

export const getAssociatedCommentsV2 = async (
  jobId: string,
  credentials: TWorkspaceCredential,
  comments: Partial<ExIssueComment>[],
  users: PlaneUser[],
  issueId: string,
  planeClient: PlaneClient,
  workspaceSlug: string
): Promise<ExIssueComment[]> => {
  const issueComments = comments.filter((comment) => comment !== undefined && comment.issue === issueId);

  const processedComments = await Promise.all(
    issueComments.map(async (comment: Partial<ExIssueComment>) => {
      try {
        // Process any attachments in the comment - summary collected inside
        const [processedComment, assetIds] = await processCommentAttachments(
          jobId,
          credentials,
          comment,
          planeClient,
          workspaceSlug
        );

        const actor = users.find((user) => user.email === comment.actor);
        const createdBy = users.find((user) => user.email === comment.created_by);

        const finalComment = {
          ...processedComment,
          file_assets: assetIds,
          actor: actor?.id || null,
          created_by: createdBy?.id || null,
        };

        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.WORK_ITEM_COMMENT,
          phase: "PROCESS_COMMENT",
          level: EExecutionLogLevel.SUCCESS,
          related_entity: issueId,
          entity_external_id: comment.external_id,
          additional_data: {
            hasAttachments: assetIds.length > 0,
            attachmentCount: assetIds.length,
            actorResolved: !!actor,
            createdByResolved: !!createdBy,
          },
        });

        return finalComment;
      } catch (error) {
        logger.error(`[${jobId.slice(0, 7)}] Error processing comment for issue ${issueId}:`, error);

        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.WORK_ITEM_COMMENT,
          phase: "PROCESS_COMMENT",
          level: EExecutionLogLevel.ERROR,
          error: extractErrorMetadata(error),
          entity_external_id: comment.external_id,
          related_entity: issueId,
        });

        return null;
      }
    })
  );

  return processedComments.filter(Boolean) as ExIssueComment[];
};

export const generateIssuePayload = async (payload: BulkIssueCreatePayload): Promise<ExIssue[]> => {
  const {
    jobId,
    planeLabels,
    issues,
    planeClient,
    workspaceSlug,
    users,
    credentials,
    planeIssueTypes,
    issueComments,
    planeIssueProperties,
    planeIssuePropertiesOptions,
    planeIssuePropertyValues,
  } = payload;
  const bulkIssuePayload: BulkIssuePayload[] = [];

  for (const issue of issues) {
    try {
      // Process attachments first
      const [processedIssue, assets] = await processAttachments(jobId, credentials, issue, planeClient, workspaceSlug);

      // Get the entities for the issue
      processedIssue.labels = getPlaneIssueLabels(processedIssue, planeLabels);
      processedIssue.created_by = getIssueCreatedBy(processedIssue, users) ?? "";
      processedIssue.assignees = getIssueAssignees(processedIssue, users);
      processedIssue.type_id = getIssueType(processedIssue, planeIssueTypes)?.id;
      processedIssue.links = processedIssue.links ? processedIssue.links.filter((link) => link !== undefined) : [];
      processedIssue.parent = processedIssue.parent ? processedIssue.parent : null;

      // Get the association for the issue
      const associatedCycles = payload.cycles.filter((cycle) => cycle.issues.includes(processedIssue.external_id));
      const associatedModules = payload.modules.filter((module) => module.issues.includes(processedIssue.external_id));
      const associatedComments = await getAssociatedComments(
        jobId,
        credentials,
        issueComments,
        users,
        processedIssue.external_id,
        planeClient,
        workspaceSlug
      );
      const associatedIssuePropertyValues = getAssociatedIssuePropertyValues({
        issueId: processedIssue.external_id,
        planeUsers: users,
        planeIssueProperties,
        planeIssuePropertiesOptions,
        planeIssuePropertyValues,
      });

      bulkIssuePayload.push({
        ...processedIssue,
        file_assets: assets,
        comments: associatedComments,
        cycles: associatedCycles.map((cycle) => cycle.id),
        modules: associatedModules.map((module) => module.id),
        issue_property_values: associatedIssuePropertyValues,
      });
    } catch (error) {
      logger.error(`[${jobId.slice(0, 7)}] Error while creating the issue: ${issue.external_id}`);
    }
  }

  return bulkIssuePayload;
};

export const generateIssuePayloadV2 = async (payload: {
  jobId: string;
  issues: ExIssue[];
  issueComments: ExIssueComment[];
  issueActivities: ExIssueActivity[];
  credentials: TWorkspaceCredential;
  planeClient: PlaneClient;
  workspaceSlug: string;

  // Mappings (pre-loaded from storage)
  userMap: Map<string, string>;
  issueTypeMap: Map<string, string>;
  cycleMap: Map<string, string>;
  moduleMap: Map<string, string>;
  releaseMap: Map<string, string>;

  associations: TIssuesAssociationsData;

  // Property data (from dependencies)
  planeIssueProperties: ExIssueProperty[];
  planeIssuePropertiesOptions: ExIssuePropertyOption[];
  planeIssuePropertyValues: TIssuePropertyValuesPayload;
}): Promise<BulkIssuePayload[]> => {
  const {
    jobId,
    releaseMap,
    issues,
    issueComments,
    issueActivities,
    credentials,
    associations,
    planeClient,
    workspaceSlug,
    userMap,
    issueTypeMap,
    cycleMap,
    moduleMap,
    planeIssueProperties,
    planeIssuePropertiesOptions,
    planeIssuePropertyValues,
  } = payload;

  const bulkIssuePayload: BulkIssuePayload[] = [];

  let successfulIssues = 0;
  let failedIssues = 0;
  let totalAttachmentsProcessed = 0;
  let attachmentErrors = 0;

  // Build planeUsers array for existing functions
  const planeUsers: PlaneUser[] = Array.from(userMap.entries()).map(
    ([email, userId]) =>
      ({
        id: userId,
        email,
      }) as PlaneUser
  );

  for (const issue of issues) {
    try {
      // Process attachments first (download + upload) - summary collected inside
      const [processedIssue, assets] = await processAttachments(jobId, credentials, issue, planeClient, workspaceSlug);

      totalAttachmentsProcessed += assets.length;
      if (issue.attachments && issue.attachments.length > assets.length) {
        attachmentErrors += issue.attachments.length - assets.length;
      }

      processedIssue.created_by = userMap.get(processedIssue.created_by || "") || "";

      processedIssue.assignees = (processedIssue.assignees || [])
        .map((assignee) => userMap.get(assignee))
        .filter(Boolean) as string[];

      processedIssue.type_id = issueTypeMap.get(processedIssue.type_id || "");

      // Clean up links
      processedIssue.links = processedIssue.links ? processedIssue.links.filter((link) => link !== undefined) : [];

      // Strip parent (handled in relations step)
      processedIssue.parent = null;

      // Get associated comments for this issue - summary collected inside
      const associatedComments = await getAssociatedCommentsV2(
        jobId,
        credentials,
        issueComments,
        planeUsers,
        processedIssue.external_id,
        planeClient,
        workspaceSlug
      );

      // Get associated property values (uses existing function!) - summary collected inside
      const associatedIssuePropertyValues = getAssociatedIssuePropertyValues({
        issueId: processedIssue.external_id || "",
        planeReleases: releaseMap,
        planeUsers,
        planeIssueProperties,
        planeIssuePropertiesOptions,
        planeIssuePropertyValues,
        jobId,
      });

      const associatedCycles = associations.cycles.get(processedIssue.external_id) || [];
      const associatedModules = associations.modules.get(processedIssue.external_id) || [];

      const associatedCycleIds = associatedCycles.map((cycle) => cycleMap.get(cycle)) || [];
      const associatedModuleIds = associatedModules.map((module) => moduleMap.get(module)) || [];

      const associatedWorklogs = processWorklogs(userMap, associations.worklogs.get(processedIssue.external_id) || []);
      const associatedSubscribers = processSubscribers(
        userMap,
        associations.subscribers.get(processedIssue.external_id) || []
      );

      const associatedIssueActivities = processActivities(
        userMap,
        issueActivities.filter((activity) => activity.issue === processedIssue.external_id)
      );

      // Build BulkIssuePayload
      bulkIssuePayload.push({
        ...processedIssue,
        file_assets: assets,
        comments: associatedComments,
        worklogs: associatedWorklogs,
        cycles: associatedCycleIds.filter(Boolean) as string[],
        modules: associatedModuleIds.filter(Boolean) as string[],
        issue_property_values: associatedIssuePropertyValues,
        subscribers: associatedSubscribers,
        activities: associatedIssueActivities,
      });

      successfulIssues++;
    } catch (error) {
      failedIssues++;
      logger.error(`[${jobId.slice(0, 7)}] Error while processing issue: ${issue.external_id}`, error);

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.WORK_ITEM,
        phase: "TRANSFORM",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        entity_external_id: issue.external_id,
        entity_name: issue.name,
      });
    }
  }

  executionLog.collect(jobId, {
    entity_type: EExecutionLogEntityType.WORK_ITEM,
    phase: "GENERATE_ISSUE_PAYLOAD",
    ignore_summarization: true,
    level: EExecutionLogLevel.INFO,
    additional_data: {
      totalIssuesAttempted: issues.length,
      successfulIssues,
      failedIssues,
      totalAttachmentsProcessed,
      attachmentErrors,
      issuesWithResolution: {
        resolvedCreatedBy: bulkIssuePayload.filter((i) => i.created_by).length,
        resolvedAssignees: bulkIssuePayload.filter((i) => i.assignees && i.assignees.length > 0).length,
        resolvedIssueType: bulkIssuePayload.filter((i) => i.type_id).length,
      },
    },
  });

  return bulkIssuePayload;
};

const processWorklogs = (userMap: Map<string, string>, worklogs: Partial<TWorklog>[]): Partial<TWorklog>[] =>
  worklogs.map((worklog) => ({
    ...worklog,
    logged_by: userMap.get(worklog.logged_by || ""),
  }));

const processSubscribers = (userMap: Map<string, string>, subscribers: string[]): string[] =>
  subscribers.map((subscriber) => userMap.get(subscriber)).filter((subscriber) => subscriber !== undefined);

/**
 * Resolves user references on activities against the USERS mapping.
 *
 * `actor` is emitted by extractors as `email || displayName` (string identifier).
 * Assignee changelog activities additionally carry raw Jira account keys in
 * `old_identifier` / `new_identifier` (Jira Server `user.name`, Jira Cloud `accountId`) —
 * the USERS mapping contains those keys alongside email/displayName, all pointing to the
 * same Plane user id, so a single lookup resolves every form.
 */
const processActivities = (
  userMap: Map<string, string>,
  activities: Partial<ExIssueActivity>[]
): Partial<ExIssueActivity>[] =>
  activities.map((activity) => {
    const resolved: Partial<ExIssueActivity> = {
      ...activity,
      actor: activity.actor ? (userMap.get(activity.actor) ?? null) : null,
      created_by: activity.created_by ? userMap.get(activity.created_by) : undefined,
    };
    if (activity.field === "assignees") {
      resolved.old_identifier = activity.old_identifier ? (userMap.get(activity.old_identifier) ?? null) : null;
      resolved.new_identifier = activity.new_identifier ? (userMap.get(activity.new_identifier) ?? null) : null;
    }
    return resolved;
  });

const processAttachments = async (
  jobId: string,
  credentials: TWorkspaceCredential,
  issue: ExIssue,
  planeClient: PlaneClient,
  workspaceSlug: string
): Promise<[ExIssue, string[]]> => {
  if (!issue.attachments || issue.attachments.length === 0) return [issue, []];

  const processedIssue = { ...issue };
  const assets = [];

  for (const attachment of issue.attachments) {
    try {
      // Set up auth token based on source
      let sourceAccessToken = credentials.source_access_token;
      let authPrefix = "Bearer";

      if (credentials.source === E_IMPORTER_KEYS.JIRA && env.JIRA_OAUTH_ENABLED == "0") {
        const token = `${credentials.source_auth_email}:${credentials.source_access_token}`;
        sourceAccessToken = Buffer.from(token).toString("base64");
        authPrefix = "Basic";
      }

      let authToken: string | undefined = `${authPrefix} ${sourceAccessToken}`;
      if (credentials.source === E_IMPORTER_KEYS.ASANA) {
        sourceAccessToken = "";
        authPrefix = "";
        authToken = undefined;
      }

      if (credentials.source === E_IMPORTER_KEYS.LINEAR && env.LINEAR_OAUTH_ENABLED !== "1") {
        sourceAccessToken = credentials.source_access_token;
        authToken = sourceAccessToken as string;
      }

      if (credentials.source === E_IMPORTER_KEYS.CLICKUP) {
        sourceAccessToken = credentials.source_access_token;
        authPrefix = "";
        authToken = sourceAccessToken as string;
      }

      // Download the file
      if (!attachment.attributes.name) {
        attachment.attributes.name = "attachment";
      }

      // Skip the attachment if the given size is zero
      if (attachment.attributes.size === 0) {
        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.WORK_ITEM_ATTACHMENT,
          phase: "PROCESS_ATTACHMENT",
          level: EExecutionLogLevel.ERROR,
          related_entity: issue.external_id,
          entity_external_id: attachment.id,
          entity_name: attachment.attributes.name,
          error: {
            message: "Zero size attachment skipped",
          },
        });
        continue;
      }

      const blob = await downloadFile(attachment.asset, authToken);
      if (!blob) {
        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.WORK_ITEM_ATTACHMENT,
          phase: "PROCESS_ATTACHMENT",
          level: EExecutionLogLevel.ERROR,
          related_entity: issue.external_id,
          entity_name: attachment.attributes.name,
          entity_external_id: attachment.external_id,
          error: {
            message: "Failed to download attachment",
          },
        });
        continue;
      }

      // Upload the asset and mark it as uploaded in one go
      const assetId = await protect(
        planeClient.assets.uploadAsset.bind(planeClient.assets),
        workspaceSlug,
        blob,
        attachment.attributes.name,
        blob.size,
        {
          external_id: attachment.external_id,
          external_source: attachment.external_source,
        }
      );

      // Update description with new asset URL
      const url = new URL(attachment.asset);
      let sourceAttachmentPathname = "";
      if (url.pathname.includes("rest")) {
        sourceAttachmentPathname = splitStringTillPart(new URL(attachment.asset).pathname, "rest");
      } else {
        if (credentials.source === E_IMPORTER_KEYS.JIRA_SERVER) {
          sourceAttachmentPathname = convertJiraImageURL(attachment.asset);
        } else {
          sourceAttachmentPathname = attachment.asset;
        }
      }

      processedIssue.description_html = replaceImageComponent(
        processedIssue.description_html,
        assetId,
        sourceAttachmentPathname,
        credentials.source
      );

      assets.push(assetId);

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.WORK_ITEM_ATTACHMENT,
        phase: "PROCESS_ATTACHMENT",
        level: EExecutionLogLevel.SUCCESS,
        related_entity: issue.external_id,
        entity_external_id: attachment.external_id,
        entity_plane_id: attachment.id,
        entity_name: attachment.attributes.name,
      });
    } catch (error) {
      logger.error(`[${jobId.slice(0, 7)}] Error processing attachment for issue "${issue.name}":`, error);

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.WORK_ITEM_ATTACHMENT,
        phase: "PROCESS_ATTACHMENT",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        related_entity: issue.external_id,
        entity_external_id: attachment.external_id,
        entity_name: attachment.attributes.name,
        additional_data: {
          attachment: attachment,
        },
      });
    }
  }

  return [processedIssue, assets];
};

export const getAssociatedIssuePropertyValues = (props: {
  issueId: string;
  planeUsers: PlaneUser[];
  planeReleases?: Map<string, string>;
  planeIssueProperties: ExIssueProperty[];
  planeIssuePropertiesOptions: ExIssuePropertyOption[];
  planeIssuePropertyValues?: TIssuePropertyValuesPayload;
  jobId?: string;
}) => {
  let associatedIssuePropertyValues: { id: string; values: ExIssuePropertyValue }[] = [];
  const {
    issueId,
    planeUsers,
    planeReleases,
    planeIssueProperties,
    planeIssuePropertiesOptions,
    planeIssuePropertyValues,
    jobId,
  } = props;

  if (planeIssuePropertyValues && planeIssuePropertyValues[issueId]) {
    associatedIssuePropertyValues =
      getIssuePropertyValues({
        planeUsers,
        planeIssueProperties,
        planeIssuePropertiesOptions,
        issuePropertyValues: planeIssuePropertyValues[issueId],
        planeReleases,
      }) ?? [];

    if (jobId) {
      associatedIssuePropertyValues.map((value) => {
        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.ISSUE_PROPERTY_VALUE,
          phase: "PROCESS_PROPERTY_VALUES",
          level: EExecutionLogLevel.SUCCESS,
          related_entity: issueId,
          entity_plane_id: value.id,
          entity_external_id: value.id,
        });
      });
    }
  }

  return associatedIssuePropertyValues;
};

export const createIssues = async (payload: IssueCreatePayload): Promise<ExIssue[]> => {
  const {
    jobId,
    meta,
    planeLabels,
    issues,
    planeClient,
    workspaceSlug,
    projectId,
    users,
    planeIssueTypes,
    planeIssueProperties,
    planeIssuePropertiesOptions,
    planeIssuePropertyValues,
  } = payload;
  let issueProcessIndex = payload.issueProcessIndex;

  const result = [];

  const issueWaitTime = Number(process.env.REQUEST_INTERVAL) || 400;

  for (const issue of issues) {
    try {
      // If there are labels, then get the label ids from the created labels
      issue.labels = getPlaneIssueLabels(issue, planeLabels);
      issue.created_by = getIssueCreatedBy(issue, users) ?? "";
      issue.assignees = getIssueAssignees(issue, users);
      issue.type_id = getIssueType(issue, planeIssueTypes)?.id;

      if (issue?.parent) {
        const parentIssue = result.find((createdIssue) => createdIssue.external_id === issue.parent)?.id;
        if (parentIssue) {
          issue.parent = parentIssue;
        } else {
          //TODO: This is an edge case and shouldn't be encountered. Create the parent issue if it doesn't exist
          issue.parent = null;
          logger.warn(`[${jobId.slice(0, 7)}] Parent issue not found for the issue: ${issue.external_id}`);
        }
      }

      // Create the issue and issue assets
      const createdIssue = await protect(
        createOrUpdateIssue,
        issue,
        meta,
        issueProcessIndex,
        planeClient,
        workspaceSlug,
        projectId
      );
      await createIssueLinks(jobId, issue, createdIssue.id, planeClient, workspaceSlug, projectId);
      await createIssueAttachments(
        jobId,
        payload.credentials,
        createdIssue.id,
        issue,
        planeClient,
        workspaceSlug,
        projectId
      );
      if (planeIssuePropertyValues && planeIssuePropertyValues[createdIssue.external_id]) {
        await createIssuePropertyValues({
          createdIssueId: createdIssue.id,
          planeUsers: users,
          planeIssueProperties,
          planeIssuePropertiesOptions,
          issuePropertyValues: planeIssuePropertyValues[createdIssue.external_id],
          planeClient,
          workspaceSlug,
          projectId,
        });
      }

      result.push(createdIssue);
      issueProcessIndex++;

      await wait(issueWaitTime);
    } catch (error) {
      logger.error(`[${jobId.slice(0, 7)}] Error while creating the issue: ${issue.external_id}`, error);
    }
  }

  return result;
};

export const createOrUpdateIssue = async (
  issue: ExIssue,
  meta: any,
  issueProcessIndex: number,
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
): Promise<ExIssue> => {
  let createdIssue: ExIssue | undefined = undefined;

  try {
    createdIssue = await protect(planeClient.issue.create.bind(planeClient.issue), workspaceSlug, projectId, issue);
    logger.info(
      `[${issue.external_source}][${issue.external_id.slice(0, 5)}...][${meta.batchId}] Created Issue: ${issue.external_id.slice(0, 7)} ----------- [${issueProcessIndex} / ${meta.batch_end}][${meta.total.issues}]`
    );
    return createdIssue;
  } catch (error) {
    if (AssertAPIErrorResponse(error)) {
      // Update the issue if the issue already exist
      if (error.error.includes("already exists")) {
        createdIssue = await protect(
          planeClient.issue.update.bind(planeClient.issue),
          workspaceSlug,
          projectId,
          error.id,
          issue
        );
        logger.info(
          `[${issue.external_source}][${issue.external_id.slice(0, 5)}...][${meta.batchId}] Updated Issue: ${issue.external_id.slice(0, 7)} ----------- [${issueProcessIndex} / ${meta.batch_end}][${meta.total.issues}]`
        );
      }
    } else {
      throw error;
    }
  }

  // I am aware that the issue will either be updated or created
  return createdIssue as ExIssue;
};

/* ------------------------------ Issue Comment Creation ---------------------------- */
export const createOrUpdateIssueComment = async (
  _jobId: string,
  issueComment: ExIssueComment,
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string,
  issueId: string
): Promise<void> => {
  // Comment array is used to store the comments that failed to create
  try {
    await protect(
      planeClient.issueComment.create.bind(planeClient.issueComment),
      workspaceSlug,
      projectId,
      issueId,
      issueComment
    );
  } catch (error) {
    if (AssertAPIErrorResponse(error)) {
      // Update the comment if the comment already exist
      if (error.error.includes("already exists")) {
        try {
          await protect(
            planeClient.issueComment.update.bind(planeClient.issueComment),
            workspaceSlug,
            projectId,
            issueId,
            error.id,
            issueComment
          );
        } catch (error) {
          logger.error("Error while updating comment", error);
        }
      }
    } else {
      logger.error("Error while creating comment, other than already exist", error);
    }
  }
};

const createIssueAttachments = async (
  jobId: string,
  credentials: TWorkspaceCredential,
  createdIssueId: string,
  issue: ExIssue,
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
) => {
  if (issue.attachments && issue.attachments.length > 0) {
    const attachmentPromises = issue.attachments.map(async (attachment) => {
      try {
        const existingAttachments: any = await protect(
          planeClient.issue.getIssueAttachments.bind(planeClient.issue),
          workspaceSlug,
          projectId,
          createdIssueId
        );
        try {
          // Get the existing attachment for the issue
          // Create a temp file to download the attachment
          let sourceAccessToken = credentials.source_access_token;
          let authPrefix = "Bearer";

          if (credentials.source === E_IMPORTER_KEYS.JIRA && env.JIRA_OAUTH_ENABLED == "0") {
            const token = `${credentials.source_auth_email}:${credentials.source_access_token}`;
            sourceAccessToken = Buffer.from(token).toString("base64");
            authPrefix = "Basic";
          }

          let authToken: string | undefined = `${authPrefix} ${sourceAccessToken}`;
          if (credentials.source === E_IMPORTER_KEYS.ASANA) {
            sourceAccessToken = "";
            authPrefix = "";
            authToken = undefined;
          }

          if (credentials.source === E_IMPORTER_KEYS.LINEAR && env.LINEAR_OAUTH_ENABLED !== "1") {
            sourceAccessToken = credentials.source_access_token;
            authToken = sourceAccessToken as string;
          }

          const blob = await downloadFile(attachment.asset, authToken);

          if (!blob) return;

          // Upload the attachment
          const response = await protect<AttachmentResponse>(
            planeClient.issue.getIssueAttachmentUrl.bind(planeClient.issue),
            workspaceSlug,
            projectId,
            createdIssueId,
            attachment.attributes.name,
            blob.size,
            blob.type,
            attachment.external_source,
            attachment.external_id
          );

          const data = generateFileUploadPayload(response.upload_data, blob, attachment.attributes.name);

          const upload = await uploadFile({
            url: response.upload_data.url,
            data: data,
          });

          if (!upload) {
            logger.error(`[${jobId.slice(0, 7)}] Error while uploading the attachment: ${issue.name}`);
            return;
          }

          // Upload the attachment
          await protect(
            planeClient.issue.updateIssueAttachment.bind(planeClient.issue),
            workspaceSlug,
            projectId,
            createdIssueId,
            response.attachment.id,
            {
              is_uploaded: true,
            }
          );

          // Update the description html if the attachment is uploaded successfully
          if (response.attachment.asset) {
            const url = new URL(attachment.asset);
            let sourceAttachmentPathname = "";
            if (url.pathname.includes("rest")) {
              sourceAttachmentPathname = splitStringTillPart(new URL(attachment.asset).pathname, "rest");
            } else {
              if (credentials.source === E_IMPORTER_KEYS.JIRA_SERVER) {
                sourceAttachmentPathname = convertJiraImageURL(attachment.asset);
              } else {
                sourceAttachmentPathname = attachment.asset;
              }
            }

            issue.description_html = replaceImageComponent(
              issue.description_html,
              response.asset_id,
              sourceAttachmentPathname,
              credentials.source
            );
          }
        } catch (error) {
          if (AssertAPIErrorResponse(error)) {
            if (error.error && error.error.includes("already exists")) {
              logger.info(
                `[${jobId.slice(0, 7)}] Attachment  already exists for the issue "${issue.name}". Skipping...`
              );
              // get the attachment from the existing attachments
              existingAttachments.find((existingAttachment: any) => {
                if (existingAttachment.external_id === attachment.external_id) {
                  const attachmentUrl = existingAttachment.asset;
                  const url = new URL(attachment.asset);
                  let sourceAttachmentPathname = "";
                  if (url.pathname.includes("rest")) {
                    sourceAttachmentPathname = splitStringTillPart(new URL(attachment.asset).pathname, "rest");
                  } else {
                    if (credentials.source === E_IMPORTER_KEYS.JIRA_SERVER) {
                      sourceAttachmentPathname = convertJiraImageURL(attachment.asset);
                    } else {
                      sourceAttachmentPathname = attachment.asset;
                    }
                  }

                  issue.description_html = replaceImageComponent(
                    issue.description_html,
                    existingAttachment.id,
                    sourceAttachmentPathname,
                    credentials.source
                  );
                }
              });
            }
          } else {
            logger.error(`[${jobId.slice(5)}] Error while creating the attachment: ${issue.name}`);
          }
        }
      } catch (error) {
        logger.error(`[${jobId.slice(0, 7)}] Error while fetching the attachments for the issue: ${issue.name}`, error);
      }
    });

    await Promise.all(attachmentPromises);
    // Finally update the issue with the updated description html
    await protect(planeClient.issue.update.bind(planeClient.issue), workspaceSlug, projectId, createdIssueId, issue);
  }
};

const createIssueLinks = async (
  jobId: string,
  issue: ExIssue,
  createdIssueId: string,
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
) => {
  if (issue.links) {
    try {
      const linkPromises = issue.links.map(async (link) => {
        await protect(
          planeClient.issue.createLink.bind(planeClient.issue),
          workspaceSlug,
          projectId,
          createdIssueId,
          link.name,
          link.url
        );
      });
      await Promise.all(linkPromises);
    } catch (error) {
      // @ts-expect-error - Need to check with AssertAPIErrorResponse
      if (error.error && !error.error.includes("already exists")) {
        logger.error(`[${jobId.slice(0, 7)}] Error while creating the link for the issue: ${issue.external_id}`, error);
      }
    }
  }
};

const createIssuePropertyValues = async (props: {
  createdIssueId: string;
  planeUsers: PlaneUser[];
  planeIssueProperties: ExIssueProperty[];
  planeIssuePropertiesOptions: ExIssuePropertyOption[];
  issuePropertyValues: TPropertyValuesPayload;
  planeClient: PlaneClient;
  workspaceSlug: string;
  projectId: string;
  planeReleases?: Map<string, string>;
}) => {
  const {
    createdIssueId,
    planeUsers,
    planeIssueProperties,
    planeIssuePropertiesOptions,
    issuePropertyValues,
    planeClient,
    workspaceSlug,
    projectId,
    planeReleases,
  } = props;
  // If there are no issue property values, then return
  if (!issuePropertyValues || Object.keys(issuePropertyValues).length === 0) return;

  // Create a map for the issue properties and options
  const issuePropertiesMap = new Map(
    planeIssueProperties.map((issueProperty) => [issueProperty.external_id, issueProperty])
  );
  const issuePropertiesOptionsMap = new Map(
    planeIssuePropertiesOptions.map((issuePropertyOption) => [issuePropertyOption.external_id, issuePropertyOption])
  );

  // Create the issue property values
  const issuePropertyValuePromises = Object.entries(issuePropertyValues)
    .map(async ([propertyId, propertyValues]) => {
      // Check if the issue property is valid
      const issueProperty = issuePropertiesMap.get(propertyId);
      if (!issueProperty || !issueProperty.id) return;
      // Get the issue property type key
      const issuePropertyTypeKey = getIssuePropertyTypeKey(issueProperty.property_type, issueProperty.relation_type);
      if (!issuePropertyTypeKey) return;
      // Create the property values payload
      const propertyValuesPayload = generatePropertyValuesPayload(
        issuePropertyTypeKey,
        propertyValues,
        issuePropertiesOptionsMap,
        planeUsers,
        planeReleases
      );
      // Create the issue property values if the property values payload is not empty
      if (propertyValuesPayload.length > 0) {
        await protect(
          planeClient.issuePropertyValue.create.bind(planeClient.issuePropertyValue),
          workspaceSlug,
          projectId,
          createdIssueId,
          issueProperty.id,
          { values: propertyValuesPayload }
        );
      }
    })
    .filter(Boolean);
  // Create the issue property values
  await Promise.all(issuePropertyValuePromises);
};

const getIssuePropertyValues = (props: {
  planeUsers: PlaneUser[];
  planeIssueProperties: ExIssueProperty[];
  planeIssuePropertiesOptions: ExIssuePropertyOption[];
  issuePropertyValues: TPropertyValuesPayload;
  planeReleases?: Map<string, string>;
}) => {
  const { planeUsers, planeReleases, planeIssueProperties, planeIssuePropertiesOptions, issuePropertyValues } = props;

  const values: {
    id: string;
    values: ExIssuePropertyValue;
  }[] = [];
  // If there are no issue property values, then return
  if (!issuePropertyValues || Object.keys(issuePropertyValues).length === 0) return;

  // Create a map for the issue properties and options
  const issuePropertiesMap = new Map(
    planeIssueProperties.map((issueProperty) => [issueProperty.external_id, issueProperty])
  );
  const issuePropertiesOptionsMap = new Map(
    planeIssuePropertiesOptions.map((issuePropertyOption) => [issuePropertyOption.external_id, issuePropertyOption])
  );

  // Create the issue property values
  Object.entries(issuePropertyValues)
    .map(([propertyId, propertyValues]) => {
      // Check if the issue property is valid
      const issueProperty = issuePropertiesMap.get(propertyId);
      if (!issueProperty || !issueProperty.id) return;
      // Get the issue property type key
      const issuePropertyTypeKey = getIssuePropertyTypeKey(issueProperty.property_type, issueProperty.relation_type);
      if (!issuePropertyTypeKey) return;
      // Create the property values payload
      const propertyValuesPayload = generatePropertyValuesPayload(
        issuePropertyTypeKey,
        propertyValues,
        issuePropertiesOptionsMap,
        planeUsers,
        planeReleases
      );
      if (propertyValuesPayload.length > 0) {
        values.push({
          id: issueProperty.id,
          values: propertyValuesPayload,
        });
      }
    })
    .filter(Boolean);

  return values;
};

/* ------------------------------ Helper Methods ---------------------------- */
const getPlaneIssueLabels = (issue: ExIssue, planeLabels: ExIssueLabel[]): string[] => {
  if (issue.labels) {
    return issue.labels
      .map((label) => {
        const createdLabel = planeLabels.find((createdLabel) => createdLabel.name === label);
        if (createdLabel) {
          return createdLabel.id;
        }
      })
      .filter((label) => label !== undefined);
  }
  return [];
};

const getIssueCreatedBy = (issue: ExIssue, users: any[]): string | undefined =>
  users.find((user) => user.display_name === issue.created_by)?.id;

const getIssueAssignees = (issue: ExIssue, users: any[]): string[] => {
  const assignedUsers = issue.assignees.map((assignee) => {
    const assignedTo = users.find((user) => user.display_name === assignee)?.id;
    if (assignedTo) {
      return assignedTo;
    }
  });
  return assignedUsers.filter((user) => user !== undefined) as string[];
};

export const generateFileUploadPayload = (uploadData: UploadData, blob: Blob, name: string): FormData => {
  const formData = new FormData();
  Object.entries(uploadData.fields).forEach(([key, value]) => formData.append(key, value));
  formData.append("file", blob, name);
  return formData;
};

export const getIssueType = (issue: ExIssue, planeIssueTypes: ExIssueType[]): ExIssueType | undefined => {
  if (issue.type_id) {
    return planeIssueTypes.find((issueType) => issueType.external_id === issue.type_id);
  }
  return undefined;
};

// Get the key for the issue property type based on the property type and relation type
export const getIssuePropertyTypeKey = (
  issuePropertyType: TIssuePropertyType | undefined,
  issuePropertyRelationType: TIssuePropertyRelationType | null | undefined
) =>
  `${issuePropertyType}${issuePropertyRelationType ? `_${issuePropertyRelationType}` : ""}` as TIssuePropertyTypeKeys;

const generatePropertyValuesPayload = (
  issuePropertyTypeKey: TIssuePropertyTypeKeys,
  propertyValues: any[],
  issuePropertiesOptionsMap: Map<string, ExIssuePropertyOption>,
  planeUsers: PlaneUser[],
  planeReleases?: Map<string, string>
): ExIssuePropertyValue => {
  switch (issuePropertyTypeKey) {
    case "TEXT":
    case "BOOLEAN":
    case "DECIMAL":
    case "DATETIME":
      return propertyValues;
    case "OPTION":
      return propertyValues
        .map((value) => {
          const option = issuePropertiesOptionsMap.get(value.external_id);
          return option ? { ...value, value: option.id } : undefined;
        })
        .filter(Boolean);
    case "RELATION_USER":
      return propertyValues
        .map((value) => {
          const user = planeUsers.find((user) => user.email === value.value);
          return user ? { ...value, value: user.id } : undefined;
        })
        .filter(Boolean);
    case "RELATION_ISSUE":
      return [];
    case "RELATION_RELEASE":
      return propertyValues
        .map((value) => {
          const release = planeReleases?.get(value.value);
          console.log(planeReleases);
          if (!release) {
            logger.warn(`Release ${value.value} not found`);
          }
          return release ? { ...value, value: release } : undefined;
        })
        .filter(Boolean);
    default:
      return [];
  }
};

const replaceImageComponent = (
  description_html: string,
  assetId: string,
  existingURL: string,
  source: string
): string => {
  if (!description_html || !assetId || !existingURL) {
    return description_html;
  }

  const root = parse(description_html);
  if (source === E_IMPORTER_KEYS.LINEAR) {
    // Handle Linear's markdown image format
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    return description_html.replace(imageRegex, (match, altText, url) => {
      // Check if this is the image we want to replace
      if (url === existingURL) {
        return `<image-component src="${assetId}" alt="${altText}"/>`;
      }
      return match;
    });
  } else if (source === E_IMPORTER_KEYS.JIRA_SERVER) {
    // Find img tags
    /**
     * Replaces an HTML element with an image-component if its source matches the existing URL
     */
    const replaceMatchingElementWithImageComponent = (
      element: HTMLElement,
      attributeName: string,
      existingURL: string,
      assetId: string
    ) => {
      const elementSrc = element.getAttribute(attributeName);
      // Remove the query params from the URL
      const existingURLWithoutQuery = existingURL.split("?")[0];
      const elementSrcWithoutQuery = elementSrc?.split("?")[0];

      // Check if the source matches the existing URL
      if (existingURLWithoutQuery === elementSrcWithoutQuery) {
        // Get height and width from original element
        const height = element.getAttribute("height");
        const width = element.getAttribute("width");

        // Build attributes string
        const heightAttr = height ? ` height="${height}"` : "";
        const widthAttr = width ? ` width="${width}"` : "";

        // Create new component with preserved dimensions
        const imageComponent = `<image-component src="${assetId}"${heightAttr}${widthAttr}/>`;

        // Find the parent span
        const parentSpan = element.closest("span");

        // Replace the span if it exists, otherwise replace the element
        if (parentSpan) {
          parentSpan.replaceWith(imageComponent);
        } else {
          element.replaceWith(imageComponent);
        }
      }
    };

    const aTags = root.querySelectorAll("a");
    const imgTags = root.querySelectorAll("img");

    imgTags.forEach((imgTag: HTMLElement) => {
      replaceMatchingElementWithImageComponent(imgTag, "src", existingURL, assetId);
    });

    aTags.forEach((aTag: HTMLElement) => {
      replaceMatchingElementWithImageComponent(aTag, "href", existingURL, assetId);
    });

    // Remove the body tag and replace it with the p tag
    root.innerHTML = root.innerHTML.replace("<body", "<p").replace("</body>", "</p>");
    return root.toString();
  } else {
    try {
      // Find img tags
      const imgTags = root.querySelectorAll("img");

      imgTags.forEach((img: HTMLElement) => {
        const imgSrc = img.getAttribute("src");
        // Remove the query params from the URL
        const existingURLWithoutQuery = existingURL.split("?")[0];
        const imgSrcWithoutQuery = imgSrc?.split("?")[0];

        // Check if the image source matches the existing URL
        if (existingURLWithoutQuery === imgSrcWithoutQuery) {
          // Get height and width from original img tag
          const height = img.getAttribute("height");
          const width = img.getAttribute("width");

          // Build attributes string
          const heightAttr = height ? ` height="${height}"` : "";
          const widthAttr = width ? ` width="${width}"` : "";

          // Create new component with preserved dimensions
          const imageComponent = `<image-component src="${assetId}"${heightAttr}${widthAttr}/>`;

          // Find the parent span
          const parentSpan = img.closest("span");

          // Replace the span if it exists, otherwise replace the img
          if (parentSpan) {
            parentSpan.replaceWith(imageComponent);
          } else {
            img.replaceWith(imageComponent);
          }
        }
      });

      // Remove the body tag and replace it with the p tag
      root.innerHTML = root.innerHTML.replace("<body", "<p").replace("</body>", "</p>");
      return root.toString();
    } catch (error) {
      logger.error("Error in replaceImageComponent:", error);
      return description_html;
    }
  }
};

function convertJiraImageURL(originalURL: string): string {
  try {
    const url = new URL(originalURL);
    const pathParts = url.pathname.split("/");

    // If the URL already matches the desired format, return it as is
    if (pathParts[pathParts.length - 1].startsWith(`${pathParts[pathParts.length - 2]}_`)) {
      return originalURL;
    }

    // Insert the second-to-last path segment before the filename
    const filename = pathParts[pathParts.length - 1];
    const secondToLastSegment = pathParts[pathParts.length - 2];

    pathParts[pathParts.length - 1] = `${secondToLastSegment}_${filename}`;

    // Reconstruct the URL
    url.pathname = pathParts.join("/");

    return url.toString();
  } catch (error) {
    logger.error("Error converting URL:", error);
    return originalURL;
  }
}

const processCommentAttachments = async (
  jobId: string,
  credentials: TWorkspaceCredential,
  comment: Partial<ExIssueComment>,
  planeClient: PlaneClient,
  workspaceSlug: string
): Promise<[Partial<ExIssueComment>, string[]]> => {
  const processedComment = { ...comment };
  try {
    // Extract image URLs from comment HTML
    const assetIds = [];
    const imageUrls = extractImageUrlsFromHtml(processedComment.comment_html || "");
    for (const recievedImageUrl of imageUrls) {
      let imageUrl = recievedImageUrl;
      if (!recievedImageUrl.startsWith("http")) {
        if (!credentials.source_hostname) {
          logger.error("Source hostname not found, skipping comment attachment");
          continue;
        }
        imageUrl = `${credentials.source_hostname}${recievedImageUrl}`;
      }

      // Set up auth token based on source
      let sourceAccessToken = credentials.source_access_token;
      let authPrefix = "Bearer";

      if (credentials.source === E_IMPORTER_KEYS.JIRA && env.JIRA_OAUTH_ENABLED == "0") {
        const token = `${credentials.source_auth_email}:${credentials.source_access_token}`;
        sourceAccessToken = Buffer.from(token).toString("base64");
        authPrefix = "Basic";
      }

      let authToken: string | undefined = `${authPrefix} ${sourceAccessToken}`;
      if (credentials.source === E_IMPORTER_KEYS.ASANA) {
        sourceAccessToken = "";
        authPrefix = "";
        authToken = undefined;
      }

      if (credentials.source === E_IMPORTER_KEYS.LINEAR && env.LINEAR_OAUTH_ENABLED !== "1") {
        sourceAccessToken = credentials.source_access_token;
        authToken = sourceAccessToken as string;
      }

      if (credentials.source === E_IMPORTER_KEYS.CLICKUP) {
        sourceAccessToken = credentials.source_access_token;
        authToken = sourceAccessToken as string;
        authPrefix = "";
      }

      try {
        // Download the file
        const blob = await downloadFile(imageUrl, authToken);
        if (!blob) {
          executionLog.collect(jobId, {
            entity_type: EExecutionLogEntityType.WORK_ITEM_COMMENT_ATTACHMENT,
            phase: "PROCESS_COMMENT_ATTACHMENT",
            level: EExecutionLogLevel.ERROR,
            entity_external_id: comment.external_id,
            error: {
              message: "Failed to donwload comment attachment",
            },
            additional_data: {
              imageUrl,
            },
          });
          continue;
        }

        // Generate a filename from the URL
        const fileName = getFileNameFromUrl(imageUrl);

        // Upload the asset and mark it as uploaded in one go
        const assetId = await protect(
          planeClient.assets.uploadAsset.bind(planeClient.assets),
          workspaceSlug,
          blob,
          fileName,
          blob.size,
          {
            external_source: credentials.source,
          }
        );

        assetIds.push(assetId);

        // Update comment HTML with new asset URL
        const url = new URL(imageUrl);
        let sourceAttachmentPathname = "";
        if (url.pathname.includes("rest")) {
          sourceAttachmentPathname = splitStringTillPart(url.pathname, "rest");
        } else {
          if (credentials.source === E_IMPORTER_KEYS.JIRA_SERVER) {
            sourceAttachmentPathname = convertJiraImageURL(imageUrl);
          } else {
            sourceAttachmentPathname = imageUrl;
          }
        }

        processedComment.comment_html = replaceImageComponent(
          processedComment.comment_html || "",
          assetId,
          sourceAttachmentPathname,
          credentials.source
        );

        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.WORK_ITEM_COMMENT_ATTACHMENT,
          phase: "PROCESS_COMMENT_ATTACHMENT",
          level: EExecutionLogLevel.SUCCESS,
          entity_external_id: comment.external_id,
          entity_plane_id: assetId,
          additional_data: {
            fileName,
            fileSize: blob.size,
          },
        });
      } catch (attachmentError) {
        logger.error(`[${jobId.slice(0, 7)}] Error processing comment attachment:`, attachmentError);

        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.WORK_ITEM_COMMENT_ATTACHMENT,
          phase: "PROCESS_COMMENT_ATTACHMENT",
          level: EExecutionLogLevel.ERROR,
          error: extractErrorMetadata(attachmentError),
          entity_external_id: comment.external_id,
          additional_data: {
            imageUrl,
          },
        });
      }
    }

    return [processedComment, assetIds];
  } catch (error) {
    logger.error(`[${jobId.slice(0, 7)}] Error processing attachments for comment:`, error);
  }

  return [processedComment, []];
};

// Helper function to extract image URLs from HTML
const extractImageUrlsFromHtml = (html: string): string[] => {
  const urls: string[] = [];
  const regex = /<img[^>]+src="([^">]+)"/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  return urls;
};

// Helper function to get filename from URL
const getFileNameFromUrl = (url: string): string => {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  const filename = pathname.split("/").pop();
  return filename || "image";
};
