import type { Hocuspocus } from "@hocuspocus/server";
import type { BroadcastedEvent } from "@plane/editor";
import { logger } from "@plane/logger";
import { Redis } from "@/extensions/redis";
import { AppError } from "@/lib/errors";

export const broadcastMessageToPage = async (
  hocuspocusServerInstance: Hocuspocus,
  documentName: string,
  eventData: BroadcastedEvent
): Promise<boolean> => {
  if (!hocuspocusServerInstance || !hocuspocusServerInstance.documents) {
    const appError = new AppError("HocusPocus server not available or initialized", {
      context: { operation: "broadcastMessageToPage", documentName },
    });
    logger.error("Error while broadcasting message:", appError);
    return false;
  }

  const redisExtension = hocuspocusServerInstance.configuration.extensions.find((ext) => ext instanceof Redis);

  if (!redisExtension) {
    logger.error("BROADCAST_MESSAGE_TO_PAGE: Redis extension not found");
    return false;
  }

  try {
    await redisExtension.broadcastToDocument(documentName, eventData);
    return true;
  } catch (error) {
    logger.error(`BROADCAST_MESSAGE_TO_PAGE: Error broadcasting to ${documentName}:`, error);
    return false;
  }
};
