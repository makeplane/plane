import { env } from "@/env";

export const getAppOAuthCallbackUrl = (provider: string) =>
  `${env.SILO_API_BASE_URL}${env.SILO_BASE_PATH}/api/apps/${provider}/auth/callback`;

export const getCallbackSuccessUrl = (provider: string, workspaceSlug?: string) =>
  workspaceSlug
    ? `${env.APP_BASE_URL}/${workspaceSlug}/settings/integrations/${provider}/`
    : `${env.APP_BASE_URL}/integrations/${provider}/success`;
