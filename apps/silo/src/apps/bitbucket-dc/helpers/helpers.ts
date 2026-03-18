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

import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import { EBitbucketEntityConnectionType } from "@plane/etl/bitbucket";
import type { BitbucketPullRequestWebhookAction, BitbucketWebhookPayload } from "@plane/etl/bitbucket";
import { logger } from "@plane/logger";
import type { TBitbucketEntityConnection, TBitbucketWorkspaceConnection, TWorkspaceCredential } from "@plane/types";
import { E_ENTITY_CONNECTION_KEYS, E_INTEGRATION_KEYS } from "@plane/types";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getAPIClient } from "@/services/client";
import { extractBitbucketBaseUrlFromPullRequestUrl, extractBitbucketBaseUrlFromRepositoryUrl } from "./sync";

// Direct apiClient is used in resolveBitbucketWebhookContext for cross-workspace queries
// that integrationConnectionHelper does not support (listing all connections without workspace_id).
const apiClient = getAPIClient();

type BitbucketRepositoryMatchProps = {
  repositoryId?: string;
  repoSlug?: string;
  projectKey?: string;
};

type BitbucketRepositoryReference = {
  repoSlug: string;
  projectKey?: string;
};

const normalizeRepositoryValue = (value: string | undefined | null): string | undefined => {
  const normalizedValue = value?.trim().toLowerCase();
  return normalizedValue || undefined;
};

const parseRepositoryReference = (value: string | undefined | null): BitbucketRepositoryReference | undefined => {
  const normalizedValue = normalizeRepositoryValue(value);
  if (!normalizedValue) {
    return undefined;
  }

  const projectRepoPathMatch = normalizedValue.match(/projects\/([^/]+)\/repos\/([^/?#]+)/i);
  if (projectRepoPathMatch) {
    return {
      projectKey: projectRepoPathMatch[1],
      repoSlug: projectRepoPathMatch[2],
    };
  }

  const segments = normalizedValue.split("/").filter(Boolean);
  if (segments.length >= 2) {
    return {
      projectKey: segments[segments.length - 2],
      repoSlug: segments[segments.length - 1],
    };
  }

  return {
    repoSlug: normalizedValue,
  };
};

const getFirstString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === "string") return value;
  }
  return undefined;
};

const parseRepositoryReferenceFromEntityData = (entityData: unknown): BitbucketRepositoryReference | undefined => {
  if (!entityData || typeof entityData !== "object") {
    return undefined;
  }

  const data = entityData as {
    slug?: unknown;
    repoSlug?: unknown;
    repository?: { slug?: unknown };
    project?: { key?: unknown };
    projectKey?: unknown;
  };

  const repoSlug = getFirstString(data.slug, data.repoSlug, data.repository?.slug);

  const projectKey = getFirstString(data.project?.key, data.projectKey);

  const normalizedRepoSlug = normalizeRepositoryValue(repoSlug);
  if (!normalizedRepoSlug) return undefined;

  return {
    repoSlug: normalizedRepoSlug,
    projectKey: normalizeRepositoryValue(projectKey),
  };
};

export const normalizeBitbucketBaseUrl = (baseUrl: string | undefined | null): string | undefined => {
  const normalizedValue = baseUrl?.trim().replace(/\/+$/, "");
  return normalizedValue || undefined;
};

export const getBitbucketWorkspaceConnectionBaseUrl = (
  workspaceConnection: Pick<TBitbucketWorkspaceConnection, "connection_data" | "source_hostname">
): string | undefined =>
  normalizeBitbucketBaseUrl(workspaceConnection.connection_data?.baseUrl || workspaceConnection.source_hostname);

export const filterBitbucketWorkspaceConnectionsByBaseUrl = (
  workspaceConnections: TBitbucketWorkspaceConnection[],
  sourceBaseUrl: string | undefined
): TBitbucketWorkspaceConnection[] => {
  const normalizedSourceBaseUrl = normalizeBitbucketBaseUrl(sourceBaseUrl);
  if (!normalizedSourceBaseUrl) {
    return workspaceConnections;
  }

  return workspaceConnections.filter(
    (workspaceConnection) => getBitbucketWorkspaceConnectionBaseUrl(workspaceConnection) === normalizedSourceBaseUrl
  );
};

export const doesBitbucketEntityConnectionMatchRepository = (
  entityConnection: Pick<TBitbucketEntityConnection, "entity_id" | "entity_slug" | "entity_data">,
  props: BitbucketRepositoryMatchProps
): boolean => {
  if (props.repositoryId && entityConnection.entity_id === props.repositoryId) {
    return true;
  }

  const normalizedRepoSlug = normalizeRepositoryValue(props.repoSlug);
  if (!normalizedRepoSlug) {
    return false;
  }

  const normalizedProjectKey = normalizeRepositoryValue(props.projectKey);

  const references = [
    parseRepositoryReference(entityConnection.entity_slug),
    parseRepositoryReferenceFromEntityData(entityConnection.entity_data),
  ].filter((reference): reference is BitbucketRepositoryReference => Boolean(reference));

  if (references.length === 0) {
    return false;
  }

  return references.some((reference) => {
    if (reference.repoSlug !== normalizedRepoSlug) {
      return false;
    }

    if (!normalizedProjectKey) {
      return true;
    }

    const normalizedReferenceProjectKey = normalizeRepositoryValue(reference.projectKey);
    return !normalizedReferenceProjectKey || normalizedReferenceProjectKey === normalizedProjectKey;
  });
};

export const getConnDetailsForBitbucketToPlaneSync = async (props: {
  wsAdminCredentials: TWorkspaceCredential;
  type: EBitbucketEntityConnectionType;
  repositoryId?: string;
  repoSlug?: string;
  projectKey?: string;
  planeProjectId?: string;
}): Promise<{
  workspaceConnection: TBitbucketWorkspaceConnection;
  entityConnectionForRepository: TBitbucketEntityConnection | undefined;
  projectConnection: TBitbucketEntityConnection | undefined;
  allEntityConnections: TBitbucketEntityConnection[];
}> => {
  const { wsAdminCredentials, type, repositoryId, repoSlug, projectKey, planeProjectId } = props;

  const workspaceConnections = await integrationConnectionHelper.getWorkspaceConnections({
    workspace_id: wsAdminCredentials.workspace_id,
    connection_type: E_INTEGRATION_KEYS.BITBUCKET_DC,
  });

  if (workspaceConnections.length === 0) {
    throw new Error("No workspace connection found for the provided Bitbucket credentials");
  }

  const entityConnections = await integrationConnectionHelper.findWorkspaceEntityConnections({
    workspace_id: wsAdminCredentials.workspace_id,
    entity_type: E_INTEGRATION_KEYS.BITBUCKET_DC,
    type,
  });

  const projectConnection = entityConnections.find(
    (entityConnection) => entityConnection.project_id === planeProjectId
  );

  const entityConnectionForRepository = entityConnections.find((entityConnection) =>
    doesBitbucketEntityConnectionMatchRepository(entityConnection as TBitbucketEntityConnection, {
      repositoryId,
      repoSlug,
      projectKey,
    })
  );

  return {
    workspaceConnection: workspaceConnections[0] as TBitbucketWorkspaceConnection,
    entityConnectionForRepository: entityConnectionForRepository as TBitbucketEntityConnection | undefined,
    projectConnection: projectConnection as TBitbucketEntityConnection | undefined,
    allEntityConnections: entityConnections as TBitbucketEntityConnection[],
  };
};

export type BitbucketWebhookContext = {
  workspaceConnection: TBitbucketWorkspaceConnection;
  wsAdminCredential: TWorkspaceCredential;
  planeCredentials: TWorkspaceCredential;
};

export const resolveBitbucketWebhookContext = async (props: {
  sourceBaseUrl: string | undefined;
  repositoryId: string;
  repoSlug: string;
  projectKey: string;
  actorIdentifier: string;
  logPrefix: string;
}): Promise<BitbucketWebhookContext | null> => {
  const { sourceBaseUrl, repositoryId, repoSlug, projectKey, actorIdentifier, logPrefix } = props;

  const workspaceConnections = filterBitbucketWorkspaceConnectionsByBaseUrl(
    (await apiClient.workspaceConnection.listWorkspaceConnections({
      connection_type: E_INTEGRATION_KEYS.BITBUCKET_DC,
    })) as TBitbucketWorkspaceConnection[],
    sourceBaseUrl
  );

  if (workspaceConnections.length === 0) {
    logger.info(`${logPrefix} No workspace connection found for webhook source, skipping`, {
      sourceBaseUrl,
      repositoryId,
      repoSlug,
    });
    return null;
  }

  const workspaceConnectionsById = new Map(
    workspaceConnections.map((workspaceConnection) => [workspaceConnection.id, workspaceConnection])
  );

  const allRepoConnections = await integrationConnectionHelper.findWorkspaceEntityConnections({
    entity_type: E_INTEGRATION_KEYS.BITBUCKET_DC,
    type: EBitbucketEntityConnectionType.PROJECT_PR_AUTOMATION,
  });

  const repositoryEntityConnection = allRepoConnections.find(
    (entityConnection) =>
      workspaceConnectionsById.has(entityConnection.workspace_connection_id) &&
      doesBitbucketEntityConnectionMatchRepository(entityConnection as TBitbucketEntityConnection, {
        repositoryId,
        repoSlug,
        projectKey,
      })
  );

  if (!repositoryEntityConnection) {
    logger.info(`${logPrefix} No entity connection found for repository, skipping`, {
      repositoryId,
      repoSlug,
      sourceBaseUrl,
    });
    return null;
  }

  const workspaceConnection = workspaceConnectionsById.get(repositoryEntityConnection.workspace_connection_id);
  if (!workspaceConnection) {
    logger.info(`${logPrefix} Workspace connection not found, skipping`, {
      workspaceConnectionId: repositoryEntityConnection.workspace_connection_id,
    });
    return null;
  }

  const wsAdminCredential = await integrationConnectionHelper.getWorkspaceCredential({
    credential_id: workspaceConnection.credential_id,
  });
  if (!wsAdminCredential?.source_access_token) {
    logger.info(`${logPrefix} Workspace credential missing source access token, skipping`, {
      workspaceConnectionId: workspaceConnection.id,
    });
    return null;
  }

  const [mappedUserCredential] = actorIdentifier
    ? await apiClient.workspaceCredential.listWorkspaceCredentials({
        source: E_ENTITY_CONNECTION_KEYS.BITBUCKET_DC_USER,
        workspace_id: workspaceConnection.workspace_id,
        source_identifier: actorIdentifier,
      })
    : [];

  const planeCredentials = mappedUserCredential || wsAdminCredential;
  if (!planeCredentials.target_access_token) {
    logger.info(`${logPrefix} No Plane credentials found, skipping`, {
      repositoryId,
      repoSlug,
      workspaceConnectionId: workspaceConnection.id,
    });
    return null;
  }

  return { workspaceConnection, wsAdminCredential, planeCredentials };
};

export const getConnDetailsForPlaneToBitbucketSync = async (
  workspace: string,
  project: string
): Promise<{
  credentials: TWorkspaceCredential;
  entityConnection: TBitbucketEntityConnection;
  workspaceConnection: TBitbucketWorkspaceConnection;
}> => {
  const entityConnectionArray = await integrationConnectionHelper.findWorkspaceEntityConnections({
    workspace_id: workspace,
    type: EBitbucketEntityConnectionType.PROJECT_PR_AUTOMATION,
    entity_type: E_INTEGRATION_KEYS.BITBUCKET_DC,
    project_id: project,
  });

  if (!entityConnectionArray || entityConnectionArray.length === 0) {
    throw new Error("Bitbucket entity connection not found");
  }

  const entityConnection = entityConnectionArray[0] as TBitbucketEntityConnection;
  const workspaceConnectionData = await integrationConnectionHelper.getWorkspaceConnection({
    connection_id: entityConnection.workspace_connection_id,
  });

  if (!workspaceConnectionData) {
    throw new Error("Bitbucket workspace connection not found");
  }

  const workspaceConnection = workspaceConnectionData as TBitbucketWorkspaceConnection;
  const credentials = await integrationConnectionHelper.getWorkspaceCredential({
    credential_id: workspaceConnection.credential_id,
  });

  return {
    credentials,
    entityConnection,
    workspaceConnection,
  };
};

export const BITBUCKET_PR_WEBHOOK_EVENTS: BitbucketPullRequestWebhookAction[] = [
  "pr:opened",
  "pr:merged",
  "pr:declined",
  "pr:deleted",
  "pr:modified",
];

export const getHeaderValue = (header: string | string[] | undefined): string | undefined =>
  Array.isArray(header) ? header[0] : header;

export const logBitbucketWebhookPayload = (
  payload: BitbucketWebhookPayload,
  eventType: string | undefined,
  deliveryId: string | undefined
): void => {
  const repository = payload.pullRequest?.toRef?.repository || payload.repository;

  logger.info("Bitbucket Webhook Payload", {
    log: {
      eventType,
      deliveryId,
      projectKey: repository?.project?.key,
      repositoryId: repository?.id,
      repositoryName: repository?.name,
      repoSlug: repository?.slug,
      pullRequestId: payload.pullRequest?.id,
    },
  });
};

export const getWebhookSourceBaseUrl = (payload: BitbucketWebhookPayload): string | undefined => {
  const pullRequestUrl = payload.pullRequest?.links?.self?.[0]?.href;
  if (pullRequestUrl) {
    const sourceBaseUrl = extractBitbucketBaseUrlFromPullRequestUrl(pullRequestUrl);
    if (sourceBaseUrl) {
      return sourceBaseUrl;
    }
  }

  const repositoryUrl = payload.repository?.links?.self?.[0]?.href;
  if (repositoryUrl) {
    return extractBitbucketBaseUrlFromRepositoryUrl(repositoryUrl);
  }

  return undefined;
};

const getWebhookRepositoryDetails = (
  payload: BitbucketWebhookPayload
): { repositoryId?: string; repoSlug?: string; projectKey?: string } => {
  const repository = payload.pullRequest?.toRef?.repository || payload.repository;

  return {
    repositoryId: repository?.id?.toString(),
    repoSlug: repository?.slug,
    projectKey: repository?.project?.key,
  };
};

const resolveBitbucketWorkspaceConnectionForWebhook = async (props: {
  sourceBaseUrl: string | undefined;
  repositoryId?: string;
  repoSlug?: string;
  projectKey?: string;
}): Promise<TBitbucketWorkspaceConnection | null> => {
  const { sourceBaseUrl, repositoryId, repoSlug, projectKey } = props;

  const workspaceConnections = filterBitbucketWorkspaceConnectionsByBaseUrl(
    (await apiClient.workspaceConnection.listWorkspaceConnections({
      connection_type: E_INTEGRATION_KEYS.BITBUCKET_DC,
    })) as TBitbucketWorkspaceConnection[],
    sourceBaseUrl
  );

  if (workspaceConnections.length === 0) {
    return null;
  }

  const workspaceConnectionsById = new Map(
    workspaceConnections.map((workspaceConnection) => [workspaceConnection.id, workspaceConnection])
  );

  const allRepoConnections = await integrationConnectionHelper.findWorkspaceEntityConnections({
    entity_type: E_INTEGRATION_KEYS.BITBUCKET_DC,
    type: EBitbucketEntityConnectionType.PROJECT_PR_AUTOMATION,
  });

  const repositoryEntityConnection = allRepoConnections.find(
    (entityConnection) =>
      workspaceConnectionsById.has(entityConnection.workspace_connection_id) &&
      doesBitbucketEntityConnectionMatchRepository(entityConnection as TBitbucketEntityConnection, {
        repositoryId,
        repoSlug,
        projectKey,
      })
  );

  if (!repositoryEntityConnection) {
    return null;
  }

  return workspaceConnectionsById.get(repositoryEntityConnection.workspace_connection_id) ?? null;
};

export async function verifyBitbucketWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const webhookPayload = req.body as BitbucketWebhookPayload;
    const sourceBaseUrl = getWebhookSourceBaseUrl(webhookPayload);
    const { repositoryId, repoSlug, projectKey } = getWebhookRepositoryDetails(webhookPayload);
    const workspaceConnection = await resolveBitbucketWorkspaceConnectionForWebhook({
      sourceBaseUrl,
      repositoryId,
      repoSlug,
      projectKey,
    });
    const webhookSecret = workspaceConnection?.connection_data?.appConfig?.webhookSecret;

    if (!webhookSecret) {
      return next();
    }

    const signature = getHeaderValue(req.headers["x-hub-signature"]);
    const eventType = getHeaderValue(req.headers["x-event-key"]);
    const requestId = getHeaderValue(req.headers["x-request-id"]);

    if (!signature) {
      logBitbucketWebhookPayload(req.body as BitbucketWebhookPayload, eventType, requestId);
      return res.status(401).json({
        error: "Missing X-Hub-Signature header",
      });
    }

    const payload = (req as Request & { rawBody?: string }).rawBody || JSON.stringify(req.body);
    if (!payload) {
      logBitbucketWebhookPayload(req.body as BitbucketWebhookPayload, eventType, requestId);
      return res.status(400).json({
        error: "Request body empty",
      });
    }

    const calculatedSignature = "sha256=" + crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");

    const normalizedSignature = signature.startsWith("sha256=") ? signature : `sha256=${signature}`;

    if (Buffer.byteLength(calculatedSignature) !== Buffer.byteLength(normalizedSignature)) {
      logBitbucketWebhookPayload(req.body as BitbucketWebhookPayload, eventType, requestId);
      return res.status(401).json({
        error: "Invalid signature",
      });
    }

    const verified = crypto.timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(normalizedSignature));

    if (!verified) {
      logBitbucketWebhookPayload(req.body as BitbucketWebhookPayload, eventType, requestId);
      return res.status(401).json({
        error: "Invalid signature",
      });
    }

    return next();
  } catch (error) {
    logger.error("Error validating Bitbucket webhook:", error);
    return res.status(500).json({
      error: "Error validating webhook signature",
    });
  }
}
