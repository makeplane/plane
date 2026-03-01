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

import type { ExIssueComment, Client as PlaneClient } from "@plane/sdk";
import type {
  TGitlabEntityConnection,
  TGitlabIssueLinkEntityConnection,
  TGitlabWorkspaceConnection,
} from "@plane/types";
import type { Store } from "@/worker/base";
import type { GitlabNoteEvent } from "@plane/etl/gitlab";
import { logger } from "@plane/logger";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { env } from "@/env";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { shouldSyncGitlabToPlane } from "@/apps/gitlab/helpers/helpers";
import { EGitlabEntityConnectionType, GitLabService } from "@plane/etl/gitlab";
import { getConnDetailsForGitlabToPlaneSync } from "@/apps/gitlab/helpers/connection-details";
import { getGitlabClientService } from "@/apps/gitlab/services/service";
import { transformGitlabComment } from "@/apps/gitlab/helpers/transform";
import {
  GITLAB_ISSUE_COMMENT_CACHE_KEY,
  GITLAB_ISSUE_EXTERNAL_ID,
  PLANE_GITLAB_ISSUE_COMMENT_CACHE_KEY,
} from "@/apps/gitlab/helpers/cache-keys";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { GITLAB_ISSUE_LINKED_COMMENT_PREFIX } from "@/apps/gitlab/helpers/constants";
import { getGitlabUploadsPrefix } from "@/apps/gitlab/helpers/urls";

export const handleIssueComment = async (store: Store, data: GitlabNoteEvent) => {
  if (data.object_attributes.noteable_type !== "Issue") {
    logger.info(`[ISSUE-COMMENT] Noteable type is not issue, skipping`, {
      noteableType: data.object_attributes.noteable_type,
    });
    return true;
  }
  // Check if this webhook was triggered by our own Plane->GitHub sync (loop prevention)
  if (data && data.object_attributes && data.object_attributes.id) {
    const glIssueCommentCacheKey = GITLAB_ISSUE_COMMENT_CACHE_KEY(
      data.project.id.toString(),
      GITLAB_ISSUE_EXTERNAL_ID(data.project.id.toString(), data.issue.iid.toString()),
      data.object_attributes.id.toString()
    );
    const exist = await store.get(glIssueCommentCacheKey);
    if (exist) {
      logger.info(`[ISSUE-COMMENT] Event triggered by Plane->Gitlab sync, skipping to prevent loop`);
      // Remove the key so future legitimate webhooks are not blocked
      await store.del(glIssueCommentCacheKey);
      return true;
    }
  }
  await syncCommentWithPlane(store, data);
  return true;
};

export const syncCommentWithPlane = async (store: Store, data: GitlabNoteEvent) => {
  const glIntegrationKey = data.isEnterprise ? E_INTEGRATION_KEYS.GITLAB_ENTERPRISE : E_INTEGRATION_KEYS.GITLAB;
  const result = await getConnDetailsForGitlabToPlaneSync(
    data.project.id.toString(),
    EGitlabEntityConnectionType.PROJECT_ISSUE_SYNC,
    data.isEnterprise ?? false
  );
  if (!result) {
    logger.info(
      `${glIntegrationKey}[ISSUE] No credential or entity connection or workspace connection found, skipping`,
      {
        projectId: data.project.id,
      }
    );
    return;
  }

  const { credential: userCredentials, entityConnection, workspaceConnection } = result;

  const planeClient: PlaneClient = await getPlaneAPIClient(userCredentials, glIntegrationKey);

  let glService: GitLabService;
  if (data.isEnterprise) {
    const appConfig = workspaceConnection.connection_data?.appConfig;
    glService = await getGitlabClientService(
      workspaceConnection.workspace_id,
      glIntegrationKey,
      appConfig?.baseUrl,
      appConfig?.clientId,
      appConfig?.clientSecret
    );
  } else {
    glService = await getGitlabClientService(workspaceConnection.workspace_id, glIntegrationKey, undefined);
  }

  const glIssue = await glService.getIssue(data.project.id, data.issue.iid);
  const isIssueLinkedComment = data.object_attributes.description?.includes(GITLAB_ISSUE_LINKED_COMMENT_PREFIX);
  if (
    isIssueLinkedComment ||
    !shouldSyncGitlabToPlane(glIssue.labels) ||
    data.object_attributes.system ||
    data.object_attributes.noteable_type !== "Issue"
  ) {
    logger.info(
      `${glIntegrationKey}[COMMENT] Not syncing. Labels missing or comment is system or noteable type is not issue, skipping`,
      {
        projectId: data.project.id,
        glIntegrationKey,
        noteableType: data.object_attributes.noteable_type,
        labels: glIssue.labels,
      }
    );
    return;
  }

  const issue = await getPlaneIssue(
    planeClient,
    entityConnection,
    data.project.id.toString(),
    data.issue.iid.toString(),
    glIntegrationKey
  );

  if (!issue) {
    logger.error(`${glIntegrationKey}[ISSUE-COMMENT] Issue not found in Plane, skipping`, {
      workspace: workspaceConnection.workspace_slug,
      project: entityConnection.project_id ?? "",
      projectId: data.project.id,
      glIntegrationKey,
      issueId: data.issue.iid.toString(),
    });
    return;
  }

  const issueLinkEntityConnection = (await integrationConnectionHelper.getIssueLinkEntityConnection({
    entity_id: GITLAB_ISSUE_EXTERNAL_ID(data.project.id.toString(), data.issue.iid.toString()),
    project_id: entityConnection.project_id ?? "",
    issue_id: issue.id,
    type: EGitlabEntityConnectionType.ISSUE_LINK,
    entity_type: glIntegrationKey,
  })) as TGitlabIssueLinkEntityConnection;

  if (!issueLinkEntityConnection?.config?.comment_id) {
    logger.error(`${glIntegrationKey}[ISSUE-COMMENT] Issue link entity connection not found, skipping`, {
      workspace: workspaceConnection.workspace_slug,
      project: entityConnection.project_id ?? "",
      projectId: data.project.id,
      glIntegrationKey,
      issueId: data.issue.iid.toString(),
    });
    return;
  }

  let comment: ExIssueComment | null = null;

  try {
    comment = await planeClient.issueComment.getIssueCommentWithExternalId(
      workspaceConnection.workspace_slug,
      entityConnection.project_id ?? "",
      issue.id,
      data.object_attributes.id.toString(),
      glIntegrationKey
    );
  } catch (error) {}

  const glNote = await glService.getIssueComment(data.project.id, data.issue.iid, data.object_attributes.id);
  const gitlabBaseUrl = workspaceConnection.connection_data?.appConfig?.baseUrl;
  const gitlabUploadsPrefix = getGitlabUploadsPrefix(data.project.id.toString(), gitlabBaseUrl);
  const planeComment = await transformGitlabComment(
    glNote,
    data.repository.name,
    workspaceConnection.workspace_slug,
    entityConnection.project_id ?? "",
    issue.id,
    issueLinkEntityConnection?.config?.comment_id,
    planeClient,
    glService,
    userCredentials.source_access_token!,
    env.API_BASE_URL,
    gitlabUploadsPrefix,
    gitlabBaseUrl,
    data.isEnterprise ?? false,
    comment ? true : false
  );

  if (comment) {
    await planeClient.issueComment.update(
      workspaceConnection.workspace_slug,
      entityConnection.project_id ?? "",
      issue.id,
      comment.id,
      planeComment
    );
    // Set key with Plane comment ID so Plane->GitHub handler can detect and skip
    await store.set(PLANE_GITLAB_ISSUE_COMMENT_CACHE_KEY(comment.id), "true", 60);
  } else {
    const createdComment = await planeClient.issueComment.create(
      workspaceConnection.workspace_slug,
      entityConnection.project_id ?? "",
      issue.id,
      planeComment
    );
    // Set key with Plane comment ID so Plane->GitHub handler can detect and skip
    await store.set(PLANE_GITLAB_ISSUE_COMMENT_CACHE_KEY(createdComment.id), "true", 60);
  }
};

const getPlaneIssue = async (
  planeClient: PlaneClient,
  entityConnection: TGitlabEntityConnection,
  glProjectId: string,
  glIssueId: string,
  glIntegrationKey: E_INTEGRATION_KEYS
) => {
  try {
    return await planeClient.issue.getIssueWithExternalId(
      entityConnection.workspace_slug,
      entityConnection.project_id ?? "",
      GITLAB_ISSUE_EXTERNAL_ID(glProjectId, glIssueId),
      glIntegrationKey
    );
  } catch {
    return null;
  }
};
