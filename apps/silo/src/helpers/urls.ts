import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { env } from "@/env";
import { convertIntegrationKeyToProvider } from "@/services/oauth/helpers";

export const getUserProfileUrl = (workspaceSlug: string, userId: string) =>
  `${env.APP_BASE_URL}/${workspaceSlug}/profile/${userId}`;

export const getIssueUrlFromId = (workspaceSlug: string, projectId: string, issueId: string) =>
  `${env.APP_BASE_URL}/${workspaceSlug}/projects/${projectId}/issues/${issueId}`;

export const getIssueUrlFromSequenceId = (workspaceSlug: string, projectIdentifier: string, sequenceId: string) =>
  `${env.APP_BASE_URL}/${workspaceSlug}/browse/${projectIdentifier}-${sequenceId}`;

export const getModuleUrl = (workspaceSlug: string, projectId: string, moduleId: string) =>
  `${env.APP_BASE_URL}/${workspaceSlug}/projects/${projectId}/modules/${moduleId}`;

export const getCycleUrl = (workspaceSlug: string, projectId: string, cycleId: string) =>
  `${env.APP_BASE_URL}/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`;

export const getProjectUrl = (workspaceSlug: string, projectId: string) =>
  `${env.APP_BASE_URL}/${workspaceSlug}/projects/${projectId}`;

export const getIntakeUrl = (workspaceSlug: string, projectId: string, issueId: string) =>
  `${env.APP_BASE_URL}/${workspaceSlug}/projects/${projectId}/intake/?currentTab=open&inboxIssueId=${issueId}`;

export const getPlaneLogoUrl = () => "https://media.docs.plane.so/logo/favicon-512x512.png";

export const getPublishedPageUrl = (pageId: string) => `${env.SPACE_BASE_URL}/pages/${pageId}`;

export const getTeamspacePageUrl = (workspaceSlug: string, teamspaceId: string, pageId: string) =>
  `${env.APP_BASE_URL}/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}`;

export const getProjectPageUrl = (workspaceSlug: string, projectId: string, pageId: string) =>
  `${env.APP_BASE_URL}/${workspaceSlug}/projects/${projectId}/pages/${pageId}`;

export const getWorkspacePageUrl = (workspaceSlug: string, pageId: string) =>
  `${env.APP_BASE_URL}/${workspaceSlug}/pages/${pageId}`;

export const getIntegrationPageUrl = (workspaceSlug: string, integrationKey: E_INTEGRATION_KEYS) => {
  const provider = convertIntegrationKeyToProvider(integrationKey);
  return `${env.APP_BASE_URL}/${workspaceSlug}/settings/integrations/${provider}`;
};
