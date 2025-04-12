import { Hocuspocus } from "@hocuspocus/server";
import { ServerAgentManager } from "@/ee/agents/server-agent";
import { BroadcastedEvent } from "@plane/editor";

/**
 * Broadcasts a message to all clients connected to a specific page
 * @param server The Hocuspocus server or serverAgentManager
 * @param pageId The ID of the page to broadcast to
 * @param message The realtime event message to broadcast
 * @returns true if the message was broadcast, false otherwise
 */
export const broadcastMessageToPage = (
  server: Hocuspocus | ServerAgentManager,
  pageId: string,
  message: BroadcastedEvent
): boolean => {
  // If server is serverAgentManager, get the Hocuspocus server from it
  const hocuspocusServer = "hocuspocusServer" in server ? (server as ServerAgentManager).hocuspocusServer : server;

  // Check if hocuspocusServer is available and has documents
  if (!hocuspocusServer || !hocuspocusServer.documents) {
    console.error("HocusPocus server not available or initialized");
    return false;
  }

  const document = hocuspocusServer.documents.get(pageId);

  if (document) {
    // Broadcast the message to all clients connected to this document
    document.broadcastStateless(JSON.stringify(message));
    return true;
  }
  return false;
};
