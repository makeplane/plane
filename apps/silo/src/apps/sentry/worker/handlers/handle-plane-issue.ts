import { SentryIssue } from "@plane/etl/sentry";
import { logger } from "@plane/logger";
import { ExIssue, ExState, PlaneWebhookPayload } from "@plane/sdk";
import { TWorkspaceConnection, TWorkspaceCredential, TWorkspaceEntityConnection } from "@plane/types";
import { env } from "@/env";
import { APIClient, getAPIClient } from "@/services/client";
import { Store } from "@/worker/base";
import { getSentryConnectionDetails } from "../../helpers/connection";
import {
  getSentryIssueDelinkMessage,
  getSentryIssueUrl,
  getSentryMarkedResolvedMessage,
  getSentryMarkedUnresolvedMessage,
} from "../../helpers/constants";
import { getProjectStateMappings } from "../../helpers/state";
import { ESentryEntityConnectionType, TSentryServices } from "../../types";

/**
 * Plane Issue Handler is responsible for handling plane issue webhook
 * to mark sentry issues as resolved. For every linked issue, we maintain
 * a record for entity connection which corresponds to a sentry issue.
 * The below handler will take the plane issue and check if the state
 * should be marked as resolved in sentry.
 * Currently we are fetching all the states from Plane and finding the
 * resolved state, which is not efficient. It's a todo that we should fix.
 */
export class PlaneIssueHandler {
  private apiClient: APIClient = getAPIClient();

  /**
   * The handle task will evaluate a predicate in order to understand
   * if the issue should be processed. There can be only two cases where
   * the issue should not be processed:
   * 1. The issue is already processed.
   * 2. The issue is not linked with any sentry issue.
   * The predicate gives the entity connections for the issue and then the
   * process function takes over the processing of the issue.
   */
  async handle(store: Store, data: PlaneWebhookPayload): Promise<void> {
    try {
      // Evaluate if the issue should be processed
      const entityConnections = await this.shouldProcess(store, data);
      if (!entityConnections) {
        logger.info(`No entity connections found for issue ${data.id}`, { data });
        return;
      }

      // Process the issue for each entity connection
      for (const connection of entityConnections) {
        await this.processConnection(store, connection, data);
      }
    } catch (error) {
      logger.error(error);
    }
  }

  /**
   * The shouldProcess function will evaluate if the issue should be processed.
   * It will check if the issue is already processed and if it is, it will return undefined.
   * If the issue is not processed, it will return the entity connections for the issue.
   */
  private async shouldProcess(
    store: Store,
    data: PlaneWebhookPayload
  ): Promise<TWorkspaceEntityConnection[] | undefined> {
    const isAlreadyProcessed = (await store.get(`silo:sentry:issue:${data.id}`)) !== null; // Todo: move this to a constant
    if (isAlreadyProcessed) {
      return undefined;
    }
    const entityConnections = await this.apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
      workspace_id: data.workspace,
      project_id: data.project,
      issue_id: data.id,
      entity_type: ESentryEntityConnectionType.SENTRY_ISSUE,
    });
    return entityConnections;
  }

  /**
   * The main task here is to evaluate and sync the states for the issue.
   * For that the first section of the process connection function will
   * gather the data from the workspace connection, services and issue data.
   * Which will be used to evaluate and sync the states for the issue.
   */
  private async processConnection(
    store: Store,
    entityConnection: TWorkspaceEntityConnection,
    data: PlaneWebhookPayload
  ): Promise<void> {
    if (!entityConnection.entity_id) {
      logger.info(`No entity id found for entity connection ${entityConnection.id}`, { entityConnection });
      return;
    }

    // Get workspace connection and validate
    const workspaceConnection = await this.getWorkspaceConnection(entityConnection);
    if (!workspaceConnection) {
      logger.info(`No workspace connection found for entity connection ${entityConnection.id}`, { entityConnection });
      return;
    }

    // Get services
    const services = await this.getServices(workspaceConnection);
    if (!services) {
      logger.info(`No services found for workspace connection ${workspaceConnection.id}`, { workspaceConnection });
      return;
    }

    // Get issue data
    const issueData = await this.getIssueData(services, workspaceConnection, entityConnection, data);
    if (!issueData) {
      logger.info(`No issue data found for entity connection ${entityConnection.id}`, { entityConnection });
      return;
    }

    /*
     * NOTE:
     * By the time of implementing this functionality, the handler handles the linking
     * of a sentry issue to a plane issue, but when comes to unlinking, sentry never
     * sends any webhook, and there is no way to get to know if the issue is unlinked.
     * Hence, when the issue is unlinked, plane will be left with a dangling issue and
     * For this purpose before we process the issue, we will check if the issue is still
     * linked with any external issue. If not, we will return null.
     * Following this: https://github.com/getsentry/sentry/issues/79352
     */
    const isIssueStillLinked = await this.isIssueStillLinked(
      services,
      workspaceConnection,
      entityConnection,
      issueData.issue
    );
    if (!isIssueStillLinked) {
      logger.info(`Issue ${entityConnection.entity_id} is not linked with any external issue`, { entityConnection });
      await this.cleanupDanglingIssue(
        services,
        workspaceConnection,
        entityConnection,
        issueData.issue,
        issueData.sentryIssue
      );
      return;
    }

    const stateResult = await getProjectStateMappings(services.planeClient, workspaceConnection, data.project);
    if (!stateResult) {
      logger.info(`No resolved state found for issue ${data.id}`, { data });
      return;
    }

    // Sync states
    await this.syncStates(store, services, workspaceConnection, entityConnection, issueData, stateResult.resolvedState);
  }

  private async cleanupDanglingIssue(
    services: TSentryServices,
    workspaceConnection: TWorkspaceConnection,
    entityConnection: TWorkspaceEntityConnection,
    issue: ExIssue,
    sentryIssue: SentryIssue
  ) {
    // Remove the link from plane for that particular sentry issue
    const linkUrl = getSentryIssueUrl(workspaceConnection.connection_slug!, entityConnection.entity_id!);
    const connectedLinks = await services.planeClient.issue.getLinks(
      workspaceConnection.workspace_slug,
      issue.project,
      issue.id
    );

    const linkToDelete = connectedLinks.results.find((link) => link.url === linkUrl);
    if (linkToDelete) {
      await services.planeClient.issue.deleteLink(
        workspaceConnection.workspace_slug,
        issue.project,
        issue.id,
        linkToDelete.id
      );
    }

    // Add a comment in plane to inform that the issue is unlinked
    const comment = getSentryIssueDelinkMessage(sentryIssue.title, sentryIssue.permalink);
    await services.planeClient.issueComment.create(workspaceConnection.workspace_slug, issue.project, issue.id, {
      comment_html: comment,
    });
  }

  /**
   * Retrieves and validates workspace connection with its credentials.
   * Checks for connection_slug and valid credentials before returning.
   */
  private async getWorkspaceConnection(
    entityConnection: TWorkspaceEntityConnection
  ): Promise<TWorkspaceConnection | null> {
    const workspaceConnection: TWorkspaceConnection = await this.apiClient.workspaceConnection.getWorkspaceConnection(
      entityConnection.workspace_connection_id
    );

    if (!workspaceConnection?.connection_slug) {
      logger.info(`No connection slug found for workspace connection ${workspaceConnection.id}`, {
        workspaceConnection,
      });
      return null;
    }

    const credentials: TWorkspaceCredential = await this.apiClient.workspaceCredential.getWorkspaceCredential(
      workspaceConnection.credential_id
    );

    if (!credentials) {
      logger.info(`No credentials found for workspace connection ${workspaceConnection.id}`, { workspaceConnection });
      return null;
    }

    return workspaceConnection;
  }

  /**
   * Initializes authenticated service clients for Sentry and Plane APIs.
   * Returns both services if successful, null if either fails to initialize.
   */
  private async getServices(workspaceConnection: TWorkspaceConnection): Promise<TSentryServices | null> {
    const { planeClient, sentryService } = await getSentryConnectionDetails(workspaceConnection.connection_id);
    return planeClient && sentryService ? { planeClient, sentryService } : null;
  }

  /**
   * Fetches issue data from both Plane and Sentry systems, along with project states.
   * Returns combined data if all fetches succeed and "resolved" state is found.
   */
  private async getIssueData(
    services: TSentryServices,
    workspaceConnection: TWorkspaceConnection,
    entityConnection: TWorkspaceEntityConnection,
    data: PlaneWebhookPayload
  ) {
    const [issue, sentryIssue] = await Promise.all([
      services.planeClient.issue.getIssue(workspaceConnection.workspace_slug, data.project, data.id),
      services.sentryService.getIssue(workspaceConnection.connection_slug!, entityConnection.entity_id!),
      services.sentryService.getLinkedExternalIssues(workspaceConnection.connection_slug!, entityConnection.entity_id!),
    ]);

    if (!issue || !sentryIssue) {
      logger.info(`No issue or sentry issue found for entity connection ${entityConnection.id}`, { entityConnection });
      return null;
    }

    return { issue, sentryIssue };
  }

  /*
   * This function will check if the issue is still linked with any external issue.
   * If not, we will return null.
   * Following this: https://github.com/getsentry/sentry/issues/79352
   */
  private async isIssueStillLinked(
    services: TSentryServices,
    workspaceConnection: TWorkspaceConnection,
    entityConnection: TWorkspaceEntityConnection,
    issue: ExIssue
  ) {
    const linkedExternalIssues = await services.sentryService.getLinkedExternalIssues(
      workspaceConnection.connection_slug!,
      entityConnection.entity_id!
    );

    return (
      linkedExternalIssues &&
      linkedExternalIssues.length > 0 &&
      linkedExternalIssues.find((link) => {
        const isServiceTypePlane = link.serviceType === env.SENTRY_INTEGRATION_SLUG;
        const isIssueIdMatching = link.issueId === entityConnection.entity_id;
        if (!isServiceTypePlane || !isIssueIdMatching) {
          return false;
        }

        const workItemId = link.webUrl.split("/").pop();
        const isWorkItemIdMatching = workItemId === issue.id;
        if (!isWorkItemIdMatching) {
          return false;
        }

        return true;
      })
    );
  }

  /*
   * From Sentry there can be two possible states for the issue:
   * Either the issue is resolved or unresolved. Hence, the sync state
   * function will first evaluate if the issue should be marked as resolved
   * or unresolved. Post that it will execute some postprocessing operations
   */
  private async syncStates(
    store: Store,
    services: TSentryServices,
    workspaceConnection: TWorkspaceConnection,
    entityConnection: TWorkspaceEntityConnection,
    issueData: NonNullable<Awaited<ReturnType<typeof this.getIssueData>>>,
    resolvedState: ExState
  ): Promise<void> {
    const { issue, sentryIssue } = issueData;
    const operations: Promise<unknown>[] = [];
    let notificationMessage = "";

    // Check if Plane issue is resolved but Sentry isn't resolved
    if (this.shouldMarkSentryResolved(issue, sentryIssue, resolvedState)) {
      operations.push(
        services.sentryService.updateIssue(workspaceConnection.connection_slug!, entityConnection.entity_id!, {
          status: "resolvedInNextRelease",
        })
      );
      notificationMessage = getSentryMarkedResolvedMessage(sentryIssue.title, sentryIssue.permalink);
    }
    // Check if Plane issue is not resolved but Sentry is resolved
    else if (this.shouldMarkSentryUnresolved(issue, sentryIssue, resolvedState)) {
      operations.push(
        services.sentryService.updateIssue(workspaceConnection.connection_slug!, entityConnection.entity_id!, {
          status: "unresolved",
        })
      );
      notificationMessage = getSentryMarkedUnresolvedMessage(sentryIssue.title, sentryIssue.permalink);
    }

    // Execute operations if any
    if (operations.length > 0) {
      await this.executeOperations(
        store,
        services,
        workspaceConnection,
        issue,
        operations,
        notificationMessage,
        sentryIssue
      );
    }
  }

  /**
   * Evaluates if Sentry issue should be marked as resolved.
   * Returns true when Plane issue is in resolved state but Sentry isn't resolved yet.
   */
  private shouldMarkSentryResolved(issue: ExIssue, sentryIssue: SentryIssue, resolvedState: ExState): boolean {
    return (
      issue.state === resolvedState.id &&
      sentryIssue.status !== "resolved" &&
      sentryIssue.status !== "resolvedInNextRelease"
    );
  }

  /**
   * Evaluates if Sentry issue should be marked as unresolved.
   * Returns true when Plane issue is not in resolved state but Sentry is currently resolved.
   */
  private shouldMarkSentryUnresolved(issue: ExIssue, sentryIssue: SentryIssue, resolvedState: ExState): boolean {
    return (
      (issue.state !== resolvedState.id && sentryIssue.status === "resolved") ||
      sentryIssue.status === "resolvedInNextRelease"
    );
  }

  private async executeOperations(
    store: Store,
    services: TSentryServices,
    workspaceConnection: TWorkspaceConnection,
    issue: ExIssue,
    operations: Promise<unknown>[],
    notificationMessage: string,
    sentryIssue: SentryIssue
  ): Promise<void> {
    // Add notification comment
    const notificationComment = services.planeClient.issueComment.create(
      workspaceConnection.workspace_slug,
      issue.project,
      issue.id,
      { comment_html: notificationMessage }
    );
    operations.push(notificationComment);

    // Mark as processed in cache
    operations.push(store.set(`silo:sentry:issue:${issue.id}`, "true", 15));

    // Execute all operations
    await Promise.all(operations);

    logger.info(`Successfully synced Plane issue status to Sentry`, {
      planeIssueId: issue.id,
      sentryIssueId: sentryIssue.id,
    });
  }
}
