import { TSlackDMAlertKeyProps } from "@/apps/slack/types/alerts";
import { EOAuthGrantType } from "@/types/oauth";

export const getTokenCacheKey = (
  appInstallationId: string,
  authorizationType: EOAuthGrantType,
  userId?: string
): string => {
  if (authorizationType === EOAuthGrantType.AUTHORIZATION_CODE) {
    if (!userId) {
      throw new Error("User ID is required for authorization code grant type");
    }
    return `oauth_token:${appInstallationId}:${userId}:${authorizationType}`;
  }
  return `oauth_token:${appInstallationId}:${authorizationType}`;
};

export const getPlaneAppDetailsCacheKey = (appName: string) => `plane_app_details_${appName}`;

export const IMPORT_JOB_PLANE_ISSUE_TYPES_CACHE_KEY = (jobId: string) => `silo:import_job_plane_issue_types_${jobId}`;

export const IMPORT_JOB_PLANE_ISSUE_PROPERTIES_CACHE_KEY = (jobId: string) =>
  `silo:import_job_plane_issue_properties_${jobId}`;

export const IMPORT_JOB_PLANE_ISSUE_PROPERTY_OPTIONS_CACHE_KEY = (jobId: string) =>
  `silo:import_job_plane_issue_property_options_${jobId}`;

export const IMPORT_JOB_PLANE_MEMBERS_CACHE_KEY = (jobId: string) => `silo:import_job_plane_members_${jobId}`;

export const IMPORT_JOB_FIRST_PAGE_PUSHED_CACHE_KEY = (jobId: string) => `silo:import_job_first_page_pushed_${jobId}`;

export const SILO_FORM_OPTIONS_CACHE_KEY = (slug: string, projectId: string, typeIdentifier: string) =>
  `silo:form_options_${slug}_${projectId}_${typeIdentifier}`;

export const getSlackDMAlertKey = ({
  workspace_id,
  project_id,
  issue_id,
  issue_comment_id,
}: TSlackDMAlertKeyProps): string => {
  let key = `silo:slack:alert:dm:${workspace_id}:${project_id}:${issue_id}`;

  if (issue_comment_id) {
    key += `:${issue_comment_id}`;
  }

  return key;
};
