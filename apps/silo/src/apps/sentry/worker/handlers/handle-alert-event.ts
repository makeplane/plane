import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { SentryEventAlertWebhook } from "@plane/etl/sentry";
import { ExIssue } from "@plane/sdk";
import { TWorkspaceConnection } from "@plane/types";
import { env } from "@/env";
import { logger } from "@/logger";
import { APIClient, getAPIClient } from "@/services/client";
import { Store } from "@/worker/base";
import { getSentryConnectionDetails } from "../../helpers/connection";
import { ESentryEntityConnectionType, ISentryTaskHandler, TSentryServices } from "../../types";

/**
 * Alert Event Handler is responsible for handling Sentry alert webhooks
 * to create corresponding issues in Plane. When a Sentry alert is triggered,
 * this handler will create a new issue in the configured Plane project and
 * establish entity connections for future synchronization.
 * The handler also creates bidirectional links between the Plane issue and
 * Sentry issue for easy navigation.
 */
export class SentryAlertHandler implements ISentryTaskHandler {
  private apiClient: APIClient = getAPIClient();

  /**
   * The handle task will process the Sentry alert webhook and create
   * corresponding Plane issue. The process involves finding the target
   * workspace connection, extracting alert settings, creating the issue,
   * setting up entity connections, and creating bidirectional links.
   */
  async handle(_store: Store, sentryEventAlert: SentryEventAlertWebhook): Promise<void> {
    try {
      // Get workspace connection for this Sentry installation
      const connection = await this.getWorkspaceConnection(sentryEventAlert);
      if (!connection) {
        logger.error("No workspace connection found for Sentry installation", {
          installationId: sentryEventAlert.installation.uuid,
        });
        return;
      }

      // Get authenticated services for API calls
      const services = await this.getServices(sentryEventAlert.installation.uuid);
      if (!services) {
        logger.error("Failed to initialize services for Sentry installation", {
          installationId: sentryEventAlert.installation.uuid,
        });
        return;
      }

      // Extract and validate alert settings
      const alertSettings = this.extractAlertSettings(sentryEventAlert);
      if (!alertSettings.projectId || !alertSettings.type) {
        logger.error("Project ID or type not found in alert settings");
        return;
      }

      // Create Plane issue from Sentry alert
      const createdIssue = await this.createPlaneIssue(services, connection, alertSettings, sentryEventAlert);
      if (!createdIssue) {
        logger.error("Failed to create Plane issue from Sentry alert");
        return;
      }

      // Setup entity connection and links for only work items
      if (alertSettings.type === "work_item") {
        await this.setupEntityConnection(
          connection,
          alertSettings.projectId,
          createdIssue as ExIssue,
          sentryEventAlert
        );
        await this.createBidirectionalLinks(
          services,
          connection,
          alertSettings.projectId,
          createdIssue as ExIssue,
          sentryEventAlert
        );
      }

      logger.info(`[SENTRY] Alert Addressed Issue created successfully 🎉`);
    } catch (error) {
      logger.error("Failed to process Sentry alert event", {
        error,
        installationId: sentryEventAlert.installation.uuid,
      });
    }
  }

  /**
   * Retrieves the workspace connection for the Sentry installation.
   * Returns the first connection found or null if none exist.
   */
  private async getWorkspaceConnection(
    sentryEventAlert: SentryEventAlertWebhook
  ): Promise<TWorkspaceConnection | null> {
    const connections = await this.apiClient.workspaceConnection.listWorkspaceConnections({
      connection_type: E_INTEGRATION_KEYS.SENTRY,
      connection_id: sentryEventAlert.installation.uuid,
    });

    return connections.length > 0 ? connections[0] : null;
  }

  /**
   * Initializes authenticated service clients for Plane and Sentry APIs.
   * Returns both services if successful, null if initialization fails.
   */
  private async getServices(installationUuid: string): Promise<TSentryServices | null> {
    const { planeClient, sentryService } = await getSentryConnectionDetails(installationUuid);
    return planeClient && sentryService ? { planeClient, sentryService } : null;
  }

  /**
   * Extracts alert settings from the Sentry webhook data.
   * Returns structured settings including project ID, assignees, labels, and state.
   */
  private extractAlertSettings(sentryEventAlert: SentryEventAlertWebhook) {
    const type = sentryEventAlert.data.issue_alert.settings.find((setting) => setting.name === "type");
    const projectId = sentryEventAlert.data.issue_alert.settings.find((setting) => setting.name === "project_id");
    const assigneeIds = sentryEventAlert.data.issue_alert.settings.find((setting) => setting.name === "assignee_ids");
    const labels = sentryEventAlert.data.issue_alert.settings.find((setting) => setting.name === "labels");
    const state = sentryEventAlert.data.issue_alert.settings.find((setting) => setting.name === "state");

    return {
      type: type?.value as string,
      projectId: projectId?.value as string,
      assigneeIds: (assigneeIds?.value as string[]) || [],
      labels: (labels?.value as string[]) || [],
      state: state?.value as string,
    };
  }

  /**
   * Creates a new Plane issue from the Sentry alert data.
   * Returns the created issue if successful, null if creation fails.
   */
  private async createPlaneIssue(
    services: TSentryServices,
    connection: TWorkspaceConnection,
    settings: ReturnType<typeof this.extractAlertSettings>,
    sentryEventAlert: SentryEventAlertWebhook
  ) {
    const issue: Partial<ExIssue> = {
      name: sentryEventAlert.data.event.title,
      description_html: `<p>${sentryEventAlert.data.event.message}\n\n<a href="${sentryEventAlert.data.event.web_url}">View in Sentry</a></p>`,
      labels: settings.labels,
      assignees: settings.assigneeIds,
      state: settings.state,
    };

    try {
      if (settings.type === "intake") {
        const response = await services.planeClient.intake.create(connection.workspace_slug, settings.projectId, {
          issue: issue as ExIssue,
        });
        return response.issue;
      } else {
        const response = await services.planeClient.issue.create(connection.workspace_slug, settings.projectId, issue);
        return response;
      }
    } catch (error) {
      logger.error("Failed to create Plane issue", { error, projectId: settings.projectId });
      return null;
    }
  }

  /**
   * Sets up entity connection between Plane issue and Sentry issue.
   * Either updates existing connection or creates a new one based on
   * whether a connection already exists for this Sentry issue.
   */
  private async setupEntityConnection(
    connection: TWorkspaceConnection,
    projectId: string,
    createdIssue: ExIssue,
    sentryEventAlert: SentryEventAlertWebhook
  ): Promise<void> {
    // Check if entity connection already exists for this Sentry issue
    const existingConnections = await this.apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
      entity_id: sentryEventAlert.data.event.issue_id.toString(),
      entity_type: ESentryEntityConnectionType.SENTRY_ISSUE,
    });

    // If connection exists, update it with new Plane issue details
    if (existingConnections.length > 0) {
      await this.apiClient.workspaceEntityConnection.updateWorkspaceEntityConnection(existingConnections[0].id, {
        workspace_id: connection.workspace_id,
        project_id: projectId,
        issue_id: createdIssue.id,
      });
    } else {
      // Create new entity connection linking Plane and Sentry issues
      await this.apiClient.workspaceEntityConnection.createWorkspaceEntityConnection({
        // Plane's information
        workspace_id: connection.workspace_id,
        project_id: projectId,
        issue_id: createdIssue.id,

        // Sentry's information
        entity_id: sentryEventAlert.data.event.issue_id.toString(),
        entity_type: ESentryEntityConnectionType.SENTRY_ISSUE,
        entity_data: sentryEventAlert,

        // Connection reference
        workspace_connection_id: connection.id,
      });
    }
  }

  /**
   * Creates bidirectional links between Plane and Sentry issues.
   * Adds a link in the Plane issue pointing to Sentry and vice versa.
   */
  private async createBidirectionalLinks(
    services: TSentryServices,
    connection: TWorkspaceConnection,
    projectId: string,
    createdIssue: ExIssue,
    sentryEventAlert: SentryEventAlertWebhook
  ): Promise<void> {
    // Create link in Plane issue pointing to Sentry issue
    try {
      const sentryIssueUrl = sentryEventAlert.data.event.web_url;
      const title = `[SENTRY] ${sentryEventAlert.data.event.title}`;
      await services.planeClient.issue.createLink(
        connection.workspace_slug,
        projectId,
        createdIssue.id,
        title,
        sentryIssueUrl
      );
    } catch {
      logger.error("Error creating link in Plane");
    }

    // Create link in Sentry issue pointing to Plane issue
    try {
      if (services.sentryService && connection.connection_slug) {
        const project = await services.planeClient.project.getProject(connection.workspace_slug, projectId);
        if (project) {
          const webUrl = `${env.APP_BASE_URL}/${connection.workspace_slug}/projects/${project.id}/issues/${createdIssue.id}`;

          await services.sentryService.connectExternal(
            connection.connection_id,
            sentryEventAlert.data.event.issue_id,
            webUrl,
            project.identifier!,
            createdIssue.sequence_id.toString()
          );
        }
      }
    } catch {
      logger.error("Error creating link in Sentry");
    }
  }
}
