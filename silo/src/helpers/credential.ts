import { TWorkspaceCredential } from "@plane/types";
import { getAPIClient } from "@/services/client";
import { E_IMPORTER_KEYS } from "@plane/etl/core";

export const getValidCredentials = async (workspaceId: string, userId: string, source: string) => {
  const apiClient = getAPIClient();
  const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
    workspace_id: workspaceId,
    source: source,
    user_id: userId,
  });
  if (!credentials || credentials.length === 0) {
    throw new Error("No importer credentials available for the given workspaceId and userId");
  }

  if (credentials.length > 1) {
    throw new Error("Multiple importer credentials found for the given workspaceId and userId");
  }

  const credential = credentials[0];

  const userEmailRequiredSources = [E_IMPORTER_KEYS.JIRA as string, E_IMPORTER_KEYS.JIRA_SERVER as string];

  let isInvalidCredentials = credential.target_access_token === null || credential.source_access_token === null;
  // invalid creds logic different for jira and jira server
  if (userEmailRequiredSources.includes(source)) {
    isInvalidCredentials =
      credential.target_access_token === null ||
      credential.source_access_token === null ||
      credential.source_auth_email === null;
  }

  if (isInvalidCredentials) {
    throw new Error("No importer credentials available for the given workspaceId and userId");
  }

  return credential;
};

export const createOrUpdateCredentials = async (
  workspaceId: string,
  userId: string,
  source: string,
  updates: Partial<TWorkspaceCredential>
) => {
  const client = getAPIClient();
  const credentials = await client.workspaceCredential.listWorkspaceCredentials({
    workspace_id: workspaceId,
    source: source,
    user_id: userId,
  });

  if (credentials.length > 1) {
    throw new Error("Multiple importer credentials found for the given workspaceId and userId");
  }

  if (credentials.length === 0) {
    return await client.workspaceCredential.createWorkspaceCredential({
      workspace_id: workspaceId,
      user_id: userId,
      source: source,
      ...updates,
    });
  }

  // Update the credentials
  const credential = credentials[0];
  return await client.workspaceCredential.updateWorkspaceCredential(credential.id, updates);
};

export const deactivateCredentials = async (workspaceId: string, userId: string, source: string) => {
  const client = getAPIClient();
  const credentials = await client.workspaceCredential.listWorkspaceCredentials({
    workspace_id: workspaceId,
    source: source,
    user_id: userId,
  });

  if (credentials.length > 1) {
    throw new Error("Multiple importer credentials found for the given workspaceId and userId");
  }

  if (credentials.length === 0) {
    return;
  }

  // Update the credentials
  const credential = credentials[0];
  await client.workspaceCredential.updateWorkspaceCredential(credential.id, {
    is_active: false,
  });
};

export const getCredentialsByWorkspaceId = async (workspaceId: string, userId: string, source: string) => {
  const client = getAPIClient();
  return await client.workspaceCredential.listWorkspaceCredentials({
    workspace_id: workspaceId,
    source: source,
    user_id: userId,
  });
};
