import { deleteCredentialsBySourceToken } from "@/db/query";
import { GithubWebhookPayload } from "@silo/github";

export const handleInstallationEvents = async (action: string, data: unknown): Promise<boolean> => {
  switch (action) {
    case "deleted": {
      await handleInstallationDeletion(data as unknown as GithubWebhookPayload["webhook-installation-deleted"]);
      return true;
    }
    default: {
      return false;
    }
  }
};

export const handleInstallationDeletion = async (data: GithubWebhookPayload["webhook-installation-deleted"]) => {
  const installationId = data.installation.id;
  await deleteCredentialsBySourceToken(installationId.toString());
};
