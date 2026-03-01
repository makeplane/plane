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

import type { GitlabMergeRequestEvent } from "@plane/etl/gitlab";
import type { TGitlabEntityConnection, TGitlabWorkspaceConnection, TWorkspaceCredential } from "@plane/types";
import type { GitlabConnectionDetails } from "../types";
import {
  EConnectionType,
  gitlabEntityConnectionSchema,
  gitlabWorkspaceConnectionSchema,
  EGitlabEntityConnectionType,
} from "@plane/etl/gitlab";
import { logger } from "@plane/logger";
import { getAPIClient } from "@/services/client";
import { verifyEntityConnection, verifyEntityConnections, verifyWorkspaceConnection } from "@/types";
import { E_INTEGRATION_KEYS } from "@plane/types";

const apiClient = getAPIClient();

export const getGitlabConnectionDetails = async (
  data: GitlabMergeRequestEvent
): Promise<GitlabConnectionDetails | undefined> => {
  // for connection now user can also just have a group connection
  // project payload has array of groups attached to it so we need to check
  // if we have any group connections among them and use that or not then check for project connection

  // later we'll check for group connections already done for a project

  if (!data.project.id) {
    logger.error(`[GITLAB] Project id not found for project ${data.project.id}, skipping...`);
    return;
  }

  const [entityConnection] = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    entity_id: data.project.id.toString(),
    type: EConnectionType.ENTITY,
  });

  if (!entityConnection) {
    logger.error(`[GITLAB] Entity connection not found for project ${data.project.id}, skipping...`);
    return;
  }

  const verifiedEntityConnection = verifyEntityConnection(gitlabEntityConnectionSchema, entityConnection as any);

  // Find the workspace connection for the project
  const workspaceConnection = await apiClient.workspaceConnection.getWorkspaceConnection(
    entityConnection.workspace_connection_id
  );

  if (!workspaceConnection) {
    logger.error(`[GITLAB] Workspace connection not found for project ${data.project.id}, skipping...`);
    return;
  }

  const verifiedWorkspaceConnection = verifyWorkspaceConnection(
    gitlabWorkspaceConnectionSchema,
    workspaceConnection as any
  );

  // project connections for this workspace connection for target state mapping
  const projectConnectionSet = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    workspace_connection_id: workspaceConnection.id,
    type: EConnectionType.PLANE_PROJECT,
  });

  if (projectConnectionSet.length === 0) {
    logger.error(`[GITLAB] Plane Project connection not found for project ${data.project.id}, skipping...`);

    return {
      workspaceConnection: verifiedWorkspaceConnection,
      entityConnection: verifiedEntityConnection,
    };
  }

  const verifiedProjectConnection = verifyEntityConnections(gitlabEntityConnectionSchema, projectConnectionSet as any);

  return {
    workspaceConnection: verifiedWorkspaceConnection,
    entityConnection: verifiedEntityConnection,
    projectConnections: verifiedProjectConnection,
  };
};

export const getConnDetailsForGitlabToPlaneSync = async (
  gitlabProjectId: string,
  entityConnectionType: EGitlabEntityConnectionType,
  isEnterprise: boolean
): Promise<
  | {
      workspaceConnection: TGitlabWorkspaceConnection;
      entityConnection: TGitlabEntityConnection;
      credential: TWorkspaceCredential;
    }
  | undefined
> => {
  const glIntegrationKey = isEnterprise ? E_INTEGRATION_KEYS.GITLAB_ENTERPRISE : E_INTEGRATION_KEYS.GITLAB;
  logger.info(`${glIntegrationKey}[ISSUE] Received webhook event from gitlab 🐱 --------- [CREATE|UPDATE]`);

  const [entityConnection] = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    entity_id: gitlabProjectId,
    type: entityConnectionType,
    entity_type: glIntegrationKey,
  });

  if (!entityConnection) {
    logger.info(`${glIntegrationKey}[ISSUE] No entity connection found, skipping`, {
      projectId: gitlabProjectId,
    });
    return;
  }

  const wsConnection = await apiClient.workspaceConnection.getWorkspaceConnection(
    entityConnection.workspace_connection_id
  );

  if (!wsConnection) {
    logger.info(`${glIntegrationKey}[ISSUE] No workspace connection found, skipping`, {
      workspaceConnectionId: entityConnection.workspace_connection_id,
    });
    return;
  }

  if (!wsConnection.target_hostname) {
    logger.info(`${glIntegrationKey}[ISSUE] Target hostname not found, skipping`, {
      workspaceConnectionId: wsConnection.id,
    });
    return;
  }

  const userCredentials = await apiClient.workspaceCredential.getWorkspaceCredential(wsConnection.credential_id);

  if (!userCredentials) {
    logger.info(`${glIntegrationKey}[ISSUE] No plane credentials found, skipping`, {
      workspaceConnectionId: wsConnection.id,
    });
    return;
  }

  return {
    workspaceConnection: wsConnection as TGitlabWorkspaceConnection,
    entityConnection: entityConnection as TGitlabEntityConnection,
    credential: userCredentials,
  };
};

export const getConnDetailsForPlaneToGitlabSync = async (
  workspace: string,
  project: string,
  isEnterprise: boolean
): Promise<
  | {
      credentials: TWorkspaceCredential;
      entityConnection: TGitlabEntityConnection;
      workspaceConnection: TGitlabWorkspaceConnection;
    }
  | undefined
> => {
  const glIntegrationKey = isEnterprise ? E_INTEGRATION_KEYS.GITLAB_ENTERPRISE : E_INTEGRATION_KEYS.GITLAB;
  const entityConnectionArray = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    workspace_id: workspace,
    type: EGitlabEntityConnectionType.PROJECT_ISSUE_SYNC,
    entity_type: isEnterprise ? E_INTEGRATION_KEYS.GITLAB_ENTERPRISE : E_INTEGRATION_KEYS.GITLAB,
    project_id: project,
  });

  if (!entityConnectionArray || entityConnectionArray.length === 0) {
    logger.info(`${glIntegrationKey}[ISSUE] No entity connection found, skipping`, {
      workspace: workspace,
      project: project,
    });
    return;
  }

  const entityConnection = entityConnectionArray[0] as TGitlabEntityConnection;

  const workspaceConnnectionData = await apiClient.workspaceConnection.getWorkspaceConnection(
    entityConnection.workspace_connection_id
  );

  if (!workspaceConnnectionData) {
    logger.info(`${glIntegrationKey}[ISSUE] Workspace connection not found, skipping`, {
      workspaceConnectionId: entityConnection.workspace_connection_id,
    });
    return;
  }

  const workspaceConnection = workspaceConnnectionData as TGitlabWorkspaceConnection;

  // Get the credentials from the workspace connection
  const credentials = await apiClient.workspaceCredential.getWorkspaceCredential(workspaceConnection.credential_id);

  return {
    credentials: credentials,
    entityConnection: entityConnection,
    workspaceConnection: workspaceConnection,
  };
};
