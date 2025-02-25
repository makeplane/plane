import { env } from "@/env";
import { createGitLabAuth } from "@plane/etl/gitlab";

export const gitlabAuthService = createGitLabAuth({
    clientId: env.GITLAB_CLIENT_ID,
    clientSecret: env.GITLAB_CLIENT_SECRET,
    redirectUri: `${env.SILO_API_BASE_URL}${env.SILO_BASE_PATH}/api/gitlab/auth/callback`,
});