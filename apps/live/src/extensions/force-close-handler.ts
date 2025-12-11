import type { Connection, Extension, Hocuspocus, onConfigurePayload } from "@hocuspocus/server";
import { logger } from "@plane/logger";
import { Redis } from "@/extensions/redis";
import { AdminCommand, CloseCode, getForceCloseMessage, isForceCloseCommand } from "@/types/admin-commands";
import type { ForceCloseReason, ClientForceCloseMessage, ForceCloseCommandData } from "@/types/admin-commands";

/**
 * Extension to handle force close commands from other servers via Redis admin channel
 */
export class ForceCloseHandler implements Extension {
  name = "ForceCloseHandler";
  priority = 999;

  async onConfigure({ instance }: onConfigurePayload) {
    const redisExt = instance.configuration.extensions.find((ext) => ext instanceof Redis);

    if (!redisExt) {
      logger.warn("[FORCE_CLOSE_HANDLER] Redis extension not found");
      return;
    }

    // Register handler for force_close admin command
    redisExt.onAdminCommand<ForceCloseCommandData>(AdminCommand.FORCE_CLOSE, async (data) => {
      // Type guard for safety
      if (!isForceCloseCommand(data)) {
        logger.error("[FORCE_CLOSE_HANDLER] Received invalid force close command");
        return;
      }

      const { docId, reason, code } = data;

      const document = instance.documents.get(docId);
      if (!document) {
        // Not our document, ignore
        return;
      }

      const connectionCount = document.getConnectionsCount();
      logger.info(`[FORCE_CLOSE_HANDLER] Sending force close message to ${connectionCount} clients...`);

      // Step 1: Send force close message to ALL clients first
      const forceCloseMessage: ClientForceCloseMessage = {
        type: "force_close",
        reason,
        code,
        message: getForceCloseMessage(reason),
        timestamp: new Date().toISOString(),
      };

      let messageSent = 0;
      document.connections.forEach(({ connection }: { connection: Connection }) => {
        try {
          connection.sendStateless(JSON.stringify(forceCloseMessage));
          messageSent++;
        } catch (error) {
          logger.error("[FORCE_CLOSE_HANDLER] Failed to send message:", error);
        }
      });

      logger.info(`[FORCE_CLOSE_HANDLER] Sent force close message to ${messageSent}/${connectionCount} clients`);

      // Wait a moment for messages to be delivered
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Step 2: Close connections
      logger.info(`[FORCE_CLOSE_HANDLER] Closing ${connectionCount} connections...`);

      let closed = 0;
      document.connections.forEach(({ connection }: { connection: Connection }) => {
        try {
          connection.close({ code, reason });
          closed++;
        } catch (error) {
          logger.error("[FORCE_CLOSE_HANDLER] Failed to close connection:", error);
        }
      });

      logger.info(`[FORCE_CLOSE_HANDLER] Closed ${closed}/${connectionCount} connections for ${docId}`);
    });

    logger.info("[FORCE_CLOSE_HANDLER] Registered with Redis extension");
  }
}

/**
 * Force close all connections to a document across all servers and unload it from memory.
 * Used for critical errors or admin operations.
 *
 * @param instance - The Hocuspocus server instance
 * @param pageId - The document ID to force close
 * @param reason - The reason for force closing
 * @param code - Optional WebSocket close code (defaults to FORCE_CLOSE)
 * @returns Promise that resolves when document is closed and unloaded
 * @throws Error if document not found in memory
 */
export const forceCloseDocumentAcrossServers = async (
  instance: Hocuspocus,
  pageId: string,
  reason: ForceCloseReason,
  code: CloseCode = CloseCode.FORCE_CLOSE
): Promise<void> => {
  // STEP 1: VERIFY DOCUMENT EXISTS
  const document = instance.documents.get(pageId);

  if (!document) {
    logger.info(`[FORCE_CLOSE] Document ${pageId} already unloaded - no action needed`);
    return; // Document already cleaned up, nothing to do
  }

  const connectionsBefore = document.getConnectionsCount();
  logger.info(`[FORCE_CLOSE] Sending force close message to ${connectionsBefore} local clients...`);

  const forceCloseMessage: ClientForceCloseMessage = {
    type: "force_close",
    reason,
    code,
    message: getForceCloseMessage(reason),
    timestamp: new Date().toISOString(),
  };

  let messageSentCount = 0;
  document.connections.forEach(({ connection }: { connection: Connection }) => {
    try {
      connection.sendStateless(JSON.stringify(forceCloseMessage));
      messageSentCount++;
    } catch (error) {
      logger.error("[FORCE_CLOSE] Failed to send message to client:", error);
    }
  });

  logger.info(`[FORCE_CLOSE] Sent force close message to ${messageSentCount}/${connectionsBefore} clients`);

  // Wait a moment for messages to be delivered
  await new Promise((resolve) => setTimeout(resolve, 50));

  // STEP 3: CLOSE LOCAL CONNECTIONS
  logger.info(`[FORCE_CLOSE] Closing ${connectionsBefore} local connections...`);

  let closedCount = 0;
  document.connections.forEach(({ connection }: { connection: Connection }) => {
    try {
      connection.close({ code, reason });
      closedCount++;
    } catch (error) {
      logger.error("[FORCE_CLOSE] Failed to close local connection:", error);
    }
  });

  logger.info(`[FORCE_CLOSE] Closed ${closedCount}/${connectionsBefore} local connections`);

  // STEP 4: BROADCAST TO OTHER SERVERS
  const redisExt = instance.configuration.extensions.find((ext) => ext instanceof Redis);

  if (redisExt) {
    const commandData: ForceCloseCommandData = {
      command: AdminCommand.FORCE_CLOSE,
      docId: pageId,
      reason,
      code,
      originServer: instance.configuration.name || "unknown",
      timestamp: new Date().toISOString(),
    };

    const receivers = await redisExt.publishAdminCommand(commandData);
    logger.info(`[FORCE_CLOSE] Notified ${receivers} other server(s)`);
  } else {
    logger.warn("[FORCE_CLOSE] Redis extension not found, cannot notify other servers");
  }

  // STEP 5: WAIT FOR OTHER SERVERS
  const waitTime = 800;
  logger.info(`[FORCE_CLOSE] Waiting ${waitTime}ms for other servers to close connections...`);
  await new Promise((resolve) => setTimeout(resolve, waitTime));

  // STEP 6: UNLOAD DOCUMENT after closing all the connections
  logger.info(`[FORCE_CLOSE] Unloading document from memory...`);

  try {
    await instance.unloadDocument(document);
    logger.info(`[FORCE_CLOSE] Document unloaded successfully ✅`);
  } catch (unloadError: unknown) {
    logger.error("[FORCE_CLOSE] UNLOAD FAILED:", unloadError);
    logger.error(`   Error: ${unloadError instanceof Error ? unloadError.message : "unknown"}`);
  }

  // STEP 7: VERIFY UNLOAD
  const documentAfterUnload = instance.documents.get(pageId);

  if (documentAfterUnload) {
    logger.error(
      `❌ [FORCE_CLOSE] Document still in memory!, Document ID: ${pageId}, Connections: ${documentAfterUnload.getConnectionsCount()}`
    );
  } else {
    logger.info(`✅ [FORCE_CLOSE] COMPLETE, Document: ${pageId}, Status: Successfully closed and unloaded`);
  }
};
