import { E_IMPORTER_KEYS } from "@plane/etl/core";
import { TImporterCredentialValidation } from "@plane/types";
import { createAsanaClient } from "@/apps/asana-importer/controllers";
import { createJiraServerClient } from "@/apps/jira-server-importer/controllers";
import { createLinearClient } from "@/apps/linear-importer/controllers";
import { APIClient } from "@/services/client";
import { createJiraClient } from "../controllers";

export enum E_VALIDATION_ERRORS {
  CREDENTIAL_ABSENT = "Credentials not found for the source",
  CREDENTIAL_INVALID = "Invalid source access token",
}

export const validateImporterCredentials = async (
  apiClient: APIClient,
  workspaceId: string,
  userId: string,
  source: E_IMPORTER_KEYS
): Promise<TImporterCredentialValidation> => {
  // Validate credentials from Plane side
  const validationResult: TImporterCredentialValidation = {
    isAuthenticated: false,
    isOAuthEnabled: false,
    sourceTokenInvalid: false,
  };

  const targetValidation = await apiClient.workspaceCredential.verifyWorkspaceCredentials(source, userId, workspaceId);

  // Assign the values to the result object
  validationResult.isAuthenticated = targetValidation.isAuthenticated;
  validationResult.isOAuthEnabled = targetValidation.isOAuthEnabled;

  // If the credentials are not authenticated, return the result
  if (!validationResult.isAuthenticated) return validationResult;

  // If the credentials do exist and are authenticated, validate the source
  // token for expiration
  const sourceValidationError = await validateSourceCredentials(workspaceId, userId, source);

  if (!sourceValidationError) {
    // All good
    return validationResult;
  } else {
    // Return the source validation error if it exists
    return { ...validationResult, sourceTokenInvalid: true };
  }
};

const validateSourceCredentials = async (workspaceId: string, userId: string, source: E_IMPORTER_KEYS) => {
  switch (source) {
    case E_IMPORTER_KEYS.JIRA:
      return validateJiraCredentials(workspaceId, userId);
    case E_IMPORTER_KEYS.JIRA_SERVER:
      return validateJiraServerCredentials(workspaceId, userId);
    case E_IMPORTER_KEYS.LINEAR:
      return validateLinearCredentials(workspaceId, userId);
    case E_IMPORTER_KEYS.ASANA:
      return validateAsanaCredentials(workspaceId, userId);
    default:
      return E_VALIDATION_ERRORS.CREDENTIAL_ABSENT;
  }
};

const validateJiraCredentials = async (
  workspaceId: string,
  userId: string
): Promise<E_VALIDATION_ERRORS | undefined> => {
  try {
    const jiraClient = await createJiraClient(workspaceId, userId);
    await jiraClient.getCurrentUser();
  } catch (error) {
    return E_VALIDATION_ERRORS.CREDENTIAL_INVALID;
  }
};

const validateJiraServerCredentials = async (
  workspaceId: string,
  userId: string
): Promise<E_VALIDATION_ERRORS | undefined> => {
  try {
    const jiraService = await createJiraServerClient(workspaceId, userId);
    await jiraService.getCurrentUser();
  } catch (error) {
    return E_VALIDATION_ERRORS.CREDENTIAL_INVALID;
  }
};

const validateLinearCredentials = async (
  workspaceId: string,
  userId: string
): Promise<E_VALIDATION_ERRORS | undefined> => {
  try {
    const linearClient = await createLinearClient(workspaceId, userId);
    await linearClient.organization();
  } catch (error) {
    return E_VALIDATION_ERRORS.CREDENTIAL_INVALID;
  }
};

const validateAsanaCredentials = async (
  workspaceId: string,
  userId: string
): Promise<E_VALIDATION_ERRORS | undefined> => {
  try {
    const asanaClient = await createAsanaClient(workspaceId, userId);
    await asanaClient.getWorkspaces();
  } catch (error) {
    return E_VALIDATION_ERRORS.CREDENTIAL_INVALID;
  }
};
