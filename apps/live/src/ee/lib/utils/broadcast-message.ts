import { Hocuspocus } from "@hocuspocus/server";
import { BroadcastedEvent } from "@plane/editor";
import { CustomHocuspocusRedisExtension } from "@/core/extensions/redis";
import { ServerAgentManager } from "@/core/agents/server-agent";

export const broadcastMessageToPage = (
  instance: Hocuspocus | ServerAgentManager,
  documentName: string,
  eventData: BroadcastedEvent
): boolean => {
  const hocuspocusServer =
    "hocuspocusServer" in instance ? (instance as ServerAgentManager).hocuspocusServer : instance;

  if (!hocuspocusServer || !hocuspocusServer.documents) {
    console.error("HocusPocus server not available or initialized");
    return false;
  }
  const redisExtension = hocuspocusServer.configuration.extensions.find(
    (ext) => ext instanceof CustomHocuspocusRedisExtension
  ) as CustomHocuspocusRedisExtension | undefined;

  if (redisExtension) {
    redisExtension.broadcastToDocument(documentName, eventData);
    return true;
  }
  return false;
};
