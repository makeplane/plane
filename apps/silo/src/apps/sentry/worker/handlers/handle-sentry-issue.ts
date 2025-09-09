import { SentryIssue, SentryIssueWebhook } from "@plane/etl/sentry";
import { ExIssue, ExState } from "@plane/sdk";
import { TWorkspaceConnection, TWorkspaceEntityConnection } from "@plane/types";
import { logger } from "@/logger";
import { APIClient, getAPIClient } from "@/services/client";
import { Store } from "@/worker/base";
import { getSentryConnectionDetails } from "../../helpers/connection";
import { getStatusBacklogMessage, getStatusDoneMessage } from "../../helpers/constants";
import { getProjectStateMappings } from "../../helpers/state";
import { ESentryEntityConnectionType, ISentryTaskHandler, TSentryServices } from "../../types";

/**
 * Sentry Issue Handler is responsible for handling Sentry issue webhooks
 * to update corresponding Plane issue states. When Sentry issue status changes
 * (resolved/unresolved), this handler will update the linked Plane issue state
 * accordingly and provide audit trail through comments.
 * The handler syncs from Sentry to Plane (opposite direction of PlaneIssueHandler).
 */
export class SentryIssueHandler implements ISentryTaskHandler {
  private apiClient: APIClient = getAPIClient();

  /**
   * The handle task will evaluate if the Sentry issue should trigger
   * a Plane issue state update. It checks cache to prevent duplicate processing,
   * finds the linked Plane issue, and synchronizes states based on Sentry status.
   * The sync direction is Sentry → Plane (opposite of PlaneIssueHandler).
   */
  async handle(store: Store, data: SentryIssueWebhook): Promise<void> {
    try {
      // Check cache to prevent duplicate processing
      const shouldProcess = await this.shouldProcess(store, data);
      if (!shouldProcess) {
        logger.debug(`Sentry issue ${data.data.issue.id} already processed - skipping`, {
          sentryIssueId: data.data.issue.id,
        });
        return;
      }

      // Get entity connection linking Sentry issue to Plane issue
      const entityConnection = await this.getEntityConnection(data);
      if (!entityConnection) {
        logger.debug(`No entity connection found for Sentry issue ${data.data.issue.id}`, {
          sentryIssueId: data.data.issue.id,
        });
        return;
      }

      // Process the connection to sync states
      await this.processConnection(store, entityConnection);
    } catch (error) {
      logger.error("Failed to process Sentry issue webhook", {
        error,
        sentryIssueId: data.data.issue.id,
      });
    }
  }

  /**
   * Checks if the Sentry issue should be processed by looking at cache.
   * Returns false if already processed to prevent duplicate work.
   */
  private async shouldProcess(store: Store, data: SentryIssueWebhook): Promise<boolean> {
    const cacheKey = `silo:sentry:issue:${data.data.issue.id}`; // TODO: Move to constants
    return (await store.get(cacheKey)) === null;
  }

  /**
   * Retrieves the entity connection that links the Sentry issue to a Plane issue.
   * Returns the first connection found or null if none exist.
   */
  private async getEntityConnection(data: SentryIssueWebhook): Promise<TWorkspaceEntityConnection | null> {
    const entityConnections = await this.apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
      entity_id: data.data.issue.id,
      entity_type: ESentryEntityConnectionType.SENTRY_ISSUE, // TODO: Move to constants
    });

    if (entityConnections.length === 0) {
      return null;
    }

    const connection = entityConnections[0];

    // Validate required fields for processing
    if (!connection.entity_id || !connection.project_id || !connection.issue_id) {
      logger.warn(`Entity connection ${connection.id} missing required fields`, {
        entityConnectionId: connection.id,
        hasEntityId: !!connection.entity_id,
        hasProjectId: !!connection.project_id,
        hasIssueId: !!connection.issue_id,
      });
      return null;
    }

    return connection;
  }

  /**
   * Processes the entity connection by gathering data and executing state sync.
   * Follows the pipeline: Get Connection → Get Services → Get Data → Sync States.
   */
  private async processConnection(store: Store, entityConnection: TWorkspaceEntityConnection): Promise<void> {
    // Get workspace connection and validate
    const workspaceConnection = await this.getWorkspaceConnection(entityConnection);
    if (!workspaceConnection) {
      logger.warn(`Failed to get workspace connection for entity connection ${entityConnection.id}`, {
        entityConnectionId: entityConnection.id,
      });
      return;
    }

    // Get authenticated services
    const services = await this.getServices(workspaceConnection);
    if (!services) {
      logger.warn(`Failed to get services for workspace connection ${workspaceConnection.id}`, {
        workspaceConnectionId: workspaceConnection.id,
      });
      return;
    }

    // Get issue data from both systems
    const issueData = await this.getIssueData(services, workspaceConnection, entityConnection);
    if (!issueData) {
      logger.warn(`Failed to get issue data for entity connection ${entityConnection.id}`, {
        entityConnectionId: entityConnection.id,
      });
      return;
    }

    // Execute state synchronization
    await this.syncStates(store, services, workspaceConnection, entityConnection, issueData);
  }

  /**
   * Retrieves and validates workspace connection with credentials.
   * Checks for connection_slug and valid credentials before returning.
   */
  private async getWorkspaceConnection(
    entityConnection: TWorkspaceEntityConnection
  ): Promise<TWorkspaceConnection | null> {
    const workspaceConnection = await this.apiClient.workspaceConnection.getWorkspaceConnection(
      entityConnection.workspace_connection_id
    );

    if (!workspaceConnection?.connection_slug) {
      logger.warn(`Workspace connection missing connection_slug`, {
        workspaceConnectionId: workspaceConnection?.id,
      });
      return null;
    }

    const credentials = await this.apiClient.workspaceCredential.getWorkspaceCredential(
      workspaceConnection.credential_id
    );

    if (!credentials) {
      logger.warn(`No credentials found for workspace connection ${workspaceConnection.id}`, {
        workspaceConnectionId: workspaceConnection.id,
      });
      return null;
    }

    return workspaceConnection;
  }

  /**
   * Initializes authenticated service clients for Sentry and Plane APIs.
   * Returns both services if successful, null if either fails.
   */
  private async getServices(workspaceConnection: TWorkspaceConnection): Promise<TSentryServices | null> {
    const { planeClient, sentryService } = await getSentryConnectionDetails(workspaceConnection.connection_id);
    return planeClient && sentryService ? { planeClient, sentryService } : null;
  }

  /**
   * Fetches issue data from both systems and project states.
   * Returns combined data if all fetches succeed and required states are found.
   */
  private async getIssueData(
    services: TSentryServices,
    workspaceConnection: TWorkspaceConnection,
    entityConnection: TWorkspaceEntityConnection
  ) {
    // Fetch both issues in parallel
    const [planeIssue, sentryIssue] = await Promise.all([
      services.planeClient.issue.getIssue(
        workspaceConnection.workspace_slug,
        entityConnection.project_id!,
        entityConnection.issue_id!
      ),
      services.sentryService.getIssue(workspaceConnection.connection_slug!, entityConnection.entity_id!),
    ]);

    if (!planeIssue || !sentryIssue) {
      logger.warn(`Missing issue data`, {
        hasPlaneIssue: !!planeIssue,
        hasSentryIssue: !!sentryIssue,
        entityConnectionId: entityConnection.id,
      });
      return null;
    }

    const stateResult = await getProjectStateMappings(
      services.planeClient,
      workspaceConnection,
      entityConnection.project_id!
    );
    if (!stateResult) {
      logger.warn(`No resolved state found for project ${entityConnection.project_id}`, {
        projectId: entityConnection.project_id,
      });
      return null;
    }

    return { planeIssue, sentryIssue, stateMappings: stateResult };
  }

  /**
   * Synchronizes Plane issue state based on Sentry issue status.
   * Rules: Sentry resolved → Plane resolved state, Sentry unresolved → Plane unresolved state.
   * Special handling for "resolvedInNextRelease" status.
   */
  private async syncStates(
    store: Store,
    services: TSentryServices,
    workspaceConnection: TWorkspaceConnection,
    entityConnection: TWorkspaceEntityConnection,
    issueData: NonNullable<Awaited<ReturnType<typeof this.getIssueData>>>
  ): Promise<void> {
    const { planeIssue, sentryIssue, stateMappings } = issueData;
    const { resolvedState, unresolvedState } = stateMappings;

    const operations: Promise<unknown>[] = [];
    let notificationMessage = "";

    // Rule 1: Sentry is resolved but Plane is not in resolved state
    if (this.shouldMarkPlaneResolved(planeIssue, sentryIssue, resolvedState)) {
      operations.push(
        services.planeClient.issue.update(
          workspaceConnection.workspace_slug,
          entityConnection.project_id!,
          entityConnection.issue_id!,
          { state: resolvedState.id }
        )
      );
      notificationMessage = getStatusDoneMessage(sentryIssue.title, sentryIssue.permalink, resolvedState.name);
    }
    // Rule 2: Sentry is not resolved but Plane is in resolved state
    else if (this.shouldMarkPlaneUnresolved(planeIssue, sentryIssue, resolvedState)) {
      if (!unresolvedState) {
        logger.warn(`No unresolved state found for project ${entityConnection.project_id}`, {
          projectId: entityConnection.project_id,
        });
        return;
      }

      // Special handling for resolvedInNextRelease - keep as resolved
      const targetState = sentryIssue.status === "resolvedInNextRelease" ? resolvedState.id : unresolvedState.id;

      operations.push(
        services.planeClient.issue.update(
          workspaceConnection.workspace_slug,
          entityConnection.project_id!,
          entityConnection.issue_id!,
          { state: targetState }
        )
      );

      notificationMessage =
        sentryIssue.status === "resolvedInNextRelease"
          ? getStatusDoneMessage(sentryIssue.title, sentryIssue.permalink, resolvedState.name)
          : getStatusBacklogMessage(sentryIssue.title, sentryIssue.permalink, unresolvedState.name);
    }

    // Execute operations if any state changes are needed
    if (operations.length > 0) {
      await this.executeOperations(
        store,
        services,
        workspaceConnection,
        entityConnection,
        operations,
        notificationMessage
      );
    }
  }

  /**
   * Evaluates if Plane issue should be marked as resolved.
   * Returns true when Sentry is resolved but Plane is not in resolved state.
   */
  private shouldMarkPlaneResolved(planeIssue: ExIssue, sentryIssue: SentryIssue, resolvedState: ExState): boolean {
    return sentryIssue.status === "resolved" && planeIssue.state !== resolvedState.id;
  }

  /**
   * Evaluates if Plane issue should be moved away from resolved state.
   * Returns true when Sentry is not resolved but Plane is currently in resolved state.
   */
  private shouldMarkPlaneUnresolved(planeIssue: ExIssue, sentryIssue: SentryIssue, resolvedState: ExState): boolean {
    return sentryIssue.status !== "resolved" && planeIssue.state === resolvedState.id;
  }

  /**
   * Executes all operations including state updates, notification comments,
   * and cache updates. All operations are executed concurrently.
   */
  private async executeOperations(
    store: Store,
    services: TSentryServices,
    workspaceConnection: TWorkspaceConnection,
    entityConnection: TWorkspaceEntityConnection,
    operations: Promise<unknown>[],
    notificationMessage: string
  ): Promise<void> {
    // Add notification comment
    const notificationComment = services.planeClient.issueComment.create(
      workspaceConnection.workspace_slug,
      entityConnection.project_id!,
      entityConnection.issue_id!,
      { comment_html: notificationMessage }
    );
    operations.push(notificationComment);

    // Mark as processed in cache
    operations.push(store.set(`silo:sentry:issue:${entityConnection.issue_id}`, "true", 15));

    // Execute all operations
    await Promise.all(operations);

    logger.info(`Successfully synced Sentry issue status to Plane`, {
      entityConnectionId: entityConnection.id,
      planeIssueId: entityConnection.issue_id,
      sentryIssueId: entityConnection.entity_id,
    });
  }
}
