import { getCredentialsBySourceToken, getCredentialsByWorkspaceId } from "@/db/query";

export const getCredentialsForTargetToken = async (targetToken: string) => {
  const credentials = await getCredentialsBySourceToken(targetToken);

  if (!credentials || credentials.length === 0) {
    throw new Error("No credentials found for installation id");
  }

  const planeCredentials = credentials[0];

  if (!planeCredentials.target_access_token) {
    throw new Error("No target access token found for installation id");
  }

  return planeCredentials;
};

export const getValidCredentials = async (workspaceId: string, userId: string, source: string) => {
  const credentials = await getCredentialsByWorkspaceId(workspaceId, userId, source);
  if (!credentials || credentials.length === 0) {
    throw new Error("No importer credentials available for the given workspaceId and userId");
  }

  if (credentials.length > 1) {
    throw new Error("Multiple importer credentials found for the given workspaceId and userId");
  }

  const credential = credentials[0];

  const userEmailRequiredSources = ["JIRA", "JIRA_SERVER"]
  
  let isInvalidCredentials = credential.target_access_token === null || credential.source_access_token === null;
  // invalid creds logic different for jira and jira server
  if (userEmailRequiredSources.includes(source)) {
      isInvalidCredentials = credential.target_access_token === null || credential.source_access_token === null || credential.user_email === null;
  }

  if (isInvalidCredentials) {
    throw new Error("No importer credentials available for the given workspaceId and userId");
  }

  return credential;
}
