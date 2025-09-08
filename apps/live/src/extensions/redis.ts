import { Redis as HocuspocusRedis } from "@hocuspocus/extension-redis";
import { OutgoingMessage } from "@hocuspocus/server";
// redis
import { redisManager } from "@/redis";

const getRedisClient = () => {
  const redisClient = redisManager.getClient();
  if (!redisClient) {
    throw new Error("Redis client not initialized");
  }
  return redisClient;
};

export class Redis extends HocuspocusRedis {
  constructor() {
    super({ redis: getRedisClient() });
  }

  public broadcastToDocument(documentName: string, payload: any): Promise<number> {
    const stringPayload = typeof payload === "string" ? payload : JSON.stringify(payload);
    const message = new OutgoingMessage(documentName).writeBroadcastStateless(stringPayload);

    const emptyPrefix = Buffer.concat([Buffer.from([0])]);

    return this.pub.publishBuffer(
      // we're accessing the private method of the hocuspocus redis extension
      this["pubKey"](documentName),
      Buffer.concat([emptyPrefix, Buffer.from(message.toUint8Array())])
    );
  }
}
