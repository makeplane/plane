import * as Y from "yjs";
import { Response } from "express";

import { DirectConnection, Hocuspocus } from "@hocuspocus/server";
import { v4 as uuidv4 } from "uuid";
import { manualLogger } from "@/core/helpers/logger";
import { TPage } from "@plane/types";
import { HocusPocusServerContext } from "@/core/types/common";
import { DocumentProcessor } from "@/plane-live/lib/document-processor";
import { getDocumentHandler } from "@/core/handlers/page-handlers";

/**
 * Metadata for a stored connection
 */
interface ConnectionData {
  connection: DirectConnection;
  context: Partial<HocusPocusServerContext>;
  createdAt: number;
  lastUsed: number;
}

/**
 * Connection statistics for a document
 */
interface ConnectionStats {
  documentId: string;
  createdAt: string;
  lastUsed: string;
  idleTime: string;
}

/**
 * Overall statistics for the connection manager
 */
interface ManagerStats {
  totalConnections: number;
  connections: ConnectionStats[];
}

/**
 * Error thrown when the ServerAgentManager is not properly initialized
 */
class ServerAgentManagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServerAgentManagerError";
  }
}

/**
 * Manages server-side connections (agents) to the Hocuspocus server
 * Implements the Singleton pattern to ensure only one instance exists
 */
export class ServerAgentManager {
  private static instance: ServerAgentManager;
  private connections: Map<string, ConnectionData>;
  public hocuspocusServer: Hocuspocus | null;
  private cleanupInterval: NodeJS.Timeout | null;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.connections = new Map<string, ConnectionData>();
    this.hocuspocusServer = null;
    this.cleanupInterval = null;
  }

  /**
   * Get the singleton instance of the ServerAgentManager
   * @returns {ServerAgentManager} The singleton instance
   */
  public static getInstance(): ServerAgentManager {
    if (!ServerAgentManager.instance) {
      ServerAgentManager.instance = new ServerAgentManager();
    }
    return ServerAgentManager.instance;
  }

  /**
   * Initialize the manager with a Hocuspocus server instance
   * @param {Hocuspocus} server - The Hocuspocus server instance
   * @returns {ServerAgentManager} The initialized manager instance for chaining
   */
  public initialize(server: Hocuspocus): ServerAgentManager {
    this.hocuspocusServer = server;

    // Set up periodic cleanup of unused connections
    this.startConnectionCleanup();

    manualLogger.info("ServerAgentManager initialized");
    return this;
  }

  /**
   * Get or create a connection to a document
   * @param {string} documentId - The document ID to connect to
   * @param {HocusPocusServerContext} context - Additional context for the connection
   * @returns {Promise<ConnectionData>} - The connection data object
   * @throws {ServerAgentManagerError} If the manager is not initialized
   */
  public async getConnection(documentId: string, context: Partial<HocusPocusServerContext>): Promise<ConnectionData> {
    if (!this.hocuspocusServer) {
      throw new ServerAgentManagerError("ServerAgentManager not initialized with a Hocuspocus server");
    }

    // Check if we already have a connection for this document
    if (this.connections.has(documentId)) {
      // manualLogger.info(`Reusing existing connection for document: ${documentId}`);
      const connectionData = this.connections.get(documentId)!;
      // Update last used timestamp
      connectionData.lastUsed = Date.now();
      return connectionData;
    }

    try {
      // Create a new connection
      const connection = await this.hocuspocusServer.openDirectConnection(documentId, {
        documentType: "server_agent",
        projectId: context.projectId,
        workspaceSlug: context.workspaceSlug,
        // triggerExecutionAfterLoad: context.triggerExecutionAfterLoad,
        agentId: uuidv4(), // Unique ID for this server agent
      });

      // Store the connection with metadata
      const connectionData: ConnectionData = {
        connection,
        context,
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };

      this.connections.set(documentId, connectionData);

      return connectionData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      manualLogger.error(`Failed to create connection for document ${documentId}: ${errorMessage}`);
      throw new ServerAgentManagerError(`Failed to create connection: ${errorMessage}`);
    }
  }

  /**
   * Execute a transaction on a document
   * @param {string} documentId - The document ID
   * @param {(doc: Y.Doc) => void | Promise<void>} transactionFn - The transaction function
   * @param {HocusPocusServerContext} context - Additional context for the connection
   * @returns {Promise<void>} - Promise that resolves when the transaction is complete
   * @throws {ServerAgentManagerError} If the transaction fails
   */
  public async executeTransaction(
    documentId: string,
    transactionFn: (_doc: Y.Doc) => void | Promise<void>,
    context: Partial<HocusPocusServerContext>,
    res?: Response
  ): Promise<boolean> {
    let connectionData: ConnectionData | null = null;

    try {
      connectionData = await this.getConnection(documentId, context);
      connectionData.lastUsed = Date.now();

      connectionData.context = { ...connectionData.context };
      // Execute the transaction
      await connectionData.connection.transact(transactionFn);

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      manualLogger.error(`Transaction error for document ${documentId}: ${errorMessage}`, {
        documentId,
        error: error instanceof Error ? error.stack : errorMessage,
        context,
      });

      // Notify about transaction failure if needed
      this.notifyTransactionFailure(documentId, errorMessage, res);

      return false;
    }
  }

  public notifySyncTrigger(
    pageId: string,
    context: HocusPocusServerContext,
    options: {
      componentType?: string;
      targetNodeId?: string;
      [key: string]: any;
    } = {}
  ) {
    if (!this.hocuspocusServer) return;

    this.executeTransaction(
      pageId,
      async (doc) => {
        const xmlFragment = doc.getXmlFragment("default");

        let subPagesFromBackend: TPage[] | undefined = [];
        if (!context.documentType) {
          return;
        }
        const documentHandler = getDocumentHandler(context.documentType);
        if (documentHandler && documentHandler.fetchSubPages) {
          subPagesFromBackend = await documentHandler.fetchSubPages({
            context,
            pageId,
          });
        }

        // // Process the document using our extensible system
        DocumentProcessor.process(xmlFragment, subPagesFromBackend || [], options);
      },
      context
    );
  }

  /**
   * Notify clients about a successful transaction
   * @private
   * @param {string} documentId - The document ID
   */
  public notifyTransactionSuccess(documentId: string, res?: Response): void {
    if (!this.hocuspocusServer) return;

    const document = this.hocuspocusServer.documents.get(documentId);
    if (!document) return;

    try {
      manualLogger.info(`notified transaction success for ${documentId}:`);
      // res.status(200).json({ success: true });
    } catch (error) {
      manualLogger.error(`Error notifying transaction success for ${documentId}:`, error);
    }
  }

  /**
   * Notify clients about a failed transaction
   * @private
   * @param {string} documentId - The document ID
   * @param {string} errorMessage - The error message
   */
  private notifyTransactionFailure(documentId: string, errorMessage: string, res?: Response): void {
    if (!this.hocuspocusServer) return;

    const document = this.hocuspocusServer.documents.get(documentId);
    if (!document) return;

    try {
      // res.status(200).json({ success: true });
      // document.broadcastStateless(
      //   JSON.stringify({
      //     type: "transaction_status",
      //     status: "error",
      //     message: errorMessage,
      //     timestamp: new Date().toISOString(),
      //   })
      // );
    } catch (error) {
      manualLogger.error(`Error notifying transaction failure for ${documentId}:`, error);
    }
  }

  /**
   * Release a connection when it's no longer needed
   * @param {string} documentId - The document ID
   * @returns {Promise<void>}
   */
  public async releaseConnection(documentId: string): Promise<void> {
    if (!this.connections.has(documentId)) {
      return;
    }

    const connectionData = this.connections.get(documentId)!;

    try {
      connectionData.connection.disconnect();
      this.connections.delete(documentId);
      manualLogger.info(`Released connection for document: ${documentId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      manualLogger.error(`Error releasing connection for document ${documentId}: ${errorMessage}`);
      // We still want to remove it from our map even if disconnect fails
      this.connections.delete(documentId);
    }
  }

  /**
   * Check if a document has any client connections (excluding our agent)
   * @param {string} documentId - The document ID
   * @returns {boolean} - True if there are client connections
   */
  /**
   * Check if a document has any client connections (excluding our agent)
   * @param {string} documentId - The document ID
   * @returns {boolean} - True if there are client connections
   */
  public hasClientConnections(documentId: string): boolean {
    if (!this.hocuspocusServer) return false;

    // Get the document from the server
    const document = this.hocuspocusServer.documents.get(documentId);
    if (!document) return false;
    return document.connections.size > 0;
  }

  /**
   * Start periodic cleanup of unused connections
   * @private
   */
  private startConnectionCleanup(): void {
    // Check every 5 minutes for unused connections
    const CLEANUP_INTERVAL = 5 * 60 * 1000;

    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupUnusedConnections().catch((error) => {
        manualLogger.error("Error during connection cleanup:", error);
      });
    }, CLEANUP_INTERVAL);
  }

  /**
   * Clean up connections that are no longer needed
   * @private
   */
  private async cleanupUnusedConnections(): Promise<void> {
    const documentsToCleanup: string[] = [];

    for (const [documentId] of this.connections.entries()) {
      // If no client connections exist (only our agent remains), schedule cleanup
      if (!this.hasClientConnections(documentId)) {
        documentsToCleanup.push(documentId);
      }
    }

    // Release connections outside the loop to avoid modifying the map during iteration
    for (const documentId of documentsToCleanup) {
      manualLogger.info(`Cleaning up connection for document with no clients: ${documentId}`);
      await this.releaseConnection(documentId);
    }

    if (documentsToCleanup.length > 0) {
      manualLogger.info(`Cleaned up ${documentsToCleanup.length} connections with no clients`);
    }
  }

  /**
   * Check if a document has no client connections and release the agent if needed
   * @param {string} documentId - The document ID to check
   * @returns {Promise<boolean>} - True if the connection was released
   */
  public async checkAndReleaseIfNoClients(documentId: string): Promise<boolean> {
    if (!this.connections.has(documentId)) {
      return false;
    }

    if (!this.hasClientConnections(documentId)) {
      manualLogger.info(`No clients left for document ${documentId}, releasing agent connection`);
      await this.releaseConnection(documentId);
      return true;
    }

    return false;
  }

  /**
   * Set up hooks on the HocusPocus server to trigger cleanup when clients disconnect
   * @returns {ServerAgentManager} The manager instance for chaining
   */
  public setupHocusPocusHooks(): ServerAgentManager {
    if (!this.hocuspocusServer) {
      throw new ServerAgentManagerError("ServerAgentManager not initialized with a Hocuspocus server");
    }

    // Add a hook to the onDisconnect event
    this.hocuspocusServer.configure({
      async onDisconnect({ documentName }) {
        // Use a small delay to ensure the connection is fully closed before checking
        setTimeout(async () => {
          try {
            await serverAgentManager.checkAndReleaseIfNoClients(documentName);
          } catch (error) {
            manualLogger.error(`Error checking client connections for ${documentName}:`, error);
          }
        }, 100); // Small delay to ensure connection state is updated
      },
    });

    return this;
  }
  /**
   * Get statistics about current connections
   * @returns {ManagerStats} - Connection statistics
   */
  public getStats(): ManagerStats {
    return {
      totalConnections: this.connections.size,
      connections: Array.from(this.connections.entries()).map(([documentId, data]) => ({
        documentId,
        createdAt: new Date(data.createdAt).toISOString(),
        lastUsed: new Date(data.lastUsed).toISOString(),
        idleTime: Math.round((Date.now() - data.lastUsed) / 1000) + "s",
      })),
    };
  }

  /**
   * Shutdown the manager and clean up all connections
   * @returns {Promise<void>}
   */
  public async shutdown(): Promise<void> {
    // Clear the cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Release all connections
    const documentIds = Array.from(this.connections.keys());
    for (const documentId of documentIds) {
      await this.releaseConnection(documentId);
    }

    manualLogger.info("ServerAgentManager shut down successfully");
  }
}

// Create and export the singleton instance
export const serverAgentManager = ServerAgentManager.getInstance();
