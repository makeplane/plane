import { Octokit } from 'octokit'
import { createAppAuth } from '@octokit/auth-app'


export const getOctokit = async (installationId: number): Promise<Octokit> => {

    const appId = process.env.GITHUB_APP_ID || "";
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY || "";

    if (!privateKey || !appId) {
        throw new Error("Private key and App ID not found in environment variables.");
    }

    // Initiate the octokit
    const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: appId,
            privateKey: privateKey,
            installationId: installationId
        }
    })

    return octokit;
}
