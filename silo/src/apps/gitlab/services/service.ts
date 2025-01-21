import { createOrUpdateCredentials, getCredentialsByOnlyWorkspaceId, getCredentialsByWorkspaceId } from "@/db/query";
import { createGitLabService } from "@plane/etl/gitlab";

export const getGitlabClientService = async (workspaceId: string, ) => {
    try {
        // Create or update credentials
        const credentials = await getCredentialsByOnlyWorkspaceId(workspaceId, "GITLAB",);
        const { source_access_token, source_refresh_token, target_access_token, user_id: userId } = credentials[0];

        if (!source_access_token || !source_refresh_token || !userId || !target_access_token) {
            throw new Error("No gitlab credentials available for the given workspaceId and userId");
        }

        const gitlabService = createGitLabService(
            source_access_token,
            source_refresh_token,
            async (access_token, refresh_token) => {
                await createOrUpdateCredentials(workspaceId, userId, {
                    source_access_token: access_token,
                    source_refresh_token: refresh_token,
                    target_access_token: target_access_token,
                    source: "GITLAB",
                });
            }
        );
        return gitlabService;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

