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

import { EBitbucketEntityConnectionType } from "@plane/etl/bitbucket";
import type { BitbucketPullRequestDedupPayload, BitbucketPullRequestWebhookAction } from "@plane/etl/bitbucket";
import { logger } from "@plane/logger";
import { E_INTEGRATION_KEYS } from "@plane/types";
import {
  getBitbucketWorkspaceConnectionBaseUrl,
  getConnDetailsForBitbucketToPlaneSync,
  resolveBitbucketWebhookContext,
} from "@/apps/bitbucket-dc/helpers/helpers";
import { getBitbucketClientService } from "@/apps/bitbucket-dc/helpers/service";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { PullRequestBehaviour } from "@/lib/behaviours";

export const handlePullRequestEvents = async (_action: BitbucketPullRequestWebhookAction, data: unknown) => {
  await handlePullRequestEvent(data as BitbucketPullRequestDedupPayload);
  return true;
};

const handlePullRequestEvent = async (data: BitbucketPullRequestDedupPayload) => {
  if (!data.projectKey || !data.repoSlug || !data.pullRequestId || !data.repositoryId) {
    logger.info("[BITBUCKET][PULL-REQUEST] Missing required payload fields, skipping", {
      data,
    });
    return;
  }

  const context = await resolveBitbucketWebhookContext({
    sourceBaseUrl: data.sourceBaseUrl,
    repositoryId: data.repositoryId,
    repoSlug: data.repoSlug,
    projectKey: data.projectKey,
    actorIdentifier: data.eventActorId?.trim() || "",
    logPrefix: "[BITBUCKET][PULL-REQUEST]",
  });

  if (!context) {
    return;
  }

  const { wsAdminCredential, planeCredentials } = context;

  const { workspaceConnection: bitbucketWorkspaceConnection, allEntityConnections } =
    await getConnDetailsForBitbucketToPlaneSync({
      wsAdminCredentials: wsAdminCredential,
      type: EBitbucketEntityConnectionType.PROJECT_PR_AUTOMATION,
      repositoryId: data.repositoryId,
      repoSlug: data.repoSlug,
      projectKey: data.projectKey,
    });

  const baseUrl = getBitbucketWorkspaceConnectionBaseUrl(bitbucketWorkspaceConnection);
  if (!baseUrl) {
    logger.info("[BITBUCKET][PULL-REQUEST] Bitbucket base URL missing in connection data, skipping", {
      workspaceConnectionId: bitbucketWorkspaceConnection.id,
    });
    return;
  }

  const planeClient = await getPlaneAPIClient(planeCredentials, E_INTEGRATION_KEYS.BITBUCKET_DC);
  const pullRequestService = await getBitbucketClientService(bitbucketWorkspaceConnection);

  const pullRequestBehaviour = new PullRequestBehaviour(
    E_INTEGRATION_KEYS.BITBUCKET_DC,
    bitbucketWorkspaceConnection.workspace_slug,
    pullRequestService,
    planeClient,
    allEntityConnections
  );

  await pullRequestBehaviour.handleEvent({
    owner: data.projectKey,
    repositoryName: data.repoSlug,
    pullRequestIdentifier: data.pullRequestId,
  });
};
