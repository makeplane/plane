import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { SentryInstallationWebhook } from "@plane/etl/sentry";
import { logger } from "@/logger";
import { APIClient, getAPIClient } from "@/services/client";
import { Store } from "@/worker/base";

/**
 * Installation Handler is responsible for handling Sentry installation webhooks
 * to manage workspace connections. When Sentry app is uninstalled, this handler
 * will clean up the corresponding workspace connection to prevent orphaned data.
 */
export class SentryInstallationHandler {
  private apiClient: APIClient = getAPIClient();

  /**
   * The handle task will process Sentry installation webhooks.
   * Currently only processes "deleted" actions to clean up connections.
   */
  async handle(store: Store, data: SentryInstallationWebhook): Promise<void> {
    try {
      // Only process uninstallation events
      if (data.action === "deleted") {
        await this.handleUninstallation(data);
      }
    } catch (error) {
      logger.error("Failed to process Sentry installation webhook", {
        error,
        action: data.action,
        installationId: data.installation.uuid,
      });
    }
  }

  private async handleUninstallation(data: SentryInstallationWebhook): Promise<void> {
    const connections = await this.apiClient.workspaceConnection.listWorkspaceConnections({
      connection_type: E_INTEGRATION_KEYS.SENTRY,
      connection_id: data.installation.uuid,
    });

    if (connections.length > 0) {
      const connection = connections[0];
      await this.apiClient.workspaceConnection.deleteWorkspaceConnection(connection.id);

      logger.info(`Successfully deleted workspace connection for uninstalled Sentry app`, {
        installationId: data.installation.uuid,
        connectionId: connection.id,
      });
    }
  }
}
